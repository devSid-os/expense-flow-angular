import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnDestroy, OnInit, Signal, ViewEncapsulation } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Subscription, take } from 'rxjs';
// SERVICES IMPORT
import { UserAccountService } from '../../Services/account.service';
import { ExpenseApiService } from '../../Services/Expenses/expense-api.service';
import { ExpenseDataService } from '../../Services/Expenses/expense-data.service';
import { LoadingService } from '../../Services/loading.service';
import { MessageService, SortEvent } from 'primeng/api';
// NG UI COMPONENTS PRIME IMPORTS
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { Dialog } from 'primeng/dialog';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { Toast } from 'primeng/toast';
import { Chip } from 'primeng/chip';
import { DividerModule } from 'primeng/divider';
import { DatePicker } from 'primeng/datepicker';
// APP COMPONENTS IMPORT
import { ExpenseListTableComponent } from './expense-list-table/expense-list-table.component';
import { EditExpenseDrawerComponent } from '../../components/expense-drawers/edit-expense-drawer/edit-expense-drawer.component';
import { AddExpenseDrawerComponent } from '../../components/expense-drawers/add-expense-drawer/add-expense-drawer.component';
import { SelectExpenseItemsDrawerComponent } from '../../components/expense-drawers/select-expense-items-drawer/select-expense-items-drawer.component';
// MODELS IMPORT
import { ExpenseCategoryModel, ExpenseEntryModel, ExpenseItemModel, FetchFilteredEntriesModel } from '../../Models/expenses.model';
import { PaginationModel } from '../../Models/pagination.model';


@Component({
  selector: 'app-expenses-list',
  imports: [CommonModule, FormsModule, SelectModule, ButtonModule, DividerModule, InputTextModule, DatePicker, Dialog, IconFieldModule, InputIconModule, Toast, Chip, EditExpenseDrawerComponent, ExpenseListTableComponent, AddExpenseDrawerComponent, SelectExpenseItemsDrawerComponent],
  templateUrl: './expenses-list.component.html',
  styleUrl: './expenses-list.component.scss',
  encapsulation: ViewEncapsulation.None,
  providers: [MessageService]
})
export class ExpensesListComponent implements OnInit, OnDestroy {
  private _expenseApiServ: ExpenseApiService = inject(ExpenseApiService);
  private _expenseDataServ: ExpenseDataService = inject(ExpenseDataService);
  private _userAccountServ: UserAccountService = inject(UserAccountService);
  private _loadingServ: LoadingService = inject(LoadingService);
  private _userId: string = this._userAccountServ.userPayload()._id;
  private _messageService: MessageService = inject(MessageService);
  readonly today: Date = new Date();

  entriesPagination: Signal<PaginationModel> = computed(() => this._expenseDataServ.entriesPagination());
  entries: Signal<ExpenseEntryModel[]> = computed(() => this._expenseDataServ.entries());
  categories: Signal<ExpenseCategoryModel[]> = computed(() => this._expenseDataServ.categories());
  items: Signal<ExpenseItemModel[]> = computed(() => this._expenseDataServ.items());

  expenseDataServFilters: Signal<{
    items: Signal<string[]>,
    categories: Signal<string[]>,
    fromDate: Signal<Date | null>,
    endDate: Signal<Date | null>,
    timePeriod: Signal<'l2d' | 'yesterday' | 'today' | null>
  }> = computed(() => this._expenseDataServ.filters());

  filters: { categories: string[], items: string[], fromDate: Date | null, endDate: Date | null, yesterday: boolean } = {
    categories: [],
    items: [],
    fromDate: null,
    endDate: null,
    yesterday: false
  }

  filterModals = {
    category: false,
    items: false,
    fromDate: false,
    endDate: false
  }

  filteredEntriesPagination: Signal<PaginationModel> = computed(() => this._expenseDataServ.filteredEntriesPagination());
  filteredEntries: Signal<ExpenseEntryModel[]> = computed(() => this._expenseDataServ.filteredEntries());
  fetchEntries$: Subscription | null = null;

