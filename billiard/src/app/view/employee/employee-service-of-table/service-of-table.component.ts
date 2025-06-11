import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ServiceOfTableService, Table } from '../../../services/service-of-table/servcie-of-table.service';
import { ServiceService, Service } from '../../../services/service/service.service';

@Component({
  selector: 'app-service-of-table',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './service-of-table.component.html',
  styleUrl: './service-of-table.component.scss'
})
export class ServiceOfTableComponent implements OnInit {
  // Inject services using Angular 18 syntax
  private billiardService = inject(ServiceOfTableService);
  private serviceService = inject(ServiceService);

  // Signals for component state
  selectedServices = signal<{ [tableId: number]: string }>({});
  serviceQuantities = signal<{ [tableId: number]: number }>({});

  // Computed signals
  availableServices = computed(() => this.serviceService.getCurrentServices());

  // Expose services for template
  readonly billiardServiceRef = this.billiardService;

  async ngOnInit(): Promise<void> {
    try {
      await Promise.all([
        this.billiardService.loadTables(),
        this.billiardService.loadServices()
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  }

  updateSelectedService(tableId: number, serviceId: string): void {
    const current = this.selectedServices();
    this.selectedServices.set({
      ...current,
      [tableId]: serviceId
    });
  }

  updateServiceQuantity(tableId: number, quantity: number): void {
    const current = this.serviceQuantities();
    this.serviceQuantities.set({
      ...current,
      [tableId]: quantity
    });
  }

  canAddService(tableId: number): boolean {
    const serviceId = this.selectedServices()[tableId];
    const quantity = this.serviceQuantities()[tableId];

    if (!serviceId || !quantity || quantity <= 0) return false;

    const service = this.serviceService.getCurrentServices().find(s => s.serviceId === parseInt(serviceId));
    return service ? service.quantity >= quantity : false;
  }

  async addServiceToTable(tableId: number): Promise<void> {
    const serviceId = parseInt(this.selectedServices()[tableId]);
    const quantity = this.serviceQuantities()[tableId];

    const success = await this.billiardService.addServiceToTable(tableId, serviceId, quantity);

    if (success) {
      // Reset form
      this.updateSelectedService(tableId, '');
      this.updateServiceQuantity(tableId, 1);
    }
  }

  getTableServices(tableId: number): Array<Service & { quantity: number }> {
    const tableServices = this.billiardService.tableServices()[tableId];
    const allServices = this.serviceService.getCurrentServices();

    if (!tableServices) return [];

    return Object.entries(tableServices.services).map(([serviceId, quantity]) => {
      const service = allServices.find(s => s.serviceId === parseInt(serviceId));
      return service ? { ...service, quantity } : null;
    }).filter(Boolean) as Array<Service & { quantity: number }>;
  }

  canIncreaseQuantity(serviceId: number): boolean {
    const service = this.serviceService.getCurrentServices().find(s => s.serviceId === serviceId);
    return service ? service.quantity > 0 : false;
  }

  async increaseQuantity(tableId: number, serviceId: number, currentQuantity: number): Promise<void> {
    await this.billiardService.updateServiceQuantity(tableId, serviceId, currentQuantity + 1);
  }

  async decreaseQuantity(tableId: number, serviceId: number, currentQuantity: number): Promise<void> {
    await this.billiardService.updateServiceQuantity(tableId, serviceId, currentQuantity - 1);
  }

  async removeService(tableId: number, serviceId: number): Promise<void> {
    await this.billiardService.removeServiceFromTable(tableId, serviceId);
  }

  getTotalRevenue(): number {
    const tables = this.billiardService.tables();
    return tables.reduce((total, table) => {
      return total + this.billiardService.getTotalAmount(table.tableId);
    }, 0);
  }

  getServiceStatusClass(quantity: number): string {
    return this.billiardService.getServiceStatus(quantity).colorClass;
  }

 getServiceStatusLabel(quantity: number): string {
    return this.billiardService.getServiceStatus(quantity).label;
  }

  formatPrice(price: number): string {
    return this.billiardService.formatPrice(price);
  }
}
