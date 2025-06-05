
export interface Shift {
  shiftId: number;
  shiftName: string;
  start: string; // Format: "HH:mm:ss"
  end: string;   // Format: "HH:mm:ss"
}

export interface ShiftAssignment {
  id: number;
  employeeId: number;
  shiftId: number;
  day: string; // Format: "YYYY-MM-DD"
  status: string; // "Assigned", "Completed", "Pending", "Cancelled"
  employee?: User;
  shift?: Shift;
}

export interface User {
  id: number;
  name: string;
  email: string;
}

export interface ShiftSchedule {
  date: string;
  dayOfWeek: string;
  shifts: ShiftAssignmentDetail[];
}

export interface ShiftAssignmentDetail extends ShiftAssignment {
  shiftName: string;
  startTime: string;
  endTime: string;
  displayTime: string;
}
