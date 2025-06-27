import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ManagerServiceComponent } from './manager-service.component';

describe('ManagerServiceComponent', () => {
  let component: ManagerServiceComponent;
  let fixture: ComponentFixture<ManagerServiceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ManagerServiceComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ManagerServiceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
