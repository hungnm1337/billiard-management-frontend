import { Component, Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { ShiftService } from '../services/shift/shift.service';
import { Shift, ShiftAssignment, ShiftAssignmentDetail, ShiftSchedule } from '../interface/shift.model';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-shift-management',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './shift-management.component.html',
  styleUrl: './shift-management.component.scss'
})

export class ShiftManagementComponent {
   getTotalShiftsInWeek(): number {
    return this.shiftSchedules().reduce((total, schedule) => total + schedule.shifts.length, 0);
  }
getAssignedAssignmentsCount() {
throw new Error('Method not implemented.');
}
getCompletedAssignmentsCount() {
throw new Error('Method not implemented.');
}
private shiftService = inject(ShiftService);

  // Signals
  shifts = signal<Shift[]>([]);
  assignments = signal<ShiftAssignment[]>([]);
  loading = signal(false);
  selectedWeek = signal(new Date());

  // Computed values
  shiftSchedules = computed(() => {
    return this.generateWeekSchedule();
  });

  currentEmployeeId = 1; // Lấy từ auth service

  ngOnInit() {
    this.loadData();
  }

  async loadData() {
    this.loading.set(true);
    try {
      const [shiftsData, assignmentsData] = await Promise.all([
        this.shiftService.getShifts().toPromise(),
        this.shiftService.getEmployeeShiftAssignments(this.currentEmployeeId).toPromise()
      ]);

      this.shifts.set(shiftsData || []);
      this.assignments.set(assignmentsData || []);
    } catch (error) {
      console.error('Error loading shift data:', error);
    } finally {
      this.loading.set(false);
    }
  }

  generateWeekSchedule(): ShiftSchedule[] {
    const schedules: ShiftSchedule[] = [];
    const startOfWeek = this.getStartOfWeek(this.selectedWeek());

    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(startOfWeek);
      currentDate.setDate(startOfWeek.getDate() + i);

      const dateString = currentDate.toISOString().split('T')[0];
      const dayAssignments = this.assignments().filter(a => a.day === dateString);

      const shiftDetails: ShiftAssignmentDetail[] = dayAssignments.map(assignment => {
        const shift = this.shifts().find(s => s.shiftId === assignment.shiftId);
        return {
          ...assignment,
          shiftName: shift?.shiftName || '',
          startTime: shift?.start || '',
          endTime: shift?.end || '',
          displayTime: shift ? this.shiftService.getDisplayTime(shift.start, shift.end) : ''
        };
      });

      schedules.push({
        date: dateString,
        dayOfWeek: this.getDayOfWeekName(currentDate),
        shifts: shiftDetails
      });
    }

    return schedules;
  }

  getStartOfWeek(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    return new Date(d.setDate(diff));
  }

  getDayOfWeekName(date: Date): string {
    const days = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'];
    return days[date.getDay()];
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'Completed': return 'bg-green-100 text-green-800';
      case 'Assigned': return 'bg-blue-100 text-blue-800';
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      case 'Cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'Completed': return 'Hoàn thành';
      case 'Assigned': return 'Đã phân công';
      case 'Pending': return 'Chờ xác nhận';
      case 'Cancelled': return 'Đã hủy';
      default: return status;
    }
  }

  async confirmShift(assignmentId: number) {
    try {
      await this.shiftService.updateShiftAssignmentStatus(assignmentId, 'Assigned').toPromise();
      await this.loadData(); // Reload data
    } catch (error) {
      console.error('Error confirming shift:', error);
    }
  }

  previousWeek() {
    const newDate = new Date(this.selectedWeek());
    newDate.setDate(newDate.getDate() - 7);
    this.selectedWeek.set(newDate);
  }

  nextWeek() {
    const newDate = new Date(this.selectedWeek());
    newDate.setDate(newDate.getDate() + 7);
    this.selectedWeek.set(newDate);
  }

  isToday(dateString: string): boolean {
    const today = new Date().toISOString().split('T')[0];
    return dateString === today;
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit'
    });
  }
}
