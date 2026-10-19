import { copySerials } from './owned-serials.service';
describe('Owned copy serials', () => {
  const resistance = ['BCES-00001', 'BCES-00001/E', 'BCES-00001/P/BBFC', 'BCES-00001/P/UK'];
  it('highlights all serials of an owned release without a selected code', () => {
    expect(copySerials({serial: resistance, selected_serial: null})).toEqual(resistance);
  });
  it('uses an explicit reissue selection instead of the inferred base', () => {
    expect(copySerials({serial: resistance, selected_serial: 'BCES-00001/P/UK'})).toEqual(['BCES-00001/P/UK']);
  });
  it('includes reissues and different codes belonging to the owned release', () => {
    expect(copySerials({serial: resistance.slice(1)})).toEqual(resistance.slice(1));
    expect(copySerials({serial: [...resistance, 'BCES-00002/P']})).toEqual([...resistance, 'BCES-00002/P']);
  });
  it('highlights only the selected edition', () => {
    expect(copySerials({serial: ['BCES-00001', 'BCES-00002'], selected_serial: 'bces00002'})).toEqual(['BCES-00002']);
  });
  it('uses release serials when no edition is selected', () => {
    expect(copySerials({serial: ['BCES-00001', 'BCES-00002']})).toEqual(['BCES-00001', 'BCES-00002']);
    expect(copySerials({serial: ['bces00001']})).toEqual(['BCES-00001']);
  });
});

import { TestBed } from '@angular/core/testing';
import { Store } from '@ngxs/store';
import { HttpTestingController } from '@angular/common/http/testing';
import { TEST_PROVIDERS } from '@app/testing/test-providers';
import { CollectionActions } from '@app/states/collection/states/collection-actions';
import { OwnedSerialsService } from './owned-serials.service';

describe('Owned serial cache', () => {
  it('loads once, refreshes copy changes and clears on logout', () => {
    TestBed.configureTestingModule({providers: TEST_PROVIDERS});
    const store = TestBed.inject(Store);
    const http = TestBed.inject(HttpTestingController);
    const service = TestBed.inject(OwnedSerialsService);
    http.expectNone(req => req.url === '/api/collection');
    const state = store.snapshot();
    store.reset({...state, Auth: {...state.Auth, login: 'alice', token: 'token'}});
    const row = {release_id: 42, product_id: 1, platform_id: 9, serial: ['BCES-00001', 'BCES-00002'], selected_serial: 'BCES-00002'};
    const request = http.expectOne(req => req.url === '/api/collection');
    // Deployed APIs require cat even when reading every platform.
    expect(request.request.params.get('cat')).toBe('0');
    request.flush({items: [row], total_count: 1});
    expect(service.forGame(1, 9)).toEqual(['BCES-00002']);
    expect(service.forGame(1, 48)).toEqual([]);
    expect(TestBed.inject(OwnedSerialsService)).toBe(service);
    http.expectNone(req => req.url === '/api/collection');
    store.dispatch(new CollectionActions.SetCopySuccess());
    http.expectOne('/api/collection-stats').flush([]);
    http.expectOne(req => req.url === '/api/collection').flush({items: [{...row, selected_serial: 'BCES-00001'}], total_count: 1});
    expect(service.forGame(1, 9)).toEqual(['BCES-00001']);
    store.dispatch(new CollectionActions.SetCopySuccess());
    http.expectOne('/api/collection-stats').flush([]);
    http.expectOne(req => req.url === '/api/collection').flush({items: [{...row, selected_serial: null}], total_count: 1});
    expect(service.forGame(1, 9)).toEqual(['BCES-00001', 'BCES-00002']);
    store.reset({...store.snapshot(), Auth: {...state.Auth, login: null, token: null}});
    expect(service.forGame(1, 9)).toEqual([]);
    http.verify();
  });
});
