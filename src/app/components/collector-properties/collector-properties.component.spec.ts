import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CollectorPropertiesComponent } from './collector-properties.component';

describe('CollectorPropertiesComponent', () => {
  let component: CollectorPropertiesComponent;
  let fixture: ComponentFixture<CollectorPropertiesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CollectorPropertiesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CollectorPropertiesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
