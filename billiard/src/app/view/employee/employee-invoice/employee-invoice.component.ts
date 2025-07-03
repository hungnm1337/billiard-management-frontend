import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { InvoiceService, InvoiceUpdateRequest ,ServiceOfTable ,ServiceItem,InvoiceData} from '../../../services/invoice/invoice.service';
import { UserService } from '../../../services/user/user.service';
import { AccountService, Account } from '../../../services/account/account.service';
import { RewardPointService } from '../../../services/RewardPoint/reward-point.service';


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
  userNameInput: string = '';
  foundUser: any = null;
  accounts: Account[] = [];
  filteredAccountSuggestions: Account[] = [];
  userCurrentPoints: number | null = null;
  constructor(
    private router: Router,
    private invoiceService: InvoiceService,
    private userService: UserService,
    private accountService: AccountService,
    private rewardPointService: RewardPointService
  ) {
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
    // Lấy danh sách account
    this.accountService.getAccounts().subscribe(accounts => {
      this.accounts = accounts;
      console.log('Danh sách account:', accounts);
    });
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
  const total = this.invoiceData.tableTotalCost + this.invoiceData.servicesTotalCost;
  return Number(total.toFixed(3));
}


  // Generate QR code cho thanh toán online
  generateQRCode(): void {
    if (this.paymentMethod === 'online') {
      const amount = this.getTotalAmount();
      const content = `Thanh toán hóa đơn bàn ${this.invoiceData?.tableName} - Số tiền: ${amount.toLocaleString('vi-VN')}đ`;
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

  const tableServices: ServiceOfTable = {
    tableId: this.invoiceData?.tableId ?? 0,
    invoiceId: Number(this.invoiceData?.invoiceId),
    services: this.invoiceData?.services ?? [],
  };
  console.log('Saving table services:', tableServices);
  console.log('Processing payment with data:', invoiceUpdateRequest);

  // Lưu dịch vụ của bàn
  this.invoiceService.saveTableServices(tableServices).subscribe({
    next: (response) => {
      console.log('Table services saved successfully:', response);
    },
    error: (err) => {
      console.error('Error saving table services:', err);
    }
  });
  this.invoiceService.updateInvoice(invoiceUpdateRequest).subscribe({
    next: (invoiceId) => { // Nhận invoiceId thay vì success
      if (invoiceId > 0) { // Check invoiceId > 0
        console.log('Payment processed successfully, Invoice ID:', invoiceId);
        this.showSuccessMessage(invoiceId);
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

  searchUserByName() {
    if (!this.userNameInput.trim()) {
      console.log('Vui lòng nhập tên');
      this.foundUser = null;
      this.filteredAccountSuggestions = [];
      this.userCurrentPoints = null;
      return;
    }
    this.userService.getUserByName(this.userNameInput.trim()).subscribe({
      next: (user) => {
        console.log('Kết quả tìm user:', user);
        this.foundUser = user;
        this.filteredAccountSuggestions = [];
        this.addRewardPointsForUser();
        // Lấy điểm hiện tại
        if (user.userId) {
          this.userCurrentPoints = null;
          this.rewardPointService.getUserPoints(user.userId).subscribe({
            next: (res) => {
              this.userCurrentPoints = res.points;
            },
            error: (err) => {
              this.userCurrentPoints = null;
            }
          });
        }
      },
      error: (err) => {
        console.error('Không tìm thấy user hoặc lỗi:', err);
        this.foundUser = null;
        this.filteredAccountSuggestions = [];
        this.userCurrentPoints = null;
      }
    });
  }

  getRewardPoint(): number {
    const total = this.getTotalAmount();
    let point = Math.round(total * 0.001);
    if (point < 100) point = 100;
    return point;
  }

  onUserNameInputChange() {
    const keyword = this.userNameInput.trim().toLowerCase();
    if (!keyword) {
      this.filteredAccountSuggestions = [];
      return;
    }
    this.filteredAccountSuggestions = this.accounts.filter(acc => acc.username.toLowerCase().includes(keyword));
  }

  addRewardPointsForUser() {
    if (!this.foundUser || !this.foundUser.userId) return;
    const points = this.getRewardPoint();
    this.rewardPointService.addPoints({
      userId: this.foundUser.userId,
      pointsToAdd: points,
      description: `Điểm thưởng cho hóa đơn ${this.invoiceData?.invoiceId || ''}`
    }).subscribe({
      next: (res) => {
        console.log('Đã cộng điểm thưởng:', res);
      },
      error: (err) => {
        console.error('Lỗi cộng điểm thưởng:', err);
      }
    });
  }
}
