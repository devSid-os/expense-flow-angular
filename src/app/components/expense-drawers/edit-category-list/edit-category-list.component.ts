import { CommonModule } from '@angular/common';
import { Component, computed, EventEmitter, inject, Output, Signal } from '@angular/core';
import { take } from 'rxjs';
import { ReactiveFormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
// SERVICES IMPORT
import { ExpenseDataService } from '../../../Services/Expenses/expense-data.service';
import { ExpenseApiService } from '../../../Services/Expenses/expense-api.service';
import { ConfirmationService, MessageService } from 'primeng/api';
import { LoadingService } from '../../../Services/loading.service';
import { UserAccountService } from '../../../Services/account.service';
// NG UI COMPONENTS PRIME IMPORTS
import { ButtonModule } from 'primeng/button';
import { ScrollPanelModule } from 'primeng/scrollpanel';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { Toast } from 'primeng/toast';
import { MessageModule } from 'primeng/message';
// MODELS IMPORT
import { ExpenseCategoryModel } from '../../../Models/expenses.model';

@Component({
  selector: 'app-edit-category-list',
  imports: [CommonModule, ReactiveFormsModule, ButtonModule, ScrollPanelModule, ConfirmDialog, Toast, MessageModule],
  templateUrl: './edit-category-list.component.html',
  styleUrl: './edit-category-list.component.scss',
  providers: [ConfirmationService, MessageService]
})
export class EditCategoryListComponent {
  private _loadingServ: LoadingService = inject(LoadingService);
  private _expenseDataServ: ExpenseDataService = inject(ExpenseDataService);
  private _userAccountServ: UserAccountService = inject(UserAccountService);
  private _expenseApiServ: ExpenseApiService = inject(ExpenseApiService);
  private _confirmationServ: ConfirmationService = inject(ConfirmationService);
  private _messageServ: MessageService = inject(MessageService);
  private readonly _userId: string = this._userAccountServ.userPayload()._id;
  @Output('onCloseEditCategoryModal') onCloseEditCategoryModal: EventEmitter<boolean> = new EventEmitter<boolean>();
  @Output('onEditCategoryClick') onEditCategoryClick: EventEmitter<ExpenseCategoryModel> = new EventEmitter<ExpenseCategoryModel>();

  loading: Signal<boolean> = computed(() => this._loadingServ.loading());
  categoriesOptions: Signal<ExpenseCategoryModel[]> = computed(() => this._expenseDataServ.categories());

  showDeleteCategoryConfirmation(category: ExpenseCategoryModel): void {
    this._confirmationServ.confirm({
      header: `Delete category ${category.name}`,
      message: `All the expenses entries related to '${category.name}' will be effected.`,
      accept: () => {
        if (category._id) this.deleteCategory(category._id);
      },
      reject: () => {

      },
    });
  }

  deleteCategory(categoryId: string): void {
    this._loadingServ.loading.set(true);
    this._expenseApiServ.deleteExpenseCategory(categoryId, this._userId)
      .pipe(take(1))
      .subscribe({
        next: (response: any) => {
          if (response.status === 200) {
            // if (categoryId === this.expenseEntryForm.get('category')?.value) this.expenseEntryForm.patchValue({ category: null });
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
