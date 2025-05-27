import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { jwtDecode } from 'jwt-decode';
@Injectable({
  providedIn: 'root'
})
export class AuthService {
private TOKEN_KEY = 'jwt_token';
private loginUrl = 'https://localhost:7176/api/Auth/login';
  constructor(private http: HttpClient) { }

  login(username: string, password: string): Observable<any> {
    const body = { username, password };
    return this.http.post<any>(this.loginUrl, body).pipe(
      tap(response => {
        if (response && response.token) {
          this.setToken(response.token);
        }
      })
    );
  }

   setToken(token: string) {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  clearToken() {
    localStorage.removeItem(this.TOKEN_KEY);
  }

  private getDecodedToken(): any | null {
    const token = this.getToken();
    if (!token) return null;
    try {
      return jwtDecode(token);
    } catch {
      return null;
    }
  }

  getAccountId(): string | null {
    const decoded = this.getDecodedToken();
    return decoded ? decoded['AccountId'] : null;
  }

  getUserId(): string | null {
    const decoded = this.getDecodedToken();
    return decoded ? decoded['UserId'] : null;
  }

  getRoleId(): string | null {
    const decoded = this.getDecodedToken();
    return decoded ? decoded['RoleId'] : null;
  }

  getName(): string | null {
    const decoded = this.getDecodedToken();
    return decoded ? decoded['Name'] : null;
  }

  getStatus(): string | null {
    const decoded = this.getDecodedToken();
    return decoded ? decoded['Status'] : null;
  }


}
