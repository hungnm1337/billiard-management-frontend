import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ManagerPointComponent } from './manager-point.component';

describe('ManagerPointComponent', () => {
  let component: ManagerPointComponent;
  let fixture: ComponentFixture<ManagerPointComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ManagerPointComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ManagerPointComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
