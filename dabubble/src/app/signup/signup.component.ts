import { ChangeDetectionStrategy, Component, effect, inject } from '@angular/core';
import { FormControl, Validators, ReactiveFormsModule, FormsModule, FormGroup } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import {MatCheckboxModule} from '@angular/material/checkbox';
import { AuthService } from '../../shared/services/auth.service';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [MatCardModule,
    CommonModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
    MatIconModule,
    FormsModule,
    MatButtonModule,
    MatCheckboxModule,
    RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './signup.component.html',
  styleUrl: './signup.component.scss'
})
export class SignupComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  twoWordsRegex = /^(?:\S+\s+){1,}\S+$/;

  loginForm = new FormGroup({
    name: new FormControl('', [
      Validators.required,
      Validators.pattern(this.twoWordsRegex)
    ]),  
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required, Validators.minLength(6)]),
    policy: new FormControl(false, [Validators.requiredTrue]),
  });

  errorMessage = '';
  hide = true;
  personalData = { firstName: '', lastName: '', email: '', password: '', avatar: '', userId: '' };

  constructor(){
    effect(() => {    
      const savedData = this.authService.getPersonalData();     
      
      if (savedData) {
        this.personalData = savedData;
        this.populateForm(savedData);
      }
    });
  }

  populateForm(data: any) {
    this.loginForm.setValue({
      name: `${data.firstName} ${data.lastName}`,
      email: data.email || '',
      password: data.password || '',
      policy: false, 
    });
  }

  get nameControl() {
    return this.loginForm.get('name');
  }

  get emailControl() {
    return this.loginForm.get('email');
  }

  get passwordControl() {
    return this.loginForm.get('password');
  }

  get policyControl() {
    return this.loginForm.get('policy');
  }

  goToNextStep() {
    const displayName = this.nameControl?.value || '';
    const nameParts = displayName.trim().split(' ');

    this.personalData = {
      firstName: nameParts.slice(0, -1).join(' ') || '',
      lastName: nameParts.slice(-1).join('') || '',
      email: this.emailControl?.value || '',
      password: this.passwordControl?.value || '',
      avatar: 'profile_default.png',
      userId: ''
    }

    this.authService.setPersonalData(this.personalData);
    this.router.navigate(['/choose-avatar']);
  }

  continueSignUp() {

  }
}
