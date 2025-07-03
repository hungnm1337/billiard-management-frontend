import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AccountService, Account } from '../../../services/account/account.service';

@Component({
  selector: 'app-manager-account',
  standalone: true,
  imports: [],
  templateUrl: './manager-account.component.html',
  styleUrl: './manager-account.component.scss'
})
export class ManagerAccountComponent implements OnInit {
   accounts: Account[] = [];
  loading = false;
  error: string | null = null;

  constructor(private accountService: AccountService) {}

  ngOnInit(): void {
    this.loadAccounts();
  }

  loadAccounts(): void {
    this.loading = true;
    this.error = null;

    this.accountService.getAccounts().subscribe({
      next: (data) => {
        this.accounts = data;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Không thể tải danh sách tài khoản';
        this.loading = false;
        console.error('Error loading accounts:', err);
      }
    });
  }

  changeAccountStatus(accountId: number): void {
    this.accountService.changeAccountStatus(accountId).subscribe({
      next: (success) => {
        if (success) {
          this.loadAccounts();
        } else {
          this.error = 'Không thể thay đổi trạng thái tài khoản';
        }
      },
      error: (err) => {
        this.error = 'Lỗi khi thay đổi trạng thái tài khoản';
        console.error('Error changing account status:', err);
      }
    });
  }

  getRoleName(roleId: number): string {
    return this.accountService.getRoleName(roleId);
  }

  getStatusColor(status: string): string {
    return this.accountService.getStatusColor(status);
  }

  getRoleColorClass(roleId: number): string {
    switch (roleId) {
      case 1: return 'bg-blue-100 text-blue-800';
      case 2: return 'bg-green-100 text-green-800';
      case 3: return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  getActionButtonClass(status: string): string {
    return status === 'ACTIVE'
      ? 'bg-red-600 hover:bg-red-700 text-white'
      : 'bg-green-600 hover:bg-green-700 text-white';
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('vi-VN');
  }
}
