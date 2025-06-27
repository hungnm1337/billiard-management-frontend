import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ManagerTablesComponent } from './manager-tables.component';

describe('ManagerTablesComponent', () => {
  let component: ManagerTablesComponent;
  let fixture: ComponentFixture<ManagerTablesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ManagerTablesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ManagerTablesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
