import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OtpPopupComponent } from './otp-popup.component';

describe('OtpPopupComponent', () => {
  let component: OtpPopupComponent;
  let fixture: ComponentFixture<OtpPopupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OtpPopupComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OtpPopupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
