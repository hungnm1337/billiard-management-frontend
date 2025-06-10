import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ServiceOfTableComponent } from './service-of-table.component';

describe('ServiceOfTableComponent', () => {
  let component: ServiceOfTableComponent;
  let fixture: ComponentFixture<ServiceOfTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ServiceOfTableComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ServiceOfTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
