import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { ProfileComponent } from './components/dashboard/profile/profile.component';
import { AddReclamationComponent } from './components/dashboard/reclamation/add-reclamation.component';
import { authGuard } from './guards/auth.guard';

import { ReclamationListComponent } from './components/dashboard/reclamation/reclamation-list.component';
import { DashboardHomeComponent } from './components/dashboard/home/dashboard-home.component';
import { AdminManagementComponent } from './components/dashboard/admin-management/admin-management.component';
import { AddAdminComponent } from './components/dashboard/admin-management/add-admin/add-admin.component';
import { SecuritySettingsComponent } from './components/dashboard/admin-management/security-settings/security-settings.component';
import { UsersListComponent } from './components/dashboard/admin-management/users-list/users-list.component';
import { EditUserComponent } from './components/dashboard/admin-management/edit-user/edit-user.component';
import { AdminHomeComponent } from './components/dashboard/admin/home/admin-home.component';
import { AssignReclamationComponent } from './components/dashboard/admin/assign-reclamation/assign-reclamation.component';
import { ConsumersListComponent } from './components/dashboard/admin/consumers-list/consumers-list.component';
import { AllReclamationsComponent } from './components/dashboard/admin/all-reclamations/all-reclamations.component';
import { StatsComponent } from './components/dashboard/admin/stats/stats.component';
import { MineralWatersComponent } from './components/dashboard/mineral-waters/mineral-waters.component';
import { ConventionnesListComponent } from './components/dashboard/admin/conventionnes-list/conventionnes-list.component';
import { MessagesComponent } from './components/dashboard/admin/messages/messages.component';
import { ForgotPasswordComponent } from './components/auth/forgot-password/forgot-password.component';

export const routes: Routes = [
    { path: '', component: HomeComponent },
    { path: 'eaux-minerales', component: MineralWatersComponent },
    { path: 'login', component: LoginComponent },
    { path: 'register', component: RegisterComponent },
    { path: 'forgot-password', component: ForgotPasswordComponent },
    { path: 'reset-password', component: ForgotPasswordComponent },
    {
        path: 'dashboard',
        component: DashboardComponent,
        canActivate: [authGuard],
        children: [
            { path: '', component: DashboardHomeComponent },
            { path: 'profile', component: ProfileComponent },
            { path: 'reclamation', component: ReclamationListComponent },
            { path: 'reclamation/new', component: AddReclamationComponent },
            { path: 'admin-management', component: AdminManagementComponent },
            { path: 'admin-management/add', component: AddAdminComponent },
            { path: 'admin-management/security', component: SecuritySettingsComponent },
            { path: 'admin-management/users', component: UsersListComponent },
            { path: 'admin-management/users/edit/:id', component: EditUserComponent },
            { path: 'admin-home', component: AdminHomeComponent },
            { path: 'admin/assign', component: AssignReclamationComponent },
            { path: 'admin/all-reclamations', component: AllReclamationsComponent },
            { path: 'admin/consumers', component: ConsumersListComponent },
            { path: 'admin/stats', component: StatsComponent },
            { path: 'admin/conventionnes', component: ConventionnesListComponent },
            { path: 'admin/messages', component: MessagesComponent },
            { path: 'mineral-waters', component: MineralWatersComponent }
        ]
    },
    { path: '**', redirectTo: '' }
];
