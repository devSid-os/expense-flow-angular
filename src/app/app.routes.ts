import { Routes } from '@angular/router';
import { AppComponent } from './app.component';

export const routes: Routes = [
    { path: '', component: AppComponent },
    {
        path: 'signin', loadComponent: () => import('./sign-in/sign-in.component').then(mod => mod.SignInComponent)
    },
    { path: 'signup', loadComponent: () => import('./sign-up/sign-up.component').then(mod => mod.SignUpComponent) },
    {
        path: 'dashboard', loadComponent: () => import('./dashboard/dashboard.component').then(mod => mod.DashboardComponent),
        children: [
            { path: 'expenses', loadComponent: () => import('./dashboard/expenses-list/expenses-list.component').then(mod => mod.ExpensesListComponent) },
            { path: 'cashbook', loadComponent: () => import('./dashboard/cashbook/cashbook.component').then(mod => mod.CashbookComponent) },
            { path: 'reports', loadComponent: () => import('./dashboard/reports/reports.component').then(mod => mod.ReportsComponent) }
        ]
    }
];