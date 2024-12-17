import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogShowDetailsComponent } from './dialog-show-details.component';

describe('DialogShowDetailsComponent', () => {
  let component: DialogShowDetailsComponent;
  let fixture: ComponentFixture<DialogShowDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DialogShowDetailsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(DialogShowDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