  editExpenseDrawerOpen: Signal<boolean> = computed(() => this._expenseDataServ.showEditExpenseDrawer());
  editExpenseDrawerData: ExpenseEntryModel | null = null;

  expenseFilterApplied: Signal<boolean> = computed(() => this._expenseDataServ.expenseFilterApplied());

  constructor() {
  }

  ngOnInit(): void {
    this.setFilters();
    this.fetchEntries$ = this._expenseApiServ.fetchExpenseEntries
      .subscribe({
        next: (fetchData: boolean) => {
          if (fetchData && this._userId) {
            this.getAllUserExpenseEntries(this._userId, this.entriesPagination().currentPage, this.entriesPagination().pageSize);
          }
        }
      });
  }

  ngOnDestroy(): void {
    if (this.fetchEntries$ instanceof Subscription) this.fetchEntries$.unsubscribe();
  }

  setFilters(): void {
    this.filters.categories = [...this.expenseDataServFilters().categories()];
    this.filters.items = [...this.expenseDataServFilters().items()];
    this.filters.fromDate = this.expenseDataServFilters().fromDate();
    this.filters.endDate = this.expenseDataServFilters().endDate();
  }

  isCategorySelected(categoryId: string): boolean {
    var categoryExist = this.filters.categories.find(id => id === categoryId);
    if (categoryExist) return true;
    return false;
  }

  addCategoryToFilterList(categoryId: string): void {
    if (this.isCategorySelected(categoryId)) {
      return;
    }
    this.filters.categories.push(categoryId);
  }

  removeCategoryFromFilterList(categoryId: string): void {
    this.filters.categories = this.filters.categories.filter(id => id !== categoryId);
  }

  openFilterModal(modalName: string): void {
    switch (modalName) {
      case 'category':
        this.filters.categories = [...this.expenseDataServFilters().categories()];
        this.filterModals.category = true;
        break;
      case 'items':
        this.filters.items = [...this.expenseDataServFilters().items()];
        this.filterModals.items = true;
        break;
      case 'fromDate':
        this.filters.fromDate = this.expenseDataServFilters().fromDate();
        this.filterModals.fromDate = true;
        break;
      case 'endDate':
        this.filters.endDate = this.expenseDataServFilters().endDate();
        this.filterModals.endDate = true;
        break;
    }
  }

  closeFilterModal(modalName: string): void {
    switch (modalName) {
      case 'category':
        this.filters.categories = [];
        this.filterModals.category = false;
        break;
      case 'items':
        this.filters.items = [];
        this.filterModals.items = false;
        break;
      case 'fromDate':
        this.filters.fromDate = null;
        this.filterModals.fromDate = false;
        break;
      case 'endDate':
        this.filters.endDate = null;
        this.filterModals.endDate = false;
        break;
    }
  }

  isItemSelected(itemId: string): boolean {
    var itemExist = this.filters.items.find(id => id === itemId);
    if (itemExist) return true;
    return false;
  }

  addItemToFilteredList(itemId: string): void {
    if (this.isItemSelected(itemId)) {
      return;
    }
    this.filters.items.push(itemId);
  }

  removeItemFromFilteredList(itemId: string): void {
    this.filters.items = this.filters.items.filter((id) => id !== itemId);
  }

  showEditExpenseDrawer(data: ExpenseEntryModel): void {
    this._expenseDataServ.showEditExpenseDrawer.set(true);
    this._expenseDataServ.showAddExpenseDrawer.set(false);
    this.editExpenseDrawerData = { ...data };
  }

  removeAllFilters(): void {
    this._expenseDataServ.resetFilters();
    this._expenseDataServ.expenseFilterApplied.set(false);
  }

  applyCateogryFilter(): void {
    this.getFilteredEntries(this._userId, this.filteredEntriesPagination().currentPage, this.filteredEntriesPagination().pageSize, {
      categories: this.filters.categories,
      itemsList: this.expenseDataServFilters().items(),
      fromDate: this.expenseDataServFilters().fromDate(),
      endDate: this.expenseDataServFilters().endDate(),
      timePeriod: this.expenseDataServFilters().timePeriod()
    });
  }

