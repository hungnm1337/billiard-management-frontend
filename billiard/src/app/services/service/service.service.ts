import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap } from 'rxjs';

export interface Service {
  serviceId: number;
  serviceName: string;
  price: number;
  quantity: number;
  invoiceDetails: any[];
}

export interface ServiceStatus {
  status: 'available' | 'low-stock' | 'out-of-stock';
  label: string;
  colorClass: string;
}

@Injectable({
  providedIn: 'root'
})
export class ServiceService {
  private http = inject(HttpClient);
  private readonly API_BASE = 'https://localhost:7176/api';

  private servicesSubject = new BehaviorSubject<Service[]>([]);
  public services$ = this.servicesSubject.asObservable();

  getServices(): Observable<Service[]> {
    return this.http.get<Service[]>(`${this.API_BASE}/Service`).pipe(
    tap(data => {
      console.log('🔥 Raw API Response from /Service:', data);
      console.table(data); // Hiển thị dạng bảng
      console.log('📊 Response details:', {
        count: data.length,
        firstItem: data[0],
        lastItem: data[data.length - 1]
      });
    })
  );;
  }

  // Sửa method này để phù hợp với API mới
  updateServiceQuantity(serviceId: number, newQuantity: number): Observable<any> {
    return this.http.put(`${this.API_BASE}/Service/${serviceId}/quantity`, {
      quantity: newQuantity
    });
  }

  // Thêm methods mới cho increase/decrease
  increaseQuantity(serviceId: number, amount: number): Observable<any> {
    return this.http.post(`${this.API_BASE}/Service/${serviceId}/increase`, {
      amount: amount
    });
  }

  decreaseQuantity(serviceId: number, amount: number): Observable<any> {
    return this.http.post(`${this.API_BASE}/Service/${serviceId}/decrease`, {
      amount: amount
    });
  }

  getServiceStatus(quantity: number): ServiceStatus {
    if (quantity === 0) {
      return {
        status: 'out-of-stock',
        label: 'Hết hàng',
        colorClass: 'bg-red-100 text-red-800'
      };
    } else if (quantity < 20) {
      return {
        status: 'low-stock',
        label: 'Sắp hết',
        colorClass: 'bg-yellow-100 text-yellow-800'
      };
    } else {
      return {
        status: 'available',
        label: 'Sẵn có',
        colorClass: 'bg-green-100 text-green-800'
      };
    }
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  }

  updateServices(services: Service[]) {
    this.servicesSubject.next(services);
  }

  getCurrentServices(): Service[] {
    return this.servicesSubject.value;
  }
}
