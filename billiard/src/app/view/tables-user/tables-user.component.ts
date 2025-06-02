import { Component, OnInit, computed, signal, inject, DestroyRef, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { debounceTime, distinctUntilChanged, startWith } from 'rxjs/operators';
import { AuthService } from '../../services/auth/auth.service';
import { TableService } from '../../services/table/table.service';
import { Table, TableStatus } from '../../interface/table.interface';
import { HeaderComponent } from "../header/header.component";
import { routes } from '../../app.routes';
import { Router } from '@angular/router';
import { OtpService } from '../../services/otp.service';
import { OtpPopupComponent } from '../otp/otp-popup/otp-popup.component';

@Component({
  selector: 'app-tables-user',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HeaderComponent, OtpPopupComponent],
  templateUrl: './tables-user.component.html',
  styleUrl: './tables-user.component.scss'
})
export class TablesUserComponent implements OnInit {

 otpPopupRef = viewChild<OtpPopupComponent>('otpPopupRef');
  showOtpModal = signal(false);
  currentOrderId = signal(0);
  allTables = signal<Table[]>([]);
  isLoading = signal(false);
  private tableService = inject(TableService);
  private destroyRef = inject(DestroyRef);
  // filteredAndSortedTables is defined later with full filtering and sorting logic.
  loading = signal<boolean>(false);
  error = signal<string | null>(null);
  selectedTable = signal<Table | null>(null);
  lastUpdateTime = signal<Date>(new Date());
  autoRefreshEnabled = signal<boolean>(true);

  searchControl = new FormControl('');
  statusFilterControl = new FormControl('all');
  sortByControl = new FormControl<'name' | 'price' | 'status'>('name');
  sortOrderControl = new FormControl<'asc' | 'desc'>('asc');

  searchTerm = signal<string>('');
  statusFilter = signal<string>('all');
  sortBy = signal<'name' | 'price' | 'status'>('name');
  sortOrder = signal<'asc' | 'desc'>('asc');

   statusOptions = [
    { value: 'all', label: 'Tất cả trạng thái' },
    { value: TableStatus.AVAILABLE, label: 'Đang trống' },
    { value: TableStatus.OCCUPIED, label: 'Đang sử dụng' },
    { value: TableStatus.MAINTENANCE, label: 'Đang bảo trì' },
    { value: TableStatus.RESERVED, label: 'Đã đặt trước' }
  ];

  sortOptions = [
    { value: 'name', label: 'Tên bàn' },
    { value: 'price', label: 'Giá tiền' },
    { value: 'status', label: 'Trạng thái' }
  ];
constructor(private router: Router, private authService: AuthService,private otpService: OtpService) {

}


filteredAndSortedTables = computed(() => {
    let tables = [...this.allTables()]; // Clone để không ảnh hưởng dữ liệu gốc

    // 1. SEARCH FILTER (Client-side)
    const search = this.searchTerm().toLowerCase().trim();
    if (search) {
      tables = tables.filter(table => {
        return (
          table.tableName.toLowerCase().includes(search) ||
          table.status.toLowerCase().includes(search) ||
          table.tableId.toString().includes(search) ||
          this.formatPrice(table.hourlyRate).includes(search)
        );
      });
    }

    // 2. STATUS FILTER (Client-side)
    const status = this.statusFilter();
    if (status !== 'all') {
      tables = tables.filter(table => table.status === status);
    }


    // 3. SORTING (Client-side)
    const sortBy = this.sortBy();
    const sortOrder = this.sortOrder();

    tables.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'name':
          comparison = a.tableName.localeCompare(b.tableName, 'vi', {
            numeric: true,
            sensitivity: 'base'
          });
          break;
        case 'price':
          comparison = a.hourlyRate - b.hourlyRate;
          break;
        case 'status':
          comparison = this.getStatusPriority(a.status) - this.getStatusPriority(b.status);
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return tables;
  });

  // STATISTICS (từ dữ liệu gốc, không bị ảnh hưởng bởi filter)
  totalTables = computed(() => this.allTables().length);

  availableTables = computed(() =>
    this.allTables().filter(table => table.status === TableStatus.AVAILABLE).length
  );

  occupiedTables = computed(() =>
    this.allTables().filter(table => table.status === TableStatus.OCCUPIED).length
  );

  maintenanceTables = computed(() =>
    this.allTables().filter(table => table.status === TableStatus.MAINTENANCE).length
  );

  reservedTables = computed(() =>
    this.allTables().filter(table => table.status === TableStatus.RESERVED).length
  );

  // Filtered count
  filteredCount = computed(() => this.filteredAndSortedTables().length);

