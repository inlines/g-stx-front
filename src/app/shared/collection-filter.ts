import { ICollectionItem } from '@app/states/collection/interfaces/collection-item.interface';

export type CollectionSort = 'name' | 'date' | 'price';

/** Sort a copy: selectors and API data must never be mutated by presentation code. */
export function filterCollection(
  items: readonly ICollectionItem[],
  query: string,
  sort: CollectionSort,
): ICollectionItem[] {
  const search = query.trim().toLocaleLowerCase();
  return items
    .filter((item) => item.product_name.toLocaleLowerCase().includes(search))
    .sort((a, b) => {
      if (sort !== 'name') {
        const left = sort === 'date' ? a.release_date : a.price;
        const right = sort === 'date' ? b.release_date : b.price;
        if (left == null && right != null) return 1;
        if (right == null && left != null) return -1;
        if (left != null && right != null && left !== right) return left - right;
      }
      return (
        a.product_name.toLocaleLowerCase().localeCompare(b.product_name.toLocaleLowerCase()) ||
        a.release_id - b.release_id
      );
    });
}

export function unixMilliseconds(value: number | null): number | null {
  return value == null ? null : value * 1000;
}
