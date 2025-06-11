import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TablesUserComponent } from './tables-user.component';

describe('TablesUserComponent', () => {
  let component: TablesUserComponent;
  let fixture: ComponentFixture<TablesUserComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TablesUserComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TablesUserComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