  // Check if any filters are applied
  hasActiveFilters = computed(() =>
    this.searchTerm() !== '' || this.statusFilter() !== 'all'
  );

  ngOnInit(): void {
    this.loadTables();
    this.setupFormControls();
    this.subscribeToService();
  }

  private setupFormControls(): void {
    // Search với debounce để tối ưu performance
    this.searchControl.valueChanges
      .pipe(
        startWith(''),
        debounceTime(300),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(value => this.searchTerm.set(value || ''));

    // Status filter
    this.statusFilterControl.valueChanges
      .pipe(
        startWith('all'),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(value => this.statusFilter.set(value || 'all'));

    // Sort by
    this.sortByControl.valueChanges
      .pipe(
        startWith('name'),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(value => {
        const allowed: Array<'name' | 'price' | 'status'> = ['name', 'price', 'status'];
        this.sortBy.set((allowed.includes(value as any) ? value : 'name') as 'name' | 'price' | 'status');
      });

    // Sort order
    this.sortOrderControl.valueChanges
      .pipe(
        startWith('asc'),
        takeUntilDestroyed(this.destroyRef)
      )
        .subscribe(value => {
        const allowed: Array<'asc' | 'desc'> = ['asc', 'desc'];
        this.sortOrder.set((allowed.includes(value as any) ? value : 'asc') as 'asc' | 'desc');
      });
  }

  private subscribeToService(): void {
    // Subscribe to auto-refreshed data từ service
    this.tableService.tables$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(tables => {
         console.log(' Tables received:', tables);
        console.log('Tables count:', tables.length);
        this.allTables.set(tables);
        this.lastUpdateTime.set(new Date());
      });

    // Subscribe to loading state
    this.tableService.loading$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(loading => this.loading.set(loading));

    // Subscribe to error state
    this.tableService.error$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(error => this.error.set(error));
  }

  // HELPER METHODS
  private getStatusPriority(status: string): number {
    const priorities: { [key: string]: number } = {
      [TableStatus.AVAILABLE]: 1,
      [TableStatus.RESERVED]: 2,
      [TableStatus.OCCUPIED]: 3,
      [TableStatus.MAINTENANCE]: 4
    };
    return priorities[status] || 5;
  }

 getStatusColor(status: string): string {
  const colors: { [key: string]: string } = {
    [TableStatus.AVAILABLE]: 'text-green-700 bg-green-100 border border-green-200',
    [TableStatus.OCCUPIED]: 'text-red-700 bg-red-100 border border-red-200',
    [TableStatus.MAINTENANCE]: 'text-yellow-700 bg-yellow-100 border border-yellow-200',
    [TableStatus.RESERVED]: 'text-blue-700 bg-blue-100 border border-blue-200'
  };
  return colors[status] || 'text-gray-700 bg-gray-100 border border-gray-200';
}


  getStatusIcon(status: string): string {
    const icons: { [key: string]: string } = {
      [TableStatus.AVAILABLE]: 'fas fa-check-circle',
      [TableStatus.OCCUPIED]: 'fas fa-user-friends',
      [TableStatus.MAINTENANCE]: 'fas fa-tools',
      [TableStatus.RESERVED]: 'fas fa-calendar-check'
    };
    return icons[status] || 'fas fa-circle';
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  }

  formatTime(date: Date): string {
    return date.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }

  // ACTIONS
  selectTable(table: Table): void {
    this.selectedTable.set(table);
  }

  clearSelection(): void {
    this.selectedTable.set(null);
  }

  // Manual refresh (force gọi API ngay)
  refreshData(): void {
    this.tableService.refreshTables();
  }

  clearError(): void {
    this.tableService.clearError();
  }

  // Reset tất cả filters
  resetFilters(): void {
    this.searchControl.setValue('');
    this.statusFilterControl.setValue('all');
    this.sortByControl.setValue('name');
    this.sortOrderControl.setValue('asc');
  }

  // Toggle sort order
  toggleSortOrder(): void {
    const currentOrder = this.sortOrder();
    this.sortOrderControl.setValue(currentOrder === 'asc' ? 'desc' : 'asc');
  }

  // Quick filters
  showAvailableOnly(): void {
    this.statusFilterControl.setValue(TableStatus.AVAILABLE);
  }

  showOccupiedOnly(): void {
    this.statusFilterControl.setValue(TableStatus.OCCUPIED);
  }

  showAllTables(): void {
    this.statusFilterControl.setValue('all');
  }

  // Auto refresh controls
  toggleAutoRefresh(): void {
    if (this.tableService.isAutoRefreshActive()) {
      this.tableService.pauseAutoRefresh();
      this.autoRefreshEnabled.set(false);
    } else {
      this.tableService.resumeAutoRefresh();
      this.autoRefreshEnabled.set(true);
    }
  }

  // Booking action
bookTable(table: Table) {
  // 1. Kiểm tra trạng thái bàn
  if (table.status !== TableStatus.AVAILABLE) {
    alert(`Bàn ${table.tableName} hiện không có sẵn để đặt.`);
    console.warn(`Attempted to book non-available table: ${table.tableName} (Status: ${table.status})`);
    return;
  }

  // 2. Lấy và kiểm tra User ID
  const userId = this.authService.getUserId();
  if (!userId) {
    console.error('User ID not found. User needs to log in.');
    alert('Bạn cần đăng nhập để thực hiện chức năng này.');
    // 3. Điều hướng người dùng đến trang đăng nhập
    this.router.navigate(['/login']);
    return;
  }
  console.log(`User ID: ${userId} attempting to book Table ID: ${table.tableId}`);

  // 4. Gọi API đặt bàn
  // Giả định this.tableService.bookTable trả về trực tiếp ID (là một số)
  this.tableService.bookTable(table.tableId, Number(userId)).subscribe({
    next: (orderId) => { // API trả về trực tiếp ID (số)
      console.log('Booking API Response (Order ID):', orderId);

      // 5. Kiểm tra Order ID nhận được
      if (typeof orderId !== 'number' || orderId <= 0) {
        console.error('Invalid Order ID received from booking response:', orderId);
        alert('Đặt bàn không thành công: Không nhận được ID đơn hàng hợp lệ từ hệ thống.');
        this.currentOrderId.set(0); // Đảm bảo reset nếu có lỗi sớm
        return;
      }

      // 6. Lưu Order ID và gọi API gửi OTP
      this.currentOrderId.set(orderId);
      console.log('Current Order ID for OTP processing set to:', this.currentOrderId());

      this.otpService.sendOtp(orderId).subscribe({
        next: (otpSendApiResponse) => {
          console.log('OTP Send API Response:', otpSendApiResponse);

          // 7. Lưu trữ response gửi OTP vào localStorage
          try {
          } catch (e) {
            console.warn('Could not save OTP send response to localStorage:', e);
          }

          // 8. Mở popup OTP và hiển thị thông báo
          this.showOtpModal.set(true);
          const popupInstance = this.otpPopupRef(); // Giả định bạn có viewChild tên là otpPopupRef
          if (popupInstance) {
            popupInstance.resetInternalState(); // Reset trạng thái của popup (input, messages, cooldown)
            popupInstance.showSuccess(otpSendApiResponse.message || 'Mã OTP đã được gửi. Vui lòng kiểm tra email.');
          } else {
            console.error('OTP Popup reference (otpPopupRef) is not available. Cannot show success message.');
            // Thông báo cho người dùng rằng có lỗi giao diện, họ có thể cần F5 hoặc thử lại
            alert('Giao diện OTP gặp lỗi. Nếu bạn không thấy popup, vui lòng thử lại sau ít phút hoặc tải lại trang.');
          }
        },
        error: (otpSendError) => {
          console.error('Error sending OTP via API:', otpSendError);
          const errorMessage = otpSendError.error?.message || otpSendError.message || 'Không thể gửi mã OTP. Vui lòng thử lại sau.';
          alert('Lỗi gửi OTP: ' + errorMessage);
          this.currentOrderId.set(0); // Reset Order ID nếu gửi OTP thất bại
        }
      });
    },
    error: (bookingApiError) => {
      console.error('Booking API Error:', bookingApiError);
      const errorMessage = bookingApiError.error?.message || bookingApiError.message || 'Không thể hoàn tất việc đặt bàn. Vui lòng thử lại.';
      alert('Đặt bàn không thành công: ' + errorMessage);
      this.currentOrderId.set(0); // Reset Order ID nếu đặt bàn thất bại
    }
  });
}


 handleOtpPopupClose(): void {
    console.log('OTP Popup close event received.');
    this.showOtpModal.set(false); // Giả sử bạn có signal showOtpModal để điều khiển popup
    this.currentOrderId.set(0); // Reset currentOrderId nếu cần
    // Thêm logic khác nếu cần khi đóng popup
  }

// Giả sử đây là một phần của class TablesUserComponent
// và bạn đã khai báo các signals/viewChild cần thiết:
// otpPopupRef = viewChild<OtpPopupComponent>('otpPopupRef');
// showOtpModal = signal(false);
// currentOrderId = signal<number | null>(null); // Nên là number | null

handleOtpVerifyAttempt(userEnteredOtp: string): void {
  console.log('OTP Verify attempt event received with user-entered OTP:', userEnteredOtp);
  const orderId = this.currentOrderId(); // Lấy orderId hiện tại từ signal
  const popupInstance = this.otpPopupRef(); // Lấy tham chiếu đến instance của OtpPopupComponent

  // 1. Kiểm tra xem tham chiếu đến popup có tồn tại không
  if (!popupInstance) {
    console.error('OTP Popup reference (otpPopupRef) is not available for verification.');
    alert('Lỗi giao diện OTP. Vui lòng thử lại sau hoặc tải lại trang.');
    return;
  }

  // 2. Kiểm tra xem orderId có tồn tại không
  if (!orderId) {
    popupInstance.showError('Lỗi hệ thống: Không tìm thấy ID đơn hàng để xác minh.');
    console.error('OTP Verify: currentOrderId is null. Cannot proceed with OTP verification.');
    return;
  }

  // 3. Tạo key để lấy OTP từ localStorage
  const localStorageKey = `${orderId}-otp`; // Ví dụ: "133-otp"

  try {
    const storedOtpDataString = localStorage.getItem(localStorageKey);

    if (!storedOtpDataString) {
      popupInstance.showError('Không tìm thấy thông tin OTP đã lưu. Vui lòng thử gửi lại OTP.');
      console.warn(`No OTP data found in localStorage for key: ${localStorageKey}`);
      return;
    }


    interface StoredOtpInfo {
      code: string;
      orderTableId: number;
      expiresAt: number;
    }

    let storedOtpInfo: StoredOtpInfo;
    try {
      storedOtpInfo = JSON.parse(storedOtpDataString);
    } catch (parseError) {
      popupInstance.showError('Lỗi đọc dữ liệu OTP đã lưu. Vui lòng thử gửi lại OTP.');
      console.error(`Error parsing OTP data from localStorage for key ${localStorageKey}:`, parseError);
      localStorage.removeItem(localStorageKey); // Xóa dữ liệu không hợp lệ
      return;
    }

    // 5. Kiểm tra tính hợp lệ của dữ liệu đã parse
    if (!storedOtpInfo || typeof storedOtpInfo.code !== 'string' || typeof storedOtpInfo.expiresAt !== 'number') {
        popupInstance.showError('Dữ liệu OTP đã lưu không hợp lệ. Vui lòng thử gửi lại OTP.');
        console.error(`Invalid OTP data structure in localStorage for key ${localStorageKey}:`, storedOtpInfo);
        localStorage.removeItem(localStorageKey); // Xóa dữ liệu không hợp lệ
        return;
    }

    // 7. So sánh OTP người dùng nhập với OTP đã lưu
    if (userEnteredOtp === storedOtpInfo.code) {
      // === OTP KHỚP ===
      console.log(`SUCCESS: User OTP (${userEnteredOtp}) matches stored OTP (${storedOtpInfo.code}) for order ID ${orderId}.`);
      popupInstance.showSuccess('Xác minh OTP thành công!');
      popupInstance.clearOtpInput();

      // Xóa OTP đã sử dụng khỏi localStorage
      localStorage.removeItem(localStorageKey);

      // Đóng popup, reset currentOrderId và thực hiện hành động sau khi thành công
      setTimeout(() => {
        this.showOtpModal.set(false);
        // xác minh thành công update trạng thái bàn từ đang trống thành đã được đặt
        this.tableService.refreshTables(); // Gọi phương thức refresh từ service để cập nhật dữ liệu

        this.tableService.updateTableStatus(this.currentOrderId(),'Đang trống', 'Đã đặt trước') .subscribe({
              next: (updateResponse) => {
                console.log('Table status updated successfully:', updateResponse);
              },
              error: (errorResponse) => {
                console.error('Error updating table status:', errorResponse);
              }
        });

      }, 1500);

    } else {
      // === OTP KHÔNG KHỚP ===
      console.warn(`FAILURE: User OTP (${userEnteredOtp}) does NOT match stored OTP (${storedOtpInfo.code}) for order ID ${orderId}.`);
      popupInstance.showError('Mã OTP không chính xác. Vui lòng thử lại.');
      popupInstance.clearOtpInput();
    }

  } catch (error) {
    // Lỗi chung khi thao tác với localStorage hoặc các lỗi không lường trước
    console.error('An unexpected error occurred during OTP verification from localStorage:', error);
    popupInstance.showError('Đã xảy ra lỗi không mong muốn. Vui lòng thử lại.');
  }
}

  handleOtpResendAttempt(): void {}

  private loadTables() {
    this.isLoading.set(true);
    // Your existing table loading logic
  }

  searchByPriceRange(min: number, max: number): void {
    // Client-side filter by price range
    // Có thể implement thêm nếu cần
  }

  getTablesByStatus(status: string): Table[] {
    return this.allTables().filter(table => table.status === status);
  }
}
