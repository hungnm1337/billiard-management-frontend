import { Component, EventEmitter, Input, Output, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { interval, Subscription } from 'rxjs';

@Component({
  selector: 'app-otp-popup',
  standalone: true,
  imports: [CommonModule, FormsModule], // Cần cho @if, [(ngModel)], v.v.
  templateUrl: './otp-popup.component.html', // Sử dụng template HTML ở bước 2
  styleUrls: ['./otp-popup.component.scss']
})
export class OtpPopupComponent implements OnInit, OnDestroy {
  // NHẬN INPUT TỪ COMPONENT CHA
  @Input() isOpen: boolean = false; // Trạng thái hiển thị của popup

  // PHÁT RA SỰ KIỆN CHO COMPONENT CHA
  @Output() closePopup = new EventEmitter<void>(); // Khi người dùng đóng popup
  @Output() verifyAttempt = new EventEmitter<string>(); // Khi người dùng nhấn "Xác nhận" -> gửi mã OTP
  @Output() resendAttempt = new EventEmitter<void>(); // Khi người dùng nhấn "Gửi lại OTP"

  // Trạng thái nội bộ của popup
  otpCode: string = '';
  errorMessage: string = '';
  successMessage: string = '';

  resendDisabled: boolean = false;
  readonly cooldownSeconds: number = 60; // Thời gian cooldown (giây)
  cooldownTimer: number = this.cooldownSeconds;
  private timerSubscription?: Subscription;

  ngOnInit(): void {
    this.resetInternalState();
  }

  ngOnDestroy(): void {
    this.stopResendCooldown(); // Dọn dẹp subscription khi component bị hủy
  }

  // Xử lý khi người dùng click nút đóng (X hoặc click ra ngoài)
  onCloseClicked(): void {
    this.resetInternalState(); // Reset trạng thái nội bộ trước khi đóng
    this.closePopup.emit(); // Báo cho component cha biết để đóng
  }

  // Xử lý khi người dùng click nút "Xác nhận"
  onVerifyClicked(): void {
    this.resetMessages(); // Xóa thông báo cũ
    if (!this.otpCode || this.otpCode.length !== 6 || !/^\d{6}$/.test(this.otpCode)) {
      this.errorMessage = 'Mã OTP phải là 6 chữ số.';
      return;
    }
    // Gửi mã OTP lên cho component cha xử lý
    this.verifyAttempt.emit(this.otpCode);
  }

  // Xử lý khi người dùng click nút "Gửi lại OTP"
  onResendClicked(): void {
    this.resetMessages(); // Xóa thông báo cũ
    // Báo cho component cha biết để yêu cầu gửi lại OTP
    // Component cha sẽ gọi startResendCooldown() sau khi API thành công
    this.resendAttempt.emit();
  }

  // === CÁC PHƯƠNG THỨC PUBLIC ĐỂ COMPONENT CHA GỌI ===
  // Component cha sẽ gọi các phương thức này để cập nhật UI của popup

  /** Hiển thị thông báo thành công trên popup */
  public showSuccess(message: string): void {
    this.successMessage = message;
    this.errorMessage = ''; // Xóa thông báo lỗi nếu có
  }

  /** Hiển thị thông báo lỗi trên popup */
  public showError(message: string): void {
    this.errorMessage = message;
    this.successMessage = ''; // Xóa thông báo thành công nếu có
  }

  /** Xóa mã OTP đã nhập trong input */
  public clearOtpInput(): void {
    this.otpCode = '';
  }

  /** Bắt đầu đếm ngược cho nút "Gửi lại OTP" */
  public startResendCooldown(): void {
    if (this.resendDisabled) return; // Tránh chạy nhiều lần

    this.resendDisabled = true;
    this.cooldownTimer = this.cooldownSeconds;
    this.timerSubscription = interval(1000).subscribe(() => {
      this.cooldownTimer--;
      if (this.cooldownTimer <= 0) {
        this.stopResendCooldown();
      }
    });
  }

  /** Dừng đếm ngược và kích hoạt lại nút "Gửi lại OTP" (thường dùng khi API gửi lại lỗi) */
  public resetResendButtonState(): void {
     this.stopResendCooldown();
  }

  // === CÁC PHƯƠNG THỨC PRIVATE ===

  private stopResendCooldown(): void {
    this.resendDisabled = false;
    this.timerSubscription?.unsubscribe();
    this.cooldownTimer = this.cooldownSeconds; // Reset lại giá trị hiển thị
  }

  public resetMessages(): void {
    this.errorMessage = '';
    this.successMessage = '';
  }

  /** Reset toàn bộ trạng thái nội bộ của popup (thường gọi khi mở hoặc đóng popup) */
  public resetInternalState(): void {
    this.clearOtpInput();
    this.resetMessages();
    this.stopResendCooldown(); // Đảm bảo nút gửi lại được reset
  }
}
