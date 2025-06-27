// interfaces/invoice.interface.ts
export interface Invoice {
  invoiceId: number;
  timeStart: string;
  timeEnd: string | null;
  totalAmount: number;
  employeeId: number;
  userId: number | null;
  paymentStatus: string;
  tableId: number;
  employee: any;
  user: any;
}

export interface MonthlyRevenue {
  month: string;
  year: number;
  revenue: number;
  invoiceCount: number;
}

export interface DailyRevenue {
  date: string;
  revenue: number;
  invoiceCount: number;
}

export interface PaymentMethodStats {
  method: string;
  amount: number;
  count: number;
  percentage: number;
}

export interface DashboardStats {
  totalRevenue: number;
  totalInvoices: number;
  averageOrderValue: number;
  activeOrders: number;
  monthlyGrowth: number;
}
