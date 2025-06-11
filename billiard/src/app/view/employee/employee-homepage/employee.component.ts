import { Component } from '@angular/core';
import { HeaderComponent } from '../../common/header/header.component';
import { MenuEmployeeComponent } from "../employee-menu/menu-employee.component";
import { Router, RouterModule } from '@angular/router';
@Component({
  selector: 'app-employee',
  standalone: true,
  imports: [HeaderComponent, MenuEmployeeComponent,RouterModule],
  templateUrl: './employee.component.html',
  styleUrl: './employee.component.scss'
})
export class EmployeeComponent {

}
