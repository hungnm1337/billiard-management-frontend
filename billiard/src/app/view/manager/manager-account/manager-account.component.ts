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
 // Signals for reactive state management
  accounts = signal<Account[]>([]);
  selectedAccount = signal<Account | null>(null);
  isLoading = signal(false);
  searchTerm = signal('');
  showDetailModal = signal(false);

  // Computed signal for filtered accounts
  filteredAccounts = computed(() => {
    const term = this.searchTerm().toLowerCase();
    return this.accounts().filter(account =>
      account.username.toLowerCase().includes(term)
    );
  });

  constructor(private accountService: AccountService) {}

  ngOnInit(): void {
    this.loadAccounts();
  }

  loadAccounts(): void {
    this.isLoading.set(true);
    this.accountService.getAccounts().subscribe({
      next: (accounts) => {
        this.accounts.set(accounts);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading accounts:', error);
        this.isLoading.set(false);
      }
    });
  }

  viewAccountDetail(account: Account): void {
    this.selectedAccount.set(account);
    this.showDetailModal.set(true);
  }

  closeDetailModal(): void {
    this.showDetailModal.set(false);
    this.selectedAccount.set(null);
  }

  toggleAccountStatus(account: Account): void {
    this.isLoading.set(true);
    this.accountService.changeStatusAccount(account.accountId).subscribe({
      next: (response) => {
        if (response.success) {
          // Update local state - toggle between ACTIVE and INACTIVE
          const newStatus = account.status === 'ACTIVE' ? 'BAN' : 'ACTIVE';
          const updatedAccounts = this.accounts().map(acc =>
            acc.accountId === account.accountId
              ? { ...acc, status: newStatus as 'ACTIVE' | 'BAN' }
              : acc
          );
          this.accounts.set(updatedAccounts);

          // Update selected account if it's the same one
          if (this.selectedAccount()?.accountId === account.accountId) {
            this.selectedAccount.set({ ...account, status: newStatus as 'ACTIVE' | 'BAN' });
          }
        }
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error changing account status:', error);
        this.isLoading.set(false);
      }
    });
  }

  getStatusText(status: string): string {
    return status === 'ACTIVE' ? 'Hoạt động' : 'Tạm khóa';
  }

  getStatusClass(status: string): string {
    return status === 'ACTIVE'
      ? 'bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium'
      : 'bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium';
  }

  trackByAccountId(index: number, account: Account): number {
    return account.accountId;
  }

  // Helper method to get display name from username
  getDisplayName(username: string): string {
    // Extract name from email if it's an email format
    if (username.includes('@')) {
      return username.split('@')[0];
    }
    return username;
  }

  // Helper method to get avatar initial
  getAvatarInitial(username: string): string {
    const displayName = this.getDisplayName(username);
    return displayName.charAt(0).toUpperCase();
  }
}
