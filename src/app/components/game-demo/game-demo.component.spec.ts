import { TestBed, ComponentFixture } from '@angular/core/testing';
import { HttpTestingController } from '@angular/common/http/testing';
import { NgbConfig } from '@ng-bootstrap/ng-bootstrap';
import { TEST_PROVIDERS } from '@app/testing/test-providers';
import { GameDemoComponent } from './game-demo.component';

// Exercise real modal, detail requests and list-page handoff together.
describe('Demo browsing', () => {
  let fixture: ComponentFixture<GameDemoComponent>;
  let demo: GameDemoComponent;
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({imports: [GameDemoComponent], providers: TEST_PROVIDERS});
    TestBed.inject(NgbConfig).animation = false;
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(GameDemoComponent);
    demo = fixture.componentInstance;
    fixture.componentRef.setInput('items', [{id: 11}, {id: 12}]);
    fixture.componentRef.setInput('offset', 2);
    fixture.componentRef.setInput('limit', 2);
    fixture.componentRef.setInput('total', 7);
    fixture.componentRef.setInput('platform', 9);
    fixture.detectChanges();
  });
  afterEach(() => { fixture.destroy(); http.verify({ignoreCancelled: true}); });
  function loaded(id: number) {
    http.expectOne(`/api/products/${id}`).flush({product:{id, name:`Game ${id}`, image_url:null}, releases:[], screenshots:[], companies:[], franschises:[]});
    fixture.detectChanges();
  }
  it('opens on the first toggle click and shows only the active mode as pressed', () => {
    const buttons = fixture.nativeElement.querySelectorAll('.view-toggle button') as NodeListOf<HTMLButtonElement>;
    buttons[1].click();
    fixture.detectChanges();
    expect(demo.active).toBe(true);
    expect(document.querySelector('.game-demo-window')).not.toBeNull();
    expect(buttons[0].getAttribute('aria-pressed')).toBe('false');
    expect(buttons[1].getAttribute('aria-pressed')).toBe('true');
    loaded(11);
  });
  it('starts as grid, opens first game on the current page and ignores input until loaded', () => {
    expect(demo.active).toBe(false);
    demo.open();
    fixture.detectChanges();
    expect(demo.position).toBe(3);
    expect(demo.blocked).toBe(true);
    demo.move(1); demo.move(-1);
    expect(demo.index).toBe(0);
    loaded(11);
    demo.move(1);
    fixture.detectChanges();
    expect(document.querySelector('.game-demo-window app-loading-panel .shade')).not.toBeNull();
    expect(document.querySelector('.game-demo-window')?.textContent).toContain('Game 11');
    demo.move(1);
    expect(demo.index).toBe(1);
    loaded(12);
    expect(demo.blocked).toBe(false);
  });
  it('turns the underlying pager forward and backward, and handles a partial last page', () => {
    const page = vi.fn(); demo.pageChange.subscribe(page);
    demo.open(); loaded(11); demo.move(1); loaded(12);
    demo.move(1); demo.move(1);
    expect(page).toHaveBeenCalledExactlyOnceWith(3);
    fixture.componentRef.setInput('busy', true);
    fixture.componentRef.setInput('offset', 4);
    fixture.detectChanges();
    expect(demo.currentId).toBe(12);
    fixture.componentRef.setInput('items', [{id:13},{id:14}]);
    fixture.componentRef.setInput('busy', false);
    fixture.detectChanges(); loaded(13);
    expect(demo.position).toBe(5);
    demo.move(-1);
    expect(page).toHaveBeenLastCalledWith(2);
    fixture.componentRef.setInput('offset', 2);
    fixture.componentRef.setInput('items', [{id:11},{id:12}]);
    fixture.detectChanges(); loaded(12);
    expect(demo.index).toBe(1);
    // Last page contains one item; there is no request past the end.
    fixture.componentRef.setInput('offset', 6);
    fixture.componentRef.setInput('items', [{id:15}]);
    fixture.detectChanges(); loaded(15);
    page.mockClear(); demo.move(1);
    expect(page).not.toHaveBeenCalled();
    const close = vi.fn(); demo.closed.subscribe(close); demo.close();
    expect(demo.active).toBe(false);
    expect(demo.offset).toBe(6);
    expect(close).toHaveBeenCalledOnce();
  });
  it('recovers from page and detail failures without losing the current game', () => {
    const page = vi.fn(); demo.pageChange.subscribe(page);
    demo.open(); loaded(11); demo.move(1); loaded(12); demo.move(1);
    fixture.componentRef.setInput('failed', true); fixture.detectChanges();
    expect(demo.pageError).toBe(true); expect(demo.blocked).toBe(false);
    expect(demo.currentId).toBe(12);
    demo.move(1); expect(page).toHaveBeenCalledTimes(2);
    fixture.componentRef.setInput('failed', false);
    fixture.componentRef.setInput('offset', 4);
    fixture.componentRef.setInput('items', [{id:13}]); fixture.detectChanges();
    http.expectOne('/api/products/13').flush({}, {status:500,statusText:'Failure'});
    fixture.detectChanges();
    expect(demo.blocked).toBe(false);
    demo.load(); loaded(13);
  });
  it('handles touch and keyboard navigation once, leaving vertical gestures alone', () => {
    demo.open(); loaded(11);
    const content = document.querySelector('.demo-content')!;
    function touch(type: string, x: number, y: number) {
      const event = new Event(type, {bubbles:true,cancelable:true});
      Object.assign(event, {touches:type === 'touchend' ? [] : [{clientX:x,clientY:y}],changedTouches:[{clientX:x,clientY:y}]});
      content.dispatchEvent(event);
    }
    touch('touchstart', 250, 100); touch('touchmove', 240, 200); touch('touchend', 80, 220);
    expect(demo.currentId).toBe(11);
    touch('touchstart', 250, 100); touch('touchend', 80, 100);
    fixture.detectChanges();
    document.dispatchEvent(new KeyboardEvent('keydown', {key:'ArrowRight',bubbles:true}));
    expect(demo.currentId).toBe(12); loaded(12);
    document.dispatchEvent(new KeyboardEvent('keydown', {key:'ArrowLeft',bubbles:true}));
    loaded(11); expect(demo.currentId).toBe(11);
  });
  it('uses each release platform in mixed-platform collections', () => {
    fixture.componentRef.setInput('items', [{product_id:11, release_id:1, platform_id:9},{product_id:11, release_id:2, platform_id:38}]);
    fixture.detectChanges(); demo.open(); loaded(11);
    expect(demo.currentPlatform).toBe(9);
    demo.move(1); loaded(11); expect(demo.currentPlatform).toBe(38);
  });
});
