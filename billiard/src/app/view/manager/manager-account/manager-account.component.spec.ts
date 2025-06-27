import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ManagerAccountComponent } from './manager-account.component';

describe('ManagerAccountComponent', () => {
  let component: ManagerAccountComponent;
  let fixture: ComponentFixture<ManagerAccountComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ManagerAccountComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ManagerAccountComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
