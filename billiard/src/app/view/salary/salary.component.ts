import { Component, Input, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Salary } from '../../interface/salary.model';
@Component({
  selector: 'app-salary',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './salary.component.html',
  styleUrl: './salary.component.scss'
})
export class SalaryComponent implements OnInit {
 @Input() salaries: Salary[] = [];

  minSalary = computed(() => Math.min(...this.salaries.map(s => s.salary1)));
  maxSalary = computed(() => Math.max(...this.salaries.map(s => s.salary1)));

  ngOnInit() {
    // Nếu không truyền @Input thì có thể mock data ở đây
    if (this.salaries.length === 0) {
      this.salaries = [
        { id: 1, userId: 1, salary1: 3000000, user: { id: 1, name: 'Nguyễn Văn A' } },
      ];
    }
  }

  getSalaryClass(salary: number): string {
    if (salary === this.minSalary()) return 'bg-red-100 text-red-700 border-red-400';
    if (salary === this.maxSalary()) return 'bg-green-100 text-green-700 border-green-400';
    return 'bg-gray-100 text-gray-700 border-gray-300';
  }

  getSalaryLabel(salary: number): string | null {
    if (salary === this.minSalary()) return 'Thấp nhất';
    if (salary === this.maxSalary()) return 'Cao nhất';
    return null;
  }
}
