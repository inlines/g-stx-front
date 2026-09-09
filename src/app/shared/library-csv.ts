import { LibraryKind } from './library-view.service';
import { Injectable } from '@angular/core';
import { ICollectionItem } from '@app/states/collection/interfaces/collection-item.interface';

function cell(value: string | number | null | undefined): string {
  let text = value == null ? '' : String(value);
  // Spreadsheet applications must treat game names and serials as text, not formulas.
  if (typeof value === 'string' && /^[\s]*[=+@-]/.test(text)) text = "'" + text;
  return '"' + text.replace(/"/g, '""') + '"';
}

export function libraryCsv(
  items: readonly ICollectionItem[],
  kind: LibraryKind,
  selling: ReadonlySet<number>,
): string {
  const headers = [
    'ID релиза',
    'ID игры',
    'Название',
    'Платформа',
    'Регион',
    'Дата релиза',
    'Серийники',
    'Обложка',
  ];
  if (kind === 'collection') headers.push('Цена покупки, ₽', 'Готова к продаже');
  if (kind === 'wts') headers.push('Цена продажи, ₽', 'CIB — полный комплект');
  const rows = items.map((item) => {
    const date = item.release_date == null ? null : new Date(item.release_date);
    const values: (string | number | null | undefined)[] = [
      item.release_id,
      item.product_id,
      item.product_name,
      item.platform_name,
      item.region_name,
      date && !Number.isNaN(date.getTime()) ? date.toISOString().slice(0, 10) : '',
      (item.serial ?? []).join('\n'),
      item.image_url,
    ];
    if (kind === 'collection') values.push(item.price, selling.has(item.release_id) ? 'Да' : 'Нет');
    if (kind === 'wts') values.push(item.price, item.cib ? 'Да' : 'Нет');
    return values.map(cell).join(';');
  });
  return '\uFEFF' + [headers.map(cell).join(';'), ...rows].join('\r\n') + '\r\n';
}

@Injectable({ providedIn: 'root' })
export class LibraryCsvDownload {
  save(csv: string, filename: string): void {
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    // Allow the browser to start the download before releasing its object URL.
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}
