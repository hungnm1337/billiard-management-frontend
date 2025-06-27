import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { ServiceService, Service } from '../service/service.service';

export interface Table {
  tableId: number;
  tableName: string;
  status: string;
  hourlyRate: number;
  orderTables: any[];
}

export interface ServiceTableDetail {
  serviceTableId: number;
  invoiceId: number;
  tableId: number;
  serviceId: number;
  quantity: number;
}

export interface TableServiceData {
  invoiceId: number;
  services: { [serviceId: number]: number };
}

export interface AllTableServicesData {
  [tableId: number]: TableServiceData;
}

@Injectable({
  providedIn: 'root'
})
export class ServiceOfTableService {
  private http = inject(HttpClient);
  private serviceService = inject(ServiceService);
  private readonly API_BASE = 'https://localhost:7176/api';

  // Signals for reactive state management
  private tablesSignal = signal<Table[]>([]);
  private tableServicesSignal = signal<AllTableServicesData>({});
  private loadingSignal = signal<boolean>(false);
  private errorSignal = signal<string | null>(null);

  // Public readonly signals
  readonly tables = this.tablesSignal.asReadonly();
  readonly tableServices = this.tableServicesSignal.asReadonly();
  readonly loading = this.loadingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();

  // Computed signals
  readonly openTablesCount = computed(() => this.tablesSignal().length);
  readonly totalRevenue = computed(() => {
    const tables = this.tablesSignal();
    return tables.reduce((total, table) => {
      return total + this.getTotalAmount(table.tableId);
    }, 0);
  });

  constructor() {

  }
  // Thêm phương thức helper
private clearOldDataIfNeeded(): void {
  const lastClearTime = localStorage.getItem('lastDataClear');
  const now = Date.now();
  const ONE_DAY = 24 * 60 * 60 * 1000; // 1 ngày

  if (!lastClearTime || (now - parseInt(lastClearTime)) > ONE_DAY) {
    console.log('🧹 Clearing old localStorage data...');
    this.clearAllTableServicesFromStorage();
    localStorage.setItem('lastDataClear', now.toString());
  }
}

// Thêm phương thức initialize mới
async initialize(): Promise<void> {
  this.loadingSignal.set(true);

  try {
    // 1. Clear localStorage cũ nếu cần
    this.clearOldDataIfNeeded();

    // 2. Load fresh data từ API trước
    await Promise.all([
      this.loadTables(),
      this.loadServices()
    ]);

    // 3. Sau đó mới load localStorage
    this.loadAllTableServicesFromStorage();

    console.log('✅ Service initialized successfully');

  } catch (error) {
    console.error('❌ Error initializing service:', error);
    this.errorSignal.set('Không thể khởi tạo dịch vụ');
  } finally {
    this.loadingSignal.set(false);
  }
}

