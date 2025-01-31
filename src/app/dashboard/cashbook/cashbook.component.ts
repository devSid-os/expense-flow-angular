import { Component, computed, effect, inject, OnDestroy, OnInit, Signal } from '@angular/core';
import { CommonModule } from '@angular/common';
// SERVICES IMPORT
import { CashbookDataService } from '../../Services/Cashbook/cashbook-data.service';
import { UserAccountService } from '../../Services/account.service';
// NG UI COMPONENTS PRIME IMPORTS
// APP COMPONENTS IMPORT
import { CashEntryDrawerComponent } from '../../components/cashbook-drawers/cash-entry-drawer/cash-entry-drawer.component';
import { EntriesTableComponent } from './entries-table/entries-table.component';
// MODELS IMPORT
import { CashbookModel } from '../../Models/cashbook.model';
import { CashbookApiService } from '../../Services/Cashbook/cashbook-api.service';
import { Subscription, take } from 'rxjs';
import { response } from 'express';
import { HttpErrorResponse } from '@angular/common/http';
import { LoadingService } from '../../Services/loading.service';
import { PaginationModel } from '../../Models/pagination.model';

@Component({
  selector: 'app-cashbook',
  imports: [CommonModule, CashEntryDrawerComponent, EntriesTableComponent],
  templateUrl: './cashbook.component.html',
  styleUrl: './cashbook.component.scss'
})
export class CashbookComponent implements OnInit, OnDestroy {
  private _userAccountServ: UserAccountService = inject(UserAccountService);
  private _cashbookDataServ: CashbookDataService = inject(CashbookDataService);
  private _cashbookApiServ: CashbookApiService = inject(CashbookApiService);
  private _loadingServ: LoadingService = inject(LoadingService);
  private readonly _userId: string = this._userAccountServ.userPayload()._id;

  reFetchEntries$: Subscription | null = null;
  cashStats: Signal<{
    cashIn: Signal<number>;
    cashOut: Signal<number>;
  }> = computed(() => this._cashbookDataServ.userCashStats());

  dataServFilters: Signal<{
    duration: Signal<string>;
    type: Signal<'in' | 'out' | 'all'>;
    mode: Signal<'cash' | 'online' | 'all'>;
  }> = computed(() => this._cashbookDataServ.selectedFilters());
  filters: {
    type: 'all' | 'in' | 'out',
    mode: 'all' | 'cash' | 'online',
    duration: string
  } = {
      duration: 'all',
      type: 'all',
      mode: 'all'
    }

  allCashBookEntries: Signal<{
    data: Signal<CashbookModel[]>;
    pagination: Signal<PaginationModel>;
  }> = computed(() => this._cashbookDataServ.allCashbookEntries());


  drawerType: 'out' | 'in' | null = null;

  menus: { duration: boolean, type: boolean, mode: boolean } = {
    duration: false,
    type: false,
    mode: false
  }

  menuItems: {
    duration: { label: string, value: string }[],
    type: { label: 'All' | 'Cash In' | 'Cash Out', value: 'all' | 'in' | 'out' }[],
    mode: { label: 'All' | 'Cash' | 'Online', value: 'all' | 'cash' | 'online' }[]
  } = {
      duration: [
        { label: 'All', value: 'all' },
        { label: 'Today', value: 'today' },
        { label: 'Yesterday', value: 'yesterday' },
        { label: 'This Month', value: 'this_month' },
        { label: 'Last Month', value: 'last_month' },
      ],
      type: [
        { label: 'All', value: 'all' },
        { label: 'Cash In', value: 'in' },
        { label: 'Cash Out', value: 'out' }
      ],
      mode: [
        { label: 'All', value: 'all' },
        { label: 'Cash', value: 'cash' },
        { label: 'Online', value: 'online' }
      ]
    }


  constructor() {
    effect(() => {
      if (this._cashbookDataServ.cashEntryDrawer() === false) {
        this.drawerType = null;
      }
    })
  }

  ngOnInit(): void {
    this.filters.duration = this.dataServFilters().duration();
    this.filters.type = this.dataServFilters().type();
    this.filters.mode = this.dataServFilters().mode();
    this.reFetchEntries$ = this._cashbookApiServ.reFetchEntries.subscribe({
      next: (value: boolean) => {
        if (value) {
          this.fetchAllCashBookEntries(this._userId, this.allCashBookEntries().pagination().currentPage, this.allCashBookEntries().pagination().pageSize);
        }
      }
    });
  }

  ngOnDestroy(): void {
    if (this.reFetchEntries$ instanceof Subscription) this.reFetchEntries$.unsubscribe();
  }

  toggleMenus(menuName: string, open: boolean): void {
    switch (menuName) {
      case 'duration':
        this.filters.duration = this.dataServFilters().duration();
        this.menus.duration = !this.menus.duration;
        this.menus.type = false;
        this.menus.mode = false;
        break;
      case 'type':
        this.filters.type = this.dataServFilters().type();
        this.menus.type = !this.menus.type;
        this.menus.duration = false;
        this.menus.mode = false;
        break;
      case 'mode':
        this.filters.mode = this.dataServFilters().mode();
        this.menus.mode = !this.menus.mode;
        this.menus.duration = false;
        this.menus.type = false;
        break;
    }
  }

  setDrawerType(type: 'in' | 'out'): void {
    this.drawerType = type;
  }

  openCashEntryDrawer(type: 'in' | 'out'): void {
    this.setDrawerType(type);
    this._cashbookDataServ.cashEntryDrawer.set(true);
  }

  setMode(value: 'all' | 'cash' | 'online'): void {
    this.filters.mode = value;
  }

  setType(value: 'in' | 'out' | 'all'): void {
    this.filters.type = value;
  }

  setDuration(value: string): void {
    this.filters.duration = value;
  }

  getModeName(value: 'all' | 'cash' | 'online'): string {
    switch (value) {
      case 'all':
        return 'All'
      case 'cash':
        return 'Cash'
      case 'online':
        return 'Online'
    }
  }

  getTypeName(value: 'in' | 'out' | 'all'): string {
    switch (value) {
      case 'all':
        return 'All';
      case 'out':
        return 'Cash Out';
      case 'in':
        return 'Cash In';
    }
  }

  getDurationName(value: string): string {
    switch (value) {
      case 'all':
        return 'All'
      case 'today':
        return 'Today'
      case 'yesterday':
        return 'Yesterday'
      case 'this_month':
        return 'This Month'
      case 'last_month':
        return 'Last Month'
    }
    return ''
  }

  closeAllMenus(): void {
    Object.keys(this.menus).forEach((menu) => {
      this.menus[menu as keyof typeof this.menus] = false;
    });
  }

  onTabelPageChange(event: any, isFilteredPaginate: boolean = false): void {
    console.log(event);
    const pageSize = event.rows;
    const pageNumber = (event.first / pageSize);
    if (pageNumber === this.allCashBookEntries().pagination().currentPage) return;
    this.fetchAllCashBookEntries(this._userId, pageNumber, pageSize);
  }

  // API CALL FUNCTIONS
  fetchAllCashBookEntries(userId: string, page: number, pageSize: number): void {
    this._loadingServ.loading.set(true);
    this._cashbookApiServ.getAllEntries(userId, page, pageSize)
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