import { CommonModule } from '@angular/common';
import { Component, computed, EventEmitter, inject, Input, OnInit, Output, Signal, ViewChild, ViewEncapsulation } from '@angular/core';
import { DrawerModule } from 'primeng/drawer';
import { MessageModule } from 'primeng/message';
import { ScrollPanelModule } from 'primeng/scrollpanel';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { CalendarModule } from 'primeng/calendar';
import { RecipientModel } from '../../../Models/recipient.model';
import { RecipientAvatarComponent } from '../../recipient-avatar/recipient-avatar.component';
import { RecipientDataService } from '../../../Services/Recipients/recipient-data.service';
import { UserAccountService } from '../../../Services/account.service';
import { LoadingService } from '../../../Services/loading.service';
import { RecipientApiService } from '../../../Services/Recipients/recipient-api.service';
import { take } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Toast } from 'primeng/toast';
import { PaginatorModule, PaginatorState } from 'primeng/paginator';
import { PaginationModel } from '../../../Models/pagination.model';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { RecepientReportGeneratorComponent } from './recepient-report-generator/recepient-report-generator.component';
import { EntryModel } from '../../../Models/entry.model';

@Component({
  selector: 'app-view-recipient-drawer',
  imports: [
    CommonModule,
    DrawerModule,
    ScrollPanelModule,
    MessageModule,
    RecipientAvatarComponent,
    RecepientReportGeneratorComponent,
    Toast,
    PaginatorModule,
    ConfirmDialogModule,
    CalendarModule,
    DialogModule,
    FormsModule
  ],
  templateUrl: './view-recipient-drawer.component.html',
  styleUrl: './view-recipient-drawer.component.scss',
  encapsulation: ViewEncapsulation.None,
  providers: [MessageService, ConfirmationService]
})
export class ViewRecipientDrawerComponent implements OnInit {
  private _messageServ: MessageService = inject(MessageService);
  private _confirmationServ: ConfirmationService = inject(ConfirmationService);
  private _recipientDataServ: RecipientDataService = inject(RecipientDataService);
  private _recipientApiServ: RecipientApiService = inject(RecipientApiService);
  private _userAccountServ: UserAccountService = inject(UserAccountService);
  private _loadingServ: LoadingService = inject(LoadingService);
  private readonly _user_id: Signal<string> = computed(() => this._userAccountServ.userPayload()._id);
  loading = computed(() => this._loadingServ.loading());

  @Input('openDrawer') openDrawer!: boolean;
  @Input('recipient') recipient!: RecipientModel;
  @Output('onCloseDrawer') onCloseDrawer: EventEmitter<false> = new EventEmitter<false>();
  @ViewChild('reportGenerator') reportGenerator!: RecepientReportGeneratorComponent;

  entries: EntryModel[] = new Array();
  pagination: PaginationModel = {
    currentPage: 0,
    pageSize: 15,
    totalRecords: 0
  }

  downloadReportObj: {
    showDownloadModal: boolean,
    downloadStatus: 'downloading' | 'completed' | 'error',
    downloadProgress: number,
  } = {
      showDownloadModal: false,
      downloadStatus: 'downloading',
      downloadProgress: 0,
    }

  // Date filter properties
  showDateFilter = false;
  today = new Date();
  activeQuickFilter: string | null = null;

  dateFilter: { startDate: Date | null; endDate: Date | null } = {
    startDate: null,
    endDate: null
  };

  quickDateFilters = [
    { label: 'Today', value: 'today' },
    { label: 'Yesterday', value: 'yesterday' },
    { label: 'Last 7 Days', value: 'last7days' },
    { label: 'Last 30 Days', value: 'last30days' },
    { label: 'This Month', value: 'thisMonth' },
    { label: 'Last Month', value: 'lastMonth' }
  ];

  constructor() { }

  ngOnInit(): void {
    this.getRecipientEntries();
  }

  getRecipientEntries() {
    this._recipientApiServ.getRecipientEntries(this.recipient._id, this.pagination.currentPage, this.pagination.pageSize, this.dateFilter.startDate, this.dateFilter.endDate)
      .pipe(take(1))
      .subscribe({
        next: (response: any) => {
          this.entries = response?.payload || [];
          this.pagination = {
            ...this.pagination,
            currentPage: response?.currentPage || 0,
            totalRecords: response?.totalEntries || 0
          }
        },
        error: (error: any) => {
          console.log(error);
        }
      })
  }

  getDownloadReportData() {
    return this._recipientApiServ.getRecipientEntries(this.recipient._id, 0, this.pagination.totalRecords, this.dateFilter.startDate, this.dateFilter.endDate)
      .pipe(take(1));
  }

  deleteRecipient(recipientId: string): void {
    this._loadingServ.loading.set(true);
    this._recipientApiServ.deleteRecipient(recipientId, this._user_id())
      .pipe(take(1))
      .subscribe({
        next: (response: any) => {
          if (response.status === 200) {
            this._loadingServ.loading.set(false);
            this._messageServ.add({ severity: 'success', summary: 'Success', detail: 'Recipient deleted successfully' });
            this._recipientApiServ.refetchRecipients.next(true);
            this.onCloseDrawer.emit(false);
          }
        },
        error: (error: HttpErrorResponse) => {
          if (error.status === 400) this._messageServ.add({ summary: 'Error', detail: error.error.error, severity: 'error' });
          this._loadingServ.loading.set(false);
        }
      });
  }

