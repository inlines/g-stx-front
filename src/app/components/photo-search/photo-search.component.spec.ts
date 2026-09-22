import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { Store } from '@ngxs/store';
import { of } from 'rxjs';
import { PhotoSearchComponent } from './photo-search.component';
import { ProductsService } from '@app/states/products/services/products.service';
describe('Photo search navigation', () => {
  it('opens the catalog by matched name, console and region, clearing unrelated filters', async () => {
    const dispatch = vi.fn((action: { payload: object }) => of(undefined));
    const navigate = vi.fn(() => Promise.resolve(true));
    TestBed.configureTestingModule({
      providers: [
        { provide: Store, useValue: { dispatch } },
        { provide: Router, useValue: { navigate } },
        { provide: ProductsService, useValue: {} },
      ],
    });
    const fixture = TestBed.createComponent(PhotoSearchComponent);
    await fixture.componentInstance.open({
      name: 'Ninja Gaiden Sigma',
      platform: 9,
      region: 'europe',
      group: 'europe',
    });
    expect(dispatch.mock.calls[0][0].payload).toMatchObject({
      query: 'Ninja Gaiden Sigma',
      search_mode: 'name',
      cat: 9,
      regions: 'europe',
      offset: 0,
      unknown: false,
      ignore_digital: false,
      local_multiplayer: false,
      online_multiplayer: false,
    });
    expect(navigate).toHaveBeenCalledWith(['/products']);
    fixture.destroy();
  });
});
