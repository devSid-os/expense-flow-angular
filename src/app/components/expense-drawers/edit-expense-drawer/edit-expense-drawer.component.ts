import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, Input, OnInit, Renderer2, signal, Signal, ViewEncapsulation, WritableSignal } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { take } from 'rxjs';
// SERVICES IMPORT
import { UserAccountService } from '../../../Services/account.service';
import { ExpenseApiService } from '../../../Services/Expenses/expense-api.service';
import { ExpenseDataService } from '../../../Services/Expenses/expense-data.service';
import { SupaBaseService } from '../../../Services/supabase.service';
import { LoadingService } from '../../../Services/loading.service';
// NG UI COMPONENTS PRIME IMPORTS
import { MessageService } from 'primeng/api';
import { DrawerModule } from 'primeng/drawer';
import { ScrollPanelModule } from 'primeng/scrollpanel';
import { Select } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { Toast } from 'primeng/toast';
import { InputTextModule } from 'primeng/inputtext';
// APP COMPONENTS IMPORT
import { AddCategoryComponent } from '../add-category/add-category.component';
import { EditCategoryListComponent } from '../edit-category-list/edit-category-list.component';
import { EditCategoryFormComponent } from '../edit-category-form/edit-category-form.component';
import { FormImagePreviewComponent } from '../../form-image-preview/form-image-preview.component';
// MODELS IMPORT
import { ExpenseCategoryModel, ExpenseItemModel } from '../../../Models/expenses.model';
import { CashbookApiService } from '../../../Services/Cashbook/cashbook-api.service';
import { EntryModel } from '../../../Models/entry.model';

@Component({
  selector: 'app-edit-expense-drawer',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, DrawerModule, ScrollPanelModule, ButtonModule, DatePickerModule, Select, MessageModule, Toast, InputTextModule, AddCategoryComponent, EditCategoryListComponent, EditCategoryFormComponent, FormImagePreviewComponent],
  templateUrl: './edit-expense-drawer.component.html',
  styleUrl: './edit-expense-drawer.component.scss',
  providers: [MessageService],
  encapsulation: ViewEncapsulation.None,
})
export class EditExpenseDrawerComponent implements OnInit {

  @Input('expenseEntry') expenseEntry!: EntryModel;
  private _loadingServ: LoadingService = inject(LoadingService);
  private _expenseApiServ: ExpenseApiService = inject(ExpenseApiService);
  private _expenseDataServ: ExpenseDataService = inject(ExpenseDataService);
  private _formBuilder: FormBuilder = inject(FormBuilder);
  private _userAccountServ: UserAccountService = inject(UserAccountService);
  private _messageServ: MessageService = inject(MessageService);
  private _cashbookApiServ: CashbookApiService = inject(CashbookApiService);
  private _supaBaseServ: SupaBaseService = inject(SupaBaseService);
  private _renderer2: Renderer2 = inject(Renderer2);
  private readonly _userId: string = this._userAccountServ.userPayload()._id;

  loading: Signal<boolean> = computed(() => this._loadingServ.loading());
  categoriesOptions: Signal<ExpenseCategoryModel[]> = computed(() => this._expenseDataServ.categories());
  cartItemsArray: Signal<{ item: ExpenseItemModel, qty: number }[]> = this._expenseDataServ.editItemsCartArray;
  cartTotal: Signal<number> = this._expenseDataServ.editCartTotalAmount;

  isAddNewCategory: boolean = false;
  isEditCategory: boolean = false;
  editCategoryData: ExpenseCategoryModel | null = null;
  showEditCategoryDialog: boolean = false;
  modeOptions: { label: string, value: string }[] = [
    { label: 'Online', value: 'online' },
    { label: 'Cash', value: 'cash' },
  ];

  editEntryForm: FormGroup;
  uploadedFileUrl: WritableSignal<string | null> = signal(null);

  isDrawerOpen: Signal<boolean> = computed(() => this._expenseDataServ.showEditExpenseDrawer());
  today: Date = new Date();

  constructor() {
    this.editEntryForm = this._formBuilder.group({
      description: [''],
      date: [this.today, [Validators.required]],
      category: ['', [Validators.required]],
      items: [[], [Validators.required, this.nonEmptyArrayValidator()]],
      mode: ['', [Validators.required]],
      id: ['', [Validators.required]]
    });

    effect(() => {
      const cart = this.cartItemsArray().map(item => ({ item: item.item, qty: item.qty }));

      this.editEntryForm.patchValue({
        items: cart
      });
    });
  }

