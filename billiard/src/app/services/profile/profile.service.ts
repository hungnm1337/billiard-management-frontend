import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ProfileModel } from '../../interface/profile.model';

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  private baseUrl = 'https://localhost:7176/api/Profile';
  constructor(private http: HttpClient) { }

  getProfile(userId: number): Observable<ProfileModel> {
    return this.http.get<ProfileModel>(`${this.baseUrl}/${userId}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  getCurrentProfile(): Observable<ProfileModel> {
    return this.http.get<ProfileModel>(`${this.baseUrl}/current`)
      .pipe(
        catchError(this.handleError)
      );
  }

  updateProfile(profile: ProfileModel): Observable<any> {
    return this.http.put(`${this.baseUrl}`, profile)
      .pipe(
        catchError(this.handleError)
      );
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'An unknown error occurred!';

    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Server-side error
      errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
    }

    console.error(errorMessage);
    return throwError(() => errorMessage);
  }
}
