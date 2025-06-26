import { NgClass, NgFor, NgIf } from '@angular/common';
import { Component, Input, Output, EventEmitter, OnChanges, OnInit } from '@angular/core';

type PageItem = number | '...';

@Component({
  selector: 'app-pager',
  standalone: true,
  templateUrl: './pager.component.html',
  styleUrls: ['./pager.component.scss'],
  imports: [NgIf, NgFor, NgClass]
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
}
