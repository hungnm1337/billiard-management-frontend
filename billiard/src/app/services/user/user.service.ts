import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface User {
  userId: number;
  name: string;
  // Thêm các thuộc tính khác nếu cần
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = 'https://localhost:7176';

  constructor(private http: HttpClient) { }

  // Lấy danh sách user theo role
  getUsersByRole(roleId: number): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/byRole/${roleId}`);
  }

  // Lấy user theo id
  getUserById(id: number): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/byId/${id}`);
  }

  // Lấy user theo tên
  getUserByName(userName: string): Observable<User> {
    // Lưu ý: userName nên được encodeURIComponent để tránh lỗi ký tự đặc biệt
    return this.http.get<User>(`${this.apiUrl}/byName?userName=${encodeURIComponent(userName)}`);
  }
}
