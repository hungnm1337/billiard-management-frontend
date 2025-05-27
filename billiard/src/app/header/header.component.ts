import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../services/auth/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent {
  nameuser: string | null = null;

  constructor(private authService: AuthService) {
    this.nameuser = this.authService.getName();
  }

  // Hàm kiểm tra đã đăng nhập chưa
  isLoggedIn(): boolean {
    return !!this.authService.getToken() && !!this.nameuser;
  }

  logout() {
    this.authService.clearToken();
    window.location.reload(); // hoặc điều hướng về trang login tuỳ ý
  }
}
