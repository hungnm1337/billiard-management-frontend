import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

export interface createShift {
  employeeId: number;
  shiftId: number;
  day: string;
  status: "Pending";
}

export interface ShiftAssignment {
  id: number;
  employeeId: number;
  shiftId: number;
  day: string;
  status: string;
  employee?: any;
  shift?: any;
}

export interface Shift {
  shiftId: number;
  shiftName: string;
  start: string;
  end: string;
}

export interface ShiftAssignmentDetail extends ShiftAssignment {
  shiftName: string;
  startTime: string;
  endTime: string;
  displayTime: string;
}

export interface ShiftSchedule {
  date: string;
  dayOfWeek: string;
  shifts: ShiftAssignmentDetail[];
}

@Injectable({
  providedIn: 'root'
})
export class ShiftService {
 private http = inject(HttpClient);
  private readonly API_BASE = 'https://localhost:7176/api';

  getShiftAssignments(): Observable<ShiftAssignment[]> {
    return this.http.get<ShiftAssignment[]>(`${this.API_BASE}/Shift`);
  }

  getShifts(): Observable<Shift[]> {
    return this.http.get<Shift[]>(`${this.API_BASE}/Shift`);
  }

  getEmployeeShiftAssignments(employeeId: number): Observable<ShiftAssignment[]> {
    return this.getShiftAssignments().pipe(
      map(assignments => assignments.filter(a => a.employeeId === employeeId))
    );
  }

updateShiftAssignmentStatus(assignmentId: number, status: string): Observable<any> {
  return this.http.put(`https://localhost:7176/api/Shift/${assignmentId}/status`, JSON.stringify(status), {
    headers: { 'Content-Type': 'application/json' }
  });
}


  getDisplayTime(startTime: string, endTime: string): string {
    return `${startTime} - ${endTime}`;
  }

  // Thêm mới ca làm (manager)
  createShift(shift: createShift): Observable<any> {
    return this.http.post(`${this.API_BASE}/Shift`, shift, {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Xóa ca làm (manager)
  deleteShift(shiftId: number): Observable<any> {
    return this.http.delete(`${this.API_BASE}/Shifts/${shiftId}`);
  }

  // Tạo mới assignment (phân ca cho nhân viên)
  createShiftAssignment(assignment: { day: string; employeeId: number; shiftId: number }): Observable<any> {
    return this.http.post(`${this.API_BASE}/ShiftAssignment`, assignment, {
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
