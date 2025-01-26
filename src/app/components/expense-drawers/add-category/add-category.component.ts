import { CommonModule } from '@angular/common';
import { Component, computed, EventEmitter, inject, Output, Signal, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { take } from 'rxjs';
// SERVICES IMPORT
import { LoadingService } from '../../../Services/loading.service';
import { ExpenseApiService } from '../../../Services/Expenses/expense-api.service';
import { UserAccountService } from '../../../Services/account.service';

// NG UI COMPONENTS PRIME IMPORTS
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { Tooltip } from 'primeng/tooltip';
import { InputTextModule } from 'primeng/inputtext';

@Component({
  selector: 'app-add-category',
  imports: [CommonModule, ReactiveFormsModule, ButtonModule, MessageModule, Tooltip, InputTextModule],
  templateUrl: './add-category.component.html',
  styleUrl: './add-category.component.scss',
  encapsulation: ViewEncapsulation.None,
})
export class AddCategoryComponent {

  private _loadingServ: LoadingService = inject(LoadingService);
  private _expenseApiServ: ExpenseApiService = inject(ExpenseApiService);
  private _userAccountServ: UserAccountService = inject(UserAccountService);
  private _formBuilder: FormBuilder = inject(FormBuilder);
  private readonly _userId: string = this._userAccountServ.userPayload()._id;

  @Output('onCloseCategoryForm') onCloseCategoryForm: EventEmitter<boolean> = new EventEmitter<boolean>();
  loading: Signal<boolean> = computed(() => this._loadingServ.loading());
  addCategoryForm: FormGroup;

  categoryFormError: string = ''

  constructor() {
    this.addCategoryForm = this._formBuilder.group({
      name: ['', [Validators.required]]
    });
  }

  closeAddNewCategoryForm(): void {
    this.addCategoryForm.reset();
    this.onCloseCategoryForm.emit(false);
  }

  addNewCategory(): void {

    if (!this.addCategoryForm.valid) {
      if (this.addCategoryForm.get('name')?.hasError('required')) {
        this.categoryFormError = 'Category name cannot be empty';
        return;
      }
      return;
    }

    this._loadingServ.loading.set(true);
    this._expenseApiServ.addNewExpenseCategory(this.addCategoryForm.get('name')?.value, this._userId)
      .pipe(take(1))
      .subscribe({
        next: (response: any) => {
          if (response.status === 201) {
            // this.expenseEntryForm.patchValue({ category: response.payload._id });
            this.addCategoryForm.reset();
            this.categoryFormError = '';
            this.closeAddNewCategoryForm();
          }
          this._loadingServ.loading.set(false);
        },
        error: (error: HttpErrorResponse) => {
          if (error.status === 400) this.categoryFormError = error.error.error;
          else if (error.status === 500) this.categoryFormError = error.error.error.errorResponse.errmsg;
          this._loadingServ.loading.set(false);
        }
      });
  }

}
