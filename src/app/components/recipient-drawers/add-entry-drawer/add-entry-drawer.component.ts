import { CommonModule } from '@angular/common';
import { Component, computed, EventEmitter, inject, OnInit, Output, Renderer2, signal, Signal, ViewEncapsulation, WritableSignal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { DatePickerModule } from 'primeng/datepicker';
import { DrawerModule } from 'primeng/drawer';
import { InputTextModule } from 'primeng/inputtext';
import { ScrollPanelModule } from 'primeng/scrollpanel';
import { SelectModule } from 'primeng/select';
import { Toast } from 'primeng/toast';
import { RecipientDataService } from '../../../Services/Recipients/recipient-data.service';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { MessageModule } from 'primeng/message';
import { TextareaModule } from 'primeng/textarea';
import { FormImagePreviewComponent } from '../../form-image-preview/form-image-preview.component';
import { SupaBaseService } from '../../../Services/supabase.service';
import { HttpErrorResponse } from '@angular/common/http';
import { LoadingService } from '../../../Services/loading.service';
import { RecipientApiService } from '../../../Services/Recipients/recipient-api.service';
import { UserAccountService } from '../../../Services/account.service';
import { take } from 'rxjs';
import { CashbookApiService } from '../../../Services/Cashbook/cashbook-api.service';

@Component({
  selector: 'app-add-entry-drawer',
  imports: [DrawerModule, ScrollPanelModule, CommonModule, Toast, ReactiveFormsModule, InputTextModule, DatePickerModule, SelectModule, InputGroupModule, InputGroupAddonModule, MessageModule, TextareaModule, FormImagePreviewComponent],
  templateUrl: './add-entry-drawer.component.html',
  styleUrl: './add-entry-drawer.component.scss',
  encapsulation: ViewEncapsulation.Emulated,
  providers: [MessageService]
})
export class AddEntryDrawerComponent implements OnInit {
  private _formBuilder: FormBuilder = inject(FormBuilder);
  private _messageServ: MessageService = inject(MessageService);
  private _loadingService: LoadingService = inject(LoadingService);
  private _recipientDataServ: RecipientDataService = inject(RecipientDataService);
  private _recipientApiServ: RecipientApiService = inject(RecipientApiService);
  private _cashbookApiServ: CashbookApiService = inject(CashbookApiService);
  private _supaBaseServ: SupaBaseService = inject(SupaBaseService);
  private _userAccountServ: UserAccountService = inject(UserAccountService);
  private _renderer2: Renderer2 = inject(Renderer2);
  readonly today: Date = new Date();
  private readonly _userId: Signal<string> = computed(() => this._userAccountServ.userPayload()._id);
  addEntryDrawer: Signal<{
    open: Signal<boolean>;
    type: Signal<'in' | 'out'>;
    recipient: Signal<null | string>;
  }> = computed(() => this._recipientDataServ.addEntryDrawer());
  @Output('onCloseDrawer') onCloseDrawer: EventEmitter<false> = new EventEmitter<false>();
  modeOptions: { label: string, value: string }[] = [
    { label: 'Online', value: 'online' },
    { label: 'Cash', value: 'cash' }
  ];

  addEntry: FormGroup;
  uploadedFileUrl: WritableSignal<string | null> = signal(null);
  constructor() {
    this.addEntry = this._formBuilder.group({
      amount: ['', [Validators.required, Validators.pattern(/^\d+(\.\d{0,2})?$/)]],
      date: ['', [Validators.required]],
      mode: ['cash', [Validators.required]],
      remark: ['']
    });
  }

  ngOnInit(): void {
    this.addEntry.patchValue({
      date: this.today
    })
  }

  addRecipientEntry(): void {

    if (!this.addEntryDrawer().recipient()) {
      this._messageServ.add({ severity: 'error', summary: 'Error', detail: 'Recipient Id cannot be empty' });
      return;
    }

    if (this.addEntryDrawer().type() !== 'in' && this.addEntryDrawer().type() !== 'out') {
      this._messageServ.add({ severity: 'error', summary: 'Error', detail: 'Entry type must be of type in or out only' });
      return;
    }

    if (this.addEntry.invalid) {

      if (this.addEntry.get('amount')?.hasError('required')) {
        this._messageServ.add({ severity: 'error', summary: 'Error', detail: 'Entry amount cannot be empty' });
        return;
      }
      if (this.addEntry.get('amount')?.hasError('pattern')) {
        this._messageServ.add({ severity: 'error', summary: 'Error', detail: 'Enter a valid entry amount' });
        return;
      }
      if (this.addEntry.get('mode')?.hasError('required')) {
        this._messageServ.add({ severity: 'error', summary: 'Error', detail: 'mode must be of type cash or online' });
        return;
      }
      if (this.addEntry.get('date')?.hasError('required')) {
        this._messageServ.add({ severity: 'error', summary: 'Error', detail: 'Entry date cannot be empty' });
        return;
      }

      return;
    }

    this._loadingService.loading.set(true);
    this._recipientApiServ.createRecipientEntry({
      amount: this.addEntry.get('amount')?.value,
      date: this.addEntry.get('date')?.value,
      mode: this.addEntry.get('mode')?.value,
      type: this.addEntryDrawer().type(),
      recipientId: this.addEntryDrawer().recipient()!,
      attachment: this.uploadedFileUrl() || undefined,
      remark: this.addEntry.get('remark')?.value,
    }, this._userId())
      .pipe(take(1))
      .subscribe({
        next: (response: any) => {
          if (response.status === 201) {
            this._messageServ.add({ severity: 'success', summary: 'Success', detail: 'Recipient Entry added successfully' });
            this._loadingService.loading.set(false);
            this.addEntry.reset();
            this.onCloseDrawer.emit(false);
            this._recipientApiServ.refetchRecipients.next(true);
            this._cashbookApiServ.reFetchEntries.next(true);
          }
        },
        error: (error: HttpErrorResponse) => {
          this._loadingService.loading.set(false);
        }
      })
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


}
