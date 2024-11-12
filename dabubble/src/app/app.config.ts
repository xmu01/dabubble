import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { getStorage, provideStorage } from '@angular/fire/storage';

export const appConfig: ApplicationConfig = {
  providers: [provideRouter(routes), provideAnimationsAsync(), provideFirebaseApp(() => initializeApp({"projectId":"dabubble-c8f61","appId":"1:998508848782:web:5f290d1ec76516073b4bdf","storageBucket":"dabubble-c8f61.firebasestorage.app","apiKey":"AIzaSyB31gWpDTcpg8tTr958GGNAAbaNPM_ovqM","authDomain":"dabubble-c8f61.firebaseapp.com","messagingSenderId":"998508848782"})), provideAuth(() => getAuth()), provideFirestore(() => getFirestore()), provideStorage(() => getStorage())]
};
