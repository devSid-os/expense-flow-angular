import { Component, computed, effect, inject, Signal, ViewEncapsulation } from '@angular/core';
import { PasswordModule } from 'primeng/password';
import { Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { AbstractControl, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { CommonModule } from '@angular/common';
import { DividerModule } from 'primeng/divider';
import { delay, of, take } from 'rxjs';
import { Message } from 'primeng/message';
import { MessageService } from 'primeng/api';
import { Toast } from 'primeng/toast'
import { UserAccountService } from '../Services/account.service';
import { LoadingService } from '../Services/loading.service';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-sign-up',
  imports: [CommonModule, RouterModule, ButtonModule, ReactiveFormsModule, FormsModule, InputTextModule, DividerModule, Message, PasswordModule, Toast],
  templateUrl: './sign-up.component.html',
  styleUrl: './sign-up.component.scss',
  providers: [MessageService],
  encapsulation: ViewEncapsulation.None
})
export class SignUpComponent {
  loading: Signal<boolean> = computed(() => this._loadingServ.loading());
  signUpError: string | null = null;
  signUpForm: FormGroup;
  private _loadingServ: LoadingService = inject(LoadingService);
  private _userAccountServ: UserAccountService = inject(UserAccountService);
  private _formBuilder: FormBuilder = inject(FormBuilder);
  private _messageServ: MessageService = inject(MessageService);
  private _router: Router = inject(Router);

  constructor() {

    effect(() => {
      if (this._userAccountServ.isUserAuthorized()) this._router.navigate(['/dashboard']);
    });

    this.signUpForm = this._formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8), Validators.pattern(/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':'\\|,.<>\/?])/)]],
      confirmPassword: ['', [Validators.required]],
      firstName: ['', [Validators.required, Validators.minLength(3)]],
      lastName: ['']
    }, {
      validators: [this.passwordMatchValidator()]  // Apply the confirm password validator at form group level
    });
  }

  onSignUpFormSubmit(): void {
    this.signUpError = null;
    if (!this.signUpForm.valid) {
      if (this.signUpForm.get('confirmPassword')?.value !== this.signUpForm.get('password')?.value) {
        this.signUpError = 'Passwords do not match';
        return;
      }
      if (!this.signUpForm.get('firstName')?.valid) {
        this.signUpError = 'First name is a required field.';
        return;
      }
      if (!this.signUpForm.get('email')?.valid) {
        this.signUpError = 'Email is a required field.';
        return;
      }
      if (!this.signUpForm.get('password')?.valid) {
        this.signUpError = 'Password cannot be empty.';
        return;
      }
      return;
    }
    this._loadingServ.loading.set(true);
    this._userAccountServ.signUp(this.signUpForm.value)
      .subscribe({
        next: (response: any) => {
          this.signUpError = null;
          this.signUpForm.reset();
          this._messageServ.add({ severity: 'success', summary: 'Success', detail: 'Account Created Successfully', life: 3000 });
          of(true).pipe(delay(3000), take(1)).subscribe(() => {
            this._router.navigate(['/signin']);
          });
        },
        error: (error: HttpErrorResponse) => {
          console.log(error);
          this.signUpError = error?.error?.error;
          this._loadingServ.loading.set(false);
        }
      });
  }

  // Custom validator to check if password and confirm password match
  passwordMatchValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const password = control.get('password')?.value;
      const confirmPassword = control.get('confirmPassword')?.value;

      if (password && confirmPassword && password !== confirmPassword) {
        return { passwordMismatch: true };
      }

      return null; // Return null if passwords match
    };
  }
}