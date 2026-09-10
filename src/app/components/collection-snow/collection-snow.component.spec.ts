import { TestBed } from '@angular/core/testing';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ICollectionItem } from '@app/states/collection/interfaces/collection-item.interface';
import { CollectionSnowComponent, snowBoxes } from './collection-snow.component';

describe('Bounded collection cover animation', () => {
  const items = Array.from(
    { length: 96 },
    (_, i) => ({ release_id: i, product_name: `Game ${i}`, image_url: '/cover.jpg' }) as ICollectionItem,
  );
  afterEach(() => vi.unstubAllGlobals());
  it('samples only supplied games and bounds the number of moving elements', () => {
    expect(snowBoxes([], 16)).toEqual([]);
    expect(snowBoxes(items, 16)).toHaveLength(16);
    expect(snowBoxes(items, 8)).toHaveLength(8);
    expect(snowBoxes(items.slice(24, 48), 16).every((x) => x.id >= 24 && x.id < 48)).toBe(true);
    expect(snowBoxes(items.slice(0, 1), 8)).toHaveLength(1);
  });
  it('uses eight boxes on mobile, supports pause and keeps missing covers local', () => {
    vi.stubGlobal('matchMedia', () => ({ matches: true }));
    TestBed.configureTestingModule({
      imports: [CollectionSnowComponent],
      providers: [{ provide: NgbActiveModal, useValue: { close: vi.fn() } }],
    });
    const fixture = TestBed.createComponent(CollectionSnowComponent);
    fixture.componentRef.setInput('items', items);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('.flake')).toHaveLength(8);
    fixture.nativeElement.querySelector('footer button').click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.snow').classList.contains('paused')).toBe(true);
    fixture.nativeElement.querySelector('img').dispatchEvent(new Event('error'));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.missing').textContent).toContain('Game 0');
    expect(items[0].image_url).toBe('/cover.jpg');
    fixture.destroy();
  });
});
