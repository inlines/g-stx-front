import { OnboardingCatalogComponent } from '../onboarding-catalog/onboarding-catalog.component';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
  inject,
  signal,
} from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ReleaseCardComponent } from '../release-card/release-card.component';
import { ICollectionItem } from '@app/states/collection/interfaces/collection-item.interface';

@Component({
  selector: 'app-onboarding',
  standalone: true,
  imports: [OnboardingCatalogComponent, ReleaseCardComponent],
  templateUrl: './onboarding.component.html',
  styleUrl: './onboarding.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OnboardingComponent implements OnInit, OnDestroy {
  readonly modal = inject(NgbActiveModal);
  playNavigationSound: () => void = () => {};
  @ViewChild('stepsNav') private stepsNav?: ElementRef<HTMLElement>;
  @ViewChild('content') private content?: ElementRef<HTMLElement>;
  readonly index = signal(0);
  readonly phase = signal(0);
  readonly requestKind = signal<'serial' | 'name'>('serial');
  private timers: ReturnType<typeof setTimeout>[] = [];
  private readonly originalSteps = [
    {
      name: 'Каталог',
      title: 'Найдите свои игры',
      text: 'Выберите платформу и введите название в каталоге. Поиск учитывает и альтернативные имена игры.',
      action: 'Найти игру',
      result: 'Игра найдена. Откройте карточку, чтобы выбрать свой релиз.',
    },
    {
      name: 'Коллекция',
      title: 'Соберите свою коллекцию',
      text: 'На странице игры выберите релиз: платформу, регион и серийник на коробке. Нажмите «В коллекцию».',
      action: 'В коллекцию',
      result: 'Релиз появился в «Моё». Там можно указать цену покупки и искать свои игры.',
    },
    {
      name: 'Заявки',
      title: 'Помогайте наполнять каталог',
      text: 'Не хватает имени? Под названием игры есть «Дополнить название». Для серийника используйте «Уточнить серийник» у релиза PS2, PS3, PS4, PS5 или PSP.',
      action: 'Отправить заявку',
      result: 'Заявка отправлена на рассмотрение. После принятия: +10 Kudos за серийник или +5 за название.',
    },
    {
      name: 'Вишлист',
      title: 'Сохраните то, что ищете',
      text: 'Понравилась игра, которой пока нет? На странице игры выберите нужный релиз и нажмите «В вишлист».',
      action: 'В вишлист',
      result: 'Релиз в списке желаемого. Вернитесь к нему, когда будете пополнять коллекцию.',
    },
    {
      name: 'Продажа',
      title: 'Дайте игре нового владельца',
      text: 'У игры в своей коллекции нажмите «Выставить на продажу». Укажите цену и отметьте CIB, если это полный комплект.',
      action: 'Выставить на продажу',
      result:
        'Игра появилась в «Хочу продать». Её увидят другие коллекционеры; цену и комплектность можно изменить.',
    },
    {
      name: 'Игроки',
      title: 'Вы здесь не одни',
      text: 'В разделе «Игроки» найдите других коллекционеров. В их профиле можно посмотреть коллекцию и список «Хочет продать», а затем написать владельцу.',
      action: 'Посмотреть коллекцию',
      result: 'Профиль игрока: его игры, предложения о продаже и заработанные Kudos.',
    },
    {
      name: 'Чат',
      title: 'Общайтесь с коллекционерами',
      text: 'Откройте чат с другим игроком, чтобы спросить о состоянии игры или договориться о покупке. Чаты доступны через облачко в шапке.',
      action: 'Отправить сообщение',
      result:
        'Сообщение отправлено. Непрочитанные видны над облачком, а отметка «Онлайн» помогает понять, кто сейчас на сайте.',
    },
    {
      name: 'Kudos',
      title: 'Ваш вклад достоин Kudos',
      text: 'Помогайте делать каталог точнее и поднимайтесь в Kudos Challenge — топ-100 коллекционеров. Очки видны в вашем профиле, шапке и рядом с именем для других игроков.',
      action: 'Показать начисление',
      result:
        'Принятая заявка на серийник: +10 Kudos. На альтернативное имя: +5. Каждое полезное дополнение приближает к вершине!',
    },
  ];
  readonly steps = [
    { ...this.originalSteps[0], scene: 0 },
    {
      name: 'Фильтры',
      title: 'Сузьте поиск до нужных игр',
      text: 'Сначала выберите консоль. Затем можно выбрать один или несколько регионов, локальный или сетевой мультиплеер. «Пропустить цифровые» скрывает отмеченные digital-only игры. Для будущих игр включите «Показывать невышедшие». Ищете конкретный диск? Переключите поиск на серийник и введите его целиком.',
      action: 'Применить фильтры',
      result:
        'Показаны подходящие игры выбранной платформы. По рейтингу можно отсортировать от высокой оценки к низкой.',
      scene: 8,
    },
    {
      name: 'Листание',
      title: 'Листайте каталог удобным способом',
      text: 'Переключайте страницы кнопками под сеткой. На компьютере работают также стрелки ← и → вне полей ввода. На телефоне проведите по сетке: влево — следующая страница, вправо — предыдущая. Пока данные загружаются, текущая сетка остаётся на месте под затемнением.',
      action: 'Следующая страница',
      result:
        'Новая страница и её номер появляются вместе. Свайп не открывает карточку, а вертикальное движение прокручивает список.',
      scene: 9,
    },
    ...this.originalSteps.slice(1).map((step, i) => ({ ...step, scene: i + 1 })),
  ];
  scene() {
    return this.step.scene;
  }
  readonly soundEnabled = signal(true);
  playEffect: (kind: 'filter' | 'page' | 'reward') => void = () => {};
  onSoundToggle: (enabled: boolean) => void = () => {};
  sound(kind: 'filter' | 'page' | 'reward') {
    if (this.soundEnabled()) this.playEffect(kind);
  }
  toggleSound() {
    this.soundEnabled.update((value) => !value);
    this.onSoundToggle(this.soundEnabled());
  }
  readonly game: ICollectionItem = {
    release_id: 0,
    product_id: 0,
    product_name: 'Night Circuit',
    platform_name: 'PlayStation 4',
    region_name: 'Europe',
    release_date: 1609459200000,
    serial: ['CUSA-01234'],
    image_url: '/tutorial-cover.svg',
    price: 1500,
    cib: true,
  };
  get step() {
    return this.steps[this.index()];
  }
  ngOnInit() {
    this.replay();
  }
  select(index: number) {
    if (index < 0 || index >= this.steps.length) return;
    if (index !== this.index() && this.soundEnabled()) this.playNavigationSound();
    this.index.set(index);
    (this.stepsNav?.nativeElement.children[index] as HTMLElement | undefined)?.scrollIntoView?.({
      block: 'nearest',
      inline: 'nearest',
    });
    if (this.content) this.content.nativeElement.scrollTop = 0;
    this.replay();
  }
  replay() {
    this.clearTimers();
    // Reduced-motion visitors see the completed example immediately.
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      this.phase.set(2);
      return;
    }
    this.phase.set(0);
    this.timers.push(
      setTimeout(() => {
        this.phase.set(1);
        if (this.scene() === 8) this.sound('filter');
        if (this.scene() === 9) this.sound('page');
      }, 700),
    );
    this.timers.push(
      setTimeout(() => {
        this.phase.set(2);
        if (this.scene() === 7) this.sound('reward');
      }, 2100),
    );
  }
  demonstrate() {
    this.sound(this.scene() === 8 ? 'filter' : this.scene() === 9 ? 'page' : 'reward');
    this.clearTimers();
    this.phase.set(2);
  }
  chooseRequest(kind: 'serial' | 'name') {
    this.requestKind.set(kind);
    this.replay();
  }
  next() {
    if (this.index() === this.steps.length - 1) this.modal.close();
    else this.select(this.index() + 1);
  }
  private clearTimers() {
    this.timers.forEach(clearTimeout);
    this.timers = [];
  }
  ngOnDestroy() {
    this.clearTimers();
  }
}
