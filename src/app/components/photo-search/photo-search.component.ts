import { Component, DestroyRef, ElementRef, ViewChild, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Store } from '@ngxs/store';
import { firstValueFrom } from 'rxjs';
import type { Worker } from 'tesseract.js';
import { ProductsService } from '@app/states/products/services/products.service';
import { ProductsActions } from '@app/states/products/states/products.actions';
import { canonicalSerial, validSerial } from '@app/shared/serial-number';
import { RegionGroup } from '@app/shared/region-filter';
import { matchingPhotoReleases, photoSerials, releaseRegionGroup, serialPlatform } from './photo-serial';
import { SpineGuideComponent } from './spine-guide.component';
import { decodePhoto, startOcr } from './photo-ocr';
interface Match {
  name: string;
  platform: number;
  region: string;
  group: RegionGroup;
}
@Component({
  selector: 'app-photo-search',
  imports: [FormsModule, SpineGuideComponent],
  templateUrl: './photo-search.component.html',
  styleUrl: './photo-search.component.scss',
})
export class PhotoSearchComponent {
  @ViewChild('preview') preview?: ElementRef<HTMLCanvasElement>;
  readonly platforms = [
    { id: 32, name: 'Saturn' },
    { id: 7, name: 'PS1' },
    { id: 8, name: 'PS2' },
    { id: 9, name: 'PS3' },
    { id: 48, name: 'PS4' },
    { id: 167, name: 'PS5' },
    { id: 38, name: 'PSP' },
  ];
  readonly busy = signal(false);
  readonly status = signal('');
  readonly hasPhoto = signal(false);
  readonly candidates = signal<string[]>([]);
  readonly matches = signal<Match[]>([]);
  serial = '';
  platform = 0;
  private image?: HTMLImageElement;
  private worker?: Worker;
  private revision = 0;
  private destroyed = false;
  private start?: { x: number; y: number };
  private crop?: { x: number; y: number; width: number; height: number };
  private rotation = 0;
  private readonly api = inject(ProductsService);
  private readonly router = inject(Router);
  private readonly store = inject(Store);
  constructor() {
    inject(DestroyRef).onDestroy(() => {
      this.destroyed = true;
      this.cancel();
    });
  }
  cancel() {
    this.revision++;
    void this.worker?.terminate();
    this.worker = undefined;
    this.busy.set(false);
  }
  async upload(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    this.cancel();
    const version = this.revision;
    this.busy.set(true);
    this.status.set('Открываем фото…');
    this.matches.set([]);
    this.candidates.set([]);
    this.serial = '';
    this.platform = 0;
    try {
      const image = await decodePhoto(file);
      if (this.destroyed || version !== this.revision) return;
      this.image = image;
      this.rotation = 0;
      this.crop = undefined;
      this.hasPhoto.set(true);
      this.draw();
      this.status.set('Выделите код на фото или распознайте весь снимок.');
    } catch (e) {
      if (version === this.revision)
        this.status.set(e instanceof Error ? e.message : 'Не удалось открыть фото. Попробуйте JPEG.');
    } finally {
      if (version === this.revision) this.busy.set(false);
    }
  }
  draw() {
    const canvas = this.preview?.nativeElement,
      image = this.image;
    if (!canvas || !image) return;
    const swapped = this.rotation % 2 !== 0;
    const scale = Math.min(1, 2400 / Math.max(image.naturalWidth, image.naturalHeight));
    const w = Math.round(image.naturalWidth * scale),
      h = Math.round(image.naturalHeight * scale);
    canvas.width = swapped ? h : w;
    canvas.height = swapped ? w : h;
    const ctx = canvas.getContext('2d')!;
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((this.rotation * Math.PI) / 2);
    ctx.drawImage(image, -w / 2, -h / 2, w, h);
    ctx.restore();
    if (this.crop) {
      ctx.strokeStyle = '#c7a6ff';
      ctx.lineWidth = 5;
      ctx.strokeRect(this.crop.x, this.crop.y, this.crop.width, this.crop.height);
    }
  }
  rotate() {
    this.rotation = (this.rotation + 1) % 4;
    this.crop = undefined;
    this.draw();
  }
  resetCrop() {
    this.crop = undefined;
    this.draw();
  }
  point(e: PointerEvent) {
    const c = this.preview!.nativeElement;
    const r = c.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(c.width, ((e.clientX - r.left) * c.width) / r.width)),
      y: Math.max(0, Math.min(c.height, ((e.clientY - r.top) * c.height) / r.height)),
    };
  }
  begin(e: PointerEvent) {
    if (this.busy() || !this.image) return;
    this.start = this.point(e);
    this.preview!.nativeElement.setPointerCapture(e.pointerId);
  }
  move(e: PointerEvent) {
    if (!this.start) return;
    const p = this.point(e);
    this.crop = {
      x: Math.min(p.x, this.start.x),
      y: Math.min(p.y, this.start.y),
      width: Math.abs(p.x - this.start.x),
      height: Math.abs(p.y - this.start.y),
    };
    this.draw();
  }
  end() {
    this.start = undefined;
    if (this.crop && Math.min(this.crop.width, this.crop.height) < 20) this.crop = undefined;
    this.draw();
  }
  choose(code: string) {
    this.serial = code;
    this.platform = serialPlatform(code) ?? 0;
    this.matches.set([]);
  }
  async recognize() {
    if (this.busy() || !this.image) return;
    const version = ++this.revision;
    this.busy.set(true);
    this.status.set('Загружаем распознавание…');
    this.matches.set([]);
    let worker: Worker | undefined;
    try {
      const selection = this.crop;
      this.crop = undefined;
      this.draw();
      this.crop = selection;
      const source = this.preview!.nativeElement;
      const canvas = document.createElement('canvas');
      const box = selection ?? { x: 0, y: 0, width: source.width, height: source.height };
      const scale = Math.min(3, 2400 / Math.max(box.width, box.height));
      canvas.width = Math.round(box.width * scale);
      canvas.height = Math.round(box.height * scale);
      canvas
        .getContext('2d')!
        .drawImage(source, box.x, box.y, box.width, box.height, 0, 0, canvas.width, canvas.height);
      this.draw();
      worker = await startOcr((p) => {
        if (version === this.revision) this.status.set(`Распознаём: ${Math.round(p * 100)}%`);
      });
      if (version !== this.revision || this.destroyed) return;
      this.worker = worker;
      const result = await worker.recognize(canvas);
      if (version !== this.revision || this.destroyed) return;
      const codes = photoSerials(result.data.text);
      this.candidates.set(codes);
      if (codes.length === 1) this.choose(codes[0]);
      this.status.set(
        codes.length
          ? 'Проверьте код по коробке перед поиском.'
          : 'Серийник не распознан. Выделите его крупнее, поверните снимок или загрузите другое фото. Можно ввести код вручную.',
      );
    } catch {
      if (version === this.revision)
        this.status.set('Не удалось распознать фото. Попробуйте ещё раз или введите код вручную.');
    } finally {
      void worker?.terminate();
      if (version === this.revision) {
        this.worker = undefined;
        this.busy.set(false);
      }
    }
  }
  async search() {
    if (this.busy()) return;
    const code = canonicalSerial(this.serial);
    if (!validSerial(code)) {
      this.status.set('Проверьте полный серийник: буквы, цифры и суффикс.');
      return;
    }
    if (!this.platform) {
      this.status.set('Выберите консоль с коробки.');
      return;
    }
    this.serial = code;
    const platform = this.platform;
    const version = ++this.revision;
    this.busy.set(true);
    this.matches.set([]);
    this.status.set('Ищем серийник в каталоге…');
    try {
      const found = await firstValueFrom(
        this.api.productsRequest({
          cat: platform,
          query: code,
          search_mode: 'serial',
          limit: 50,
          offset: 0,
          ignore_digital: false,
          include_unreleased: true,
        }),
      );
      if (found.total_count > 50) throw new Error('Слишком много совпадений. Проверьте полный серийник.');
      const matches: Match[] = [];
      for (const item of found.items) {
        if (version !== this.revision || this.destroyed) return;
        const details = await firstValueFrom(this.api.productPropertiesRequest(item.id));
        for (const release of matchingPhotoReleases(details.releases, code, platform)) {
          if (!matches.some((m) => m.name === item.name && m.region === release.release_region))
            matches.push({
              name: item.name,
              platform,
              region: release.release_region,
              group: releaseRegionGroup(release.release_region),
            });
        }
      }
      if (version !== this.revision || this.destroyed) return;
      this.matches.set(matches);
      if (matches.length === 1) await this.open(matches[0]);
      else
        this.status.set(
          matches.length
            ? 'Найдено несколько релизов. Выберите регион своей коробки.'
            : 'Такой серийник пока не найден. Проверьте код и консоль или попробуйте другое фото.',
        );
    } catch (e) {
      if (version === this.revision)
        this.status.set(e instanceof Error ? e.message : 'Каталог недоступен. Попробуйте ещё раз.');
    } finally {
      if (version === this.revision) this.busy.set(false);
    }
  }
  async open(match: Match) {
    await firstValueFrom(
      this.store.dispatch(
        new ProductsActions.SetRequestParams({
          cat: match.platform,
          regions: match.group,
          query: match.name,
          search_mode: 'name',
          offset: 0,
          unknown: false,
          franchise_id: undefined,
          company_id: undefined,
          company_role: undefined,
          genre_id: undefined,
          local_multiplayer: false,
          online_multiplayer: false,
          ignore_digital: false,
          include_unreleased: true,
        }),
      ),
    );
    await this.router.navigate(['/products']);
  }
}
