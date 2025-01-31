import { CommonModule } from '@angular/common';
import { Component, computed, effect, HostListener, inject, OnDestroy, OnInit, Signal, signal, ViewChild, ViewEncapsulation, WritableSignal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, forkJoin, Subscription, take } from 'rxjs';
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
import { CashbookApiService } from '../Services/Cashbook/cashbook-api.service';
import { CashbookDataService } from '../Services/Cashbook/cashbook-data.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterOutlet, AvatarModule, Menu, ButtonModule, OverlayBadgeModule, BadgeModule, PopoverModule, DividerModule, DrawerModule, Ripple, ProfilePopoverComponent, ProfileAvatarComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class DashboardComponent implements OnInit, OnDestroy {

  @ViewChild('profilePopover') profilePopover!: Popover;
  private _route: ActivatedRoute = inject(ActivatedRoute);
  private _router: Router = inject(Router);
  private _cookieServ: CookieService = inject(CookieService);
  private _loadingServ: LoadingService = inject(LoadingService);
  private _userAccountServ: UserAccountService = inject(UserAccountService);
  private _expenseApiServ: ExpenseApiService = inject(ExpenseApiService);
  private _expenseDataServ: ExpenseDataService = inject(ExpenseDataService);
  private _cashbookApiServ: CashbookApiService = inject(CashbookApiService);
  private _cashbookDataServ: CashbookDataService = inject(CashbookDataService);
  private _routerEvent$: Subscription | null = null;
  private readonly _userId: string | null = this._cookieServ.get('userId') || null;

  isUserAuthorized: Signal<boolean> = computed(() => this._userAccountServ.isUserAuthorized());
  userPayload: Signal<UserModel> = computed(() => this._userAccountServ.userPayload());
  private _entriesPagination = computed(() => this._expenseDataServ.entriesPagination());
  private _cashbookEntriesPagination = computed(() => this._cashbookDataServ.allCashbookEntries().pagination());


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
    this.updateCurrentRoute();
    this._routerEvent$ = this._router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        this.updateCurrentRoute();
      });
  }

  ngOnDestroy(): void {
    if (this._routerEvent$ instanceof Subscription) this._routerEvent$.unsubscribe();
  }

  private updateCurrentRoute(): void {
    const childRoute: string | undefined = this._route.firstChild?.snapshot.url.map(segment => segment.path).join('/');
    const currentRoute = childRoute || 'dashboard'; // Default to 'dashboard' if no child
    switch (currentRoute) {
      case 'cashbook':
        this.selectedMenuItem.set({ name: 'Cashbook', icon: 'fa-solid fa-wallet' });
        break;
      case 'expenses':
        this.selectedMenuItem.set({ name: 'Expenses', icon: 'fa-solid fa-receipt' });
        break;
      default:
        this._router.navigate(['dashboard/expenses']);
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
      expenseEntries: this._expenseApiServ.getAllUserExpenseEntries(userId, this._entriesPagination().currentPage, this._entriesPagination().pageSize),
      expenseCategories: this._expenseApiServ.getAllUserExpenseCategories(userId),
      expenseItems: this._expenseApiServ.getAllUserExpenseItems(userId),
      cashbookEntries: this._cashbookApiServ.getAllEntries(userId, this._cashbookEntriesPagination().currentPage, this._cashbookEntriesPagination().pageSize)
    }).pipe(take(1))
      .subscribe({
        next: (response: any) => {
          if (response.expenseEntries.status === 200 && response.expenseCategories.status === 200 && response.expenseItems.status === 200 && response.cashbookEntries.status === 200) {
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