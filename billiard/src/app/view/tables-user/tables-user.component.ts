import { Component, OnInit, computed, signal, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { debounceTime, distinctUntilChanged, startWith } from 'rxjs/operators';

import { TableService } from '../../services/table/table.service';
import { Table, TableStatus } from '../../interface/table.interface';
import { HeaderComponent } from "../header/header.component";

@Component({
  selector: 'app-tables-user',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HeaderComponent],
  templateUrl: './tables-user.component.html',
  styleUrl: './tables-user.component.scss'
})
export class TablesUserComponent implements OnInit {
private tableService = inject(TableService);
private destroyRef = inject(DestroyRef);

 allTables = signal<Table[]>([]);

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

   // CLIENT-SIDE FILTERING & SORTING
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
         console.log('📊 Tables received:', tables); // DEBUG
        console.log('📊 Tables count:', tables.length); // DEBUG
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
  bookTable(table: Table): void {
    if (table.status === TableStatus.AVAILABLE) {
      console.log('Booking table:', table);
      alert(`Đặt bàn ${table.tableName} thành công!`);
    }
  }

  // Advanced search methods
  searchByPriceRange(min: number, max: number): void {
    // Client-side filter by price range
    // Có thể implement thêm nếu cần
  }

  getTablesByStatus(status: string): Table[] {
    return this.allTables().filter(table => table.status === status);
  }
}