  applyItemsFilter(): void {
    this.getFilteredEntries(this._userId, this.filteredEntriesPagination().currentPage, this.filteredEntriesPagination().pageSize, {
      categories: this.expenseDataServFilters().categories(),
      itemsList: this.filters.items,
      fromDate: this.expenseDataServFilters().fromDate(),
      endDate: this.expenseDataServFilters().endDate(),
      timePeriod: this.expenseDataServFilters().timePeriod()
    });
  }

  applyFromDateFilter(): void {
    this.getFilteredEntries(this._userId, this.filteredEntriesPagination().currentPage, this.filteredEntriesPagination().pageSize, {
      categories: this.expenseDataServFilters().categories(),
      itemsList: this.expenseDataServFilters().items(),
      fromDate: this.filters.fromDate,
      endDate: this.expenseDataServFilters().endDate(),
      timePeriod: null
    });
  }

  applyEndDateFilter(): void {
    this.getFilteredEntries(this._userId, this.filteredEntriesPagination().currentPage, this.filteredEntriesPagination().pageSize, {
      categories: this.expenseDataServFilters().categories(),
      itemsList: this.expenseDataServFilters().items(),
      fromDate: this.expenseDataServFilters().fromDate(),
      endDate: this.filters.endDate,
      timePeriod: null
    });
  }

  applyTimePeriodFilter(period: 'l2d' | 'yesterday' | 'today'): void {
    this.getFilteredEntries(this._userId, this.filteredEntriesPagination().currentPage, this.filteredEntriesPagination().pageSize, {
      categories: this.expenseDataServFilters().categories(),
      itemsList: this.expenseDataServFilters().items(),
      fromDate: this.expenseDataServFilters().fromDate(),
      endDate: this.expenseDataServFilters().endDate(),
      timePeriod: period
    });
  }

  loadExpenses(event: any, isFilteredPaginate: boolean = false): void {
    const pageSize = event.rows;
    const pageNumber = (event.first / pageSize);
    if (isFilteredPaginate) {
      if (pageNumber === this.entriesPagination().currentPage) return;
      this.getAllUserExpenseEntries(this._userId, pageNumber, pageSize);
    }
    else {
      if (pageNumber === this.filteredEntriesPagination().currentPage) return;
      this.getFilteredEntries(this._userId, pageNumber, pageSize, {
        categories: this.expenseDataServFilters().categories(),
        itemsList: this.expenseDataServFilters().items(),
        fromDate: this.expenseDataServFilters().fromDate(),
        endDate: this.expenseDataServFilters().endDate(),
        timePeriod: this.expenseDataServFilters().timePeriod()
      });
    }
  }

  // API FUNCTIONS
  getFilteredEntries(userId: string, pageNo: number, pageSize: number, data: FetchFilteredEntriesModel): void {
    this._loadingServ.loading.set(true);
    this._expenseApiServ.getFilteredUserEntries(data, userId, pageNo, pageSize)
      .pipe(take(1))
      .subscribe({
        next: (response: any) => {
          if (response.status === 200) {
            this._loadingServ.loading.set(false);
            this.filterModals.category = false;
            this.filterModals.items = false;
            this.filterModals.fromDate = false;
            this.filterModals.endDate = false;
          }
        },
        error: (error: HttpErrorResponse) => {
          if (error.status === 400) {
            this._messageService.add({ severity: 'error', summary: 'Error', detail: error.error.error });
          }
          this._loadingServ.loading.set(false);
        }
      });
  }

  getAllUserExpenseEntries(userId: string, pageNo: number, pageSize: number): void {
    this._loadingServ.loading.set(true);
    this._expenseApiServ.getAllUserExpenseEntries(userId, pageNo, pageSize)
      .pipe(take(1))
      .subscribe({
        next: (response: any) => {
          this._loadingServ.loading.set(false);
        },
        error: (error: HttpErrorResponse) => {
          if (error.status === 400) {
            this._messageService.add({ severity: 'error', summary: 'Error', detail: error.error.error });
          }
          this._loadingServ.loading.set(false);
        }
      });
  }
}