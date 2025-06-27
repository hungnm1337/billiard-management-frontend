// services/reward-point.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

// Interfaces
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

  private getHttpOptions() {
    const token = localStorage.getItem('jwt_token');

    return {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
      })
    };
  }
  // ============ CRUD OPERATIONS ============

  /**
   * Lấy tất cả reward points
   */
  getAllRewardPoints(): Observable<RewardPoint[]> {
    return this.http.get<RewardPoint[]>(this.API_URL).pipe(
      tap(rewardPoints => this.rewardPointsSubject.next(rewardPoints)),
      catchError(this.handleError)
    );
  }

  /**
   * Lấy reward point theo ID
   */
  getRewardPointById(id: number): Observable<RewardPoint> {
    return this.http.get<RewardPoint>(`${this.API_URL}/${id}`, this.getHttpOptions()).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Lấy reward point theo User ID
   */
  getRewardPointByUserId(userId: number): Observable<RewardPoint> {
    return this.http.get<RewardPoint>(`${this.API_URL}/user/${userId}`).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Lấy số points của user
   */
  getUserPoints(userId: number): Observable<{userId: number, points: number}> {
    return this.http.get<{userId: number, points: number}>(`${this.API_URL}/user/${userId}/points`).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Tạo reward point mới
   */
  createRewardPoint(rewardPoint: CreateRewardPointDto): Observable<RewardPoint> {
    return this.http.post<RewardPoint>(this.API_URL, rewardPoint, this.getHttpOptions()).pipe(
      tap(() => this.refreshRewardPoints()),
      catchError(this.handleError)
    );
  }

  /**
   * Cập nhật reward point
   */
  updateRewardPoint(id: number, rewardPoint: UpdateRewardPointDto): Observable<RewardPoint> {
    return this.http.put<RewardPoint>(`${this.API_URL}/${id}`, rewardPoint, this.getHttpOptions()).pipe(
      tap(() => this.refreshRewardPoints()),
      catchError(this.handleError)
    );
  }

  /**
   * Xóa reward point
   */
  deleteRewardPoint(id: number): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${id}`, this.getHttpOptions()).pipe(
      tap(() => this.refreshRewardPoints()),
      catchError(this.handleError)
    );
  }

  /**
   * Cộng points cho user
   */
  addPoints(addPointsDto: AddPointsDto): Observable<RewardPoint> {
    return this.http.post<RewardPoint>(`${this.API_URL}/add-points`, addPointsDto, this.getHttpOptions()).pipe(
      tap(() => this.refreshRewardPoints()),
      catchError(this.handleError)
    );
  }

  /**
   * Trừ points của user
   */
  deductPoints(deductPointsDto: DeductPointsDto): Observable<RewardPoint> {
    return this.http.post<RewardPoint>(`${this.API_URL}/deduct-points`, deductPointsDto, this.getHttpOptions()).pipe(
      tap(() => this.refreshRewardPoints()),
      catchError(this.handleError)
    );
  }

  // ============ UTILITY METHODS ============

  private refreshRewardPoints(): void {
    this.getAllRewardPoints().subscribe();
  }

  private handleError(error: any): Observable<never> {
    console.error('RewardPoint Service Error:', error);
    throw error;
  }
}
