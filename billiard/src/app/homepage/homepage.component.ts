import { Component, OnInit } from '@angular/core';
import { HeaderComponent } from "../header/header.component";
import { NewsService, NewsArticle } from '../services/news.service';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-homepage',
  standalone: true,
  imports: [HeaderComponent,CommonModule],
  templateUrl: './homepage.component.html',
  styleUrl: './homepage.component.scss'
})
export class HomepageComponent implements OnInit {

   news: NewsArticle[] = [];
  loading = true;
  error = '';

  constructor(private newsService: NewsService) {}

  ngOnInit(): void {
    this.newsService.getBilliardNews().subscribe({
      next: (data) => {
        this.news = data;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Không thể tải tin tức!';
        this.loading = false;
      }
    });
    console.log(this.news);
  }
}
