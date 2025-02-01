import { Component, computed, effect, inject, Signal, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { take } from 'rxjs';
// SERVICES IMPORT
import { UserAccountService } from '../../../Services/account.service';
import { ExpenseApiService } from '../../../Services/Expenses/expense-api.service';
import { ExpenseDataService } from '../../../Services/Expenses/expense-data.service';
import { LoadingService } from '../../../Services/loading.service';
import { MessageService } from 'primeng/api';
// NG UI COMPONENTS PRIME IMPORTS
import { DrawerModule } from 'primeng/drawer';
import { DatePickerModule } from 'primeng/datepicker';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { Select } from 'primeng/select';
import { MessageModule } from 'primeng/message';
import { ScrollPanelModule } from 'primeng/scrollpanel';
import { Toast } from 'primeng/toast';
// APP COMPONENTS IMPORT
import { AddCategoryComponent } from '../add-category/add-category.component';
import { EditCategoryListComponent } from '../edit-category-list/edit-category-list.component';
import { EditCategoryFormComponent } from '../edit-category-form/edit-category-form.component';
// MODELS IMPORT
import { ExpenseCategoryModel, ExpenseItemModel } from '../../../Models/expenses.model';

@Component({
  selector: 'app-add-expense-drawer',
  imports: [CommonModule, ReactiveFormsModule, FormsModule, DrawerModule, DatePickerModule, InputTextModule, ButtonModule, RippleModule, Select, MessageModule, ScrollPanelModule, Toast, AddCategoryComponent, EditCategoryListComponent, EditCategoryFormComponent],
  templateUrl: './add-expense-drawer.component.html',
  styleUrl: './add-expense-drawer.component.scss',
  encapsulation: ViewEncapsulation.None,
  standalone: true,
  providers: [MessageService]
})
export class AddExpenseDrawerComponent {
  private _loadingServ: LoadingService = inject(LoadingService);
  private _expenseApiServ: ExpenseApiService = inject(ExpenseApiService);
  private _expenseDataServ: ExpenseDataService = inject(ExpenseDataService);
  private _formBuilder: FormBuilder = inject(FormBuilder);
  private _userAccountServ: UserAccountService = inject(UserAccountService);
  private _messageServ: MessageService = inject(MessageService);
  private readonly _userId: string = this._userAccountServ.userPayload()._id;

  loading: Signal<boolean> = computed(() => this._loadingServ.loading());
  categoriesOptions: Signal<ExpenseCategoryModel[]> = computed(() => this._expenseDataServ.categories());
  cartItemsArray: Signal<{ item: ExpenseItemModel, qty: number }[]> = this._expenseDataServ.itemsCartArray;
  cartTotal: Signal<number> = this._expenseDataServ.cartTotalAmount;

  isAddNewCategory: boolean = false;
  isEditCategory: boolean = false;
  editCategoryData: ExpenseCategoryModel | null = null;
  showEditCategoryDialog: boolean = false;

  entryForm: FormGroup;

  isDrawerOpen: Signal<boolean> = computed(() => this._expenseDataServ.showAddExpenseDrawer());
  today: Date = new Date();

  constructor() {
    this.entryForm = this._formBuilder.group({
      description: [''],
      date: [this.today, [Validators.required]],
      category: ['', [Validators.required]],
      items: [[], [Validators.required, this.nonEmptyArrayValidator()]]
    });

    effect(() => {
      const cart: {
        item: ExpenseItemModel;
        qty: number;
      }[] = this.cartItemsArray().map(item => ({ item: item.item, qty: item.qty }));

      this.entryForm.patchValue({
        items: cart
      });
    });
  }

  nonEmptyArrayValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      return Array.isArray(control.value) && control.value.length > 0
        ? null
        : { emptyArray: true };
    };
  }

  closeDrawer(): void {
    this._expenseDataServ.showAddExpenseDrawer.set(false);
    this._expenseDataServ.showEditExpenseDrawer.set(false);
  }

  showEditCategoryModal(category: ExpenseCategoryModel): void {
    this.editCategoryData = category;
    this.showEditCategoryDialog = true;
  }

  closeEditCategoryModal(): void {
    this.editCategoryData = null;
    this.showEditCategoryDialog = false;
  }

  showAddNewCategoryForm(): void {
    this.isAddNewCategory = true;
  }

  openExpenseItemsDrawer(): void {
    this._expenseDataServ.showExpenseItemsDrawer.set(true);
  }

  // FUNCTION TO CALCULATE THE TOTAL OF ITEM EX: (2 * RS.40)
  calculateItemsTotal(price: number, qty: number): number {
    return price * qty;
  }

  // API CALLS FUNCTIONS
  createExpenseEntry(): void {
    if (this.entryForm.invalid) {
      if (this.entryForm.get('date')?.hasError('required')) {
        this._messageServ.add({ summary: 'Error', detail: 'Expense Date is a required field', severity: 'error' });
        return;
      }

      if (this.entryForm.get('category')?.hasError('required')) {
        this._messageServ.add({ summary: 'Error', detail: 'Expense Category is a required field', severity: 'error' });
        return;
      }
      if (this.entryForm.get('items')?.hasError('emptyArray')) {
        this._messageServ.add({ summary: 'Error', detail: 'Atleast Select 1 Expense Item to create an entry', severity: 'error' });
        return;
      }
      this._messageServ.add({ summary: 'Error', detail: 'An error while adding expense entry!', severity: 'error' });
      return;
    }
    this._loadingServ.loading.set(true);
    const entryDate = this.entryForm.get('date')?.value;
    const entryCategory = this.entryForm.get('category')?.value;
    const entryItems = this.entryForm.get('items')?.value;
    const entryDescription = this.entryForm.get('description')?.value;
    this._expenseApiServ.createExpenseEntry({
      date: entryDate,
      category: entryCategory,
      items: entryItems,
      description: entryDescription
    }, this._userId)
      .pipe(take(1))
      .subscribe({
        next: (response: any) => {
          if (response.status === 201) {
            this.entryForm.reset();
            this.entryForm.patchValue({ date: this.today });
            this._messageServ.add({ severity: 'success', summary: 'Sucess', detail: 'Expense entry added successfully' });
            this._loadingServ.loading.set(false);
            this._expenseApiServ.fetchExpenseEntries.next(true);
          }
        },
        error: (error: HttpErrorResponse) => {
          if (error.status === 400) this._messageServ.add({ summary: 'Error', detail: error.error.error, severity: 'error' });
          this._loadingServ.loading.set(false);
        }
      });
  }
}