import { Routes } from '@angular/router';
import { HomepageComponent } from './homepage/homepage.component';
import { ErrorComponent } from './error/error.component';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';
import { EmployeeComponent } from './employee/employee.component';
import { ManagerComponent } from './manager/manager.component';

export const routes: Routes = [
  {path:"",component:HomepageComponent,title:"Homepage"},
  {path:"login",component:LoginComponent, title:"Login"},
  {path:"register",component:RegisterComponent,title:"Register"},
  {path:"employee",component:EmployeeComponent,title:"Employee"},
  {path:"manager",component:ManagerComponent,title:"Manager"},
  {path:"**", component:ErrorComponent}

];
