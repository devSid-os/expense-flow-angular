import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnDestroy, OnInit, Signal } from '@angular/core';
import { AddRecipientDrawerComponent } from '../../components/recipient-drawers/add-recipient-drawer/add-recipient-drawer.component';
import { RecipientsTableComponent } from './recipients-table/recipients-table.component';
import { RecipientApiService } from '../../Services/Recipients/recipient-api.service';
import { UserAccountService } from '../../Services/account.service';
import { LoadingService } from '../../Services/loading.service';
import { response } from 'express';
import { HttpErrorResponse } from '@angular/common/http';
import { Subscription, take } from 'rxjs';
import { RecipientDataService } from '../../Services/Recipients/recipient-data.service';
import { RecipientModel } from '../../Models/recipient.model';
import { PaginationModel } from '../../Models/pagination.model';

@Component({
  selector: 'app-recipients',
  imports: [CommonModule, AddRecipientDrawerComponent, RecipientsTableComponent],
  templateUrl: './recipients.component.html',
  styleUrl: './recipients.component.scss'
})
export class RecipientsComponent implements OnInit, OnDestroy {
  private _recipientApiServ: RecipientApiService = inject(RecipientApiService);
  private _loadingServ: LoadingService = inject(LoadingService);
  private _userAccountServ: UserAccountService = inject(UserAccountService);
  private _recipientDataServ = inject(RecipientDataService);
  private readonly userId: Signal<string> = computed(() => this._userAccountServ.userPayload()._id);
  recipients: Signal<{
    data: Signal<RecipientModel[]>;
    pagination: Signal<PaginationModel>;
  }> = computed(() => this._recipientDataServ.recipients());
  filteredRecipients: Signal<{
    data: Signal<RecipientModel[]>;
    pagination: Signal<PaginationModel>;
  }> = computed(() => this._recipientDataServ.filteredRecipients());
  openAddRecipientDrawer: boolean = false;
  fetchRecipients$: Subscription | null = null;
  filterApplied: Signal<boolean> = computed(() => this._recipientDataServ.filteredApplied());


  ngOnInit(): void {
    this.fetchRecipients$ = this._recipientApiServ.refetchRecipients.subscribe({
      next: (value: boolean) => {
        if (value) {
          const userId = this._userAccountServ.userPayload()._id;
          this.fetchAllRecipients(this._recipientDataServ.recipients().pagination().currentPage, this._recipientDataServ.recipients().pagination().pageSize, userId);
          this._recipientApiServ.refetchRecipients.next(false);
        }
      }
    });
  }

  ngOnDestroy(): void {
    if (this.fetchRecipients$ instanceof Subscription) this.fetchRecipients$.unsubscribe();
  }

  searchRecipients(value: string): void {
    if (!value) {
      this._recipientDataServ.filteredApplied.set(false);
      return;
    }
    this._loadingServ.loading.set(true);
    this._recipientApiServ.getFilteredRecipients(value, this.filteredRecipients().pagination().currentPage, this.filteredRecipients().pagination().pageSize, this.userId())
      .pipe(take(1))
      .subscribe({
        next: (response: any) => {
          if (response.status === 200) {
            this._loadingServ.loading.set(false);
          }
        },
        error: (error: HttpErrorResponse) => {
          this._loadingServ.loading.set(false);
        }
      })
  }

  fetchAllRecipients(page: number, limit: number, userId: string): void {
    this._loadingServ.loading.set(true);
    this._recipientApiServ.getAllRecipients(page, limit, userId)
      .pipe(take(1))
      .subscribe({
        next: (response: any) => {
          if (response.status === 200) {
            this._loadingServ.loading.set(false);
          }
        },
        error: (error: HttpErrorResponse) => {
          this._loadingServ.loading.set(false);
        }
      })
  }
}
