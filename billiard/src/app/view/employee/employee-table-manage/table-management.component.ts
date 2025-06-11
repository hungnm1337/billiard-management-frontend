import { ChangeDetectionStrategy, ChangeDetectorRef, Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { TableService } from '../../../services/table/table.service';
import { Table, TableStatus } from '../../../interface/table.interface';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth/auth.service';
import { debounceTime, distinctUntilChanged, startWith } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { ServiceService } from '../../../services/service/service.service';
import { Service, ServiceStatus } from '../../../services/service/service.service';
import { InvoiceService } from '../../../services/invoice/invoice.service';

@Component({
  selector: 'app-table-management',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './table-management.component.html',
  styleUrl: './table-management.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TableManagementComponent implements OnInit {

closeTable(arg0: number) {
console.log('closeTable called with:', arg0);
// tính thời gian đã sử dụng
const tableId = arg0;
const startTime = this.getTableStartTime(tableId);
if (!startTime) {
  console.error('No start time found for table:', tableId);
}
const endTime = new Date();
if (startTime) {
  const usedTime = endTime.getTime() - startTime.getTime();

  const usedSeconds = Math.floor(usedTime / 1000);
  console.log('Used time in seconds:', usedSeconds);

  const hourlyRate = this.getTableHourlyRate(tableId);
  console.log('Hourly rate for table:', hourlyRate);
  const totalCost = (usedSeconds / 3600) * hourlyRate;
  console.log('Total cost:', totalCost);
} else {
  console.error('Start time is not defined for table:', tableId);
}


}
  getTableHourlyRate(tableId: number) {
    // lấy giá bàn theo id bàn
    const table = this.allTables().find(t => t.tableId === tableId);
    // trả về giá tiền
    return table ? table.hourlyRate : 0;
  }

tableStartTimes = signal<{[tableId: number]: Date}>({});
private updateTimer: any;
  currentTime = signal(new Date());

InverTable(_t112: number) {
  console.log('InverTable called with:', _t112);
  const tableId = _t112;
  const employeeId = this.authService.getUserId();

  this.invoice.createInvoice(Number(employeeId), tableId).subscribe({
    next: (invoiceId) => {
      console.log('Invoice created successfully with ID:', invoiceId);

      // Lưu invoiceId lên localStorage
      localStorage.setItem("TableId-"+tableId.toString(),"InvoiceId-"+ invoiceId.toString());

      // Lưu thời gian bắt đầu
      const currentTime = new Date();
      console.log('Current time:', currentTime.toLocaleString());

      // Cập nhật signal với thời gian bắt đầu của bàn
      const currentTimes = this.tableStartTimes();
      this.tableStartTimes.set({
        ...currentTimes,
        [tableId]: currentTime
      });

      // Lưu thời gian vào localStorage để persist data
      localStorage.setItem(`table_start_time_${tableId}`, currentTime.toISOString());
      this.refreshData(); // Tải lại danh sách bàn để cập nhật trạng thái
    },
    error: (error) => {
      console.error('Error creating invoice:', error);
    }
  });
}

 private startUpdateTimer(): void {
    this.updateTimer = setInterval(() => {
      this.currentTime.set(new Date());
      this.cdr.markForCheck(); // Trigger change detection manually
    }, 1000);
  }

private loadTableStartTimes(): void {
  const savedTimes: {[tableId: number]: Date} = {};

  // Duyệt qua localStorage để tìm các thời gian đã lưu
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('table_start_time_')) {
      const tableId = parseInt(key.replace('table_start_time_', ''));
      const timeString = localStorage.getItem(key);
      if (timeString) {
        savedTimes[tableId] = new Date(timeString);
      }
    }
  }

  this.tableStartTimes.set(savedTimes);
}
// Thêm method để lấy thời gian bắt đầu của bàn
getTableStartTime(tableId: number): Date | null {
  return this.tableStartTimes()[tableId] || null;
}

// Thêm method để format thời gian hiển thị
formatStartTime(tableId: number): string {
  const startTime = this.getTableStartTime(tableId);
  if (!startTime) return '';

  return startTime.toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

// Thêm method để tính thời gian đã sử dụng
getUsedTime(tableId: number): string {
  const startTime = this.getTableStartTime(tableId);
  if (!startTime) return '';

  const now = this.currentTime();
  const diffMs = now.getTime() - startTime.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  const diffSeconds = Math.floor((diffMs % (1000 * 60)) / 1000);

  return `${diffHours.toString().padStart(2, '0')}:${diffMinutes.toString().padStart(2, '0')}:${diffSeconds.toString().padStart(2, '0')}`;
}

  services = signal<Service[]>([]);

  showOtpModal = signal(false);
  currentOrderId = signal(0);
  allTables = signal<Table[]>([]);
  isLoading = signal(false);
  private tableService = inject(TableService);
  private destroyRef = inject(DestroyRef);

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
constructor( private cdr: ChangeDetectorRef,private router: Router, private authService: AuthService, private serviceService: ServiceService, private invoice: InvoiceService) {

}

async loadServices() {
    this.loading.set(true);
    try {
      const services = await this.serviceService.getServices().toPromise();
      this.services.set(services || []);
      this.serviceService.updateServices(services || []);
    } catch (error) {
      console.error('Error loading services:', error);
    } finally {
      this.loading.set(false);
    }
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
    this.loadServices();
    this.startUpdateTimer();
    this.loadTableStartTimes();
    console.log(this.services());
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
