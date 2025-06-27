import { TestBed } from '@angular/core/testing';

import { RewardPointService } from './reward-point.service';

describe('RewardPointService', () => {
  let service: RewardPointService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RewardPointService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
