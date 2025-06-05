import { Component, Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { Shift, ShiftAssignment, ShiftAssignmentDetail, ShiftSchedule } from '../../interface/shift.model';

@Injectable({
  providedIn: 'root'
})
export class ShiftService {
 private http = inject(HttpClient);
  private apiUrl = 'https://your-api-url/api';

  // Mock data - thay thế bằng API calls thực tế
  private mockShifts: Shift[] = [
    { shiftId: 1, shiftName: 'Ca sáng', start: '07:00', end: '12:00' },
    { shiftId: 2, shiftName: 'Ca chiều', start: '12:00', end: '18:00' },
    { shiftId: 3, shiftName: 'Ca tối', start: '18:00', end: '00:00' },
    { shiftId: 4, shiftName: 'Ca đêm', start: '00:00', end: '06:00' }
  ];

  private mockAssignments: ShiftAssignment[] = [
    { id: 1, employeeId: 1, shiftId: 1, day: '2025-06-05', status: 'Completed' },
    { id: 2, employeeId: 1, shiftId: 2, day: '2025-06-06', status: 'Assigned' },
    { id: 3, employeeId: 1, shiftId: 3, day: '2025-06-07', status: 'Pending' },
    { id: 4, employeeId: 1, shiftId: 1, day: '2025-06-08', status: 'Assigned' },
    { id: 5, employeeId: 1, shiftId: 4, day: '2025-06-09', status: 'Cancelled' }
  ];

  getShifts(): Observable<Shift[]> {
    // return this.http.get<Shift[]>(`${this.apiUrl}/shifts`);
    return of(this.mockShifts);
  }

  getEmployeeShiftAssignments(employeeId: number): Observable<ShiftAssignment[]> {
    // return this.http.get<ShiftAssignment[]>(`${this.apiUrl}/employees/${employeeId}/shift-assignments`);
    return of(this.mockAssignments.filter(a => a.employeeId === employeeId));
  }

  updateShiftAssignmentStatus(assignmentId: number, status: string): Observable<boolean> {
    // return this.http.put<boolean>(`${this.apiUrl}/shift-assignments/${assignmentId}/status`, { status });
    const assignment = this.mockAssignments.find(a => a.id === assignmentId);
    if (assignment) {
      assignment.status = status;
      return of(true);
    }
    return of(false);
  }

  formatTime(timeString: string): string {
    const [hours, minutes] = timeString.split(':');
    return `${hours}:${minutes}`;
  }

  getDisplayTime(start: string, end: string): string {
    return `${this.formatTime(start)} - ${this.formatTime(end)}`;
  }
}
