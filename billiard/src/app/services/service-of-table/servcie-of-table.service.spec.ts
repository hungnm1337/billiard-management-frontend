import { TestBed } from '@angular/core/testing';

import { ServcieOfTableService } from './servcie-of-table.service';

describe('ServcieOfTableService', () => {
  let service: ServcieOfTableService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ServcieOfTableService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
