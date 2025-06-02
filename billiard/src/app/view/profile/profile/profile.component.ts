import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from "../../header/header.component";

interface Account {
  username: string;
  password: string;
  status: string;
}

interface User {
  userId: number;
  name: string;
  accountId: number;
  roleId: number;
  dob: string;
}

interface Salary {
  userId: number;
  salary1: number;
}

interface RewardPoint {
  userId: number;
  points: number;
}

interface UserProfile {
  account: Account;
  user: User;
  salary?: Salary;
  rewardPoint: RewardPoint;
}

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [CommonModule, HeaderComponent],
  templateUrl: './profile.component.html',
  styles: [`
    @keyframes fade-in {
      from { opacity: 0; transform: translateY(-20px); }
      to { opacity: 1; transform: translateY(0); }
    }

    @keyframes slide-in-left {
      from { opacity: 0; transform: translateX(-50px); }
      to { opacity: 1; transform: translateX(0); }
    }

    @keyframes slide-in-right {
      from { opacity: 0; transform: translateX(50px); }
      to { opacity: 1; transform: translateX(0); }
    }

    .animate-fade-in {
      animation: fade-in 0.8s ease-out;
    }

    .animate-slide-in-left {
      animation: slide-in-left 0.8s ease-out;
      animation-fill-mode: both;
    }

    .animate-slide-in-right {
      animation: slide-in-right 0.8s ease-out;
      animation-fill-mode: both;
    }

    .animate-spin-slow {
      animation: spin 3s linear infinite;
    }
  `]
})
export class UserProfileComponent implements OnInit {
  profile = signal<UserProfile>({
    account: {
      username: 'john_doe',
      password: '********',
      status: 'Hoạt động'
    },
    user: {
      userId: 1,
      name: 'Nguyễn Văn An',
      accountId: 1,
      roleId: 1, // Nhân viên
      dob: '1990-05-15'
    },
    salary: {
      userId: 1,
      salary1: 15000000
    },
    rewardPoint: {
      userId: 1,
      points: 6000
    }
  });

  ngOnInit() {
    // Load profile data here
  }

  getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }

  getRoleName(roleId: number): string {
    const roles = {
      1: 'Người dùng',
      2: 'Nhân viên',
      3: 'Quản lý'
    };
    return roles[roleId as keyof typeof roles] || 'Không xác định';
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN');
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  }

  getPointsPercentage(): number {
    const maxPoints = 5000;
    return Math.min((this.profile().rewardPoint.points / maxPoints) * 100, 100);
  }

  getPointsLevel(): string {
    const points = this.profile().rewardPoint.points;
    if (points >= 5000) return 'Thành viên Vàng';
    if (points >= 2000) return 'Thành viên Bạc';
    if (points >= 500) return 'Thành viên Đồng';
    return 'Thành viên Mới';
  }
}
