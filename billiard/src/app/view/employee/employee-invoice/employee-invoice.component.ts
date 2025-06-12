import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { InvoiceService, InvoiceUpdateRequest } from '../../../services/invoice/invoice.service';
interface InvoiceData {
  tableId: number;
  invoiceId: number;
  tableName: string;
  startTime: Date;
  endTime: Date;
  usedTimeSeconds: number;
  hourlyRate: number;
  tableTotalCost: number;
  services: ServiceItem[];
  servicesTotalCost: number;
}

interface ServiceItem {
  id: number;
  name: string;
  quantity: number;
  price: number;
  total: number;
}

@Component({
  selector: 'app-employee-invoice',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './employee-invoice.component.html',
  styleUrl: './employee-invoice.component.scss'
})
export class EmployeeInvoiceComponent implements OnInit {
  invoiceData: InvoiceData | null = null;
  paymentMethod: 'online' | 'cash' = 'cash';
  qrCodeUrl: string = '';
  showSuccessNotification = false;
  notificationMessage = '';
  constructor(private router: Router, private invoiceService: InvoiceService) {
    // Lấy data từ navigation state
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras.state) {
      this.invoiceData = navigation.extras.state['invoiceData'];
    }
  }

  ngOnInit(): void {
    if (!this.invoiceData) {
      // Redirect về trang trước nếu không có data
      this.router.navigate(['/employee/table-management']);
      return;
    }

    // Generate QR code nếu chọn thanh toán online
    this.generateQRCode();
  }

  // Format thời gian sử dụng
  formatUsedTime(): string {
    if (!this.invoiceData) return '';

    const seconds = this.invoiceData.usedTimeSeconds;
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  // Tính tổng tiền
  getTotalAmount(): number {
    if (!this.invoiceData) return 0;
    return this.invoiceData.tableTotalCost + this.invoiceData.servicesTotalCost;
  }

  // Generate QR code cho thanh toán online
  generateQRCode(): void {
    if (this.paymentMethod === 'online') {
      const amount = this.getTotalAmount();
      const content = `Thanh toán hóa đơn bàn ${this.invoiceData?.tableName} - Số tiền: ${amount.toLocaleString('vi-VN')}đ`;
      // Sử dụng API tạo QR code hoặc thư viện
      this.qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(content)}`;
    }
  }

  // Xử lý thay đổi phương thức thanh toán
  onPaymentMethodChange(): void {
    this.generateQRCode();
  }

  // Xử lý thanh toán
  processPayment(): void {
  const invoiceUpdateRequest: InvoiceUpdateRequest = {
    invoiceId: Number(this.invoiceData?.invoiceId), // Convert to number
    timeEnd: new Date().toISOString(), // Thêm timeEnd
    totalAmount: this.getTotalAmount(),
    paymentStatus: this.paymentMethod === 'online' ? 'VNpay' : 'Đã thanh toán tiền mặt'
  };

  console.log('Processing payment with data:', invoiceUpdateRequest);

  this.invoiceService.updateInvoice(invoiceUpdateRequest).subscribe({
    next: (invoiceId) => { // Nhận invoiceId thay vì success
      if (invoiceId > 0) { // Check invoiceId > 0
        console.log('Payment processed successfully, Invoice ID:', invoiceId);
        this.showSuccessMessage(invoiceId);
        // Clear localStorage
        this.clearTableData();

       setTimeout(() => {
            this.router.navigate(['/employee/table-management']);
          }, 750);
      } else {
        console.error('Failed to process payment');
      }
    },
    error: (err) => {
      console.error('Error processing payment:', err);
    }
  });
}
 private showSuccessMessage(invoiceId: number): void {
    this.notificationMessage =
      `Đã thanh toán thành công hóa đơn ${invoiceId} - ${this.invoiceData?.tableName}`;
    this.showSuccessNotification = true;

    // Ẩn thông báo sau 3 giây với animation
    setTimeout(() => {
      this.showSuccessNotification = false;
    }, 3000);
  }
// Thêm method clear localStorage
private clearTableData(): void {
  if (this.invoiceData) {
    const tableId = this.invoiceData.tableId;
    localStorage.removeItem(`TableId-${tableId}`);
    localStorage.removeItem(`table_start_time_${tableId}`);
    localStorage.removeItem(`tableService-${tableId}`);
  }
}


  // Quay lại
  goBack(): void {
    this.router.navigate(['/employee/table-management']);
  }
}
