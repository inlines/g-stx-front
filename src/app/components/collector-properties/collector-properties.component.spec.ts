import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TEST_PROVIDERS } from '@app/testing/test-providers';

import { CollectorPropertiesComponent } from './collector-properties.component';

describe('CollectorPropertiesComponent', () => {
  let component: CollectorPropertiesComponent;
  let fixture: ComponentFixture<CollectorPropertiesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: TEST_PROVIDERS,
      imports: [CollectorPropertiesComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CollectorPropertiesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
