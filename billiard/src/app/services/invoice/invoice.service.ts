import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

// Interface cho request body
export interface CreateInvoiceRequest {
  employeeId: number;
  tableId: number;
}
export interface InvoiceUpdateRequest {
  invoiceId: number;
  timeEnd?: string; // ISO string format
  totalAmount: number;
  userId?: number;
  paymentStatus: string;
}

// Interface cho update response
export interface UpdateInvoiceResponse {
  success: boolean;
  message?: string;
}
// Interface cho response (invoice ID)
export interface CreateInvoiceResponse {
  invoiceId: number;
}

@Injectable({
  providedIn: 'root'
})
export class InvoiceService {
  private apiUrl = 'https://localhost:7176/api/Invoice';

  constructor(private http: HttpClient) { }

  createInvoice(employeeId: number, tableId: number): Observable<number> {
    const requestBody: CreateInvoiceRequest = {
      employeeId: employeeId,
      tableId: tableId
    };

    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    return this.http.post<number>(this.apiUrl, requestBody, { headers });
  }

  createInvoiceWithObject(request: CreateInvoiceRequest): Observable<number> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    return this.http.post<number>(this.apiUrl, request, { headers });
  }
  // Thêm method updateInvoice
updateInvoice(invoiceData: InvoiceUpdateRequest): Observable<number> {
  const headers = new HttpHeaders({
    'Content-Type': 'application/json'
  });

  return this.http.put<number>(`${this.apiUrl}/${invoiceData.invoiceId}`, invoiceData, { headers });
}


  // Method helper để update invoice khi đóng bàn
  updateInvoiceOnClose(
    invoiceId: number,
    totalAmount: number,
    userId?: number,
    paymentStatus: string = 'Đã thanh toán'
  ): Observable<number> {
    const updateData: InvoiceUpdateRequest = {
      invoiceId: invoiceId,
      timeEnd: new Date().toISOString(),
      totalAmount: totalAmount,
      userId: userId,
      paymentStatus: paymentStatus
    };

    return this.updateInvoice(updateData);
  }

}
