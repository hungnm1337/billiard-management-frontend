import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ManagerShiftComponent } from './manager-shift.component';

describe('ManagerShiftComponent', () => {
  let component: ManagerShiftComponent;
  let fixture: ComponentFixture<ManagerShiftComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ManagerShiftComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ManagerShiftComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
