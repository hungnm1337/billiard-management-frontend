import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { HeaderComponent } from '../header/header.component';

@Component({
  selector: 'app-login',
  standalone:true,
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  imports: [HeaderComponent],
})
export class LoginComponent {
loginWithGoogle() {
throw new Error('Method not implemented.');
}
  model = { username: '', password: '' };
  loading = false;
  error = '';

  constructor( private router: Router) {}

  login() {

  }
}
