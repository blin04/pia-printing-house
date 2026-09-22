import { TestBed } from '@angular/core/testing';

import { Login=service } from './login.=service';

describe('Login=service', () => {
  let service: Login=service;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Login=service);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
