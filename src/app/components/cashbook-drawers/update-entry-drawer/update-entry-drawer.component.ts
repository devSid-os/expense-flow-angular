import { CommonModule } from '@angular/common';
import { Component, computed, EventEmitter, inject, Input, OnInit, Output, Renderer2, signal, Signal, WritableSignal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
// SERVICES IMPORT
import { CashbookDataService } from '../../../Services/Cashbook/cashbook-data.service';
import { MessageService } from 'primeng/api';
import { SupaBaseService } from '../../../Services/supabase.service';
import { LoadingService } from '../../../Services/loading.service';
import { UserAccountService } from '../../../Services/account.service';
import { CashbookApiService } from '../../../Services/Cashbook/cashbook-api.service';
// NG UI COMPONENTS PRIME IMPORTS
import { ButtonModule } from 'primeng/button';
import { Chip } from 'primeng/chip';
import { DatePickerModule } from 'primeng/datepicker';
import { DrawerModule } from 'primeng/drawer';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { InputTextModule } from 'primeng/inputtext';
import { ScrollPanelModule } from 'primeng/scrollpanel';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { Toast } from 'primeng/toast';
// MODELS IMPORT
import { CashbookModel } from '../../../Models/cashbook.model';
// IMAGE VIEWER IMPORT
import { Lightbox, LightboxConfig, LightboxModule } from 'ngx-lightbox';

@Component({
  selector: 'app-update-entry-drawer',
  imports: [CommonModule, DrawerModule, ScrollPanelModule, DatePickerModule, ButtonModule, SelectModule, ReactiveFormsModule, Chip, InputGroupModule, InputGroupAddonModule, InputTextModule, TextareaModule, Toast, LightboxModule],
  templateUrl: './update-entry-drawer.component.html',
  styleUrl: './update-entry-drawer.component.scss',
  providers: [MessageService]
})
export class UpdateEntryDrawerComponent implements OnInit {
  private _cashbookDataServ: CashbookDataService = inject(CashbookDataService);
  private _formBuilder: FormBuilder = inject(FormBuilder);
  private _supaBaseServ: SupaBaseService = inject(SupaBaseService);
  private _lightbox: Lightbox = inject(Lightbox);
  private _lightboxConfig: LightboxConfig = inject(LightboxConfig);
  private _renderer2: Renderer2 = inject(Renderer2);
  private _loadingServ: LoadingService = inject(LoadingService);
  private _messageServ: MessageService = inject(MessageService);
  private _userAccountServ: UserAccountService = inject(UserAccountService);
  private _cashbookApiServ: CashbookApiService = inject(CashbookApiService);
  private readonly _userId: string = this._userAccountServ.userPayload()._id;
  @Input('entryData') entryData!: CashbookModel;
  @Output('onCloseDrawer') onCloseDrawer: EventEmitter<boolean> = new EventEmitter<boolean>();
  @Output('onSuccessfullUpdate') onSuccessfullUpdate: EventEmitter<CashbookModel> = new EventEmitter<CashbookModel>();
  uploadedFileUrl: WritableSignal<string | null> = signal(null);
  entryForm: FormGroup;
  updateCashEntryDrawer: Signal<boolean> = computed(() => this._cashbookDataServ.updateCashEntryDrawer());
  modeOptions: { label: string, value: string }[] = [
    { label: 'Online', value: 'online' },
    { label: 'Cash', value: 'cash' }
  ];

  constructor() {
    this.entryForm = this._formBuilder.group({
      entryId: ['', [Validators.required]],
      type: ['', [Validators.required]],
      mode: ['', [Validators.required]],
      date: ['', [Validators.required]],
      amount: ['', [Validators.required]],
      remark: [''],
      url: ['']
    })
  }

  ngOnInit(): void {
    this._lightboxConfig.resizeDuration = 1;
    this._lightboxConfig.fadeDuration = 0;
    this._lightboxConfig.enableTransition = false;
    this._lightboxConfig.showDownloadButton = true;
    this._lightboxConfig.disableScrolling = true;
    this._lightboxConfig.centerVertically = true;
    this._lightboxConfig.wrapAround = true;
    this.entryForm.patchValue({
      entryId: this.entryData._id,
      type: this.entryData.type,
      mode: this.entryData.mode,
      date: new Date(this.entryData.date),
      amount: this.entryData.amount,
      remark: this.entryData.remark || ''
    });
    this.uploadedFileUrl.set(this.entryData.attachment || null);
  }

  openUploadedFilePreview(mediaUrl: string): void {
    this._lightbox.open([{ src: mediaUrl, caption: '', thumb: '' }], 0);
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

  getDrawerType(): 'in' | 'out' {
    return this.entryForm.get('type')?.value;
  }

  updateDrawerType(value: 'in' | 'out'): void {
    this.entryForm.patchValue({
      type: value
    });
  }

  closeDrawer(): void {
    this.onCloseDrawer.emit(true);
  }

  updateCashEntry(): void {
    if (this.entryForm.invalid) {
      if (this.entryForm.get('entryId')?.hasError('required')) {
        this._messageServ.add({ severity: 'error', summary: 'Error', detail: 'Entry id cannot be empty' });
        return;
      }

      if (this.entryForm.get('type')?.hasError('required')) {
        this._messageServ.add({ severity: 'error', summary: 'Error', detail: 'Entry type cannot be empty' });
        return;
      }

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
    this._cashbookApiServ.updateEntry({
      entryId: this.entryForm.get('entryId')!.value,
      amount: this.entryForm.get('amount')!.value || 0,
      type: this.entryForm.get('type')!.value,
      mode: this.entryForm.get('mode')!.value,
      date: this.entryForm.get('date')!.value,
      remark: this.entryForm.get('remark')?.value || null,
      url: this.uploadedFileUrl() || undefined
    }, this._userId)
      .subscribe({
        next: (response: any) => {
          if (response.status === 200) {
            this._loadingServ.loading.set(false);
            this.onSuccessfullUpdate.emit(response.payload);
            this._cashbookDataServ.updateCashEntryDrawer.set(false);
            this._cashbookApiServ.reFetchEntries.next(true);
          }
        },
        error: (error: HttpErrorResponse) => {
          if (error.status === 400) {
            this._messageServ.add({ severity: 'error', summary: 'Error', detail: error.error.error });
          }
          this._loadingServ.loading.set(false);
        }
      })
  }
}