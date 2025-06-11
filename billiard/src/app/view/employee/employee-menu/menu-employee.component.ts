// menu-employee.component.ts (Phiên bản đơn giản)
import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

interface MenuItem {
  id: string;
  title: string;
  icon: string;
}

@Component({
  selector: 'app-menu-employee',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './menu-employee.component.html',
  styleUrl: './menu-employee.component.scss'
})
export class MenuEmployeeComponent {
  constructor(private router: Router) {}

  activeMenu = signal('table-management');

  menuItems: MenuItem[] = [
    { id: 'table-management', title: 'Quản lý bàn', icon: '' },
    { id: 'service-of-table-management', title: 'Dịch vụ của bàn', icon: '' },
    { id: 'shift-management', title: 'Ca làm việc', icon: '' },
    { id: 'service-management', title: 'Quản lý dịch vụ', icon: '' },
  ];

  selectMenu(menuId: string) {
    this.activeMenu.set(menuId);

    console.log('Selected menu:', menuId);

    // Navigate
    switch(menuId) {
      case 'table-management':
        this.router.navigate(['/employee/table-management']);
        break;
      case 'service-of-table-management':
        this.router.navigate(['/employee/service-of-table-management']);
        break;
      case 'shift-management':
        this.router.navigate(['/employee/shift-management']);
        break;
      case 'service-management':
        this.router.navigate(['/employee/service-management']);
        break;
    }
  }

  isActive(itemId: string): boolean {
    return this.activeMenu() === itemId;
  }
}
