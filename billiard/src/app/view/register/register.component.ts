import { Component } from '@angular/core';
import { HeaderComponent } from "../header/header.component";
import { RegisterService } from '../../services/register/register.service';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
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
  errorMessage = '';
  successMessage = '';
  constructor(private fb: FormBuilder,private registerService: RegisterService) {
    this.registerForm = this.fb.group({
      name: ['', [Validators.required,
        Validators.pattern('^[a-zA-Z ]+$')
      ]],
      username: ['', [
        Validators.required,
        Validators.minLength(7)

      ]],
      password: ['', [
        Validators.required,
        Validators.minLength(8)
      ]],
      dob: ['', [
        Validators.required,
        this.dateOfBirthValidator
      ]]
    });
  }

  // Custom validator cho ngày sinh
  dateOfBirthValidator(control: AbstractControl): ValidationErrors | null {
    const inputDate = new Date(control.value);
    const today = new Date();
    // Xóa giờ phút giây để so sánh chính xác ngày
    today.setHours(0, 0, 0, 0);
    if (inputDate >= today) {
      return { invalidDob: true };
    }
    return null;
  }

  get f() {
    return this.registerForm.controls;
  }

  onSubmit() {
    this.submitted = true;
    if (this.registerForm.invalid) {
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';

    if (this.registerForm.invalid) return;

    this.registerService.register(this.registerForm.value).subscribe({
      next: (response: { status: number; }) => {
        if (response.status === 200) {
          this.successMessage = 'Đăng ký thành công!';
          this.registerForm.reset();
          this.submitted = false;
        }
      },
      error: (error: { status: number; }) => {
        if (error.status === 400) {
          this.errorMessage = 'Username đã tồn tại. Vui lòng chọn username khác.';
        } else {
          this.errorMessage = 'Có lỗi xảy ra. Vui lòng thử lại.';
        }
      }
    });
  }
}

