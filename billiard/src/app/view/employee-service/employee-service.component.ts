import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ServiceService, Service, ServiceStatus } from '../../services/service/service.service';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-employee-service',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './employee-service.component.html',
  styleUrl: './employee-service.component.scss'
})
export class EmployeeServiceComponent implements OnInit {
  private serviceService = inject(ServiceService);

  // Signals
  services = signal<Service[]>([]);
  loading = signal(false);
  searchTerm = signal('');
  selectedCategory = signal('all');

  // Computed values
  filteredServices = computed(() => {
    const search = this.searchTerm().toLowerCase();
    const category = this.selectedCategory();

    return this.services().filter(service => {
      const matchesSearch = service.serviceName.toLowerCase().includes(search);

      if (category === 'all') return matchesSearch;

      const status = this.serviceService.getServiceStatus(service.quantity);
      return matchesSearch && status.status === category;
    });
  });

  // Statistics
  totalServices = computed(() => this.services().length);
  availableServices = computed(() =>
    this.services().filter(s => this.serviceService.getServiceStatus(s.quantity).status === 'available').length
  );
  lowStockServices = computed(() =>
    this.services().filter(s => this.serviceService.getServiceStatus(s.quantity).status === 'low-stock').length
  );
  outOfStockServices = computed(() =>
    this.services().filter(s => this.serviceService.getServiceStatus(s.quantity).status === 'out-of-stock').length
  );

  ngOnInit() {
    this.loadServices();
    console.log(this.filteredServices());
  }

  async loadServices() {
    this.loading.set(true);
    try {
      const services = await this.serviceService.getServices().toPromise();
      this.services.set(services || []);
      this.serviceService.updateServices(services || []);
    } catch (error) {
      console.error('Error loading services:', error);
    } finally {
      this.loading.set(false);
    }
  }

  // Sửa method này để sử dụng API mới
  async updateQuantity(serviceId: number, change: number) {
    const services = this.services();
    const serviceIndex = services.findIndex(s => s.serviceId === serviceId);

    if (serviceIndex === -1) return;

    const currentService = services[serviceIndex];

    try {
      if (change > 0) {
        // Sử dụng increase API
        await this.serviceService.increaseQuantity(serviceId, change)
          .pipe(
            catchError(error => {
              console.error('Error increasing quantity:', error);
              this.showErrorMessage(error);
              return of(null);
            })
          )
          .toPromise();
      } else if (change < 0) {
        // Sử dụng decrease API
        const decreaseAmount = Math.abs(change);
        await this.serviceService.decreaseQuantity(serviceId, decreaseAmount)
          .pipe(
            catchError(error => {
              console.error('Error decreasing quantity:', error);
              this.showErrorMessage(error);
              return of(null);
            })
          )
          .toPromise();
      }

      // Reload data sau khi update thành công
      await this.loadServices();
    } catch (error) {
      console.error('Error updating quantity:', error);
    }
  }

  // Thêm method để hiển thị error message
  private showErrorMessage(error: any) {
    let message = 'Đã xảy ra lỗi';

    if (error.error?.message) {
      message = error.error.message;
    } else if (error.message) {
      message = error.message;
    }

    // Bạn có thể thêm toast notification hoặc alert ở đây
    alert(message);
  }

  // Thêm method để update quantity trực tiếp
  async setQuantity(serviceId: number, newQuantity: number) {
    try {
      await this.serviceService.updateServiceQuantity(serviceId, newQuantity)
        .pipe(
          catchError(error => {
            console.error('Error setting quantity:', error);
            this.showErrorMessage(error);
            return of(null);
          })
        )
        .toPromise();

      await this.loadServices();
    } catch (error) {
      console.error('Error setting quantity:', error);
    }
  }

  getServiceStatus(quantity: number): ServiceStatus {
    return this.serviceService.getServiceStatus(quantity);
  }

  formatPrice(price: number): string {
    return this.serviceService.formatPrice(price);
  }

  onSearchChange(event: Event) {
    const target = event.target as HTMLInputElement;
    this.searchTerm.set(target.value);
  }

  onCategoryChange(category: string) {
    this.selectedCategory.set(category);
  }
}
