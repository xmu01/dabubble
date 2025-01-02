import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DirectThreadComponent } from './thread.component';

describe('ThreadComponent', () => {
  let component: DirectThreadComponent;
  let fixture: ComponentFixture<DirectThreadComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DirectThreadComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(DirectThreadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
