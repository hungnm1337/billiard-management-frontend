import { Component } from '@angular/core';
import { HeaderComponent } from "../header/header.component";
import { MenuEmployeeComponent } from "../menu-employee/menu-employee.component";
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
