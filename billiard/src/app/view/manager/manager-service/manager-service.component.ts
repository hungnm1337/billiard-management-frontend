import { Component, OnInit } from '@angular/core';
import { Service, ServiceModel, ServiceService } from '../../../../app/services/service/service.service';
import { CommonModule, NgClass, NgFor, NgIf } from '@angular/common';
import { FormsModule  } from '@angular/forms';
@Component({
  selector: 'app-manager-service',
  standalone: true,
  imports: [NgClass,FormsModule,CommonModule],
  templateUrl: './manager-service.component.html',
  styleUrl: './manager-service.component.scss'
})
export class ManagerServiceComponent implements OnInit {
   services: Service[] = [];
  newService: ServiceModel = { serviceId: 0, serviceName: '', price: 0, quantity: 0 };
  editId: number | null = null;
  editService: ServiceModel = { serviceId: 0, serviceName: '', price: 0, quantity: 0 };
  successMessage: string | null = null;
  errorMessage: string | null = null;
  showAddModal = false;
  showEditModal = false;
  searchText: string = '';
  filterQuantity: 'all' | 'inStock' | 'outOfStock' = 'all';
  sortBy: 'quantityAsc' | 'quantityDesc' = 'quantityAsc';

  constructor(private serviceService: ServiceService) {
    this.loadServices();
  }
  ngOnInit(): void {
    this.serviceService.getServices().subscribe({
      next: (data) => {
        console.log('🔥 Services loaded:', data);
      },
      error: (error) => {
        console.error('❌ Error loading services:', error);
      }
    });
  }
    loadServices() {
    this.serviceService.getServices().subscribe(data => this.services = data);
  }

  openAddModal() {
    this.showAddModal = true;
    this.successMessage = null;
    this.errorMessage = null;
    this.newService = { serviceId: 0, serviceName: '', price: 0, quantity: 0 };
  }
  closeAddModal() {
    this.showAddModal = false;
  }

  openEditModal(service: Service) {
    this.editId = service.serviceId;
    this.editService = { ...service };
    this.showEditModal = true;
    this.successMessage = null;
    this.errorMessage = null;
  }
  closeEditModal() {
    this.showEditModal = false;
    this.editId = null;
  }

  onCreateService(event: Event) {
    event.preventDefault();
    this.successMessage = null;
    this.errorMessage = null;
    if (this.newService.quantity < 1) {
      this.errorMessage = 'Số lượng phải lớn hơn hoặc bằng 1!';
      return;
    }
    if (this.newService.price <= 0) {
      this.errorMessage = 'Giá phải lớn hơn 0!';
      return;
    }
    if (!this.newService.serviceName || !this.newService.serviceName.trim() || !/\p{L}/u.test(this.newService.serviceName)) {
      this.errorMessage = 'Tên dịch vụ không được để trống hoặc chỉ có dấu/ký tự đặc biệt!';
      return;
    }
    this.serviceService.createNewService(this.newService).subscribe({
      next: (success) => {
        if (success) {
          this.loadServices();
          this.newService = { serviceId: 0, serviceName: '', price: 0, quantity: 0 };
          setTimeout(() => {
            this.successMessage = 'Thêm dịch vụ thành công!';
          }, 200);
          this.closeAddModal();
        } else {
          this.errorMessage = 'Thêm dịch vụ thất bại!';
        }
      },
      error: (err) => {
        this.errorMessage = 'Lỗi khi thêm dịch vụ!';
      }
    });
  }

  onEdit(service: Service) {
    this.openEditModal(service);
  }

  onSaveEdit() {
    this.successMessage = null;
    this.errorMessage = null;
    if (this.editService.quantity < 1) {
      this.errorMessage = 'Số lượng phải lớn hơn hoặc bằng 1!';
      return;
    }
    if (this.editService.price <= 0) {
      this.errorMessage = 'Giá phải lớn hơn 0!';
      return;
    }
    if (!this.editService.serviceName || !this.editService.serviceName.trim() || !/\p{L}/u.test(this.editService.serviceName)) {
      this.errorMessage = 'Tên dịch vụ không được để trống hoặc chỉ có dấu/ký tự đặc biệt!';
      return;
    }
    this.serviceService.updateService(this.editService).subscribe({
      next: (success) => {
        if (success) {
          this.loadServices();
          this.editId = null;
          setTimeout(() => {
            this.successMessage = 'Cập nhật dịch vụ thành công!';
          }, 200);
          this.closeEditModal();
        } else {
          this.errorMessage = 'Cập nhật dịch vụ thất bại!';
        }
      },
      error: (err) => {
        this.errorMessage = 'Lỗi khi cập nhật dịch vụ!';
      }
    });
  }

  onCancelEdit() {
    this.closeEditModal();
    this.errorMessage = null;
    this.successMessage = null;
  }

  getServiceStatus(quantity: number) {
    return this.serviceService.getServiceStatus(quantity);
  }

  get filteredServices() {
    let filtered = this.services;
    if (this.searchText.trim()) {
      const keyword = this.searchText.trim().toLowerCase();
      filtered = filtered.filter(s => s.serviceName.toLowerCase().includes(keyword));
    }
    if (this.filterQuantity === 'inStock') {
      filtered = filtered.filter(s => s.quantity > 0);
    } else if (this.filterQuantity === 'outOfStock') {
      filtered = filtered.filter(s => s.quantity === 0);
    }
    // Sắp xếp
    if (this.sortBy === 'quantityAsc') {
      filtered = [...filtered].sort((a, b) => a.quantity - b.quantity);
    } else if (this.sortBy === 'quantityDesc') {
      filtered = [...filtered].sort((a, b) => b.quantity - a.quantity);
    }
    return filtered;
  }

}
