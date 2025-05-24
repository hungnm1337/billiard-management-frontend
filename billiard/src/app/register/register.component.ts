import { Component } from '@angular/core';
import { HeaderComponent } from "../header/header.component";
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [HeaderComponent,ReactiveFormsModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})
export class RegisterComponent {
 registerForm: FormGroup;
  submitted = false;

  constructor(private fb: FormBuilder) {
    this.registerForm = this.fb.group({
      name: ['', Validators.required],
      username: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(6)]],
      dob: ['', Validators.required]
    });
  }

  get f() { return this.registerForm.controls; }

  register() {
    this.submitted = true;
    if (this.registerForm.invalid) {
      return;
    }
    // Gửi dữ liệu lên server ở đây
    console.log(this.registerForm.value);
  }

}
