declare const google: any; // Declare google globally
import { AfterViewInit, Component, computed, effect, ElementRef, inject, Signal, ViewChild, ViewEncapsulation } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { IconField } from 'primeng/iconfield';
import { CommonModule } from '@angular/common';
import { InputIcon } from 'primeng/inputicon';
import { DividerModule } from 'primeng/divider';
import { environment } from '../../enviroments/enviroment';
import { Message } from 'primeng/message';
import { UserAccountService } from '../Services/account.service';
import { CookieService } from 'ngx-cookie-service'
import { LoadingService } from '../Services/loading.service';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-sign-in',
  imports: [CommonModule, RouterModule, ButtonModule, ReactiveFormsModule, FormsModule, InputTextModule, IconField, InputIcon, DividerModule, Message],
  templateUrl: './sign-in.component.html',
  styleUrl: './sign-in.component.scss',
  encapsulation: ViewEncapsulation.None,
  standalone: true
})
export class SignInComponent implements AfterViewInit {
  
  loading: Signal<boolean> = computed(() => this._loadingServ.loading());
  signInForm: FormGroup;
  signInError: string | null = null;

  private _loadingServ: LoadingService = inject(LoadingService);
  private _userAccountServ: UserAccountService = inject(UserAccountService);
  private _formBuilder: FormBuilder = inject(FormBuilder);
  private _cookieServ: CookieService = inject(CookieService);
  private _router: Router = inject(Router);

  @ViewChild('loginForm') loginForm!: ElementRef<HTMLFormElement>;

  constructor() {
    effect(() => {
      if (this._userAccountServ.isUserAuthorized()) {
        this._router.navigate(['/dashboard']);
      }
    });
    this.signInForm = this._formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]]
    });
  }

  ngAfterViewInit(): void {
    this._loadingServ.loading.set(false);
    // RENDER GOOGLE BUTTON ON UI
    if (typeof google !== 'undefined') {
      this._renderGoogleButton();
    }
  }

  private _decodeToken(token: string) {
    return JSON.parse(atob(token.split('.')[1]));
  }

  private _renderGoogleButton(): void {
    google.accounts.id.initialize({
      client_id: environment.CLIENT_ID_GOOGLE,
      callback: (response: any) => {
        const payload = this._decodeToken(response.credential);
        this._loadingServ.loading.set(true);
        this._userAccountServ.googleSignIn(payload)
          .subscribe({
            next: (response: any) => {
              this._loadingServ.loading.set(false);
              this.signInForm.reset();
              this._cookieServ.set('userId', response.payload._id);
              this._userAccountServ.isUserAuthorized.set(true);
              this._userAccountServ.userPayload.set(response.payload);
            },
            error: (error: HttpErrorResponse) => {
              console.log(error)
              this._userAccountServ.isUserAuthorized.set(false);
              this._loadingServ.loading.set(false);
            }
          });
      }
    });

    google.accounts.id.renderButton(document.getElementById('google-btn'), {
      shape: 'pill',
      theme: 'outline',
      size: 'large',
      logo_alignment: 'left'
    });
  }

  signIn(): void {
    this._loadingServ.loading.set(true);
    this._userAccountServ.signIn(this.signInForm.get("email")?.value, this.signInForm.get("password")?.value)
      .subscribe({
        next: (response: any) => {
          if (response.status === 200) {
            this.signInError = null;
            this.signInForm.reset();
            this._cookieServ.set('userId', response.payload._id);
            this._userAccountServ.isUserAuthorized.set(true);
            this._userAccountServ.userPayload.set(response.payload);
          }
          this._loadingServ.loading.set(false);
        },
        error: (error: HttpErrorResponse) => {
          console.log(error)
          console.log('Status Code: ' + error?.status);
          if (error.status !== 500) this.signInError = error?.error?.error;
          this._userAccountServ.isUserAuthorized.set(false);
          this._loadingServ.loading.set(false);
        }
      });
  }
}