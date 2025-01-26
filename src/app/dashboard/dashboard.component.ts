import { CommonModule } from '@angular/common';
import { Component, computed, effect, HostListener, inject, OnInit, Signal, signal, ViewChild, ViewEncapsulation, WritableSignal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Router, RouterOutlet } from '@angular/router';
import { forkJoin, take } from 'rxjs';
// SERVICES IMPORT
import { UserAccountService } from '../Services/account.service';
import { ExpenseApiService } from '../Services/Expenses/expense-api.service';
import { ExpenseDataService } from '../Services/Expenses/expense-data.service';
import { LoadingService } from '../Services/loading.service';
import { CookieService } from 'ngx-cookie-service';
// NG UI COMPONENTS PRIME IMPORTS
import { DividerModule } from 'primeng/divider';
import { AvatarModule } from 'primeng/avatar';
import { MenuItem } from 'primeng/api';
import { Menu } from 'primeng/menu';
import { Ripple } from 'primeng/ripple';
import { Popover } from 'primeng/popover';
import { ButtonModule } from 'primeng/button';
import { BadgeModule } from 'primeng/badge';
import { PopoverModule } from 'primeng/popover';
import { OverlayBadgeModule } from 'primeng/overlaybadge';
import { DrawerModule } from 'primeng/drawer';
// APP COMPONENTS IMPORT
import { ProfileAvatarComponent } from '../components/profile-avatar/profile-avatar.component';
import { ProfilePopoverComponent } from '../components/profile-popover/profile-popover.component';
// MODELS IMPORT
import { UserModel } from '../Models/user.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterOutlet, AvatarModule, Menu, ButtonModule, OverlayBadgeModule, BadgeModule, PopoverModule, DividerModule, DrawerModule, Ripple, ProfilePopoverComponent, ProfileAvatarComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'], // ✅ FIXED: Correct property name
  encapsulation: ViewEncapsulation.None
})
export class DashboardComponent implements OnInit {

  @ViewChild('profilePopover') profilePopover!: Popover; // GET POPOVER ELEMENT FROM HTML
  private _router: Router = inject(Router);
  private _cookieServ: CookieService = inject(CookieService); // COOKIE SERVICE
  private _loadingServ: LoadingService = inject(LoadingService); // LOADING SERVICE
  private _userAccountServ: UserAccountService = inject(UserAccountService); // USER ACCOUNT SERVICE
  private _expenseApiServ: ExpenseApiService = inject(ExpenseApiService); // USER EXPENSES SERVICE
  private _expenseDataServ: ExpenseDataService = inject(ExpenseDataService); // USER EXPENSES SERVICE
  private readonly _userId: string | null = this._cookieServ.get('userId') || null; // GET USER ID

  isUserAuthorized: Signal<boolean> = computed(() => this._userAccountServ.isUserAuthorized());
  userPayload: Signal<UserModel> = computed(() => this._userAccountServ.userPayload()); // USER PAYLOAD FROM BACKEDN
  entriesPagination = computed(() => this._expenseDataServ.entriesPagination());

  // COMPONENT VARIABLES
  isSmallScreen: boolean = false;
  loading: boolean = false;
  mobileMenuItemDrawerOpen: boolean = false;
  selectedMenuItem: WritableSignal<{ name: string, icon: string }> = signal({ name: 'Expenses', icon: 'fa-solid fa-receipt' });
  menuitems: MenuItem[] = [
    { label: 'Expenses', icon: 'fa-solid fa-receipt', styleClass: '', command: () => this.onMenuItemClick('Expenses', 'fa-solid fa-receipt', 'expenses'), link: 'expenses' },
    { label: 'Cashbook', icon: 'fa-solid fa-wallet', styleClass: '', command: () => this.onMenuItemClick('Cashbook', 'fa-solid fa-wallet', 'cashbook'), link: 'cashbook' },
    { label: 'Recipients', icon: 'fa-solid fa-address-book', styleClass: '', command: () => this.onMenuItemClick('Recipients', 'fa-solid fa-address-book', 'recipients'), link: 'recipients' },
    { label: 'Reports', icon: 'fa-solid fa-square-poll-vertical', styleClass: '', command: () => this.onMenuItemClick('Reports', 'fa-solid fa-square-poll-vertical', 'reports'), link: 'reports' }
  ];

