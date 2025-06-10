import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

// Interface cho request body
export interface CreateInvoiceRequest {
  employeeId: number;
  tableId: number;
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
}
