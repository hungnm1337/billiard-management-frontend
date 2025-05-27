import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class NewsService {
  private apiUrl = 'https://localhost:7176/api/API/billiardnews'

  constructor(private http: HttpClient) {}

  getBilliardNews(): Observable<NewsArticle[]> {
    return this.http.get<NewsArticle[]>(this.apiUrl);
  }
}

export interface NewsArticle {
  title: string;
  url: string;
  author: string;
  text: string;
  publishDate: string;
}

