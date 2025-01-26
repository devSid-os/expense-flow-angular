import { HttpErrorResponse } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { Component, EventEmitter, inject, Input, OnInit, Output, ViewEncapsulation } from '@angular/core';
// SERVICES IMPORT
import { ConfirmationService, MessageService } from 'primeng/api';
import { UserAccountService } from '../../../Services/account.service';
import { ExpenseApiService } from '../../../Services/Expenses/expense-api.service';
import { LoadingService } from '../../../Services/loading.service';
// NG UI COMPONENTS PRIME IMPORTS
import { ButtonModule } from 'primeng/button';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { Skeleton } from 'primeng/skeleton';
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { ConfirmDialog } from 'primeng/confirmdialog';
// MODELS IMPORT
import { ExpenseEntryModel, ExpenseItemModel } from '../../../Models/expenses.model';
import { PaginationModel } from '../../../Models/pagination.model';

@Component({
  selector: 'app-expense-list-table',
  imports: [TableModule, IconFieldModule, InputIconModule, ButtonModule, CommonModule, InputTextModule, Skeleton, ConfirmDialog],
  templateUrl: './expense-list-table.component.html',
  styleUrl: './expense-list-table.component.scss',
  providers: [MessageService, ConfirmationService],
  encapsulation: ViewEncapsulation.None,
})
export class ExpenseListTableComponent implements OnInit {

  private _loadingServ: LoadingService = inject(LoadingService);
  private _userAccountServ: UserAccountService = inject(UserAccountService);
  private _expenseApiServ: ExpenseApiService = inject(ExpenseApiService);
  private _messageServ: MessageService = inject(MessageService);
  private _userId: string = this._userAccountServ.userPayload()._id;
  private _confirmationServ: ConfirmationService = inject(ConfirmationService);

  products: any[] = [];

  @Input('entriesPagination') entriesPagination!: PaginationModel;
  @Input('entries') entries!: ExpenseEntryModel[];
  @Output('onEditExpenseClick') onEditExpenseClick: EventEmitter<ExpenseEntryModel> = new EventEmitter<ExpenseEntryModel>();
  @Output('onPageChange') onPageChange: EventEmitter<any> = new EventEmitter<any>();


  ngOnInit(): void {
    this.products = Array.from({ length: 12 }).map((_, i) => `Item #${i}`);
  }

  getExpenseTotal(items: { item: ExpenseItemModel, qty: number }[]): number {
    const expTotal: number = items.reduce((sum, item) => sum + (item.item.price * item.qty), 0);
    return expTotal;
  }

  getTotalPage(): number {
    return Math.ceil(this.entriesPagination.totalRecords / this.entriesPagination.pageSize);
  }

  showDeleteEntryConfirmation(entryId: string): void {
    this._confirmationServ.confirm({
      header: `Delete Entry`,
      message: `Are you sure, you want to delete this entry`,
      accept: () => {
        this.deleteExpenseEntry(entryId);
      },
      reject: () => {

      },
    });
  }

  deleteExpenseEntry(entryId: string): void {
    if (!entryId) {
      this._messageServ.add({ summary: 'Error', detail: 'Cannot delete expense entry', severity: 'error' });
      return;
    }
    this._loadingServ.loading.set(true);
    this._expenseApiServ.deleteUserExpenseEntry(this._userId, entryId)
      .subscribe({
        next: (response: any) => {
          if (response.status === 200) {
            this._messageServ.add({ summary: 'Success', detail: response.payload, severity: 'success' });
          }
          this._loadingServ.loading.set(false);
        },
        error: (error: HttpErrorResponse) => {
          if (error.status === 400) {
            this._messageServ.add({ summary: 'Error', detail: error.error.error, severity: 'error' });
          }
          this._loadingServ.loading.set(false);
        }
      });
  }

}