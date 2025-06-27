// manager-point.component.ts
import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RewardPointService, RewardPoint, CreateRewardPointDto, AddPointsDto, DeductPointsDto } from '../../../services/RewardPoint/reward-point.service';

@Component({
  selector: 'app-manager-point',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './manager-point.component.html',
  styleUrl: './manager-point.component.scss'
})
export class ManagerPointComponent implements OnInit {
  // ============ SIGNALS ============
  rewardPoints = signal<RewardPoint[]>([]);
  filteredPoints = signal<RewardPoint[]>([]);
  isLoading = signal<boolean>(false);
  errorMessage = signal<string>('');
  successMessage = signal<string>('');
  showModal = signal<boolean>(false);
  showPointsModal = signal<boolean>(false);
  isEditMode = signal<boolean>(false);
  isSubmitting = signal<boolean>(false);
  modalType = signal<'add' | 'deduct'>('add');

  // ============ FORM DATA ============
  formData = {
    userId: 0,
    points: 0
  };

  pointsFormData = {
    userId: 0,
    currentPoints: 0,
    pointsToAdd: 0,
    pointsToDeduct: 0
  };

  // ============ FILTERS ============
  searchUserId: number | null = null;
  currentEditingId: number | null = null;

  // ✅ Inject Service thay vì HttpClient
  constructor(private rewardPointService: RewardPointService) {}

  ngOnInit(): void {
    this.loadAllRewardPoints();
    this.subscribeToRewardPoints();
  }

  // ============ SUBSCRIBE TO SERVICE ============

  private subscribeToRewardPoints(): void {
    this.rewardPointService.rewardPoints$.subscribe(points => {
      this.rewardPoints.set(points);
      this.filteredPoints.set(points);
    });
  }

  // ============ DATA LOADING ============

  loadAllRewardPoints(): void {
    this.isLoading.set(true);
    this.clearMessages();

    this.rewardPointService.getAllRewardPoints().subscribe({
      next: (points) => {
        this.rewardPoints.set(points);
        this.filteredPoints.set(points);
        this.isLoading.set(false);
      },
      error: (error) => {
        this.handleError('Có lỗi xảy ra khi tải dữ liệu', error);
        this.isLoading.set(false);
      }
    });
  }

  searchByUserId(): void {
    if (!this.searchUserId) {
      this.filteredPoints.set(this.rewardPoints());
      return;
    }

    this.isLoading.set(true);
    this.rewardPointService.getRewardPointByUserId(this.searchUserId).subscribe({
      next: (point) => {
        this.filteredPoints.set([point]);
        this.isLoading.set(false);
        this.clearMessages();
      },
      error: (error) => {
        this.handleError('Không tìm thấy điểm thưởng cho user này', error);
        this.filteredPoints.set([]);
        this.isLoading.set(false);
      }
    });
  }

  // ============ MODAL MANAGEMENT ============
  // Giữ nguyên các methods modal...

  // ============ CRUD OPERATIONS ============

  onSubmit(): void {
    if (this.isSubmitting()) return;

    this.isSubmitting.set(true);
    this.clearMessages();

    if (this.isEditMode() && this.currentEditingId) {
      this.updateRewardPoint();
    } else {
      this.createRewardPoint();
    }
  }

  private createRewardPoint(): void {
    const createDto: CreateRewardPointDto = {
      userId: this.formData.userId,
      points: this.formData.points
    };

    console.log(createDto)
    this.rewardPointService.createRewardPoint(createDto).subscribe({
      next: () => {
        this.showSuccessMessage('Thêm điểm thưởng thành công!');
        this.closeModal();
        this.isSubmitting.set(false);
      },
      error: (error) => {
        this.handleError('Có lỗi xảy ra khi thêm điểm thưởng', error);
        this.isSubmitting.set(false);
      }
    });
  }

  private updateRewardPoint(): void {
    if (!this.currentEditingId) return;

    const updateDto = {
      userId: this.formData.userId,
      points: this.formData.points
    };
    console.log(updateDto);

    this.rewardPointService.updateRewardPoint(this.currentEditingId, updateDto).subscribe({
      next: () => {
        this.showSuccessMessage('Cập nhật điểm thưởng thành công!');
        this.closeModal();
        this.isSubmitting.set(false);
      },
      error: (error) => {
        this.handleError('Có lỗi xảy ra khi cập nhật điểm thưởng', error);
        this.isSubmitting.set(false);
      }
    });
  }