  onPageChange(event: PaginatorState) {
    this.pagination = {
      ...this.pagination,
      currentPage: event.page || 0,
      pageSize: event.rows || 15
    };
    this.getRecipientEntries();
  }

  confirmDeleteRecipient(recipientId: string): void {
    this._confirmationServ.confirm({
      message: `Are you sure you want to delete "${this.recipient.name}"?`,
      header: 'Delete Recipient',
      icon: 'fa-solid fa-triangle-exclamation',
      acceptLabel: 'Delete',
      rejectLabel: 'Cancel',
      acceptButtonStyleClass: 'bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium',
      rejectButtonStyleClass: 'bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium mr-2',
      accept: () => {
        this.deleteRecipient(recipientId);
      }
    });
  }

  openAddEntryDrawer(type: 'in' | 'out', recipientId: string): void {
    this._recipientDataServ.addEntryDrawer().open.set(true);
    this._recipientDataServ.addEntryDrawer().type.set(type);
    this._recipientDataServ.addEntryDrawer().recipient.set(recipientId);
  }

  openDownloadReport(): void {
    this.downloadReportObj.showDownloadModal = true;
    this.downloadReportObj.downloadStatus = 'downloading';
    this.downloadReportObj.downloadProgress = 10;

    this.generateReport();
  }

  generateReport() {
    this.getDownloadReportData()
      .subscribe({
        next: async (response: any) => {
          const reportData = response?.payload || [];
          this.downloadReportObj.downloadProgress = 50;

          // Wait for Angular to bind data to the component
          setTimeout(async () => {
            this.downloadReportObj.downloadProgress = 80;

            if (this.reportGenerator) {
              const success = await this.reportGenerator.generatePDF(this.recipient, reportData);
              this.downloadReportObj.downloadProgress = 100;

              if (success) {
                this.downloadReportObj.downloadStatus = 'completed';
              } else {
                this.downloadReportObj.downloadStatus = 'error';
              }
            } else {
              this.downloadReportObj.downloadStatus = 'error';
            }
          }, 500); // <-- This delay is important!
        },
        error: (error: any) => {
          console.error('Download error:', error);
          this.downloadReportObj.downloadStatus = 'error';
        }
      });
  }

  cancelDownloadReport(): void {
    // Add actual cancel logic here
    this.closeDownloadReportModal();
  }

  retryDownloadReport(): void {
    this.downloadReportObj.downloadStatus = 'downloading';
    this.downloadReportObj.downloadProgress = 0;
    this.generateReport();
  }

  closeDownloadReportModal(): void {
    this.downloadReportObj.showDownloadModal = false;
    this.downloadReportObj.downloadProgress = 0;
    this.downloadReportObj.downloadStatus = 'downloading';
  }

  // Computed property for checking active filter
  get hasActiveFilter(): boolean {
    return this.dateFilter.startDate !== null || this.dateFilter.endDate !== null;
  }

  get canApplyFilter(): boolean {
    return this.dateFilter.startDate !== null || this.dateFilter.endDate !== null;
  }

  // Quick filter logic
  applyQuickFilter(filterValue: string): void {
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    let startDate: Date;
    let endDate: Date = new Date(today);

    switch (filterValue) {
      case 'today':
        startDate = new Date(today);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'yesterday':
        startDate = new Date(today);
        startDate.setDate(startDate.getDate() - 1);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(startDate);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'last7days':
        startDate = new Date(today);
        startDate.setDate(startDate.getDate() - 6);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'last30days':
        startDate = new Date(today);
        startDate.setDate(startDate.getDate() - 29);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'thisMonth':
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        break;
      case 'lastMonth':
        startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        endDate = new Date(today.getFullYear(), today.getMonth(), 0);
        endDate.setHours(23, 59, 59, 999);
        break;
      default:
        return;
    }

    this.activeQuickFilter = filterValue;
    this.dateFilter.startDate = startDate;
    this.dateFilter.endDate = endDate;

    // Auto-apply when quick filter is selected
    // this.applyDateFilter();
  }

  // Custom date change handler
  onDateFilterChange(): void {
    // Clear quick filter when custom dates are selected
    this.activeQuickFilter = null;
  }

  // Apply date filter - call your API here
  applyDateFilter(): void {
    this.getRecipientEntries();
  }

  // Clear all filters
  clearDateFilter(): void {
    this.dateFilter = { startDate: null, endDate: null };
    this.activeQuickFilter = null;
    this.getRecipientEntries();
  }

  // Get label for active filter badge
  getActiveFilterLabel(): string {
    if (this.activeQuickFilter) {
      const filter = this.quickDateFilters.find(f => f.value === this.activeQuickFilter);
      return filter?.label || '';
    }

    if (this.dateFilter.startDate && this.dateFilter.endDate) {
      const start = this.formatDateForDisplay(this.dateFilter.startDate);
      const end = this.formatDateForDisplay(this.dateFilter.endDate);
      return `${start} - ${end}`;
    }

    if (this.dateFilter.startDate) {
      return `From ${this.formatDateForDisplay(this.dateFilter.startDate)}`;
    }

    if (this.dateFilter.endDate) {
      return `Until ${this.formatDateForDisplay(this.dateFilter.endDate)}`;
    }

    return '';
  }

  // Helper: Format date for display
  private formatDateForDisplay(date: Date): string {
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }

}