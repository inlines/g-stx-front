import { CollectorsService } from '@app/states/collectors/services/collectors.service';
import { unixMilliseconds } from '@app/shared/collection-filter';
import { ICollectionItem } from '@app/states/collection/interfaces/collection-item.interface';
import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { RequestStatus } from '@app/constants/request-status.const';
import { LibraryViewService } from '@app/shared/library-view.service';
import { ChatActions } from '@app/states/chat/states/chat-actions';
import { CollectorsActions } from '@app/states/collectors/states/collectors-actions';
import { CollectorsState } from '@app/states/collectors/states/collectors.state';
import { Store } from '@ngxs/store';
import { BehaviorSubject, combineLatest, map, switchMap, of, startWith, catchError } from 'rxjs';
import { PagerComponent } from '../pager/pager.component';
import { ReleaseCardComponent } from '../release-card/release-card.component';
@Component({
  selector: 'app-collector-properties',
  imports: [RouterLink, AsyncPipe, PagerComponent, ReleaseCardComponent],
  templateUrl: './collector-properties.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './collector-properties.component.scss',
})
export class CollectorPropertiesComponent {
  private readonly store = inject(Store);
  private readonly views = inject(LibraryViewService);
  private readonly changes = new BehaviorSubject<void>(undefined);
  private readonly service = inject(CollectorsService);
  private readonly selectedTab = new BehaviorSubject<'collection' | 'wts'>('collection');
  private readonly reload = new BehaviorSubject(0);
  get tab() {
    return this.selectedTab.value;
  }
  selectTab(tab: 'collection' | 'wts'): void {
    if (this.tab !== tab) this.selectedTab.next(tab);
  }
  private readonly data$ = combineLatest([
    this.store.select(CollectorsState.collectionPropertiesLogin),
    this.selectedTab,
    this.reload,
  ]).pipe(
    switchMap(([login, tab]) => {
      const result = (items: ICollectionItem[], status: RequestStatus) => ({ login, tab, items, status });
      if (tab === 'collection')
        return combineLatest([
          this.store.select(CollectorsState.loadedCollection),
          this.store.select(CollectorsState.propertiesStatus),
        ]).pipe(map(([items, status]) => result(items, status)));
      if (!login) return of(result([], RequestStatus.Load));
      return this.service.getCollectorWts(login).pipe(
        map((items) =>
          result(
            items.map((item) => ({ ...item, release_date: unixMilliseconds(item.release_date) })),
            RequestStatus.Load,
          ),
        ),
        startWith(result([], RequestStatus.Pending)),
        catchError(() => of(result([], RequestStatus.Error))),
      );
    }),
  );
  readonly vm$ = combineLatest([this.data$, this.changes]).pipe(
    map(([{ items, login, status, tab }]) => {
      const view = this.views.get(tab === 'wts' ? `collector-wts:${login}` : `collector:${login}`);
      const pages = Math.max(1, Math.ceil(items.length / view.size));
      if (status === RequestStatus.Load) view.page = Math.min(view.page, pages);
      const offset = (view.page - 1) * view.size;
      return {
        login,
        tab,
        total: items.length,
        offset,
        page: view.page,
        size: view.size,
        items: items.slice(offset, offset + view.size).map((item) => ({ ...item })),
        loading: status === RequestStatus.Pending,
        failed: status === RequestStatus.Error,
      };
    }),
  );
  page(page: number): void {
    this.view.page = page;
    this.changes.next();
    window.scrollTo({ top: 0, behavior: 'instant' });
  }
  pageSize(size: string): void {
    this.view.size = Number(size);
    this.view.page = 1;
    this.changes.next();
  }
  private get view() {
    return this.views.get(
      this.tab === 'wts'
        ? `collector-wts:${this.store.selectSnapshot(CollectorsState.collectionPropertiesLogin)}`
        : `collector:${this.store.selectSnapshot(CollectorsState.collectionPropertiesLogin)}`,
    );
  }
  retry(): void {
    if (this.tab === 'wts') {
      this.reload.next(this.reload.value + 1);
      return;
    }
    this.store.dispatch(
      new CollectorsActions.GetCollectorsPropertiesRequest(
        this.store.selectSnapshot(CollectorsState.collectionPropertiesLogin),
      ),
    );
  }
  startChatWith(): void {
    const user = this.store.selectSnapshot(CollectorsState.collectionPropertiesLogin);
    if (user) {
      this.store.dispatch(new ChatActions.SetRecepient(user));
      this.store.dispatch(new ChatActions.RequestMessages(user));
      this.store.dispatch(new ChatActions.ToggleChatVisibility());
    }
  }
}
