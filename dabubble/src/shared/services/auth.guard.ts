import { CanActivateFn } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';
import { Router } from '@angular/router';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const isLoggedIn = !!authService.getLoggedInUser();

  if (isLoggedIn) {
    return true;
  } else {
    return router.createUrlTree(['/login']); // Umleitung zur Login-Seite
  }
};
