import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ContentEmployeeComponent } from './content-employee.component';

describe('ContentEmployeeComponent', () => {
  let component: ContentEmployeeComponent;
  let fixture: ComponentFixture<ContentEmployeeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ContentEmployeeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ContentEmployeeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
