import { Component, OnInit } from '@angular/core';
import { HeaderComponent } from "../header/header.component";
import { NewsService, NewsArticle } from '../../../services/news/news.service';
import { CommonModule } from '@angular/common';
import { VideoService } from '../../../services/video/video.service';
import { RouterLink } from '@angular/router';
@Component({
  selector: 'app-homepage',
  standalone: true,
  imports: [HeaderComponent,CommonModule,RouterLink],
  templateUrl: './homepage.component.html',
  styleUrl: './homepage.component.scss'
})
export class HomepageComponent implements OnInit {

  videos: any[] = [];
  news: NewsArticle[] = [];
  loading = true;
  error = '';
   loadingV = true;
  errorV = '';

  constructor(private newsService: NewsService,private videoService: VideoService) {}
// Thêm vào component TypeScript
ngAfterViewInit() {
  this.observeScrollAnimations();
}

private observeScrollAnimations() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('fade-in-up');
        if (entry.target.classList.contains('fade-in-left')) {
          entry.target.classList.add('fade-in-left');
        }
        if (entry.target.classList.contains('fade-in-right')) {
          entry.target.classList.add('fade-in-right');
        }
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  });

  document.querySelectorAll('.scroll-animate').forEach(el => {
    observer.observe(el);
  });
}

  ngOnInit(): void {
    this.videoService.getVideos().subscribe({
      next: (data) => {
        this.videos = data;
        this.loadingV = false;
      },
      error: (err) => {
        this.errorV = 'Lỗi khi tải dữ liệu video!';
        this.loadingV = false;
      }
    });
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

  getBestVideoLink(files: any[]): string {
    const uhd = files.find(f => f.quality === 'uhd');
    if (uhd) return uhd.link;
    const hd = files.find(f => f.quality === 'hd');
    if (hd) return hd.link;
    return files[0].link;
  }
}
