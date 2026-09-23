import { NinjaSound } from './ninja-sound';
import {
  afterNextRender,
  Component,
  DestroyRef,
  ElementRef,
  InjectionToken,
  ViewChild,
  inject,
  signal,
} from '@angular/core';
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
export const PHOTO_PROCESSOR = new InjectionToken('Photo processor', {
  providedIn: 'root',
  factory: () => ({ decodePhoto, startOcr }),
});
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
  @ViewChild('result') result?: ElementRef<HTMLCanvasElement>;
  readonly step = signal<'intro' | 'upload' | 'crop' | 'review'>('upload');
  readonly slide = signal(0);
  readonly ocrDone = signal(false);
  private touchStart = 0;
  @ViewChild('zoom') zoom?: ElementRef<HTMLCanvasElement>;
  readonly selected = signal(false);
  cropWidth = 50;
  cropHeight = 20;
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
  private recognizedSerial = '';
  private readonly ninja = new NinjaSound();
  serial = '';
  platform = 0;
  private image?: HTMLImageElement;
  private worker?: Worker;
  private revision = 0;
  private destroyed = false;
  private center?: { x: number; y: number };
  private crop?: { x: number; y: number; width: number; height: number };
  private rotation = 0;
  private readonly processor = inject(PHOTO_PROCESSOR);
  private readonly api = inject(ProductsService);
  private readonly router = inject(Router);
  private readonly store = inject(Store);
  constructor() {
    try {
      const raw = Number(localStorage.getItem('gstx.photo-search.visits.v1') ?? 0);
      const visits = Number.isFinite(raw) && raw >= 0 ? Math.floor(raw) : 0;
      if (visits < 5) this.step.set('intro');
      localStorage.setItem('gstx.photo-search.visits.v1', String(Math.min(visits + 1, 5)));
    } catch {
      this.step.set('intro');
    }
    const host = inject(ElementRef<HTMLElement>).nativeElement;
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      const viewport = window.visualViewport;
      const resize = () => {
        host.style.setProperty('--photo-height', `${viewport?.height ?? window.innerHeight}px`);
        host.style.setProperty('--photo-top', `${viewport?.offsetTop ?? 0}px`);
      };
      resize();
      viewport?.addEventListener('resize', resize);
      viewport?.addEventListener('scroll', resize);
      destroyRef.onDestroy(() => {
        viewport?.removeEventListener('resize', resize);
        viewport?.removeEventListener('scroll', resize);
      });
    });
    inject(DestroyRef).onDestroy(() => {
      this.destroyed = true;
      this.cancel();
      this.ninja.stop();
    });
  }
  finishIntro() {
    this.step.set('upload');
  }
  help() {
    this.slide.set(0);
    this.step.set('intro');
  }
  tutorialTouchStart(event: TouchEvent) {
    this.touchStart = event.changedTouches[0].clientX;
  }
  tutorialTouchEnd(event: TouchEvent) {
    const delta = event.changedTouches[0].clientX - this.touchStart;
    if (Math.abs(delta) > 40) this.slide.set(Math.max(0, Math.min(2, this.slide() + (delta < 0 ? 1 : -1))));
  }
  back() {
    this.cancel();
    this.status.set('');
    if (this.step() === 'review') this.step.set('crop');
    else if (this.step() === 'crop' || this.step() === 'intro') this.step.set('upload');
    else void this.router.navigate(['/products']);
  }
  next() {
    this.status.set('');
    this.step.set('review');
    this.draw();
  }
  manualEntry() {
    this.ocrDone.set(true);
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
    this.recognizedSerial = '';
    this.ninja.stop();
    this.platform = 0;
    try {
      const image = await this.processor.decodePhoto(file);
      if (this.destroyed || version !== this.revision) return;
      this.image = image;
      this.rotation = 0;
      this.crop = undefined;
      this.center = undefined;
      this.ocrDone.set(false);
      this.step.set('crop');
      this.selected.set(false);
      this.hasPhoto.set(true);
      this.draw();
      this.status.set('');
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
    const box = this.crop ?? { x: 0, y: 0, width: canvas.width, height: canvas.height };
    for (const output of [this.zoom?.nativeElement, this.result?.nativeElement]) {
      if (!output) continue;
      output.width = Math.max(1, Math.round(box.width));
      output.height = Math.max(1, Math.round(box.height));
      output
        .getContext('2d')!
        .drawImage(canvas, box.x, box.y, box.width, box.height, 0, 0, output.width, output.height);
    }
    if (this.crop) {
      ctx.strokeStyle = '#c7a6ff';
      ctx.lineWidth = 5;
      ctx.strokeRect(this.crop.x, this.crop.y, this.crop.width, this.crop.height);
    }
  }
  rotate() {
    this.center = undefined;
    this.rotation = (this.rotation + 1) % 4;
    this.crop = undefined;
    this.selected.set(false);
    this.draw();
  }
  resetCrop() {
    this.center = undefined;
    this.crop = undefined;
    this.selected.set(false);
    this.draw();
  }
  selectPoint(e: MouseEvent) {
    if (this.busy() || !this.image) return;
    const c = this.preview!.nativeElement,
      r = c.getBoundingClientRect();
    this.center = {
      x: ((e.clientX - r.left) * c.width) / r.width,
      y: ((e.clientY - r.top) * c.height) / r.height,
    };
    this.resizeCrop();
  }
  resizeCrop() {
    if (!this.center || this.busy()) return;
    const c = this.preview!.nativeElement;
    const width = (c.width * this.cropWidth) / 100,
      height = (c.height * this.cropHeight) / 100;
    this.crop = {
      x: Math.max(0, Math.min(c.width - width, this.center.x - width / 2)),
      y: Math.max(0, Math.min(c.height - height, this.center.y - height / 2)),
      width,
      height,
    };
    this.selected.set(true);
    this.draw();
  }
  choose(code: string) {
    this.serial = code;
    this.recognizedSerial = this.candidates().includes(code) ? code : '';
    this.platform = serialPlatform(code) ?? 0;
    this.matches.set([]);
  }
  async recognize() {
    if (this.busy() || !this.image) return;
    const version = ++this.revision;
    this.busy.set(true);
    this.status.set('Загружаем распознавание…');
    this.matches.set([]);
    this.candidates.set([]);
    this.serial = '';
    this.recognizedSerial = '';
    this.ninja.stop();
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
      worker = await this.processor.startOcr((p) => {
        if (version === this.revision) this.status.set(`Распознаём: ${Math.round(p * 100)}%`);
      });
      if (version !== this.revision || this.destroyed) return;
      this.worker = worker;
      const result = await worker.recognize(canvas);
      if (version !== this.revision || this.destroyed) return;
      let codes = photoSerials(result.data.text);
      // Light text on dark spines often needs the opposite polarity.
      if (!codes.some((code) => /[A-Z]/.test(code))) {
        const ctx = canvas.getContext('2d')!;
        const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
        for (let i = 0; i < pixels.data.length; i += 4) {
          const gray =
            255 - (pixels.data[i] * 0.299 + pixels.data[i + 1] * 0.587 + pixels.data[i + 2] * 0.114);
          pixels.data[i] = pixels.data[i + 1] = pixels.data[i + 2] = gray;
        }
        ctx.putImageData(pixels, 0, 0);
        const retry = await worker.recognize(canvas);
        if (version !== this.revision || this.destroyed) return;
        const extra = photoSerials(retry.data.text);
        codes = extra.some((code) => /[A-Z]/.test(code)) ? extra : [...new Set([...codes, ...extra])];
      }
      this.ocrDone.set(true);
      this.candidates.set(codes);
      if (codes.length === 1) this.choose(codes[0]);
      this.status.set(
        codes.length
          ? codes.every((code) => /^\d/.test(code))
            ? 'Прочитаны только цифры. Проверьте, не пропущены ли буквы: коснитесь полного кода и повторите распознавание.'
            : 'Проверьте код по коробке.'
          : 'Код не найден. Вернитесь к рамке или введите серийник вручную.',
      );
    } catch (error) {
      console.error('Photo OCR failed', error);
      if (version === this.revision)
        this.status.set(
          'Ошибка запуска распознавания. Проверьте соединение и повторите попытку. Это не означает, что код на фото нечитаемый.',
        );
    } finally {
      void worker?.terminate();
      if (version === this.revision) {
        this.worker = undefined;
        this.busy.set(false);
      }
    }
  }
  editSerial() {
    this.matches.set([]);
    this.recognizedSerial = '';
    this.ninja.stop();
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
    if (this.recognizedSerial === 'BLES-00072' && code === this.recognizedSerial) this.ninja.prepare();
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
    if (this.recognizedSerial === 'BLES-00072' && canonicalSerial(this.serial) === this.recognizedSerial)
      await this.ninja.play();
    if (!this.destroyed) await this.router.navigate(['/products']);
  }
}
