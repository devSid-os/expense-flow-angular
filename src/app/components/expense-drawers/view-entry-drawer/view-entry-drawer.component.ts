import { CommonModule } from '@angular/common';
import { Component, computed, inject, Signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
// SERVICES IMPORT
import { ConfirmationService, MessageService } from 'primeng/api';
import { ExpenseApiService } from '../../../Services/Expenses/expense-api.service';
import { LoadingService } from '../../../Services/loading.service';
import { UserAccountService } from '../../../Services/account.service';
import { ExpenseDataService } from '../../../Services/Expenses/expense-data.service';
// NG UI COMPONENTS PRIME IMPORTS
import { DrawerModule } from 'primeng/drawer';
import { ScrollPanelModule } from 'primeng/scrollpanel';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { ButtonModule } from 'primeng/button';
// APP COMPONENTS IMPORT
import { EditExpenseDrawerComponent } from '../edit-expense-drawer/edit-expense-drawer.component';
// MODELS IMPORT
import { ExpenseEntryModel, ExpenseItemModel } from '../../../Models/expenses.model';
import { Lightbox, LightboxConfig, LightboxModule } from 'ngx-lightbox';

@Component({
  selector: 'app-view-entry-drawer',
  imports: [CommonModule, DrawerModule, ScrollPanelModule, ConfirmDialog, ButtonModule, LightboxModule, EditExpenseDrawerComponent],
  templateUrl: './view-entry-drawer.component.html',
  styleUrl: './view-entry-drawer.component.scss',
  providers: [ConfirmationService, MessageService]
})
export class ViewEntryDrawerComponent {
  private _lightboxConfig: LightboxConfig = inject(LightboxConfig);
  private _lightbox: Lightbox = inject(Lightbox);
  private _messageServ: MessageService = inject(MessageService);
  private _loadingServ: LoadingService = inject(LoadingService);
  private _expenseApiServ: ExpenseApiService = inject(ExpenseApiService);
  private _expenseDataServ: ExpenseDataService = inject(ExpenseDataService);
  private _userAccountServ: UserAccountService = inject(UserAccountService);
  private _userId: string = this._userAccountServ.userPayload()._id;
  private _confirmationServ: ConfirmationService = inject(ConfirmationService);
  isViewEntryDrawerOpen: Signal<boolean> = computed(() => this._expenseDataServ.showViewEntryDrawer());
  entryData: Signal<ExpenseEntryModel | null> = computed(() => this._expenseDataServ.viewEntryData());
  editExpenseDrawerOpen: Signal<boolean> = computed(() => this._expenseDataServ.showEditExpenseDrawer());
  editExpenseDrawerData: ExpenseEntryModel | null = null;

  constructor() {
    this._lightboxConfig.resizeDuration = 1;
    this._lightboxConfig.fadeDuration = 0;
    this._lightboxConfig.enableTransition = false;
    this._lightboxConfig.showDownloadButton = true;
    this._lightboxConfig.disableScrolling = true;
    this._lightboxConfig.centerVertically = true;
    this._lightboxConfig.wrapAround = true;
  }

  closeViewEntryDrawer(): void {
    this._expenseDataServ.showViewEntryDrawer.set(false);
    this._expenseDataServ.viewEntryData.set(null);
  }

  openAttachmentPreview(mediaUrl: string): void {
    this._lightbox.open([{ src: mediaUrl, caption: '', thumb: '' }], 0);
  }

  getTotal(items: { item: ExpenseItemModel, qty: number }[]): number {
    return items.reduce((acc, item) => acc + (item.qty * item.item.price), 0);
  }

  showDeleteEntryConfirmation(entryId: string): void {
    this._confirmationServ.confirm({
      header: `Delete Entry`,
      message: `Are you sure, You want to delete this expense entry? This cannot be undone.`,
      accept: () => {
        this.deleteExpenseEntry(entryId);
      },
      reject: () => {

      },
    });
  }

  showEditExpenseDrawer(data: ExpenseEntryModel): void {
    this._expenseDataServ.showEditExpenseDrawer.set(true);
    this._expenseDataServ.showAddExpenseDrawer.set(false);
    this.editExpenseDrawerData = { ...data };
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
            this._loadingServ.loading.set(false);
            this._expenseApiServ.fetchExpenseEntries.next(true);
          }
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