  constructor() {
    effect(() => {
      this.menuitems = this.menuitems.map(item => {
        if (item.label === this.selectedMenuItem().name) {
          item.styleClass = 'bg-[#1a3d32]';
        }
        else {
          item.styleClass = '';
        }
        return item;
      });
    });
  }

  ngOnInit(): void {
    // if (this.selectedMenuItem().name === 'Expenses') this._router.navigate([`dashboard/expenses`]);
    if (this.isUserAuthorized() && this.userPayload() && this._userId) {
      this.getAllUserData(this.userPayload()._id);
    }
    else if (!this.isUserAuthorized() && !this._userId) {
      this._userAccountServ.resetCredentials();
    }
    else if (!this.isUserAuthorized() && this._userId) {
      this._verifyUser(this._userId);
    }
  }

  // SET MOBILE MENU DRAW FOR SMALL SCREENS
  @HostListener('window:resize', ['$event'])
  onResize(event: Event): void {
    this.isSmallScreen = innerWidth < 992;
    if (!this.isSmallScreen) this.mobileMenuItemDrawerOpen = false;
  }

  // GET ALL USER DATA (EXPENSES CATEGORIES, ITEMS)
  getAllUserData(userId: string): void {
    this._loadingServ.loading.set(true);
    forkJoin({
      expenseEntries: this._expenseApiServ.getAllUserExpenseEntries(userId, this.entriesPagination().currentPage, this.entriesPagination().pageSize),
      expenseCategories: this._expenseApiServ.getAllUserExpenseCategories(userId),
      expenseItems: this._expenseApiServ.getAllUserExpenseItems(userId)
    }).pipe(take(1))
      .subscribe({
        next: (response: any) => {
          if (response.expenseEntries.status === 200 && response.expenseCategories.status === 200 && response.expenseItems.status === 200) {
            this._loadingServ.loading.set(false);
          }
        },
        error: (error: HttpErrorResponse) => {
          if (error.status === 401) {
            this._userAccountServ.resetCredentials();
            this._router.navigate(['/signin']);
          }
          this._loadingServ.loading.set(false);
        },
        complete: () => { this._loadingServ.loading.set(false); }
      });
  }

  showAddExpenseDrawer(): void {
    this._expenseDataServ.showAddExpenseDrawer.set(true);
    this._expenseDataServ.showEditExpenseDrawer.set(false);
  }

  onMenuItemClick(label: any, icon: any, link: string): void {
    this.selectedMenuItem.set({ name: label, icon });
    this.mobileMenuItemDrawerOpen = false;
    this._router.navigate([`dashboard/${link}`]);
  }

  toggleProfilePopover(event: any): void {
    this.profilePopover.toggle(event);
  }

  // API FUNCTIONS
  private _verifyUser(userId: string): void {
    this._loadingServ.loading.set(true);
    this._userAccountServ.verifyUser(userId)
      .subscribe({
        next: (response: any) => {
          if (response.status === 200) {
            this._cookieServ.set('userId', response.user._id);
            this._userAccountServ.userPayload.set(response.user);
            this._userAccountServ.isUserAuthorized.set(true);
            this._loadingServ.loading.set(false);
            this.getAllUserData(this.userPayload()._id);
          }
        },
        error: (error: HttpErrorResponse) => {
          this._userAccountServ.resetCredentials();
          this._loadingServ.loading.set(false);
        }
      });
  }

  // FUNCTION TO SIGN OUT USER
  signOut(): void {
    this._loadingServ.loading.set(true);
    this._userAccountServ.signOut()
      .subscribe({
        next: (response: any) => {
          if (response.status === 200) {
            this._userAccountServ.resetCredentials();
          }
          this._loadingServ.loading.set(false);
        },
        error: (error: HttpErrorResponse) => {
          this._loadingServ.loading.set(false);
        }
      });
  }
}