import { Component, computed, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ShiftService, Shift, ShiftAssignment, ShiftAssignmentDetail, ShiftSchedule } from '../../services/shift/shift.service';

@Component({
  selector: 'app-shift-management',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './shift-management.component.html',
  styleUrls: ['./shift-management.component.scss']
})
export class ShiftManagementComponent implements OnInit {
  private shiftService = inject(ShiftService);
  private authService = inject(AuthService);
  shifts = signal<Shift[]>([]);
  assignments = signal<ShiftAssignment[]>([]);
  loading = signal(false);
  selectedWeek = signal(new Date());

  currentEmployeeId = Number(this.authService.getUserId());
  shiftSchedules = computed(() => {
    return this.generateWeekSchedule();
  });

  ngOnInit() {
    this.loadData();
  }

  async loadData() {
    this.loading.set(true);
    try {
      const mockShifts: Shift[] = [
        { shiftId: 3, shiftName: 'Ca sáng', start: '06:00', end: '12:00' },
        { shiftId: 4, shiftName: 'Ca chiều', start: '12:00', end: '18:00' },
        { shiftId: 5, shiftName: 'Ca tối ', start: '18:00', end: '00:00' },
        { shiftId: 6, shiftName: 'Ca đêm', start: '00:00', end: '06:00' }
      ];

      const assignmentsData = await this.shiftService.getEmployeeShiftAssignments(this.currentEmployeeId).toPromise();

      this.shifts.set(mockShifts);
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
          shiftName: shift?.shiftName || 'Không xác định',
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
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  }

  getDayOfWeekName(date: Date): string {
    const days = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'];
    return days[date.getDay()];
  }

  getStatusClass(status: string): string {
    switch (status.toLowerCase()) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'assigned': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  getStatusText(status: string): string {
    switch (status.toLowerCase()) {
      case 'completed': return 'Hoàn thành';
      case 'assigned': return 'Đã phân công';
      case 'pending': return 'Chờ xác nhận';
      case 'cancelled': return 'Đã hủy';
      case '': return 'Chờ xác nhận';
      default: return status || 'Chờ xác nhận';
    }
  }

  async confirmShift(assignmentId: number) {
    try {
      await this.shiftService.updateShiftAssignmentStatus(assignmentId, 'Assigned').toPromise();
      await this.loadData();
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

  getCompletedAssignmentsCount(): number {
    return this.assignments().filter(a => a.status.toLowerCase() === 'completed').length;
  }

  getAssignedAssignmentsCount(): number {
    return this.assignments().filter(a => a.status.toLowerCase() === 'assigned').length;
  }

  getPendingAssignmentsCount(): number {
    return this.assignments().filter(a => a.status === '' || a.status.toLowerCase() === 'pending').length;
  }

  getTotalShiftsInWeek(): number {
    return this.shiftSchedules().reduce((total, schedule) => total + schedule.shifts.length, 0);
  }
}import { from } from 'rxjs';
import { AuthService } from '../../services/auth/auth.service';

