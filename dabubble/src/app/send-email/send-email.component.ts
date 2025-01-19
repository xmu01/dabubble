import { Component, inject } from '@angular/core';
import { FormControl, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../shared/services/auth.service';

@Component({
  selector: 'app-send-email',
  standalone: true,
  imports: [
    MatCardModule,
    CommonModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
    MatIconModule,
    FormsModule,
  ],
  templateUrl: './send-email.component.html',
  styleUrls: ['./send-email.component.scss'],
})
export class SendEmailComponent {
  private authService = inject(AuthService);
  email = new FormControl('', [Validators.required, Validators.email]);
  errorMessage: string = '';
  errorResponse: string = '';
  successMessage: string = '';

  checkErrorMessage() {
    if (this.email.invalid) {
      this.errorMessage = 'Bitte geben Sie eine gültige E-Mail-Adresse ein.';
      this.successMessage = '';
      return;
    }
  }

  async sendPassword() {
    const emailValue = this.email.value;
  
    if (!emailValue || this.email.invalid) {
      this.errorMessage = 'Bitte geben Sie eine gültige E-Mail-Adresse ein.';
      return;
    }
  
    const result = await this.authService.sendEmailForPasswordReset(emailValue);
  
    if (result.success) {
      this.successMessage = result.message; // Erfolgsmeldung setzen
      this.errorResponse = ''; // Fehlermeldung zurücksetzen
    } else {
      this.errorResponse = result.message; // Fehlermeldung setzen
      this.successMessage = ''; // Erfolgsmeldung zurücksetzen
    }
  }
  
}
