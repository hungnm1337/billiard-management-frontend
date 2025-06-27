// account.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Account {
  accountId: number;
  username: string;
  password: string; // Hashed password
  status: 'ACTIVE' | 'BAN';
  users: User[];
}

export interface User {
  userId: number;
  name: string;
  email: string;
  accountId: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
}

@Injectable({
  providedIn: 'root'
})
export class AccountService {
  private readonly apiUrl = 'https://localhost:7176/api/account';

  constructor(private http: HttpClient) {}

  getAccounts(): Observable<Account[]> {
    return this.http.get<Account[]>(this.apiUrl);
  }

  changeStatusAccount(accountId: number): Observable<ApiResponse<boolean>> {
    return this.http.put<ApiResponse<boolean>>(`${this.apiUrl}/${accountId}/status`, {});
  }
}
