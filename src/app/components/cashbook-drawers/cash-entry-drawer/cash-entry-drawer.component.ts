import { CommonModule } from '@angular/common';
import { Component, computed, EventEmitter, inject, Input, Output, Renderer2, signal, Signal, ViewEncapsulation, WritableSignal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
// SERVICES IMPORT
import { LoadingService } from '../../../Services/loading.service';
import { MessageService } from 'primeng/api';
import { CashbookDataService } from '../../../Services/Cashbook/cashbook-data.service';
import { UserAccountService } from '../../../Services/account.service';
import { CashbookApiService } from '../../../Services/Cashbook/cashbook-api.service';
import { SupaBaseService } from '../../../Services/supabase.service';
// NG UI COMPONENTS PRIME IMPORTS
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { DrawerModule } from 'primeng/drawer';
import { ScrollPanelModule } from 'primeng/scrollpanel';
import { SelectModule } from 'primeng/select';
import { Chip } from 'primeng/chip';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { Toast } from 'primeng/toast';
// IMAGE VIEWER IMPORTS
import { Lightbox, LightboxConfig, LightboxModule } from 'ngx-lightbox';

@Component({
  selector: 'app-cash-entry-drawer',
  standalone: true,
  imports: [CommonModule, DrawerModule, ScrollPanelModule, DatePickerModule, ButtonModule, SelectModule, ReactiveFormsModule, Chip, InputGroupModule, InputGroupAddonModule, InputTextModule, TextareaModule, Toast, LightboxModule],
  templateUrl: './cash-entry-drawer.component.html',
  styleUrl: './cash-entry-drawer.component.scss',
  encapsulation: ViewEncapsulation.None,
  providers: [MessageService]
})
export class CashEntryDrawerComponent {
  private _formBuilder: FormBuilder = inject(FormBuilder);
  private _cashbookDataServ: CashbookDataService = inject(CashbookDataService);
  private _cashbookApiServ: CashbookApiService = inject(CashbookApiService);
  private _userAccountServ: UserAccountService = inject(UserAccountService);
  private _messageServ: MessageService = inject(MessageService);
  private _loadingServ: LoadingService = inject(LoadingService);
  private _supaBaseServ: SupaBaseService = inject(SupaBaseService);
  private _lightbox: Lightbox = inject(Lightbox);
  private _lightboxConfig: LightboxConfig = inject(LightboxConfig);
  private _renderer2: Renderer2 = inject(Renderer2);
  private readonly _userId: string = this._userAccountServ.userPayload()._id;
  readonly today = new Date();
  @Input('drawerType') drawerType: 'in' | 'out' | null = 'in';
  @Output('onDrawerTypeChange') onDrawerTypeChange: EventEmitter<'in' | 'out'> = new EventEmitter<'in' | 'out'>();
  cashEntryDrawer: Signal<boolean> = computed(() => this._cashbookDataServ.cashEntryDrawer());
  modeOptions: { label: string, value: string }[] = [
    { label: 'Online', value: 'online' },
    { label: 'Cash', value: 'cash' }
  ];
  uploadedFileUrl: WritableSignal<string | null> = signal(null);
  previewUploadedImage: boolean = false;

  entryForm: FormGroup;

  constructor() {
    this._lightboxConfig.resizeDuration = 1;
    this._lightboxConfig.fadeDuration = 0;
    this._lightboxConfig.enableTransition = false;
    this._lightboxConfig.showDownloadButton = true;
    this._lightboxConfig.disableScrolling = true;
    this._lightboxConfig.centerVertically = true;
    this._lightboxConfig.wrapAround = true;

    this.entryForm = this._formBuilder.group({
      date: [this.today, [Validators.required]],
      mode: ['online', [Validators.required]],
      amount: ['', [Validators.required, Validators.pattern(/^\d+(\.\d{0,2})?$/)]],
      description: [''],
      url: ['']
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
        this._supaBaseServ.uploadImage(file, file.name, 'cashbook')
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

  images = [
    { src: 'image1.jpg', caption: 'Image 1' },
    { src: 'image2.jpg', caption: 'Image 2' }
  ];

  openUploadedFilePreview(mediaUrl: string): void {
    this._lightbox.open([{ src: mediaUrl, caption: '', thumb: '' }], 0);
  }

  createCashbookEntry(): void {
    if (this.drawerType === null) {
      this._messageServ.add({ severity: 'error', summary: 'Error', detail: 'An error occured, Try again later' });
      return;
    }

    if (this.entryForm.invalid) {
      if (this.entryForm.get('date')?.hasError('required')) {
        this._messageServ.add({ severity: 'error', summary: 'Error', detail: 'Entry Date cannot be empty' });
        return;
      }

      if (this.entryForm.get('mode')?.hasError('required')) {
        this._messageServ.add({ severity: 'error', summary: 'Error', detail: 'Entry mode cannot be empty' });
        return;
      }

      if (this.entryForm.get('amount')?.hasError('required')) {
        this._messageServ.add({ severity: 'error', summary: 'Error', detail: 'Entry amount is a required field' });
        return;
      }

      if (this.entryForm.get('amount')?.hasError('pattern')) {
        this._messageServ.add({ severity: 'error', summary: 'Error', detail: 'Please enter valid entry amount' });
        return;
      }
      return;
    }

    this._loadingServ.loading.set(true);
    this.entryForm.patchValue({ url: this.uploadedFileUrl() || '' });
    const date = this.entryForm.get('date')?.value;
    const mode = this.entryForm.get('mode')?.value;
    const amount = this.entryForm.get('amount')?.value;
    const description = this.entryForm.get('description')?.value || '';
    const url = this.entryForm.get('url')?.value || '';

    this._cashbookApiServ.createEntry(date, this.drawerType, mode, amount, description, url, this._userId)
      .subscribe({
        next: (response: any) => {
          if (response.status === 201) {
            this._cashbookDataServ.cashIn.set(response.cashIn);
            this._cashbookDataServ.cashOut.set(response.cashOut);
            this.entryForm.reset();
            this.uploadedFileUrl.set(null);
            this._loadingServ.loading.set(false);
          }
        },
        error: (error: HttpErrorResponse) => {
          if (error.status === 400) {
            this._messageServ.add({ severity: 'error', summary: 'Error', detail: error?.error?.error });
          }
          this._loadingServ.loading.set(false);
        }
      });
  }

  closeDrawer(): void {
    this._cashbookDataServ.cashEntryDrawer.set(false);
  }
}