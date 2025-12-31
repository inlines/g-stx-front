import { NgClass } from '@angular/common';
import { Component, Input, Output, EventEmitter, OnChanges, OnInit, HostListener } from '@angular/core';

type PageItem = number | '...';

@Component({
  selector: 'app-pager',
  standalone: true,
  templateUrl: './pager.component.html',
  styleUrls: ['./pager.component.scss'],
  imports: [NgClass]
})
export class PagerComponent implements OnChanges, OnInit {
  @Input() totalCount: number = 0;
  @Input() offset: number = 0;
  @Input() limit: number = 10;

  @Output() pageChange = new EventEmitter<number>();

  pages: PageItem[] = [];
  currentPage: number = 1;
  totalPages: number = 1;
  range: number = 5; // сколько страниц показывать вокруг текущей

  public ngOnInit(): void {
    if (window.innerWidth < 576) {
      this.range = 1; // например, для мобильных
    }
  }

  ngOnChanges(): void {
    this.currentPage = Math.floor(this.offset / this.limit) + 1;
    this.totalPages = Math.ceil(this.totalCount / this.limit);
    this.pages = this.buildPages();
  }

  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent): void {
    // Проверяем, не находится ли фокус в поле ввода
    const activeElement = document.activeElement as HTMLElement;
    const isInputFocused = activeElement.tagName === 'INPUT' || 
                          activeElement.tagName === 'TEXTAREA' ||
                          activeElement.isContentEditable;
    
    // Если фокус в поле ввода - не обрабатываем клавиши
    if (isInputFocused) {
      return;
    }

    switch (event.key) {
      case 'ArrowLeft':
        this.goToPreviousPage();
        break;
      case 'ArrowRight':
        this.goToNextPage();
        break;
    }
  }

  buildPages(): PageItem[] {
    const pages: PageItem[] = [];

    for (let i = 1; i <= this.totalPages; i++) {
      if (
        i === 1 || // первая страница
        i === this.totalPages || // последняя
        (i >= this.currentPage - this.range && i <= this.currentPage + this.range)
      ) {
        pages.push(i);
      } else if (pages[pages.length - 1] !== '...') {
        pages.push('...');
      }
    }

    return pages;
  }

  selectPage(page: PageItem): void {
    if (typeof page !== 'number' || page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.pages = this.buildPages();
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
