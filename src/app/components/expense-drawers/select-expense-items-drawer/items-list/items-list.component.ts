import { Component, computed, EventEmitter, inject, Input, Output, Signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ReactiveFormsModule } from '@angular/forms';
import { take } from 'rxjs';
// SERVICES IMPORT
import { ExpenseDataService } from '../../../../Services/Expenses/expense-data.service';
import { LoadingService } from '../../../../Services/loading.service';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ExpenseApiService } from '../../../../Services/Expenses/expense-api.service';
import { UserAccountService } from '../../../../Services/account.service';
// NG UI COMPONENTS PRIME IMPORTS
import { ButtonModule } from 'primeng/button';
import { ConfirmDialog } from 'primeng/confirmdialog';
// MODELS IMPORT
import { ExpenseItemModel } from '../../../../Models/expenses.model';

@Component({
  selector: 'app-items-list',
  imports: [CommonModule, ButtonModule, ConfirmDialog, ReactiveFormsModule],
  templateUrl: './items-list.component.html',
  styleUrl: './items-list.component.scss',
  providers: [ConfirmationService, MessageService]
})
export class ItemsListComponent {

  private _userAccountServ: UserAccountService = inject(UserAccountService);
  private _loadingServ: LoadingService = inject(LoadingService);
  private _expenseApiServ: ExpenseApiService = inject(ExpenseApiService);
  private _expenseDataServ: ExpenseDataService = inject(ExpenseDataService);
  private _confirmationServ: ConfirmationService = inject(ConfirmationService);
  private _messageServ: MessageService = inject(MessageService);
  private readonly _userId: string = this._userAccountServ.userPayload()._id;
  @Input('itemsCartArray') itemsCartArray!: { item: ExpenseItemModel, qty: number }[];
  @Input('items') items!: ExpenseItemModel[];
  @Input('itemsCart') itemsCart!: { [itemId: string]: { item: ExpenseItemModel, qty: number } };
  @Output('onEditItem') onEditItem: EventEmitter<ExpenseItemModel> = new EventEmitter<ExpenseItemModel>();
  loading: Signal<boolean> = computed(() => this._loadingServ.loading());
  showEditItemDialog: boolean = false;
  editExpenseDrawerOpen: Signal<boolean> = computed(() => this._expenseDataServ.showEditExpenseDrawer());

  addItemToCart(item: any): void {
    if (!this.editExpenseDrawerOpen()) {
      this._expenseDataServ.itemsCart.update(cart => ({ ...cart, [item._id]: { item, qty: (cart[item._id]?.qty + 1) || 1 } }));
    }
    else {
      this._expenseDataServ.editItemsCart.update(cart => ({ ...cart, [item._id]: { item, qty: (cart[item._id]?.qty + 1) || 1 } }));
    }
  }

  removeItemFromCart(itemId: string): void {
    if (!this.editExpenseDrawerOpen()) {
      this._expenseDataServ.itemsCart.update(cart => {
        if (!(itemId in cart)) return cart;

        const updatedCart = { ...cart };

        if (updatedCart[itemId].qty > 1) {
          updatedCart[itemId].qty -= 1;
        } else {
          delete updatedCart[itemId];
        }

        return updatedCart;
      });
    }
    else {
      this._expenseDataServ.editItemsCart.update(cart => {
        if (!(itemId in cart)) return cart;

        const updatedCart = { ...cart };

        if (updatedCart[itemId].qty > 1) {
          updatedCart[itemId].qty -= 1;
        } else {
          delete updatedCart[itemId];
        }

        return updatedCart;
      });
    }
  }

  deleteUserExpenseItem(itemId: string): void {
    this._loadingServ.loading.set(true);
    this._expenseApiServ.deleteUserExpenseItem(itemId, this._userId)
      .pipe(take(1))
      .subscribe({
        next: (response: any) => {
          if (response.status === 200) {
            this._expenseApiServ.fetchExpenseEntries.next(true);
            if (this.editExpenseDrawerOpen()) {
              if (itemId in this._expenseDataServ.editItemsCart()) {
                this._expenseDataServ.editItemsCart.update(cart => {
                  const updatedCart = { ...cart };
                  delete updatedCart[itemId];
                  return updatedCart;
                });
              }
            }
            else {
              if (itemId in this._expenseDataServ.itemsCart()) {
                this._expenseDataServ.itemsCart.update(cart => {
                  const updatedCart = { ...cart };
                  delete updatedCart[itemId];
                  return updatedCart;
                });
              }
            }
          }
          this._loadingServ.loading.set(false);
        },
        error: (error: HttpErrorResponse) => {
          if (error.status === 400) this._messageServ.add({ severity: 'error', summary: 'An error occured', detail: error.error.error });
          this._loadingServ.loading.set(false);
        }
      });
  }

  showDeleteItemConfirmation(item: ExpenseItemModel): void {
    this._confirmationServ.confirm({
      header: `Delete item ${item.name}`,
      message: `Are you sure, you want to delete this item?`,
      accept: () => {
        if (item._id) this.deleteUserExpenseItem(item._id);
      },
      reject: () => {

      },
    });
  }
}