  // API calls
  getOpenTables(): Observable<Table[]> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    return this.http.get<Table[]>(`${this.API_BASE}/Tables/open`).pipe(
      tap(data => {
        console.log('🔥 Raw API Response from /Tables/open:', data);
        console.table(data);
        this.tablesSignal.set(data || []);
        this.loadingSignal.set(false);
      }),
      catchError(error => {
        console.error('❌ Error loading tables:', error);
        this.errorSignal.set('Không thể tải danh sách bàn');
        this.loadingSignal.set(false);
        return throwError(() => error);
      })
    );
  }

  // Load data and update signals
  async loadTables(): Promise<void> {
    try {
      await this.getOpenTables().toPromise();
    } catch (error) {
      console.error('Error loading tables:', error);
    }
  }

  async loadServices(): Promise<void> {
    try {
      const services = await this.serviceService.getServices().toPromise();
      if (services) {
        this.serviceService.updateServices(services);
      }
    } catch (error) {
      console.error('Error loading services:', error);
    }
  }

  // LocalStorage operations - Lưu riêng từng bàn
  private loadTableServiceFromStorage(tableId: number): TableServiceData | null {
    const key = `tableService-${tableId}`;
    const stored = localStorage.getItem(key);
    if (stored) {
      try {
        const data = JSON.parse(stored);
        console.log(`📦 Loaded table service for table ${tableId}:`, data);
        return data;
      } catch (error) {
        console.error(`Error parsing stored data for table ${tableId}:`, error);
      }
    }
    return null;
  }

  private saveTableServiceToStorage(tableId: number, data: TableServiceData): void {
    const key = `tableService-${tableId}`;
    localStorage.setItem(key, JSON.stringify(data));
    console.log(`💾 Saved table service for table ${tableId}:`, data);
  }

  private removeTableServiceFromStorage(tableId: number): void {
    const key = `tableService-${tableId}`;
    localStorage.removeItem(key);
    console.log(`🗑️ Removed table service for table ${tableId}`);
  }

  // Load tất cả table services từ localStorage
  private loadAllTableServicesFromStorage(): void {
    const allTableServices: AllTableServicesData = {};

    // Lặp qua tất cả keys trong localStorage để tìm tableService-*
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('tableService-')) {
        const tableIdMatch = key.match(/tableService-(\d+)/);
        if (tableIdMatch) {
          const tableId = parseInt(tableIdMatch[1]);
          const data = this.loadTableServiceFromStorage(tableId);
          if (data) {
            allTableServices[tableId] = data;
          }
        }
      }
    }

    this.tableServicesSignal.set(allTableServices);
    console.log('📦 Loaded all table services from storage:', allTableServices);
  }

  // Invoice ID operations với format: TableId-{tableId} -> InvoiceId-{invoiceId}
  private getOrCreateInvoiceId(tableId: number): number {
    const key = `TableId-${tableId.toString()}`;
    const stored = localStorage.getItem(key);

    if (stored) {
      const invoiceIdMatch = stored.match(/InvoiceId-(\d+)/);
      if (invoiceIdMatch) {
        const invoiceId = parseInt(invoiceIdMatch[1]);
        console.log(`✅ Found existing invoiceId: ${invoiceId} for tableId: ${tableId}`);
        return invoiceId;
      }
    }

    const newInvoiceId = Date.now();
    localStorage.setItem(key, `InvoiceId-${newInvoiceId.toString()}`);
    console.log(`🆕 Created new invoiceId: ${newInvoiceId} for tableId: ${tableId}`);
    return newInvoiceId;
  }

  getAllInvoiceIds(): { [tableId: number]: number } {
    const invoiceIds: { [tableId: number]: number } = {};

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('TableId-')) {
        const tableIdMatch = key.match(/TableId-(\d+)/);
        if (tableIdMatch) {
          const tableId = parseInt(tableIdMatch[1]);
          const value = localStorage.getItem(key);

          if (value) {
            const invoiceIdMatch = value.match(/InvoiceId-(\d+)/);
            if (invoiceIdMatch) {
              const invoiceId = parseInt(invoiceIdMatch[1]);
              invoiceIds[tableId] = invoiceId;
            }
          }
        }
      }
    }

    console.log('📋 All invoice IDs:', invoiceIds);
    return invoiceIds;
  }

  removeInvoiceId(tableId: number): void {
    const key = `TableId-${tableId.toString()}`;
    localStorage.removeItem(key);
    console.log(`🗑️ Removed invoiceId for tableId: ${tableId}`);
  }

  // Business logic using ServiceService
  async addServiceToTable(tableId: number, serviceId: number, quantity: number): Promise<boolean> {
    try {
      console.log(`🔄 Adding service ${serviceId} (qty: ${quantity}) to table ${tableId}`);

      // Kiểm tra số lượng dịch vụ có sẵn
      const currentServices = this.serviceService.getCurrentServices();
      const service = currentServices.find(s => s.serviceId === serviceId);

      if (!service || service.quantity < quantity) {
        console.error(`❌ Not enough service quantity. Available: ${service?.quantity || 0}, Requested: ${quantity}`);
        this.errorSignal.set('Không đủ số lượng dịch vụ');
        return false;
      }

      // Sử dụng ServiceService để giảm số lượng
      await this.serviceService.decreaseQuantity(serviceId, quantity).toPromise();

      // Get hoặc tạo table service data
      const currentTableServices = this.tableServicesSignal();
      const invoiceId = this.getOrCreateInvoiceId(tableId);

      const currentTableData = currentTableServices[tableId] || {
        invoiceId,
        services: {}
      };

      const updatedTableData: TableServiceData = {
        invoiceId,
        services: {
          ...currentTableData.services,
          [serviceId]: (currentTableData.services[serviceId] || 0) + quantity
        }
      };

      // Lưu riêng cho bàn này
      this.saveTableServiceToStorage(tableId, updatedTableData);

      // Update signal
      const updatedAllTableServices = {
        ...currentTableServices,
        [tableId]: updatedTableData
      };
      this.tableServicesSignal.set(updatedAllTableServices);

      console.log(`✅ Successfully added service ${serviceId} to table ${tableId} with invoice ${invoiceId}`);

      // Reload services để cập nhật UI
      await this.loadServices();
      this.errorSignal.set(null);
      return true;
    } catch (error) {
      console.error('❌ Error adding service to table:', error);
      this.errorSignal.set('Không thể thêm dịch vụ vào bàn');
      return false;
    }
  }

  async updateServiceQuantity(tableId: number, serviceId: number, newQuantity: number): Promise<boolean> {
    try {
      console.log(`🔄 Updating service ${serviceId} quantity to ${newQuantity} for table ${tableId}`);

      const currentTableServices = this.tableServicesSignal();
      const currentTableData = currentTableServices[tableId];
      const currentQuantity = currentTableData?.services?.[serviceId] || 0;
      const difference = newQuantity - currentQuantity;

      if (newQuantity < 0) {
        console.error('❌ New quantity cannot be negative');
        return false;
      }

      if (difference > 0) {
        // Cần thêm dịch vụ - kiểm tra và giảm từ kho
        const currentServices = this.serviceService.getCurrentServices();
        const service = currentServices.find(s => s.serviceId === serviceId);

        if (!service || service.quantity < difference) {
          console.error(`❌ Not enough service quantity. Available: ${service?.quantity || 0}, Needed: ${difference}`);
          this.errorSignal.set('Không đủ số lượng dịch vụ');
          return false;
        }

        await this.serviceService.decreaseQuantity(serviceId, difference).toPromise();
      } else if (difference < 0) {
        // Cần bớt dịch vụ - tăng vào kho
        await this.serviceService.increaseQuantity(serviceId, Math.abs(difference)).toPromise();
      }

      // Update table service data
      const invoiceId = this.getOrCreateInvoiceId(tableId);
      const updatedTableData: TableServiceData = {
        invoiceId,
        services: {
          ...currentTableData?.services,
          [serviceId]: newQuantity
        }
      };

      // Remove service if quantity is 0
      if (newQuantity === 0) {
        delete updatedTableData.services[serviceId];
        console.log(`🗑️ Removed service ${serviceId} from table ${tableId} (quantity = 0)`);
      }

      // Lưu riêng cho bàn này
      this.saveTableServiceToStorage(tableId, updatedTableData);

      // Update signal
      const updatedAllTableServices = {
        ...currentTableServices,
        [tableId]: updatedTableData
      };
      this.tableServicesSignal.set(updatedAllTableServices);

      console.log(`✅ Successfully updated service ${serviceId} quantity to ${newQuantity} for table ${tableId}`);

      // Reload services để cập nhật UI
      await this.loadServices();
      this.errorSignal.set(null);
      return true;
    } catch (error) {
      console.error('❌ Error updating service quantity:', error);
      this.errorSignal.set('Không thể cập nhật số lượng dịch vụ');
      return false;
    }
  }

  async removeServiceFromTable(tableId: number, serviceId: number): Promise<void> {
    try {
      console.log(`🗑️ Removing service ${serviceId} from table ${tableId}`);

      const currentTableServices = this.tableServicesSignal();
      const currentTableData = currentTableServices[tableId];
      const quantity = currentTableData?.services?.[serviceId] || 0;

      if (quantity > 0) {
        // Trả lại số lượng vào kho
        await this.serviceService.increaseQuantity(serviceId, quantity).toPromise();
        console.log(`↩️ Returned ${quantity} units of service ${serviceId} to inventory`);
      }

      // Update table service data
      const invoiceId = this.getOrCreateInvoiceId(tableId);
      const updatedServices = { ...currentTableData?.services };
      delete updatedServices[serviceId];

      const updatedTableData: TableServiceData = {
        invoiceId,
        services: updatedServices
      };

      // Lưu riêng cho bàn này
      this.saveTableServiceToStorage(tableId, updatedTableData);

      // Update signal
      const updatedAllTableServices = {
        ...currentTableServices,
        [tableId]: updatedTableData
      };
      this.tableServicesSignal.set(updatedAllTableServices);

      console.log(`✅ Successfully removed service ${serviceId} from table ${tableId}`);

      // Reload services để cập nhật UI
      await this.loadServices();
      this.errorSignal.set(null);
    } catch (error) {
      console.error('❌ Error removing service from table:', error);
      this.errorSignal.set('Không thể xóa dịch vụ khỏi bàn');
    }
  }

  // Helper methods
  getTableServiceDetails(tableId: number): ServiceTableDetail[] {
    const tableData = this.tableServicesSignal()[tableId];
    if (!tableData) return [];

    return Object.entries(tableData.services).map(([serviceId, quantity]) => ({
      serviceTableId: 0,
      invoiceId: tableData.invoiceId,
      tableId,
      serviceId: parseInt(serviceId),
      quantity
    }));
  }

  getTotalAmount(tableId: number): number {
    const tableData = this.tableServicesSignal()[tableId];
    const services = this.serviceService.getCurrentServices();

    if (!tableData) return 0;

    return Object.entries(tableData.services).reduce((total, [serviceId, quantity]) => {
      const service = services.find(s => s.serviceId === parseInt(serviceId));
      return total + (service ? service.price * quantity : 0);
    }, 0);
  }

  getTableServiceCount(tableId: number): number {
    const tableData = this.tableServicesSignal()[tableId];
    if (!tableData) return 0;

    return Object.keys(tableData.services).length;
  }

  getTableTotalQuantity(tableId: number): number {
    const tableData = this.tableServicesSignal()[tableId];
    if (!tableData) return 0;

    return Object.values(tableData.services).reduce((total, quantity) => total + quantity, 0);
  }

  // Clear table services (khi đóng bàn)
  clearTableServices(tableId: number): void {
    const currentTableServices = this.tableServicesSignal();
    const tableData = currentTableServices[tableId];
    // Xóa dữ liệu bàn khỏi signal
    const updatedAllTableServices = { ...currentTableServices };
    delete updatedAllTableServices[tableId];
    this.tableServicesSignal.set(updatedAllTableServices);

    // Xóa dữ liệu bàn khỏi localStorage
    this.removeTableServiceFromStorage(tableId);

    // Xóa invoiceId
    this.removeInvoiceId(tableId);

    console.log(`🧹 Cleared all services for table ${tableId}`);
  }

  // Debug methods
  debugLocalStorage(): void {
    console.log('🔍 Debug LocalStorage:');
    console.log('All invoice IDs:', this.getAllInvoiceIds());
    console.log('Table services:', this.tableServicesSignal());

    // In ra tất cả table services
    console.log('📋 All table service entries in localStorage:');
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('tableService-')) {
        const value = localStorage.getItem(key);
        console.log(`Key: ${key}, Value:`, JSON.parse(value || '{}'));
      }
    }

    // In ra tất cả invoice IDs
    console.log('📋 All invoice ID entries in localStorage:');
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('TableId-')) {
        const value = localStorage.getItem(key);
        console.log(`Key: ${key}, Value: ${value}`);
      }
    }
  }

  // Expose ServiceService methods
  getServiceStatus(quantity: number) {
    return this.serviceService.getServiceStatus(quantity);
  }

  formatPrice(price: number): string {
    return this.serviceService.formatPrice(price);
  }

  // Refresh data
  async refreshData(): Promise<void> {
    this.loadingSignal.set(true);
    try {
      await Promise.all([
        this.loadTables(),
        this.loadServices()
      ]);
      this.loadAllTableServicesFromStorage(); // Reload table services
    } catch (error) {
      console.error('Error refreshing data:', error);
      this.errorSignal.set('Không thể tải lại dữ liệu');
    } finally {
      this.loadingSignal.set(false);
    }
  }
  // Thêm vào ServiceOfTableService class
clearAllTableServicesFromStorage(): void {
  // Clear signals trước
  this.tableServicesSignal.set({});

  // Xóa tất cả table services từ localStorage
  for (let i = localStorage.length - 1; i >= 0; i--) {
    const key = localStorage.key(i);
    if (key && (key.startsWith('tableService-') || key.startsWith('TableId-'))) {
      localStorage.removeItem(key);
    }
  }

  console.log('🧹 Cleared all table services from localStorage and signals');
}

}
