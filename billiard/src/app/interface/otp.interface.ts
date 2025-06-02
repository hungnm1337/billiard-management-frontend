// src/app/models/otp.models.ts

export interface OtpSendRequest {
  orderTableId: number;
}

export interface OtpResponse {
  success: boolean;
  message: string;
  otp?: string; // OTP trả về từ server để client có thể lưu vào localStorage
  expiresAt?: string; // Thêm thời gian hết hạn từ server nếu có
}

export interface VerifyOtpRequest {
  orderTableId: number;
  otpCode: string;
}

export interface VerificationResponse {
  success: boolean;
  message: string;
}

// Dữ liệu lưu trong localStorage
export interface LocalOtpData {
  code: string;
  orderTableId: number;
  expiresAt: number; // Lưu dưới dạng timestamp (milliseconds since epoch)
}