  ngOnInit(): void {
    const cart: { [itemId: string]: { item: ExpenseItemModel, qty: number } } = {};
    (this.expenseEntry?.items || []).forEach((element: { item: ExpenseItemModel, qty: number }) => {
      if (element.item._id) {
        return cart[element.item._id] = { ...element };
      }
      return null;
    });
    this._expenseDataServ.editItemsCart.set(cart);
    this.uploadedFileUrl.set(this.expenseEntry.attachment || null);
    const expenseDate = new Date(this.expenseEntry.date);
    this.editEntryForm.patchValue({
      date: expenseDate,
      category: this.expenseEntry.category,
      items: this.expenseEntry.items,
      description: this.expenseEntry?.remark || '',
      id: this.expenseEntry._id,
      mode: this.expenseEntry.mode
    });
  }

  nonEmptyArrayValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      return Array.isArray(control.value) && control.value.length > 0
        ? null
        : { emptyArray: true };
    };
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

  closeDrawer(): void {
    this._expenseDataServ.showAddExpenseDrawer.set(false);
    this._expenseDataServ.showEditExpenseDrawer.set(false);
    this._expenseDataServ.editItemsCart.set({});
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

  closeAddNewCategoryForm(): void {
    this.isAddNewCategory = false;
  }

  openExpenseItemsDrawer(): void {
    this._expenseDataServ.showExpenseItemsDrawer.set(true);
  }

  // FUNCTION TO CALCULATE THE TOTAL OF ITEM EX: (2 * RS.40)
  calculateItemsTotal(price: number, qty: number): number {
    return price * qty;
  }

  // API CALLS FUNCTIONS
  updateExpenseEntry(): void {
    if (this.editEntryForm.invalid) {
      if (this.editEntryForm.get('date')?.hasError('required')) {
        this._messageServ.add({ summary: 'Error', detail: 'Expense Date is a required field', severity: 'error' });
        return;
      }

      if (this.editEntryForm.get('category')?.hasError('required')) {
        this._messageServ.add({ summary: 'Error', detail: 'Expense Category is a required field', severity: 'error' });
        return;
      }
      if (this.editEntryForm.get('items')?.hasError('emptyArray')) {
        this._messageServ.add({ summary: 'Error', detail: 'Atleast Select 1 Expense Item to create an entry', severity: 'error' });
        return;
      }
      if (this.editEntryForm.get('mode')?.hasError('required')) {
        this._messageServ.add({ summary: 'Error', detail: 'Mode can only be of type online or cash', severity: 'error' });
        return;
      }
      this._messageServ.add({ summary: 'Error', detail: 'An error while adding expense entry!', severity: 'error' });
      return;
    }
    this._loadingServ.loading.set(true);
    const entryDate = this.editEntryForm.get('date')?.value;
    const entryCategory = this.editEntryForm.get('category')?.value;
    const entryItems = this.editEntryForm.get('items')?.value;
    const entryDescription = this.editEntryForm.get('description')?.value;
    const entryId = this.editEntryForm.get('id')?.value;
    const entryMode = this.editEntryForm.get('mode')?.value;
    this._expenseApiServ.updateUserExpenseEntry({
      entryId,
      description: entryDescription,
      date: entryDate,
      category: entryCategory,
      items: entryItems,
      mode: entryMode,
      attachment: this.uploadedFileUrl()
    }, this._userId)
      .pipe(
        take(1)
      )
      .subscribe({
        next: (response: any) => {
          if (response.status === 200) {
            this._expenseDataServ.showEditExpenseDrawer.set(false);
            this._expenseDataServ.showAddExpenseDrawer.set(false);
            this._expenseDataServ.showExpenseItemsDrawer.set(false);
            this._loadingServ.loading.set(false);
            this._expenseApiServ.fetchExpenseEntries.next(true);
            this._cashbookApiServ.reFetchEntries.next(true);
          }
        },
        error: (error: HttpErrorResponse) => {
          if (error.status === 400) this._messageServ.add({ severity: 'error', summary: 'Error', detail: error.error.error });
          this._loadingServ.loading.set(false);
        }
      })
  }
}