import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogAddMembersComponent } from './dialog-add-members.component';

describe('DialogAddMembersComponent', () => {
  let component: DialogAddMembersComponent;
  let fixture: ComponentFixture<DialogAddMembersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DialogAddMembersComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(DialogAddMembersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
