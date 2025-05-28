import { Routes } from '@angular/router';
import { HomepageComponent } from './view/homepage/homepage.component';
import { ErrorComponent } from './view/error/error.component';
import { LoginComponent } from './view/login/login.component';
import { RegisterComponent } from './view/register/register.component';
import { EmployeeComponent } from './view/employee/employee.component';
import { ManagerComponent } from './view/manager/manager.component';
import { TablesUserComponent } from './view/tables-user/tables-user.component';
export const routes: Routes = [
  {path:"",component:HomepageComponent,title:"Homepage"},
  {path:"login",component:LoginComponent, title:"Login"},
  {path:"register",component:RegisterComponent,title:"Register"},
  {path:"employee",component:EmployeeComponent,title:"Employee"},
  {path:"manager",component:ManagerComponent,title:"Manager"},
  {path:"tablesuser",component:TablesUserComponent,title:"Tables"},
  {path:"**", component:ErrorComponent}

];
