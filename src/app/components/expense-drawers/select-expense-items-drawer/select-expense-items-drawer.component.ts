import { Component, computed, inject, Signal, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { take } from 'rxjs';
// SERVICES IMPORT
import { UserAccountService } from '../../../Services/account.service';
import { ExpenseApiService } from '../../../Services/Expenses/expense-api.service';
import { ExpenseDataService } from '../../../Services/Expenses/expense-data.service';
import { LoadingService } from '../../../Services/loading.service';
import { ConfirmationService, MessageService } from 'primeng/api';
// NG UI COMPONENTS PRIME IMPORTS
import { Toast } from 'primeng/toast';
import { AccordionModule } from 'primeng/accordion';
import { DrawerModule } from 'primeng/drawer';
import { ScrollPanelModule } from 'primeng/scrollpanel';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { Dialog } from 'primeng/dialog';
// APP COMPONENTS IMPORT
import { ItemsListComponent } from './items-list/items-list.component';
// MODELS IMPORT
import { ExpenseItemModel } from '../../../Models/expenses.model';

@Component({
  selector: 'app-select-expense-items-drawer',
  imports: [CommonModule, ReactiveFormsModule, DrawerModule, ScrollPanelModule, ButtonModule, InputTextModule,  AccordionModule, MessageModule, Toast, Dialog, ItemsListComponent],
  templateUrl: './select-expense-items-drawer.component.html',
  styleUrl: './select-expense-items-drawer.component.scss',
  encapsulation: ViewEncapsulation.None,
  providers: [MessageService, ConfirmationService]
})
export class SelectExpenseItemsDrawerComponent {
  private _loadingServ: LoadingService = inject(LoadingService);
  private _expenseApiServ: ExpenseApiService = inject(ExpenseApiService);
  private _expenseDataServ: ExpenseDataService = inject(ExpenseDataService);
  private _userAccountServ: UserAccountService = inject(UserAccountService);
  private _messageServ: MessageService = inject(MessageService);
  private _formBuilder: FormBuilder = inject(FormBuilder);
  private readonly _userId: string = this._userAccountServ.userPayload()._id;

  items: Signal<ExpenseItemModel[]> = computed(() => this._expenseDataServ.items());
  itemsCart: Signal<{ [itemId: string]: { item: ExpenseItemModel, qty: number } }> = computed(() => this._expenseDataServ.itemsCart());
  itemsCartArray: Signal<{ item: ExpenseItemModel, qty: number }[]> = this._expenseDataServ.itemsCartArray;
  cartTotalAmount: Signal<number> = this._expenseDataServ.cartTotalAmount;
  editItemsCart: Signal<{
    [itemId: string]: {
      item: ExpenseItemModel,
      qty: number
    };
  }> = computed(() => this._expenseDataServ.editItemsCart());
  editItemsCartArray: Signal<{
    item: ExpenseItemModel,
    qty: number
  }[]> = computed(() => this._expenseDataServ.editItemsCartArray());
  editCartTotalAmount: Signal<number> = this._expenseDataServ.editCartTotalAmount;

  // UI VARIABLES
  editExpenseDrawerOpen: Signal<boolean> = computed(() => this._expenseDataServ.showEditExpenseDrawer());
  loading: Signal<boolean> = computed(() => this._loadingServ.loading());
  isDrawerOpen: Signal<boolean> = computed(() => this._expenseDataServ.showExpenseItemsDrawer());
  showEditItemDialog: boolean = false;
  addItemForm: FormGroup;
  editItemForm: FormGroup;

  constructor() {
    this.addItemForm = this._formBuilder.group({
      name: ['', [Validators.required]],
      price: [0, [Validators.required, Validators.pattern(/^\d+(\.\d{0,2})?$/)]]
    });
    this.editItemForm = this._formBuilder.group({
      name: ['', [Validators.required]],
      price: [0, [Validators.required, Validators.pattern(/^\d+(\.\d{0,2})?$/)]],
      itemId: ['', [Validators.required]]
    });
  }

  closeDrawer(): void {
    this._expenseDataServ.showExpenseItemsDrawer.set(false);
  }

  closeAllDrawers(): void {
    this._expenseDataServ.showAddExpenseDrawer.set(false);
    this._expenseDataServ.showEditExpenseDrawer.set(false);
    this.closeDrawer();
  }

  onEditExpenseItem(item: ExpenseItemModel): void {
    this.editItemForm.patchValue({
      name: item.name,
      itemId: item._id,
      price: item.price
    });
    this.showEditItemDialog = true;
  }

  closeEditExpenseModal(): void {
    this.editItemForm.reset();
    this.showEditItemDialog = false;
  }

  // API CALL FUNCTIONS
  addNewExpenseItem(): void {
    if (this.addItemForm.invalid) {
      if (this.addItemForm.get('name')?.hasError('required')) {
        this._messageServ.add({ severity: 'error', summary: 'Item name cannot be empty', detail: 'Name and price are required fields' });
        return;
      }
      if (this.addItemForm.get('price')?.hasError('required')) {
        this._messageServ.add({ severity: 'error', summary: 'Item price cannot be empty', detail: 'Name and price are required fields' });
        return;
      }
      if (this.addItemForm.get('price')?.hasError('pattern')) {
        this._messageServ.add({ severity: 'error', summary: 'Item price is not valid', detail: 'Name and price are required fields' });
        return;
      }
      this._messageServ.add({ severity: 'error', summary: 'Expense Item couldn\'t be added', detail: 'Name and price are required fields' });
      return;
    }

    this._loadingServ.loading.set(true);
    this._expenseApiServ.addNewExpenseItem(this.addItemForm.get('name')?.value, this.addItemForm.get('price')?.value, this._userId)
      .pipe(take(1))
      .subscribe({
        next: (response: any) => {
          if (response.status === 201) {
            this._messageServ.clear();
            this.addItemForm.reset();
          }
          this._loadingServ.loading.set(false);
        },
        error: (error: HttpErrorResponse) => {
          if (error.status === 400) {
            this._messageServ.add({ severity: 'error', detail: error.error.error, summary: 'Expense Item couldn\'t be added' });
          }
          this._loadingServ.loading.set(false);
        }
      })
  }

  editUserExpenseItem(): void {
    if (this.editItemForm.invalid) {
      if (this.editItemForm.get('itemId')?.hasError('required')) {
        this._messageServ.add({ severity: 'error', summary: 'Error', detail: 'Item id cannot be empty' });
        return;
      }
      if (this.editItemForm.get('name')?.hasError('required')) {
        this._messageServ.add({ severity: 'error', summary: 'Error', detail: 'Item name cannot be empty' });
        return;
      }
      else if (this.editItemForm.get('price')?.hasError('required')) {
        this._messageServ.add({ severity: 'error', summary: 'Error', detail: 'Item price cannot be empty' });
        return;
      }
      else if (this.editItemForm.get('price')?.hasError('pattern')) {
        this._messageServ.add({ severity: 'error', summary: 'Error', detail: 'Enter a valid price (only numbers, max 2 decimal places).' });
        return;
      }
      else if (this.editItemForm.get('price')?.hasError('itemId')) {
        this._messageServ.add({ severity: 'error', summary: 'Error', detail: 'Cannot edit expense item right now. Try again later!' });
        return;
      }
      return;
    }
    this._loadingServ.loading.set(true);
    this._expenseApiServ.updateUserExpenseItem(this.editItemForm.get('name')?.value, this.editItemForm.get('price')?.value, this.editItemForm.get('itemId')?.value, this._userId)
      .pipe(take(1))
      .subscribe({
        next: (response: any) => {
          if (response.status === 200) {
            this.showEditItemDialog = false;
            this.editItemForm.reset();
            this._loadingServ.loading.set(false);
            this._expenseApiServ.fetchExpenseEntries.next(true);
          }
        },
        error: (error: HttpErrorResponse) => {
          if (error.status === 400) {
            this._messageServ.add({ severity: 'error', summary: 'Error', detail: error.error.error });
          }
          this._loadingServ.loading.set(false);
        }
      });
  }
}