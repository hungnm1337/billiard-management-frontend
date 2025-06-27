import { Component, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableService } from '../../../services/table/table.service';
import { Table, CreateTableDto } from '../../../interface/table.interface';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-manager-tables',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './manager-tables.component.html',
  styleUrl: './manager-tables.component.scss'
})
export class ManagerTablesComponent implements OnInit, OnDestroy {
  // ============ SIGNALS ============
  allTables = signal<Table[]>([]);
  filteredTables = signal<Table[]>([]);
  isLoading = signal<boolean>(false);
  errorMessage = signal<string>('');
  successMessage = signal<string>('');
  showModal = signal<boolean>(false);
  isEditMode = signal<boolean>(false);
  isSubmitting = signal<boolean>(false);

  // ============ FORM DATA - CHỈ DÙNG MỘT INTERFACE ============
  formData: CreateTableDto = {
    tableName: '',
    status: 'Available',
    hourlyRate: 0
  };

  // ============ FILTERS ============
  searchTerm = '';
  selectedStatus = '';
  sortBy = 'name';
  currentEditingId: number | null = null;

  // ============ SUBSCRIPTIONS ============
  private subscriptions: Subscription[] = [];

  constructor(private tableService: TableService) {}

  // ============ LIFECYCLE HOOKS ============
  ngOnInit(): void {
    this.initializeComponent();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  // ============ INITIALIZATION ============
  private initializeComponent(): void {
    this.loadInitialData();
    this.subscribeToUpdates();
  }

  private loadInitialData(): void {
    const tables = this.tableService.getTables();
    this.allTables.set(tables);
    this.applyFilters();
  }

  private subscribeToUpdates(): void {
    const subscriptions = [
      this.tableService.tables$.subscribe(tables => {
        this.allTables.set(tables);
        this.applyFilters();
      }),
      this.tableService.loading$.subscribe(loading => {
        this.isLoading.set(loading);
      }),
      this.tableService.error$.subscribe(error => {
        this.errorMessage.set(error || '');
      })
    ];

    this.subscriptions.push(...subscriptions);
  }

  // ============ MODAL MANAGEMENT ============
  openCreateModal(): void {
    this.resetForm();
    this.isEditMode.set(false);
    this.showModal.set(true);
  }

  openEditModal(table: Table): void {
    this.populateForm(table);
    this.isEditMode.set(true);
    this.currentEditingId = table.tableId;
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
    this.currentEditingId = null;
    this.resetForm();
    this.clearMessages();
  }

  private resetForm(): void {
    this.formData = {
      tableName: '',
      status: 'Available',
      hourlyRate: 0
    };
  }

  private populateForm(table: Table): void {
    this.formData = {
      tableName: table.tableName,
      status: table.status,
      hourlyRate: table.hourlyRate
    };
  }

  // ============ CRUD OPERATIONS ============
  onSubmit(): void {
    if (this.isSubmitting() || !this.isFormValid()) return;

    this.isSubmitting.set(true);
    this.clearMessages();

    if (this.isEditMode() && this.currentEditingId) {
      this.performUpdate();
    } else {
      this.performCreate();
    }
  }

  private isFormValid(): boolean {
    return !!(this.formData.tableName.trim() &&
              this.formData.hourlyRate > 0);
  }

  private performCreate(): void {
    const subscription = this.tableService.createTable(this.formData).subscribe({
      next: () => this.handleSuccess('Thêm bàn mới thành công!'),
      error: (error) => this.handleError(error, 'Có lỗi xảy ra khi thêm bàn')
    });

    this.subscriptions.push(subscription);
  }

  private performUpdate(): void {
    if (!this.currentEditingId) return;

    // Tạo UpdateTableDto với TableId
    const updateData = {
      tableId: this.currentEditingId,
      tableName: this.formData.tableName,
      hourlyRate: this.formData.hourlyRate
    };
    console.log(updateData);

    const subscription = this.tableService.updateTable(this.currentEditingId, updateData).subscribe({
      next: () => this.handleSuccess('Cập nhật thông tin bàn thành công!'),
      error: (error) => this.handleError(error, 'Có lỗi xảy ra khi cập nhật bàn')
    });

    this.subscriptions.push(subscription);
  }

  deleteTable(tableId: number): void {
    if (!this.confirmDelete()) return;

    const subscription = this.tableService.deleteTable(tableId).subscribe({
      next: () => this.showSuccessMessage('Xóa bàn thành công!'),
      error: (error) => this.handleError(error, 'Có lỗi xảy ra khi xóa bàn')
    });

    this.subscriptions.push(subscription);
  }

  private confirmDelete(): boolean {
    return confirm('Bạn có chắc chắn muốn xóa bàn này?');
  }

  // ============ STATUS MANAGEMENT ============
  changeStatus(table: Table, newStatus: string): void {
    const subscription = this.tableService.updateTableStatus(
      table.tableId,
      table.status,
      newStatus
    ).subscribe({
      next: () => this.showSuccessMessage(`Đã chuyển trạng thái bàn thành "${this.getStatusText(newStatus)}"`),
      error: (error) => this.handleError(error, 'Có lỗi xảy ra khi thay đổi trạng thái')
    });

    this.subscriptions.push(subscription);
  }

  // ============ FILTERING & SEARCHING ============
  onSearch(): void {
    this.applyFilters();
  }

  onFilterChange(): void {
    this.applyFilters();
  }

  onSortChange(): void {
    this.applyFilters();
  }

  private applyFilters(): void {
    let filtered = [...this.allTables()];

    filtered = this.applySearchFilter(filtered);
    filtered = this.applyStatusFilter(filtered);
    filtered = this.applySorting(filtered);

    this.filteredTables.set(filtered);
  }

  private applySearchFilter(tables: Table[]): Table[] {
    if (!this.searchTerm.trim()) return tables;

    return tables.filter(table =>
      table.tableName.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }

  private applyStatusFilter(tables: Table[]): Table[] {
    if (!this.selectedStatus) return tables;

    // Mapping status values
    const statusMapping: { [key: string]: string } = {
      'Trống': 'Đang trống',
      'Đang sử dụng': 'Đang sử dụng',
      'Đang bảo trì': 'Đang bảo trì'
    };

    const mappedStatus = statusMapping[this.selectedStatus] || this.selectedStatus;
    return tables.filter(table => table.status === mappedStatus);
  }

  private applySorting(tables: Table[]): Table[] {
    return tables.sort((a, b) => {
      switch (this.sortBy) {
        case 'name':
          return a.tableName.localeCompare(b.tableName);
        case 'status':
          return a.status.localeCompare(b.status);
        case 'rate':
          return a.hourlyRate - b.hourlyRate;
        default:
          return 0;
      }
    });
  }

  // ============ UTILITY METHODS ============
  getTableCountByStatus(status: string): number {
    return this.allTables().filter(table => table.status === status).length;
  }

  getStatusText(status: string): string {
    const statusMap: { [key: string]: string } = {
      'Đang trống': 'Đang trống',
      'Đang sử dụng': 'Đang sử dụng',
      'Đang bảo trì': 'Đang bảo trì'
    };
    return statusMap[status] || status;
  }

  getStatusClass(status: string): string {
    const classMap: { [key: string]: string } = {
      'Đang trống': 'bg-green-100 text-green-800',
      'Đã đặt trước': 'bg-red-100 text-red-800',
      'Đang bảo trì': 'bg-yellow-100 text-yellow-800'
    };
    return classMap[status] || 'bg-gray-100 text-gray-800';
  }

  // ============ MESSAGE HANDLING ============
  private handleSuccess(message: string): void {
    this.showSuccessMessage(message);
    this.closeModal();
    this.isSubmitting.set(false);
  }

  private handleError(error: any, defaultMessage: string): void {
    this.errorMessage.set(error?.message || defaultMessage);
    this.isSubmitting.set(false);
  }

  private showSuccessMessage(message: string): void {
    this.successMessage.set(message);
    this.autoHideMessage();
  }

  clearError(): void {
    this.errorMessage.set('');
    this.tableService.clearError();
  }

  clearSuccess(): void {
    this.successMessage.set('');
  }

  private clearMessages(): void {
    this.errorMessage.set('');
    this.successMessage.set('');
  }

  private autoHideMessage(): void {
    setTimeout(() => this.clearSuccess(), 3000);
  }

  // ============ COMPUTED PROPERTIES ============
  get hasNoTables(): boolean {
    return this.filteredTables().length === 0 && !this.isLoading();
  }

  get modalTitle(): string {
    return this.isEditMode() ? 'Sửa thông tin bàn' : 'Thêm bàn mới';
  }

  get submitButtonText(): string {
    if (this.isSubmitting()) return 'Đang xử lý...';
    return this.isEditMode() ? 'Cập nhật' : 'Thêm mới';
  }
}
