export interface Table {
  tableId: number;
  tableName: string;
  status: string;
  hourlyRate: number;
  invoiceDetails: any[];
  orderTables: any[];
}

export interface TableFilter {
  searchTerm: string;
  statusFilter: string;
  sortBy: 'name' | 'price' | 'status';
  sortOrder: 'asc' | 'desc';
}

export enum TableStatus {
  AVAILABLE = 'Đang trống',
  OCCUPIED = 'Đang sử dụng',
  MAINTENANCE = 'Đang bảo trì',
  RESERVED = 'Đã đặt trước'
}

export interface BookingTableModel {
  tableId: number;
  userId: number;
  time?: Date; // Thêm time
}


export interface ChangeStatusTableRequest {
  tableId: number;
  oldStatus: string;
  newStatus: string;
}

export interface VerifyOtpRequest {
  orderID: string;   // camelCase - đúng với API
  otpCode: string;   // camelCase - đúng với API
}

export interface SendOtpRequest {
  orderTableId: number;  // camelCase
}

export interface OtpResponse {
  success?: boolean;
  message?: string;
  data?: any;
}

