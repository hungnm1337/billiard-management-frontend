
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { OtpResponse, VerifyOtpRequest, VerificationResponse, LocalOtpData, OtpSendRequest } from '../interface/otp.interface'; // Điều chỉnh đường dẫn nếu cần

@Injectable({
  providedIn: 'root'
})
export class OtpService {
  private apiUrl = 'https://localhost:7176/api/GmailOTP'; // Điều chỉnh nếu API của bạn có prefix khác

  // Thiết lập headers nếu cần, ví dụ Content-Type
  private httpOptions = {
    headers: new HttpHeaders({ 'Content-Type': 'application/json' })
  };

  constructor(private http: HttpClient) { }

  /**
   * Gửi yêu cầu tạo và gửi OTP qua email.
   * Server sẽ lưu OTP (ví dụ vào session hoặc cache tạm thời nếu cần đối chiếu sau).
   * Client cũng sẽ lưu OTP và thời gian hết hạn vào localStorage.
   */
  sendOtp(orderTableId: number): Observable<OtpResponse> {
    // Backend API [FromBody] int orderTableId, nên gửi trực tiếp giá trị
    // Hoặc nếu backend mong muốn một object: const payload: OtpSendRequest = { orderTableId };
    return this.http.post<OtpResponse>(`${this.apiUrl}/send-otp`, orderTableId, this.httpOptions)
      .pipe(
        tap(response => {
          if (response.success && response.otp) {
            // Giả sử server trả về OTP và thời gian hết hạn (ví dụ: 5 phút từ bây giờ)
            // Nếu server không trả về expiresAt, client tự tính
            const expiresAt = response.expiresAt ? new Date(response.expiresAt).getTime() : Date.now() + (5 * 60 * 1000);
            this.saveOtpToLocalStorage(response.otp, orderTableId, expiresAt);
          }
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Xác minh OTP với server.
   * Client có thể thực hiện kiểm tra sơ bộ từ localStorage trước khi gọi API này.
   */
  verifyOtpWithServer(request: VerifyOtpRequest): Observable<VerificationResponse> {
    return this.http.post<VerificationResponse>(`${this.apiUrl}/verify-otp`, request, this.httpOptions)
      .pipe(
        tap(response => {
          if (response.success) {
            // Xóa OTP khỏi localStorage sau khi xác minh thành công trên server
            this.removeOtpFromLocalStorage(request.orderTableId);
          }
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Gửi lại mã OTP mới.
   */
  resendOtp(orderTableId: number): Observable<OtpResponse> {
    // Tương tự sendOtp, backend API [FromBody] int orderTableId
    return this.http.post<OtpResponse>(`${this.apiUrl}/resend-otp`, orderTableId, this.httpOptions)
      .pipe(
        tap(response => {
          if (response.success && response.otp) {
            const expiresAt = response.expiresAt ? new Date(response.expiresAt).getTime() : Date.now() + (5 * 60 * 1000);
            this.saveOtpToLocalStorage(response.otp, orderTableId, expiresAt);
          }
        }),
        catchError(this.handleError)
      );
  }

  // --- LocalStorage Helper Functions ---

  private getLocalStorageKey(orderTableId: number): string {
    return `${orderTableId}-otp`;
  }

  saveOtpToLocalStorage(otpCode: string, orderTableId: number, expiresAtTimestamp: number): void {
    const key = this.getLocalStorageKey(orderTableId);
    const otpData: LocalOtpData = {
      code: otpCode,
      orderTableId: orderTableId,
      expiresAt: expiresAtTimestamp
    };
    localStorage.setItem(key, JSON.stringify(otpData));
    console.log(`OTP for order ${orderTableId} saved to localStorage. Expires: ${new Date(expiresAtTimestamp).toLocaleString()}`);
  }

  getOtpFromLocalStorage(orderTableId: number): LocalOtpData | null {
    const key = this.getLocalStorageKey(orderTableId);
    const storedData = localStorage.getItem(key);

    if (!storedData) {
      return null;
    }

    try {
      const otpData: LocalOtpData = JSON.parse(storedData);
      if (Date.now() > otpData.expiresAt) {
        console.log(`OTP for order ${orderTableId} has expired. Removing from localStorage.`);
        localStorage.removeItem(key);
        return null;
      }
      return otpData;
    } catch (e) {
      console.error("Error parsing OTP data from localStorage:", e);
      localStorage.removeItem(key);
      return null;
    }
  }

  removeOtpFromLocalStorage(orderTableId: number): void {
    const key = this.getLocalStorageKey(orderTableId);
    localStorage.removeItem(key);
    console.log(`OTP for order ${orderTableId} removed from localStorage.`);
  }

  /**
   * Xác minh OTP cục bộ từ localStorage.
   * @param orderTableId ID đơn hàng
   * @param userEnteredOtp Mã OTP người dùng nhập
   * @returns true nếu OTP hợp lệ và khớp, false ngược lại.
   */
  verifyOtpLocally(orderTableId: number, userEnteredOtp: string): boolean {
    const storedOtpData = this.getOtpFromLocalStorage(orderTableId);
    if (storedOtpData && storedOtpData.code === userEnteredOtp) {
      return true;
    }
    return false;
  }


  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Đã có lỗi không xác định xảy ra!';
    if (error.error instanceof ErrorEvent) {
      // Lỗi phía client hoặc mạng
      errorMessage = `Lỗi client: ${error.error.message}`;
    } else {
      // Backend trả về mã lỗi
      // error.error có thể là một object chứa thông tin lỗi từ server
      if (error.error && error.error.message) {
        errorMessage = error.error.message;
      } else {
        errorMessage = `Mã lỗi Server: ${error.status}, thông điệp: ${error.message}`;
      }
    }
    console.error(errorMessage);
    return throwError(() => new Error(errorMessage)); // Trả về một Observable lỗi
  }
}
