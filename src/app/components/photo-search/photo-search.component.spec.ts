import { NinjaSound } from './ninja-sound';
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
      ignore_digital: true,
      local_multiplayer: false,
      online_multiplayer: false,
    });
    expect(navigate).toHaveBeenCalledWith(['/products']);
    fixture.destroy();
  });
});

describe('Photo-only easter egg', () => {
  for (const mode of ['photo','manual','edited'] as const) {
    it(`handles ${mode} serial input without confusing its origin`, async () => {
      const play=vi.spyOn(NinjaSound.prototype,'play').mockResolvedValue(undefined);
      TestBed.configureTestingModule({providers:[
        {provide:Store,useValue:{dispatch:()=>of(undefined)}},
        {provide:Router,useValue:{navigate:()=>Promise.resolve(true)}},
        {provide:ProductsService,useValue:{}},
      ]});
      const fixture=TestBed.createComponent(PhotoSearchComponent), component=fixture.componentInstance;
      if(mode !== 'manual'){component.candidates.set(['BLES-00072']);component.choose('BLES-00072');}
      else component.serial='BLES00072';
      if(mode === 'edited')component.editSerial();
      await component.open({name:'Ninja Gaiden Sigma',platform:9,region:'europe',group:'europe'});
      expect(play).toHaveBeenCalledTimes(mode === 'photo' ? 1 : 0);
      fixture.destroy();play.mockRestore();
    });
  }
});
