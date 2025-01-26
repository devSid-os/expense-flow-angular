import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, Input, OnInit, Signal, ViewEncapsulation } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { take } from 'rxjs';
// SERVICES IMPORT
import { UserAccountService } from '../../../Services/account.service';
import { ExpenseApiService } from '../../../Services/Expenses/expense-api.service';
import { ExpenseDataService } from '../../../Services/Expenses/expense-data.service';
import { LoadingService } from '../../../Services/loading.service';
// NG UI COMPONENTS PRIME IMPORTS
import { MessageService } from 'primeng/api';
import { DrawerModule } from 'primeng/drawer';
import { ScrollPanelModule } from 'primeng/scrollpanel';
import { Select } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { Toast } from 'primeng/toast';
import { InputTextModule } from 'primeng/inputtext';
// APP COMPONENTS IMPORT
import { AddCategoryComponent } from '../add-category/add-category.component';
import { EditCategoryListComponent } from '../edit-category-list/edit-category-list.component';
import { EditCategoryFormComponent } from '../edit-category-form/edit-category-form.component';
// MODELS IMPORT
import { ExpenseCategoryModel, ExpenseEntryModel, ExpenseItemModel } from '../../../Models/expenses.model';

@Component({
  selector: 'app-edit-expense-drawer',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, DrawerModule, ScrollPanelModule, ButtonModule, DatePickerModule, Select, MessageModule, Toast, InputTextModule, AddCategoryComponent, EditCategoryListComponent, EditCategoryFormComponent],
  templateUrl: './edit-expense-drawer.component.html',
  styleUrl: './edit-expense-drawer.component.scss',
  providers: [MessageService],
  encapsulation: ViewEncapsulation.None,
})
export class EditExpenseDrawerComponent implements OnInit {


  @Input('expenseEntry') expenseEntry!: ExpenseEntryModel;
  private _loadingServ: LoadingService = inject(LoadingService);
  private _expenseApiServ: ExpenseApiService = inject(ExpenseApiService);
  private _expenseDataServ: ExpenseDataService = inject(ExpenseDataService);
  private _formBuilder: FormBuilder = inject(FormBuilder);
  private _userAccountServ: UserAccountService = inject(UserAccountService);
  private _messageServ: MessageService = inject(MessageService);
  private readonly _userId: string = this._userAccountServ.userPayload()._id;

  loading: Signal<boolean> = computed(() => this._loadingServ.loading());
  categoriesOptions: Signal<ExpenseCategoryModel[]> = computed(() => this._expenseDataServ.categories());
  cartItemsArray: Signal<{ item: ExpenseItemModel, qty: number }[]> = this._expenseDataServ.editItemsCartArray;
  cartTotal: Signal<number> = this._expenseDataServ.editCartTotalAmount;

  isAddNewCategory: boolean = false;
  isEditCategory: boolean = false;
  editCategoryData: ExpenseCategoryModel | null = null;
  showEditCategoryDialog: boolean = false;

  editEntryForm: FormGroup;

  isDrawerOpen: Signal<boolean> = computed(() => this._expenseDataServ.showEditExpenseDrawer());
  today: Date = new Date();

  constructor() {
    this.editEntryForm = this._formBuilder.group({
      description: [''],
      date: [this.today, [Validators.required]],
      category: ['', [Validators.required]],
      items: [[], [Validators.required, this.nonEmptyArrayValidator()]],
      id: ['', [Validators.required]]
    });

    effect(() => {
      const cart = this.cartItemsArray().map(item => ({ item: item.item?._id, qty: item.qty }));

      this.editEntryForm.patchValue({
        items: cart
      });
    });
  }

  ngOnInit(): void {
    const cart: { [itemId: string]: { item: ExpenseItemModel, qty: number } } = {};
    this.expenseEntry.items.forEach((element: { item: ExpenseItemModel, qty: number }) => {
      if (element.item._id) {
        return cart[element.item._id] = element;
      }
      return null;
    });
    this._expenseDataServ.editItemsCart.set(cart);
    const expenseDate = new Date(this.expenseEntry.date);
    this.editEntryForm.patchValue({
      date: expenseDate,
      category: this.expenseEntry.category._id,
      items: this.expenseEntry.items,
      description: this.expenseEntry.description || '',
      id: this.expenseEntry._id
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
    this._expenseDataServ.editItemsCart.set({});
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

  closeAddNewCategoryForm(): void {
    this.isAddNewCategory = false;
  }

  openExpenseItemsDrawer(): void {
    this._expenseDataServ.showExpenseItemsDrawer.set(true);
  }

  // FUNCTION TO CALCULATE THE TOTAL OF ITEM EX: (2 * RS.40)
  calculateItemsTotal(price: number, qty: number): number {
    return price * qty;
  }

  // API CALLS FUNCTIONS
  updateExpenseEntry(): void {
    if (this.editEntryForm.invalid) {
      if (this.editEntryForm.get('date')?.hasError('required')) {
        this._messageServ.add({ summary: 'Error', detail: 'Expense Date is a required field', severity: 'error' });
        return;
      }

      if (this.editEntryForm.get('category')?.hasError('required')) {
        this._messageServ.add({ summary: 'Error', detail: 'Expense Category is a required field', severity: 'error' });
        return;
      }
      if (this.editEntryForm.get('items')?.hasError('emptyArray')) {
        this._messageServ.add({ summary: 'Error', detail: 'Atleast Select 1 Expense Item to create an entry', severity: 'error' });
        return;
      }
      this._messageServ.add({ summary: 'Error', detail: 'An error while adding expense entry!', severity: 'error' });
      return;
    }
    this._loadingServ.loading.set(true);
    const entryDate = this.editEntryForm.get('date')?.value;
    const entryCategory = this.editEntryForm.get('category')?.value;
    const entryItems = this.editEntryForm.get('items')?.value;
    const entryDescription = this.editEntryForm.get('description')?.value;
    const entryId = this.editEntryForm.get('id')?.value;
    this._expenseApiServ.updateUserExpenseEntry(entryDate, entryCategory, entryItems, entryDescription, entryId, this._userId)
      .pipe(
        take(1)
      )
      .subscribe({
        next: (response: any) => {
          if (response.status === 200) {
            this._expenseDataServ.showEditExpenseDrawer.set(false);
            this._expenseDataServ.showAddExpenseDrawer.set(false);
            this._expenseDataServ.showExpenseItemsDrawer.set(false);
            this._loadingServ.loading.set(false);
            this._expenseApiServ.fetchExpenseEntries.next(true);
          }
        },
        error: (error: HttpErrorResponse) => {
          if (error.status === 400) this._messageServ.add({ severity: 'error', summary: 'Error', detail: error.error.error });
          this._loadingServ.loading.set(false);
        }
      })
  }
}