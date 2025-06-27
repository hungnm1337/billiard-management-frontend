// manager-dashboard.component.ts
import { Component, OnInit, OnDestroy, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Subscription, interval } from 'rxjs';
import { startWith, switchMap } from 'rxjs/operators';

// Interfaces
interface Invoice {
  invoiceId: number;
  timeStart: string;
  timeEnd: string | null;
  totalAmount: number;
  employeeId: number;
  userId: number | null;
  paymentStatus: string;
  tableId: number;
}

interface DashboardStats {
  totalRevenue: number;
  totalInvoices: number;
  averageOrderValue: number;
  activeOrders: number;
  monthlyGrowth: number;
}

interface MonthlyRevenue {
  month: string;
  revenue: number;
  invoiceCount: number;
}

interface DailyRevenue {
  date: string;
  revenue: number;
  invoiceCount: number;
}

interface PaymentMethodStats {
  method: string;
  amount: number;
  count: number;
  percentage: number;
}

interface TopTable {
  tableId: number;
  revenue: number;
  orderCount: number;
}

@Component({
  selector: 'app-manager-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './manager-dashboard.component.html',
  styleUrl: './manager-dashboard.component.scss'
})
export class ManagerDashboardComponent implements OnInit, OnDestroy {
  private readonly API_URL = 'https://localhost:7176/api/Invoice';

  // ============ SIGNALS ============
  isLoading = signal<boolean>(false);
  errorMessage = signal<string>('');

  dashboardStats = signal<DashboardStats>({
    totalRevenue: 0,
    totalInvoices: 0,
    averageOrderValue: 0,
    activeOrders: 0,
    monthlyGrowth: 0
  });

  monthlyRevenue = signal<MonthlyRevenue[]>([]);
  dailyRevenue = signal<DailyRevenue[]>([]);
  paymentMethodStats = signal<PaymentMethodStats[]>([]);
  topTables = signal<TopTable[]>([]);

  private subscriptions: Subscription[] = [];
  private invoices: Invoice[] = [];

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadData();
    this.startAutoRefresh();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  // ============ DATA LOADING ============

  private startAutoRefresh(): void {
    // Auto refresh every 30 seconds
    const refreshSubscription = interval(30000)
      .pipe(
        startWith(0),
        switchMap(() => this.loadInvoicesFromAPI())
      )
      .subscribe({
        next: (invoices) => {
          this.invoices = invoices;
          this.processData();
        },
        error: (error) => {
          console.error('Error loading data:', error);
          this.errorMessage.set('Có lỗi xảy ra khi tải dữ liệu');
          this.isLoading.set(false);
        }
      });

    this.subscriptions.push(refreshSubscription);
  }

  private loadInvoicesFromAPI() {
    this.isLoading.set(true);
    this.errorMessage.set('');

    return this.http.get<Invoice[]>(this.API_URL);
  }

  private processData(): void {
    console.log('Processing invoices:', this.invoices);

    // Calculate dashboard stats
    this.calculateDashboardStats();

    // Calculate monthly revenue
    this.calculateMonthlyRevenue();

    // Calculate daily revenue
    this.calculateDailyRevenue();

    // Calculate payment method stats
    this.calculatePaymentMethodStats();

    // Calculate top tables
    this.calculateTopTables();

    this.isLoading.set(false);
    this.cdr.detectChanges();
  }

  // ============ CALCULATIONS ============

