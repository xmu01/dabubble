import { Routes } from '@angular/router';

import { MainContentComponent } from './main-content/main-content.component';

import { LoginComponent } from './login/login.component';
import { ChooseAvatarComponent } from './choose-avatar/choose-avatar.component';
import { EditProfileComponent } from './edit-profile/edit-profile.component';
import { ForgotPasswordComponent } from './forgot-password/forgot-password.component';
import { PrivacyPolicyComponent } from './privacy-policy/privacy-policy.component';
import { LegalNoticeComponent } from './legal-notice/legal-notice.component';

export const routes: Routes = [

    { path: '', component: MainContentComponent },
    { path: 'login', component: LoginComponent },
    { path: 'choose-avatar', component: ChooseAvatarComponent },
    { path: 'edit-profile', component: EditProfileComponent },
    { path: 'forgot-password', component: ForgotPasswordComponent },
    { path: 'privacy-policy', component: PrivacyPolicyComponent },
    { path: 'legal-notice', component: LegalNoticeComponent },

];
