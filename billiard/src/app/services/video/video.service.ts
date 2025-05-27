import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class VideoService {
  private apiUrl = 'https://localhost:7176/api/API/billiardvideo?perPage=4'

  constructor(private http: HttpClient) { }

  getVideos(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }
}
