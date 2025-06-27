// services/reward-point.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs'; // ✅ Thêm throwError
import { catchError, tap } from 'rxjs/operators';

// Interfaces giữ nguyên...
export interface RewardPoint {
  rewardPointsId: number;
  userId: number;
  points: number;
}

export interface CreateRewardPointDto {
  userId: number;
  points: number;
}

export interface UpdateRewardPointDto {
  userId: number;
  points: number;
}

export interface AddPointsDto {
  userId: number;
  pointsToAdd: number;
  description?: string;
}

export interface DeductPointsDto {
  userId: number;
  pointsToDeduct: number;
  description?: string;
}

@Injectable({
  providedIn: 'root'
})
export class RewardPointService {
  private readonly API_URL = 'https://localhost:7176/api/RewardPoints';

  private rewardPointsSubject = new BehaviorSubject<RewardPoint[]>([]);
  public rewardPoints$ = this.rewardPointsSubject.asObservable();

  constructor(private http: HttpClient) {}

  // ✅ Cải thiện getHttpOptions với logging
  private getHttpOptions() {
    const token = localStorage.getItem('jwt_token');
    console.log('Token exists:', !!token);

    return {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        'Authorization': token ? `${token}` : ''
      })
    };
  }

  // ============ CRUD OPERATIONS ============

  getAllRewardPoints(): Observable<RewardPoint[]> {
    return this.http.get<RewardPoint[]>(this.API_URL).pipe(
      tap(rewardPoints => {
        console.log('Loaded reward points:', rewardPoints);
        this.rewardPointsSubject.next(rewardPoints);
      }),
      catchError(this.handleError)
    );
  }

  getRewardPointById(id: number): Observable<RewardPoint> {
    return this.http.get<RewardPoint>(`${this.API_URL}/${id}`, this.getHttpOptions()).pipe(
      catchError(this.handleError)
    );
  }

  getRewardPointByUserId(userId: number): Observable<RewardPoint> {
    return this.http.get<RewardPoint>(`${this.API_URL}/user/${userId}`).pipe(
      catchError(this.handleError)
    );
  }

  getUserPoints(userId: number): Observable<{userId: number, points: number}> {
    return this.http.get<{userId: number, points: number}>(`${this.API_URL}/user/${userId}/points`).pipe(
      catchError(this.handleError)
    );
  }

  createRewardPoint(rewardPoint: CreateRewardPointDto): Observable<RewardPoint> {
    console.log('Creating reward point:', rewardPoint);

    return this.http.post<RewardPoint>(this.API_URL, rewardPoint, this.getHttpOptions()).pipe(
      tap((result) => {
        console.log('Create success:', result);
        this.refreshRewardPoints();
      }),
      catchError(this.handleError)
    );
  }

  updateRewardPoint(id: number, rewardPoint: UpdateRewardPointDto): Observable<RewardPoint> {
    console.log('Updating reward point:', id, rewardPoint);

    return this.http.put<RewardPoint>(`${this.API_URL}/${id}`, rewardPoint, this.getHttpOptions()).pipe(
      tap((result) => {
        console.log('Update success:', result);
        this.refreshRewardPoints();
      }),
      catchError(this.handleError)
    );
  }

  deleteRewardPoint(id: number): Observable<void> {
    console.log('Deleting reward point:', id);

    return this.http.delete<void>(`${this.API_URL}/${id}`, this.getHttpOptions()).pipe(
      tap(() => {
        console.log('Delete success');
        this.refreshRewardPoints();
      }),
      catchError(this.handleError)
    );
  }

  // ✅ Cải thiện addPoints với logging
  addPoints(addPointsDto: AddPointsDto): Observable<RewardPoint> {
    console.log('Adding points:', addPointsDto);
    console.log('API URL:', `${this.API_URL}/add-points`);

    return this.http.post<RewardPoint>(`${this.API_URL}/add-points`, addPointsDto, this.getHttpOptions()).pipe(
      tap((result) => {
        console.log('Add points success:', result);
        this.refreshRewardPoints();
      }),
      catchError(this.handleError)
    );
  }

  // ✅ Cải thiện deductPoints với logging
  deductPoints(deductPointsDto: DeductPointsDto): Observable<RewardPoint> {
    console.log('Deducting points:', deductPointsDto);
    console.log('API URL:', `${this.API_URL}/deduct-points`);

    return this.http.post<RewardPoint>(`${this.API_URL}/deduct-points`, deductPointsDto, this.getHttpOptions()).pipe(
      tap((result) => {
        console.log('Deduct points success:', result);
        this.refreshRewardPoints();
      }),
      catchError(this.handleError)
    );
  }

  // ============ UTILITY METHODS ============

  private refreshRewardPoints(): void {
    this.getAllRewardPoints().subscribe({
      next: () => console.log('Refresh completed'),
      error: (error) => console.error('Refresh error:', error)
    });
  }

  // ✅ Cải thiện error handling
  private handleError = (error: any): Observable<never> => {
    console.error('RewardPoint Service Error:', error);

    let errorMessage = 'Có lỗi xảy ra';

    if (error.status === 401) {
      errorMessage = 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
    } else if (error.status === 403) {
      errorMessage = 'Bạn không có quyền thực hiện thao tác này.';
    } else if (error.status === 404) {
      errorMessage = 'Không tìm thấy dữ liệu.';
    } else if (error.status === 500) {
      errorMessage = error.error?.message || 'Lỗi server.';
    } else if (error.error?.message) {
      errorMessage = error.error.message;
    }

    return throwError(() => new Error(errorMessage));
  }
}
