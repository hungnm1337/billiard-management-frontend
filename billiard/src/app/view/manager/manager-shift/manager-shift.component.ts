import { Component, computed, inject, signal, OnInit } from '@angular/core';
import { CommonModule, NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ShiftService, createShift, Shift, ShiftAssignment, ShiftAssignmentDetail, ShiftSchedule } from '../../../services/shift/shift.service';
import { User, UserService } from '../../../services/user/user.service';
@Component({
  selector: 'app-manager-shift',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './manager-shift.component.html',
  styleUrl: './manager-shift.component.scss'
})
export class ManagerShiftComponent implements OnInit {
  private shiftService = inject(ShiftService);
  private userService = inject(UserService);
  shifts = signal<Shift[]>([]);
  assignments = signal<ShiftAssignment[]>([]);
  loading = signal(false);
  selectedWeek = signal(new Date());
  employees = signal<User[]>([]);
  mockShifts = signal<Shift[]>([
    { shiftId: 3, shiftName: 'Ca sáng', start: '06:00', end: '12:00' },
    { shiftId: 4, shiftName: 'Ca chiều', start: '12:00', end: '18:00' },
    { shiftId: 5, shiftName: 'Ca tối ', start: '18:00', end: '00:00' },
    { shiftId: 6, shiftName: 'Ca đêm', start: '00:00', end: '06:00' }
  ]);

  // Modal state
  showAddModal = signal(false);
  addShiftLoading = signal(false);
  addShiftError = signal<string | null>(null);

  // New assignment form state
  newAssignment = signal<{ day: string; employeeId: number | null; shiftId: number | null }>(
    { day: '', employeeId: null, shiftId: null }
  );

  shiftSchedules = computed(() => {
    return this.generateWeekSchedule();
  });

  ngOnInit() {
    this.loadData();
  }

  async loadData() {
    this.loading.set(true);
    try {
      const employee = await this.userService.getUsersByRole(2).toPromise();
      this.employees.set(employee || []);
      const assignmentsData = await this.shiftService.getShiftAssignments().toPromise();
      this.assignments.set(assignmentsData || []);
      console.log('Employees:', this.employees());
      console.log('Assignments:', this.assignments());
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

  // Modal controls
  openAddShiftModal() {
    this.showAddModal.set(true);
    this.addShiftError.set(null);
    this.newAssignment.set({ day: '', employeeId: null, shiftId: null });
  }
  closeAddShiftModal() {
    this.showAddModal.set(false);
    this.addShiftError.set(null);
  }

  // Thêm ca mới (manager)
  async addShift() {
    this.addShiftLoading.set(true);
    this.addShiftError.set(null);
    try {
      const { day, employeeId, shiftId } = this.newAssignment();
      if (!day || !employeeId || !shiftId) throw new Error('Vui lòng nhập đủ thông tin!');
      await this.shiftService.createShift({ day, employeeId, shiftId, status: 'Pending' }).toPromise();
      this.closeAddShiftModal();
      await this.loadData();
    } catch (error: any) {
      this.addShiftError.set(error?.message || 'Lỗi khi thêm ca mới!');
    } finally {
      this.addShiftLoading.set(false);
    }
  }

  // Xóa ca làm (manager)
  async deleteShift(shiftId: number) {
    if (!confirm('Bạn có chắc muốn xóa ca này?')) return;
    try {
      await this.shiftService.deleteShift(shiftId).toPromise();
      await this.loadData();
    } catch (error) {
      alert('Lỗi khi xóa ca!');
    }
  }

  // Getter/setter cho form ngModel
  get assignmentDay() { return this.newAssignment().day; }
  set assignmentDay(val: string) { this.newAssignment.set({ ...this.newAssignment(), day: val }); }

  get assignmentEmployeeId() { return this.newAssignment().employeeId; }
  set assignmentEmployeeId(val: number | null) { this.newAssignment.set({ ...this.newAssignment(), employeeId: val }); }

  get assignmentShiftId() { return this.newAssignment().shiftId; }
  set assignmentShiftId(val: number | null) { this.newAssignment.set({ ...this.newAssignment(), shiftId: val }); }

  getEmployeeNameById(id: number): string {
    const emp = this.employees().find(e => e.userId === id);
    return emp ? emp.name : 'Không rõ';
  }

  getShiftNameById(shiftId: number): string {
    const shift = this.mockShifts().find(s => s.shiftId === shiftId);
    return shift ? shift.shiftName : 'Không rõ';
  }

  getShiftTimeById(shiftId: number): string {
    const shift = this.mockShifts().find(s => s.shiftId === shiftId);
    return shift ? `${shift.start} - ${shift.end}` : '';
  }

  getStatusClass(status: string): string {
    switch ((status || '').toLowerCase()) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'assigned': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  getStatusText(status: string): string {
    switch ((status || '').toLowerCase()) {
      case 'completed': return 'Hoàn thành';
      case 'assigned': return 'Đã phân công';
      case 'pending': return 'Chờ xác nhận';
      case 'cancelled': return 'Đã hủy';
      case '': return 'Chờ xác nhận';
      default: return status || 'Chờ xác nhận';
    }
  }


  async markCompleted(assignmentId: number) {
    // Tìm assignment để lấy ngày
    const assignment = this.assignments().find(a => a.id === assignmentId);
    if (assignment) {
      const today = new Date().toISOString().split('T')[0];
      if (assignment.day > today) {
        alert('Không thể đánh dấu hoàn thành cho ca làm trong tương lai!');
        return;
      }
    }
    try {
      await this.shiftService.updateShiftAssignmentStatus(assignmentId, 'Completed').toPromise();
      await this.loadData();
    } catch (error) {
      alert('Lỗi khi cập nhật trạng thái!');
    }
  }

}
