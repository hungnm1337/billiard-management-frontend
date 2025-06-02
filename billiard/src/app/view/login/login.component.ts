import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { HeaderComponent } from '../header/header.component';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth/auth.service';
@Component({
  selector: 'app-login',
  standalone: true,
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  imports: [HeaderComponent,ReactiveFormsModule],
})
export class LoginComponent {

  loginForm: FormGroup;
  submitted = false;
  error: string = '';

  constructor(private router: Router, private fb: FormBuilder,private authService: AuthService) {
    this.loginForm = this.fb.group({
      username: ['', [
        Validators.required,
     
      ]],
      password: ['', [
        Validators.required
      ]]
    });
  }

  get f() {
    return this.loginForm.controls;
  }

  login() {
    this.submitted = true;
    if (this.loginForm.invalid) {
      return;
    }
    // Xử lý đăng nhập ở đây
    console.log(this.loginForm.value);

     const { username, password } = this.loginForm.value;

     this.authService.login(username, password).subscribe({
    next: () => {
      const accountId = this.authService.getAccountId();
      const userId = this.authService.getUserId();
      const roleId = this.authService.getRoleId();
      const name = this.authService.getName();
      const status = this.authService.getStatus();

      console.log(accountId, userId, roleId, name, status);


      if (roleId === '1') {
        this.router.navigate(['/']);
      } else if (roleId === '2') {
        this.router.navigate(['/employee']);
      } else if (roleId === '3') {
        this.router.navigate(['/manager']);
      } else {
        this.error = 'Role không hợp lệ!';
      }
    },
    error: (err) => {
      if (err.status === 401) {
        this.error = 'Tài khoản hoặc mật khẩu sai';
      } else {
        this.error = 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.';
      }
      console.error(err);
    }
  });
  }
}

