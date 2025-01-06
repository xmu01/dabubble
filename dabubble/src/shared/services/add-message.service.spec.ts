import { TestBed } from '@angular/core/testing';

import { AddMessageService } from './add-message.service';

describe('AddMessageService', () => {
  let service: AddMessageService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AddMessageService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
