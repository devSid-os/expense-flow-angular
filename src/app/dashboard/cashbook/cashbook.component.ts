import { Component, computed, effect, inject, OnInit, Signal } from '@angular/core';
import { CommonModule } from '@angular/common';
// SERVICES IMPORT
import { CashbookDataService } from '../../Services/Cashbook/cashbook-data.service';
import { UserAccountService } from '../../Services/account.service';
// NG UI COMPONENTS PRIME IMPORTS
import { TableModule } from 'primeng/table';
// APP COMPONENTS IMPORT
import { CashEntryDrawerComponent } from '../../components/cashbook-drawers/cash-entry-drawer/cash-entry-drawer.component';

@Component({
  selector: 'app-cashbook',
  imports: [CommonModule, TableModule, CashEntryDrawerComponent],
  templateUrl: './cashbook.component.html',
  styleUrl: './cashbook.component.scss'
})
export class CashbookComponent implements OnInit {
  private _userAccountServ: UserAccountService = inject(UserAccountService);
  cashbookDataServ: CashbookDataService = inject(CashbookDataService);
  private readonly _userId: string = this._userAccountServ.userPayload()._id;

  cashIn: Signal<number> = computed(() => this.cashbookDataServ.cashIn());
  cashOut: Signal<number> = computed(() => this.cashbookDataServ.cashOut());

  dataServFilters: Signal<{
    duration: Signal<string>;
    type: Signal<'in' | 'out' | 'all'>;
    mode: Signal<'cash' | 'online' | 'all'>;
  }> = computed(() => this.cashbookDataServ.selectedFilters());

  filters: {
    type: 'all' | 'in' | 'out',
    mode: 'all' | 'cash' | 'online',
    duration: string
  } = {
      duration: 'all',
      type: 'all',
      mode: 'all'
    }

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
      if (this.cashbookDataServ.cashEntryDrawer() === false) {
        this.drawerType = null;
      }
    })
  }

  ngOnInit(): void {
    this.filters.duration = this.dataServFilters().duration();
    this.filters.type = this.dataServFilters().type();
    this.filters.mode = this.dataServFilters().mode();
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
    this.cashbookDataServ.cashEntryDrawer.set(true);
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


}
