import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmployeeInvoiceComponent } from './employee-invoice.component';

describe('EmployeeInvoiceComponent', () => {
  let component: EmployeeInvoiceComponent;
  let fixture: ComponentFixture<EmployeeInvoiceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmployeeInvoiceComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EmployeeInvoiceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
