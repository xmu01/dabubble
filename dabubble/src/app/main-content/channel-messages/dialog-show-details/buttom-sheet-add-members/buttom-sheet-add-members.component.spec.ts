import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ButtomSheetAddMembersComponent } from './buttom-sheet-add-members.component';

describe('ButtomSheetAddMembersComponent', () => {
  let component: ButtomSheetAddMembersComponent;
  let fixture: ComponentFixture<ButtomSheetAddMembersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ButtomSheetAddMembersComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ButtomSheetAddMembersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
