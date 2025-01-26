import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal, WritableSignal } from '@angular/core';
import { environment } from '../../enviroments/enviroment';
import { Observable, take } from 'rxjs';
import { Router } from '@angular/router';
import { CookieService } from 'ngx-cookie-service';
import { UserModel } from '../Models/user.model';

@Injectable({
    providedIn: 'root'
})
export class UserAccountService {
    isUserAuthorized: WritableSignal<boolean> = signal(false);
    userPayload: WritableSignal<UserModel> = signal({ email: '', name: '', imageUrl: '', verified: false, googleId: '', _id: '', cashIn: 0, cashOut: 0 });

    private _cookieServ = inject(CookieService);
    private _http = inject(HttpClient);
    private _router = inject(Router);

    signUp(userData: { email: string, password: string, confirmPassword: string, firstName: string, lastName: string }): Observable<Object> {
        return this._http.post(`${environment.BACKEND_BASE_URL}/auth/signup`, userData).pipe(take(1));
    }

    signIn(email: string, password: string): Observable<Object> {
        return this._http.post(`${environment.BACKEND_BASE_URL}/auth/signin`, { email, password }, { withCredentials: true }).pipe(take(1));
    }

    googleSignIn(googlePayload: any): Observable<Object> {
        return this._http.post(`${environment.BACKEND_BASE_URL}/auth/googleSignIn`, { payload: googlePayload }, { withCredentials: true }).pipe(take(1));
    }

    signOut(): Observable<Object> {
        return this._http.post(`${environment.BACKEND_BASE_URL}/auth/signout`, {}, { withCredentials: true }).pipe(take(1));
    }

    verifyUser(id: string): Observable<Object> {
        return this._http.get(`${environment.BACKEND_BASE_URL}/auth/verifyUser/${id}`, { withCredentials: true }).pipe(take(1));
    }

    resetCredentials() {
        this.isUserAuthorized.set(false);
        this.userPayload.set({ email: '', name: '', imageUrl: '', verified: false, googleId: '', _id: '', cashIn: 0, cashOut: 0 });
        this._cookieServ.delete('userId');
        this._router.navigate(['/signin']);
    }
}