  private calculateDashboardStats(): void {
    const completedInvoices = this.invoices.filter(invoice =>
      invoice.timeEnd && invoice.totalAmount > 0
    );

    const activeOrders = this.invoices.filter(invoice => !invoice.timeEnd).length;

    const totalRevenue = completedInvoices.reduce((sum, invoice) => sum + invoice.totalAmount, 0);
    const totalInvoices = completedInvoices.length;
    const averageOrderValue = totalInvoices > 0 ? totalRevenue / totalInvoices : 0;

    // Calculate monthly growth
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    const currentMonthRevenue = completedInvoices
      .filter(invoice => {
        const date = new Date(invoice.timeStart);
        return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
      })
      .reduce((sum, invoice) => sum + invoice.totalAmount, 0);

    const lastMonthRevenue = completedInvoices
      .filter(invoice => {
        const date = new Date(invoice.timeStart);
        return date.getMonth() === lastMonth && date.getFullYear() === lastMonthYear;
      })
      .reduce((sum, invoice) => sum + invoice.totalAmount, 0);

    const monthlyGrowth = lastMonthRevenue > 0
      ? ((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
      : 0;

    this.dashboardStats.set({
      totalRevenue,
      totalInvoices,
      averageOrderValue,
      activeOrders,
      monthlyGrowth
    });
  }

  private calculateMonthlyRevenue(): void {
    const monthlyData = new Map<string, { revenue: number; count: number }>();

    this.invoices
      .filter(invoice => invoice.timeEnd && invoice.totalAmount > 0)
      .forEach(invoice => {
        const date = new Date(invoice.timeStart);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

        if (!monthlyData.has(monthKey)) {
          monthlyData.set(monthKey, { revenue: 0, count: 0 });
        }

        const current = monthlyData.get(monthKey)!;
        current.revenue += invoice.totalAmount;
        current.count += 1;
      });

    const monthlyRevenue = Array.from(monthlyData.entries())
      .map(([key, data]) => {
        const [year, month] = key.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1);
        return {
          month: date.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' }),
          revenue: data.revenue,
          invoiceCount: data.count
        };
      })
      .sort((a, b) => {
        const dateA = new Date(a.month + ' 1');
        const dateB = new Date(b.month + ' 1');
        return dateA.getTime() - dateB.getTime();
      });

    this.monthlyRevenue.set(monthlyRevenue);
  }

  private calculateDailyRevenue(): void {
    const dailyData = new Map<string, { revenue: number; count: number }>();
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 30);

    this.invoices
      .filter(invoice => {
        if (!invoice.timeEnd || invoice.totalAmount <= 0) return false;
        const invoiceDate = new Date(invoice.timeStart);
        return invoiceDate >= startDate && invoiceDate <= endDate;
      })
      .forEach(invoice => {
        const dateKey = new Date(invoice.timeStart).toISOString().split('T')[0];

        if (!dailyData.has(dateKey)) {
          dailyData.set(dateKey, { revenue: 0, count: 0 });
        }

        const current = dailyData.get(dateKey)!;
        current.revenue += invoice.totalAmount;
        current.count += 1;
      });

    const dailyRevenue = Array.from(dailyData.entries())
      .map(([date, data]) => ({
        date,
        revenue: data.revenue,
        invoiceCount: data.count
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    this.dailyRevenue.set(dailyRevenue);
  }

  private calculatePaymentMethodStats(): void {
    const paymentData = new Map<string, { amount: number; count: number }>();
    const completedInvoices = this.invoices.filter(invoice => invoice.timeEnd && invoice.totalAmount > 0);
    const totalRevenue = completedInvoices.reduce((sum, invoice) => sum + invoice.totalAmount, 0);

    completedInvoices.forEach(invoice => {
      const method = invoice.paymentStatus || 'Chưa xác định';

      if (!paymentData.has(method)) {
        paymentData.set(method, { amount: 0, count: 0 });
      }

      const current = paymentData.get(method)!;
      current.amount += invoice.totalAmount;
      current.count += 1;
    });

    const paymentStats = Array.from(paymentData.entries())
      .map(([method, data]) => ({
        method,
        amount: data.amount,
        count: data.count,
        percentage: totalRevenue > 0 ? (data.amount / totalRevenue) * 100 : 0
      }))
      .sort((a, b) => b.amount - a.amount);

    this.paymentMethodStats.set(paymentStats);
  }

  private calculateTopTables(): void {
    const tableData = new Map<number, { revenue: number; count: number }>();

    this.invoices
      .filter(invoice => invoice.timeEnd && invoice.totalAmount > 0)
      .forEach(invoice => {
        if (!tableData.has(invoice.tableId)) {
          tableData.set(invoice.tableId, { revenue: 0, count: 0 });
        }

        const current = tableData.get(invoice.tableId)!;
        current.revenue += invoice.totalAmount;
        current.count += 1;
      });

    const topTables = Array.from(tableData.entries())
      .map(([tableId, data]) => ({
        tableId,
        revenue: data.revenue,
        orderCount: data.count
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    this.topTables.set(topTables);
  }

  // ============ UTILITY METHODS ============

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  }

  formatNumber(num: number): string {
    return new Intl.NumberFormat('vi-VN').format(num);
  }

  getGrowthClass(growth: number): string {
    if (growth > 0) return 'text-green-600';
    if (growth < 0) return 'text-red-600';
    return 'text-gray-600';
  }

  getGrowthIcon(growth: number): string {
    if (growth > 0) return '↗️';
    if (growth < 0) return '↘️';
    return '➡️';
  }

  getTodayRevenue(): number {
    const today = new Date().toISOString().split('T')[0];
    const todayData = this.dailyRevenue().find(item => item.date === today);
    return todayData?.revenue || 0;
  }

  getTodayOrders(): number {
    const today = new Date().toISOString().split('T')[0];
    const todayData = this.dailyRevenue().find(item => item.date === today);
    return todayData?.invoiceCount || 0;
  }

  // ============ USER ACTIONS ============

  loadData(): void {
    this.loadInvoicesFromAPI().subscribe({
      next: (invoices) => {
        this.invoices = invoices;
        this.processData();
      },
      error: (error) => {
        console.error('Error loading data:', error);
        this.errorMessage.set('Có lỗi xảy ra khi tải dữ liệu');
        this.isLoading.set(false);
      }
    });
  }

  refreshData(): void {
    this.loadData();
  }

  clearError(): void {
    this.errorMessage.set('');
  }
}
