import { Routes } from '@angular/router';
import { HomepageComponent } from './view/homepage/homepage.component';
import { ErrorComponent } from './view/error/error.component';
import { LoginComponent } from './view/login/login.component';
import { RegisterComponent } from './view/register/register.component';
import { EmployeeComponent } from './view/employee/employee.component';
import { ManagerComponent } from './view/manager/manager.component';
import { TablesUserComponent } from './view/tables-user/tables-user.component';
import { UserProfileComponent } from './view/profile/profile/profile.component';
import { TableManagementComponent } from './view/table-management/table-management.component';
export const routes: Routes = [
  {path:"",component:HomepageComponent,title:"Homepage"},
  {path:"login",component:LoginComponent, title:"Login"},
  {path:"register",component:RegisterComponent,title:"Register"},
  {path:"employee",component:EmployeeComponent,title:"Employee",
    children: [

       { path: '', redirectTo: 'table-management', pathMatch: 'full' },
      {
        path: 'table-management',
        loadComponent: () => import('../app/view/table-management/table-management.component').then(c => c.TableManagementComponent)
      },
      {
        path: 'shift-management',
        loadComponent: () => import('./shift-management/shift-management.component').then(c => c.ShiftManagementComponent)
      },
      {
        path: 'salary',
        loadComponent: () => import('./view/salary/salary.component').then(c => c.SalaryComponent)
      }
    ]
  },
  {path:"manager",component:ManagerComponent,title:"Manager"},
  {path:"tablesuser",component:TablesUserComponent,title:"Tables"},
  {path:"profile",component:UserProfileComponent,title:"Profile"},
  {path:"**", component:ErrorComponent}

];
