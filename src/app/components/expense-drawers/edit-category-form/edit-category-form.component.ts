import { Component, computed, EventEmitter, inject, Input, OnInit, Output, Signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { take } from 'rxjs';
// SERVICES IMPORT
import { MessageService } from 'primeng/api';
import { LoadingService } from '../../../Services/loading.service';
import { ExpenseApiService } from '../../../Services/Expenses/expense-api.service';
import { UserAccountService } from '../../../Services/account.service';
// NG UI COMPONENTS PRIME IMPORTS
import { ButtonModule } from 'primeng/button';
import { Dialog } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
// MODELS IMPORT
import { ExpenseCategoryModel } from '../../../Models/expenses.model';

@Component({
  selector: 'app-edit-category-form',
  imports: [CommonModule, ReactiveFormsModule, ButtonModule, MessageModule, Dialog, InputTextModule],
  templateUrl: './edit-category-form.component.html',
  styleUrl: './edit-category-form.component.scss'
})
export class EditCategoryFormComponent implements OnInit {
  private _loadingServ: LoadingService = inject(LoadingService);
  private _expenseApiServ: ExpenseApiService = inject(ExpenseApiService);
  private _messageServ: MessageService = inject(MessageService);
  private _formBuilder: FormBuilder = inject(FormBuilder);
  private _userAccountServ: UserAccountService = inject(UserAccountService);
  private readonly _userId: string = this._userAccountServ.userPayload()._id;

  @Input('showEditCategoryDialog') showEditCategoryDialog!: boolean;
  @Input('editCategoryData') editCategoryData!: ExpenseCategoryModel;
  @Output('onCloseEditCategoryDialog') onCloseEditCategoryDialog: EventEmitter<boolean> = new EventEmitter<boolean>();

  loading: Signal<boolean> = computed(() => this._loadingServ.loading());
  editCategoryForm: FormGroup;

  formErrors = {
    updateCategoryForm: ''
  }

  constructor() {
    this.editCategoryForm = this._formBuilder.group({
      name: ['', [Validators.required]],
      categoryId: ['', [Validators.required]]
    });
  }

  ngOnInit(): void {
    this.editCategoryForm.patchValue({
      name: this.editCategoryData.name || '',
      categoryId: this.editCategoryData._id || ''
    });
  }

  closeDialog(): void {
    this.editCategoryForm.reset();
    this.onCloseEditCategoryDialog.emit(true);
  }

  updateExpenseCategory(): void {

    if (!this.editCategoryForm.valid) {
      if (!this.editCategoryForm.get('name')?.valid) {
        this.formErrors.updateCategoryForm = 'Category name cannot be empty';
        return;
      }
      this.formErrors.updateCategoryForm = 'An error while updating category. Please try again later';
      return;
    }

    this._loadingServ.loading.set(true);
    this._expenseApiServ.updateExpenseCategory(this.editCategoryForm.get('name')?.value, this.editCategoryForm.get('categoryId')?.value, this._userId)
      .pipe(take(1))
      .subscribe({
        next: (response: any) => {
          if (response.status === 200) {
            this.editCategoryForm.reset();
            this.showEditCategoryDialog = false;
            this.formErrors.updateCategoryForm = '';
            this._loadingServ.loading.set(false);
            this._expenseApiServ.fetchExpenseEntries.next(true);
          }
        },
        error: (error: HttpErrorResponse) => {
          if (error.status === 400) this._messageServ.add({ severity: 'error', summary: 'error', detail: error.error.error });
          this._loadingServ.loading.set(false);
        }
      });
  }
}