import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { ChooseAvatarComponent } from './choose-avatar/choose-avatar.component';
import { LegalNoticeComponent } from './legal-notice/legal-notice.component';
import { LandingPageComponent } from './landing-page/landing-page.component';
import { SignupComponent } from './signup/signup.component';
import { SendEmailComponent } from './send-email/send-email.component';
import { ResetPasswordComponent } from './reset-password/reset-password.component';
import { authGuard } from '../shared/services/auth.guard';
import { PrivacyPolicyComponent } from './privacy-policy/privacy-policy.component';

export const routes: Routes = [

    { path: '', component: LandingPageComponent, canActivate: [authGuard] },
    { path: 'login', component: LoginComponent },
    { path: 'choose-avatar', component: ChooseAvatarComponent},
    { path: 'send-email', component: SendEmailComponent },
    { 
        path: 'reset-password', 
        component: ResetPasswordComponent,
        children: [
            { path: 'acctmgmt/__/auth/action', component: ResetPasswordComponent } 
        ]
    },
    { path: 'legal-notice', component: LegalNoticeComponent },
    { path: 'privacy-policy', component: PrivacyPolicyComponent },
    { path: 'sign-up', component: SignupComponent },
    { path: '**', redirectTo: '/login', pathMatch: 'full' },
];
