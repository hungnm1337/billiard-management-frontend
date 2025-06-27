import { Routes } from '@angular/router';
import { HomepageComponent } from './view/common/homepage/homepage.component';
import { ErrorComponent } from './view/common/error/error.component';
import { LoginComponent } from './view/common/login/login.component';
import { RegisterComponent } from './view/common/register/register.component';
import { EmployeeComponent } from './view/employee/employee-homepage/employee.component';
import { ManagerComponent } from './view/manager/manager-homepage/manager.component';
import { TablesUserComponent } from './view/user/user-order-table/tables-user.component';
import { UserProfileComponent } from './view/common/profile/profile.component';
import { TableManagementComponent } from './view/employee/employee-table-manage/table-management.component';
import { EmployeeInvoiceComponent } from './view/employee/employee-invoice/employee-invoice.component';
export const routes: Routes = [
  {path:"",component:HomepageComponent,title:"Homepage"},
  {path:"login",component:LoginComponent, title:"Login"},
  {path:"register",component:RegisterComponent,title:"Register"},
  {path:"employee",component:EmployeeComponent,title:"Employee",
    children: [

       { path: '', redirectTo: 'table-management', pathMatch: 'full' },
      {
        path: 'table-management',
        loadComponent: () => import('./view/employee/employee-table-manage/table-management.component').then(c => c.TableManagementComponent)
      },
      {
        path: 'service-of-table-management',
        loadComponent: () => import('./view/employee/employee-service-of-table/service-of-table.component').then(c => c.ServiceOfTableComponent)
      },
      {
        path: 'shift-management',
        loadComponent: () => import('./view/employee/employee-shift/shift-management.component').then(c => c.ShiftManagementComponent)
      },
      {
        path: 'service-management',
        loadComponent: () => import('./view/employee/employee-service/employee-service.component').then(c => c.EmployeeServiceComponent)
      }
    ]
  },
  {path:"employee-invoice",component:EmployeeInvoiceComponent,title:"Employee Invoice"},
  {path:"manager",component:ManagerComponent,title:"Manager"
    ,
    children: [
       { path: '', redirectTo: 'manager-dashboard', pathMatch: 'full' },
       {path: 'manager-dashboard', loadComponent: () => import('./view/manager/manager-dashboard/manager-dashboard.component').then(c => c.ManagerDashboardComponent) },
       {path: 'manager-service', loadComponent: () => import('./view/manager/manager-service/manager-service.component').then(c => c.ManagerServiceComponent) },
       {path: 'manager-shift', loadComponent: () => import('./view/manager/manager-shift/manager-shift.component').then(c => c.ManagerShiftComponent) },
       {path: 'manager-point', loadComponent: () => import('./view/manager/manager-point/manager-point.component').then(c => c.ManagerPointComponent) },
       {path: 'manager-tables', loadComponent: () => import('./view/manager/manager-tables/manager-tables.component').then(c => c.ManagerTablesComponent) },
       {path: 'manager-account',loadComponent: () => import('./view/manager/manager-account/manager-account.component').then(c => c.ManagerAccountComponent) },
      ]
  },
  {path:"tablesuser",component:TablesUserComponent,title:"Tables"},
  {path:"profile",component:UserProfileComponent,title:"Profile"},
  {path:"**", component:ErrorComponent}

];