  deleteRewardPoint(id: number): void {
    if (!confirm('Bạn có chắc chắn muốn xóa điểm thưởng này?')) return;

    this.rewardPointService.deleteRewardPoint(id).subscribe({
      next: () => {
        this.showSuccessMessage('Xóa điểm thưởng thành công!');
      },
      error: (error) => {
        this.handleError('Có lỗi xảy ra khi xóa điểm thưởng', error);
      }
    });
  }

  // ============ POINTS OPERATIONS ============

  onPointsSubmit(): void {
    if (this.isSubmitting()) return;

    this.isSubmitting.set(true);
    this.clearMessages();

    if (this.modalType() === 'add') {
      this.addPoints();
    } else {
      this.deductPoints();
    }
  }

  private addPoints(): void {
    const addDto: AddPointsDto = {
      userId: this.pointsFormData.userId,
      pointsToAdd: this.pointsFormData.pointsToAdd
    };
    console.log(addDto)

    this.rewardPointService.addPoints(addDto).subscribe({
      next: () => {
        this.showSuccessMessage(`Cộng ${this.pointsFormData.pointsToAdd} điểm thành công!`);
        this.closePointsModal();
        this.isSubmitting.set(false);
      },
      error: (error) => {
        this.handleError('Có lỗi xảy ra khi cộng điểm', error);
        this.isSubmitting.set(false);
      }
    });
  }

  private deductPoints(): void {
    const deductDto: DeductPointsDto = {
      userId: this.pointsFormData.userId,
      pointsToDeduct: this.pointsFormData.pointsToDeduct
    };

    this.rewardPointService.deductPoints(deductDto).subscribe({
      next: () => {
        this.showSuccessMessage(`Trừ ${this.pointsFormData.pointsToDeduct} điểm thành công!`);
        this.closePointsModal();
        this.isSubmitting.set(false);
      },
      error: (error) => {
        this.handleError('Có lỗi xảy ra khi trừ điểm', error);
        this.isSubmitting.set(false);
      }
    });
  }

  // ============ UTILITY METHODS ============

  private handleError(message: string, error: any): void {
    console.error('Error:', error);
    const errorMsg = error?.message || message;
    this.errorMessage.set(errorMsg);
  }

  private showSuccessMessage(message: string): void {
    this.successMessage.set(message);
    setTimeout(() => this.successMessage.set(''), 3000);
  }

  clearMessages(): void {
    this.errorMessage.set('');
    this.successMessage.set('');
  }

  formatPoints(points: number): string {
    return new Intl.NumberFormat('vi-VN').format(points);
  }

  // ============ COMPUTED PROPERTIES ============
  // Giữ nguyên các computed properties...

  // ============ MODAL METHODS ============
  openCreateModal(): void {
    this.isEditMode.set(false);
    this.formData = { userId: 0, points: 0 };
    this.showModal.set(true);
  }

  openEditModal(point: RewardPoint): void {
    this.isEditMode.set(true);
    this.currentEditingId = point.rewardPointsId;
    this.formData = {
      userId: point.userId,
      points: point.points
    };
    this.showModal.set(true);
  }

  openAddPointsModal(point: RewardPoint): void {
    this.modalType.set('add');
    this.pointsFormData = {
      userId: point.userId,
      currentPoints: point.points,
      pointsToAdd: 0,
      pointsToDeduct: 0
    };
    this.showPointsModal.set(true);
  }

  openDeductPointsModal(point: RewardPoint): void {
    this.modalType.set('deduct');
    this.pointsFormData = {
      userId: point.userId,
      currentPoints: point.points,
      pointsToAdd: 0,
      pointsToDeduct: 0
    };
    this.showPointsModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
    this.currentEditingId = null;
    this.clearMessages();
  }

  closePointsModal(): void {
    this.showPointsModal.set(false);
    this.clearMessages();
  }

  get modalTitle(): string {
    return this.isEditMode() ? 'Sửa Điểm Thưởng' : 'Thêm Điểm Thưởng Mới';
  }

  get pointsModalTitle(): string {
    return this.modalType() === 'add' ? 'Cộng Điểm' : 'Trừ Điểm';
  }

  get submitButtonText(): string {
    if (this.isSubmitting()) return 'Đang xử lý...';
    return this.isEditMode() ? 'Cập nhật' : 'Thêm mới';
  }

  get pointsSubmitButtonText(): string {
    if (this.isSubmitting()) return 'Đang xử lý...';
    return this.modalType() === 'add' ? 'Cộng điểm' : 'Trừ điểm';
  }

  get hasNoData(): boolean {
    return this.filteredPoints().length === 0 && !this.isLoading();
  }
}
