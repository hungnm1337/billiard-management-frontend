import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth/auth.service';
import { Router } from '@angular/router';
@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent {
  nameuser: string | null = null;

  constructor(private authService: AuthService, private router: Router) {
    this.nameuser = this.authService.getName();
  }

  // Hàm kiểm tra đã đăng nhập chưa
  isLoggedIn(): boolean {
    return !!this.authService.getToken() && !!this.nameuser;
  }

  logout() {
    this.authService.clearToken();
    this.router.navigate(['/login']);
  }
}
