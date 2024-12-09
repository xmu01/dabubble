import { CanActivateFn } from '@angular/router';
import { inject } from '@angular/core';
import { Router } from '@angular/router';

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);

  // Überprüfen, ob die Session existiert
  const sessionData = sessionStorage.getItem('user');

  if (sessionData) {
    return true; // Zugang gewähren
  } else {
    return router.createUrlTree(['/login']); // Umleitung zur Login-Seite
  }
};
