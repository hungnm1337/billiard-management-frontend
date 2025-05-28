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
