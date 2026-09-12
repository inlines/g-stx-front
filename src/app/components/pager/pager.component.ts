import {
  ElementRef,
  inject,
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  HostListener,
  Input,
  OnChanges,
  OnInit,
  Output,
} from '@angular/core';

import { buildPages, PageItem } from './pagination';

@Component({
  selector: 'app-pager',
  standalone: true,
  templateUrl: './pager.component.html',
  styleUrls: ['./pager.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class PagerComponent implements OnChanges, OnInit {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  @Input() totalCount: number = 0;
  @Input() offset: number = 0;
  @Input() limit: number = 10;
  @Input() busy = false;
  pendingPage: number | null = null;

  @Output() pageChange = new EventEmitter<number>();

  pages: PageItem[] = [];
  currentPage: number = 1;
  totalPages: number = 1;
  range: number = 5; // сколько страниц показывать вокруг текущей

  public ngOnInit(): void {
    this.resize();
  }
  @HostListener('window:resize')
  resize(): void {
    this.range = window.innerWidth < 576 ? 1 : 5;
    this.ngOnChanges();
  }

  ngOnChanges(): void {
    if (!this.busy) this.pendingPage = null;
    this.limit = Math.max(1, this.limit);
    this.currentPage = Math.floor(this.offset / this.limit) + 1;
    this.totalPages = Math.max(0, Math.ceil(this.totalCount / this.limit));
    this.pages = this.buildPages();
  }

  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent): void {
    if (
      this.busy ||
      event.defaultPrevented ||
      event.altKey ||
      event.ctrlKey ||
      event.metaKey ||
      event.shiftKey
    )
      return;
    const modal = document.querySelector('.modal.show');
    if (modal ? !modal.contains(this.host) : document.querySelector('app-chat:not(.invisible)')) return;
    // Проверяем, не находится ли фокус в поле ввода
    const activeElement = document.activeElement as HTMLElement;
    const isInputFocused =
      activeElement?.tagName === 'SELECT' ||
      activeElement?.tagName === 'INPUT' ||
      activeElement?.tagName === 'TEXTAREA' ||
      activeElement?.isContentEditable;

    // Если фокус в поле ввода - не обрабатываем клавиши
    if (isInputFocused) {
      return;
    }

    switch (event.key) {
      case 'ArrowLeft':
        if (this.currentPage > 1) event.preventDefault();
        this.goToPreviousPage();
        break;
      case 'ArrowRight':
        if (this.currentPage < this.totalPages) event.preventDefault();
        this.goToNextPage();
        break;
    }
  }

  buildPages(): PageItem[] {
    return buildPages(this.totalPages, this.currentPage, this.range);
  }

  selectPage(page: PageItem): void {
    if (
      this.busy ||
      typeof page !== 'number' ||
      page < 1 ||
      page > this.totalPages ||
      page === this.currentPage
    )
      return;
    this.pendingPage = page;
    this.pageChange.emit(page);
  }

  goToPreviousPage(): void {
    if (this.currentPage > 1) {
      const previousPage = this.currentPage - 1;
      this.selectPage(previousPage);
    }
  }

  // Метод для перехода на следующую страницу
  goToNextPage(): void {
    if (this.currentPage < this.totalPages) {
      const nextPage = this.currentPage + 1;
      this.selectPage(nextPage);
    }
  }
}
