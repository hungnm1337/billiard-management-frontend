import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError, timer, EMPTY } from 'rxjs';
import { catchError, retry, tap, switchMap, startWith } from 'rxjs/operators';
import { Table } from '../../interface/table.interface';

@Injectable({
  providedIn: 'root'
})
export class TableService {
  private http = inject(HttpClient);
  private readonly API_URL = 'https://localhost:7176/api/Tables';
  private readonly REFRESH_INTERVAL = 30000; // 30 seconds

  private tablesCache$ = new BehaviorSubject<Table[]>([]);
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private errorSubject = new BehaviorSubject<string | null>(null);
  private refreshTimer$ = new BehaviorSubject<boolean>(true);

  public tables$ = this.tablesCache$.asObservable();
  public loading$ = this.loadingSubject.asObservable();
  public error$ = this.errorSubject.asObservable();

  constructor() {
    this.startAutoRefresh();
  }


  private startAutoRefresh(): void {
    timer(0, this.REFRESH_INTERVAL)
      .pipe(
        switchMap(() => {
          if (!this.refreshTimer$.value) {
            return EMPTY;
          }
          return this.fetchTablesFromAPI();
        })
      )
      .subscribe({
        next: (tables) => {
          this.tablesCache$.next(tables);
          this.errorSubject.next(null);
        },
        error: (error) => {
          console.error('Auto refresh error:', error);
        }
      });
  }

  private fetchTablesFromAPI(): Observable<Table[]> {
    this.loadingSubject.next(true);

    return this.http.get<Table[]>(this.API_URL).pipe(
      retry(2),
      tap(() => {
        this.loadingSubject.next(false);
      }),
      catchError(error => {
        this.loadingSubject.next(false);
        return this.handleError(error);
      })
    );
  }

  refreshTables(): void {
    this.fetchTablesFromAPI().subscribe({
      next: (tables) => {
        this.tablesCache$.next(tables);
        this.errorSubject.next(null);
      },
      error: (error) => {
        console.error('Manual refresh error:', error);
      }
    });
  }

  getCurrentTables(): Table[] {
    return this.tablesCache$.value;
  }

  getTableById(id: number): Table | undefined {
    return this.tablesCache$.value.find(table => table.tableId === id);
  }

  pauseAutoRefresh(): void {
    this.refreshTimer$.next(false);
  }

  resumeAutoRefresh(): void {
    this.refreshTimer$.next(true);
  }

  isAutoRefreshActive(): boolean {
    return this.refreshTimer$.value;
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Có lỗi xảy ra khi tải dữ liệu';

    if (error.error instanceof ErrorEvent) {
      errorMessage = `Lỗi: ${error.error.message}`;
    } else {
      switch (error.status) {
        case 0:
          errorMessage = 'Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.';
          break;
        case 404:
          errorMessage = 'Không tìm thấy dữ liệu bàn.';
          break;
        case 500:
          errorMessage = 'Lỗi server. Vui lòng thử lại sau.';
          break;
        default:
          errorMessage = `Lỗi ${error.status}: ${error.message}`;
      }
    }

    this.errorSubject.next(errorMessage);
    return throwError(() => errorMessage);
  }

  clearError(): void {
    this.errorSubject.next(null);
  }

  getLastUpdateTime(): Date {
    return new Date();
  }
}
