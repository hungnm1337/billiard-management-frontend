import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface User {
  userId: number;
  name: string;
  accountId: number;
  roleId: number;
  dob: string;
  invoiceEmployees: any[];
  invoiceUsers: any[];
  orderTables: any[];
  rewardPoints: any[];
  role: any;
  salaries: any[];
  shiftAssignments: any[];
}

export interface Account {
  accountId: number;
  username: string;
  password: string;
  status: string;
  users: User[];
}

@Injectable({
  providedIn: 'root'
})
export class AccountService {
  private apiUrl = 'https://localhost:7176/api/Account';

  constructor(private http: HttpClient) { }

  getAccounts(): Observable<Account[]> {
    return this.http.get<Account[]>(this.apiUrl);
  }

  changeAccountStatus(accountId: number): Observable<boolean> {
    return this.http.put<boolean>(`${this.apiUrl}/${accountId}/status`, {});
  }

  getRoleName(roleId: number): string {
    switch (roleId) {
      case 1: return 'User';
      case 2: return 'Employee';
      case 3: return 'Manager';
      default: return 'Unknown';
    }
  }

  getStatusColor(status: string): string {
    return status === 'ACTIVE' ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100';
  }
}
