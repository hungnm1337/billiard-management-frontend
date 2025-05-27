import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class RegisterService {

private apiUrl = 'https://localhost:7176/api/Register';

  constructor(private http: HttpClient) {}

  register(data: any): Observable<any> {
    return this.http.post(this.apiUrl, data, { observe: 'response' }).pipe(
      catchError((error: HttpErrorResponse) => throwError(() => error))
    );
  }
}
