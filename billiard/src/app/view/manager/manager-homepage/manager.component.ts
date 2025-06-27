import { Component } from '@angular/core';
import { HeaderComponent } from "../../common/header/header.component";
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-manager',
  standalone: true,
  imports: [HeaderComponent, RouterOutlet, RouterModule, CommonModule],
  templateUrl: './manager.component.html',
  styleUrl: './manager.component.scss'
})
export class ManagerComponent {
  currentRoute: string = '';

  constructor(private router: Router) {
    // Theo dõi thay đổi route để cập nhật active state
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      this.currentRoute = event.url;
    });
  }

  navigateTo(route: string): void {
    this.router.navigate([`/manager/${route}`]);
  }

  isActiveRoute(route: string): boolean {
    return this.currentRoute.includes(route);
  }
}
