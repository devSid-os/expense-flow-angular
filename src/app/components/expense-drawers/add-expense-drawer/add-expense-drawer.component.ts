import { Component, computed, effect, inject, Renderer2, signal, Signal, ViewEncapsulation, WritableSignal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { take } from 'rxjs';
// SERVICES IMPORT
import { UserAccountService } from '../../../Services/account.service';
import { ExpenseApiService } from '../../../Services/Expenses/expense-api.service';
import { SupaBaseService } from '../../../Services/supabase.service';
import { ExpenseDataService } from '../../../Services/Expenses/expense-data.service';
import { LoadingService } from '../../../Services/loading.service';
import { MessageService } from 'primeng/api';
// NG UI COMPONENTS PRIME IMPORTS
import { AutoComplete, AutoCompleteCompleteEvent } from 'primeng/autocomplete';
import { DrawerModule } from 'primeng/drawer';
import { DatePickerModule } from 'primeng/datepicker';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { Select } from 'primeng/select';
import { MessageModule } from 'primeng/message';
import { ScrollPanelModule } from 'primeng/scrollpanel';
import { Toast } from 'primeng/toast';
// APP COMPONENTS IMPORT
import { AddCategoryComponent } from '../add-category/add-category.component';
import { EditCategoryListComponent } from '../edit-category-list/edit-category-list.component';
import { EditCategoryFormComponent } from '../edit-category-form/edit-category-form.component';
import { FormImagePreviewComponent } from '../../form-image-preview/form-image-preview.component';
// MODELS IMPORT
import { ExpenseCategoryModel, ExpenseItemModel } from '../../../Models/expenses.model';
import { CashbookApiService } from '../../../Services/Cashbook/cashbook-api.service';
import { RecipientApiService } from '../../../Services/Recipients/recipient-api.service';
import { RecipientModel } from '../../../Models/recipient.model';
import { extractErrorMessage } from '../../../utils/helper';

@Component({
  selector: 'app-add-expense-drawer',
  imports: [CommonModule, ReactiveFormsModule, FormsModule, DrawerModule, DatePickerModule, InputTextModule, ButtonModule, RippleModule, Select, MessageModule, ScrollPanelModule, Toast, AddCategoryComponent, EditCategoryListComponent, EditCategoryFormComponent, FormImagePreviewComponent, AutoComplete],
  templateUrl: './add-expense-drawer.component.html',
  styleUrl: './add-expense-drawer.component.scss',
  encapsulation: ViewEncapsulation.None,
  standalone: true,
  providers: [MessageService]
})
export class AddExpenseDrawerComponent {
  private _loadingServ: LoadingService = inject(LoadingService);
  private _expenseApiServ: ExpenseApiService = inject(ExpenseApiService);
  private _expenseDataServ: ExpenseDataService = inject(ExpenseDataService);
  private _formBuilder: FormBuilder = inject(FormBuilder);
  private _userAccountServ: UserAccountService = inject(UserAccountService);
  private _messageServ: MessageService = inject(MessageService);
  private _supaBaseServ: SupaBaseService = inject(SupaBaseService);
  private _cashbookApiServ: CashbookApiService = inject(CashbookApiService);
  private _recipientApiServ: RecipientApiService = inject(RecipientApiService);
  private _renderer2: Renderer2 = inject(Renderer2);
  private readonly _userId: string = this._userAccountServ.userPayload()._id;

  loading: Signal<boolean> = computed(() => this._loadingServ.loading());
  categoriesOptions: Signal<ExpenseCategoryModel[]> = computed(() => this._expenseDataServ.categories());
  cartItemsArray: Signal<{ item: ExpenseItemModel, qty: number }[]> = this._expenseDataServ.itemsCartArray;
  cartTotal: Signal<number> = this._expenseDataServ.cartTotalAmount;

  isAddNewCategory: boolean = false;
  isEditCategory: boolean = false;
  editCategoryData: ExpenseCategoryModel | null = null;
  showEditCategoryDialog: boolean = false;
  showCashbookFields: boolean = false;
  modeOptions: { label: string, value: string }[] = [
    { label: 'Online', value: 'online' },
    { label: 'Cash', value: 'cash' },
  ];
  uploadedFileUrl: WritableSignal<string | null> = signal(null);

  entryForm: FormGroup;

  recipientSearchLoading: boolean = false;
  recipients: RecipientModel[] = new Array();
  selectedRecipient: string | null = null; // RECIPIENT ID NOT WHOLE data

  isDrawerOpen: Signal<boolean> = computed(() => this._expenseDataServ.showAddExpenseDrawer());
  today: Date = new Date();

  constructor() {
    this.entryForm = this._formBuilder.group({
      description: [''],
      date: [this.today, [Validators.required]],
      category: ['', [Validators.required]],
      items: [[], []],
      mode: ['', [Validators.required]]
    });

    effect(() => {
      const cart: {
        item: ExpenseItemModel;
        qty: number;
      }[] = this.cartItemsArray().map(item => ({ item: item.item, qty: item.qty }));

      this.entryForm.patchValue({
        items: cart
      });
    });
  }

  onUploadFileClick(): void {
    const fileInputEl = this._renderer2.createElement('input');
    this._renderer2.setAttribute(fileInputEl, 'type', 'file');

    fileInputEl.click();

    fileInputEl.addEventListener('change', (event: Event) => {
      const target = event.target as HTMLInputElement;
      if (target && target.files && target.files.length > 0) {
        const file = target.files[0];
        const allowedFileSize = 5 * 1024 * 1024; // 5MB
        if (file.size > allowedFileSize) {
          this._messageServ.add({ severity: 'error', summary: 'Error', detail: 'File size cannot be greater than 5MB' });
          return;
        }
        const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
        if (!allowedTypes.includes(file.type)) {
          this._messageServ.add({ severity: 'error', summary: 'Error', detail: 'Only images are allowed.' });
          return;
        }
        this.uploadedFileUrl.set(null);
        this._supaBaseServ.uploadImage(file, file.name, 'expense')
          .then((response: any) => {
            this.uploadedFileUrl.set(response.url);
          })
          .catch((error: HttpErrorResponse) => {
            this.uploadedFileUrl.set(null);
            console.log(error)
          });
      }
    });
  }

  removeMediaUrl(): void {
    // this._supaBaseServ.deleteFileFromUrl(this.uploadedFileUrl() as string, 'cashbook')
    //   .then((response:any) => {
    //     // console.log(response)
    //   })
    //   .catch((error:any) => {
    //     console.log(error)
    //   });
    this.uploadedFileUrl.set(null);
  }

  closeDrawer(): void {
    this._expenseDataServ.showAddExpenseDrawer.set(false);
    this._expenseDataServ.showEditExpenseDrawer.set(false);
  }

  showEditCategoryModal(category: ExpenseCategoryModel): void {
    this.editCategoryData = category;
    this.showEditCategoryDialog = true;
  }

  closeEditCategoryModal(): void {
    this.editCategoryData = null;
    this.showEditCategoryDialog = false;
  }

  showAddNewCategoryForm(): void {
    this.isAddNewCategory = true;
  }

  openExpenseItemsDrawer(): void {
    this._expenseDataServ.showExpenseItemsDrawer.set(true);
  }

  // FUNCTION TO CALCULATE THE TOTAL OF ITEM EX: (2 * RS.40)
  calculateItemsTotal(price: number, qty: number): number {
    return price * qty;
  }

  // API CALLS FUNCTIONS
  createExpenseEntry(): void {
    const entryItems = this.entryForm.get('items')?.value || [];
    console.log('selected recipient', this.selectedRecipient);

    if (this.entryForm.invalid) {
      if (this.entryForm.get('date')?.hasError('required')) {
        this._messageServ.add({ summary: 'Error', detail: 'Expense Date is a required field', severity: 'error' });
        return;
      }

      if (this.entryForm.get('category')?.hasError('required')) {
        this._messageServ.add({ summary: 'Error', detail: 'Expense Category is a required field', severity: 'error' });
        return;
      }

      if (this.selectedRecipient === null) {
        if (entryItems.length < 0) {
          this._messageServ.add({ summary: 'Error', detail: 'Atleast Select 1 Expense Item to create an entry', severity: 'error' });
          return;
        }
      }

      if (this.entryForm.get('mode')?.hasError('required')) {
        this._messageServ.add({ summary: 'Error', detail: 'Mode can only be of type online or cash', severity: 'error' });
        return;
      }
      this._messageServ.add({ summary: 'Error', detail: 'An error while adding expense entry!', severity: 'error' });
      return;
    }
    this._loadingServ.loading.set(true);
    const entryDate = this.entryForm.get('date')?.value;
    const entryCategory = this.entryForm.get('category')?.value;
    // const entryItems = this.entryForm.get('items')?.value;
    const entryDescription = this.entryForm.get('description')?.value;
    const mode = this.entryForm.get('mode')?.value;
    this._expenseApiServ.createExpenseEntry({
      date: entryDate,
      category: entryCategory,
      items: entryItems,
      description: entryDescription,
      mode,
      attachment: this.uploadedFileUrl(),
      recipient: this.selectedRecipient || null
    }, this._userId)
      .pipe(take(1))
      .subscribe({
        next: (response: any) => {
          if (response.status !== 201) {
            const message = extractErrorMessage(response);
            this._messageServ.add({ summary: 'Error', detail: message, severity: 'error' });
            return;
          }
          this.entryForm.reset();
          this.entryForm.patchValue({ date: this.today });
          this._messageServ.add({ severity: 'success', summary: 'Sucess', detail: 'Expense entry added successfully' });
          this._loadingServ.loading.set(false);
          this.uploadedFileUrl.set(null);
          this._expenseApiServ.fetchExpenseEntries.next(true);
          this._cashbookApiServ.reFetchEntries.next(true);
        },
        error: (error: HttpErrorResponse) => {
          const message = extractErrorMessage(error);
          this._messageServ.add({ summary: 'Error', detail: message, severity: 'error' });
          this._loadingServ.loading.set(false);
        }
      });
  }

  searchReipients(event: AutoCompleteCompleteEvent): void {
    const searchQuery = event.query;
    this.recipientSearchLoading = true;
    this._recipientApiServ.getFilteredRecipients(searchQuery, 0, 100, this._userId, false)
      .pipe(
        take(1)
      )
      .subscribe({
        next: (response: any) => {
          if (response.status === 200) {
            const recipientList = response?.payload?.[0]?.data || [];
            this.recipients = recipientList;
            this.recipientSearchLoading = false;
          }
        },
        error: (error: any) => {
          console.log('error: ', error);
          this.recipientSearchLoading = false;
        }
      })

  }
}