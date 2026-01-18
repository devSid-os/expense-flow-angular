import { CommonModule } from '@angular/common';
import { Component, EventEmitter, inject, Input, OnInit, Output, Renderer2, signal, ViewEncapsulation, WritableSignal } from '@angular/core';
import { MessageService } from 'primeng/api';
import { DrawerModule } from 'primeng/drawer';
import { ScrollPanelModule } from 'primeng/scrollpanel';
import { Toast } from 'primeng/toast';
import { RecipientApiService } from '../../../Services/Recipients/recipient-api.service';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { HttpErrorResponse } from '@angular/common/http';
import { SupaBaseService } from '../../../Services/supabase.service';
import { CreateRecipientModel } from '../../../Models/recipient.model';
import { UserAccountService } from '../../../Services/account.service';
import { take } from 'rxjs';
import { LoadingService } from '../../../Services/loading.service';
import { RecipientAvatarComponent } from '../../recipient-avatar/recipient-avatar.component';

@Component({
  selector: 'app-add-recipient-drawer',
  imports: [CommonModule, DrawerModule, ScrollPanelModule, Toast, ReactiveFormsModule, InputTextModule,  MessageModule, RecipientAvatarComponent],
  templateUrl: './add-recipient-drawer.component.html',
  styleUrl: './add-recipient-drawer.component.scss',
  providers: [MessageService],
  encapsulation: ViewEncapsulation.None
})
export class AddRecipientDrawerComponent implements OnInit {
  @Input('openDrawer') openDrawer!: boolean;
  @Output('closeDrawer') closeDrawer: EventEmitter<false> = new EventEmitter<false>();
  private _recipientApiServ: RecipientApiService = inject(RecipientApiService);
  private _userAccountServ: UserAccountService = inject(UserAccountService);
  private _loadingServ: LoadingService = inject(LoadingService);
  private _messageServ: MessageService = inject(MessageService);
  private _formBuilder: FormBuilder = inject(FormBuilder);
  private _renderer2: Renderer2 = inject(Renderer2);
  private _supaBaseServ: SupaBaseService = inject(SupaBaseService);
  randomColor: string = '#FF5733';
  addRecipientForm: FormGroup;
  uploadedFileUrl: WritableSignal<string | null> = signal(null);

  constructor() {
    this.addRecipientForm = this._formBuilder.group({
      name: ['', [Validators.required]],
      number: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
      profileUrl: ['']
    });
  }

  ngOnInit(): void {
    this.randomColor = this.getRandomColor();
  }

  getRandomColor(): string {
    const avatarColors = ['#FF5733', '#3498DB', '#2ECC71', '#F1C40F', '#9B59B6', '#E74C3C', '#1ABC9C', '#34495E'];
    return avatarColors[Math.floor(Math.random() * avatarColors.length)];
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
        this._supaBaseServ.uploadImage(file, file.name, 'recipientProfiles')
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

  removeProfilePhoto(): void {
    this.uploadedFileUrl.set(null);
  }


  addNewRecipient(): void {
    if (this.addRecipientForm.invalid) {
      if (this.addRecipientForm.get('name')?.hasError('required')) {
        this._messageServ.add({ severity: 'error', summary: 'Error', detail: 'Recipient name cannot be empty' });
        return;
      }
      if (this.addRecipientForm.get('number')?.hasError('required')) {
        this._messageServ.add({ severity: 'error', summary: 'Error', detail: 'Recipient number cannot be empty' });
        return;
      }
      if (this.addRecipientForm.get('number')?.hasError('pattern')) {
        this._messageServ.add({ severity: 'error', summary: 'Error', detail: 'Please enter a valid recipient number.' });
        return;
      }
      return;
    }
    this._loadingServ.loading.set(true);
    const data: CreateRecipientModel = { name: this.addRecipientForm.get('name')!.value, number: this.addRecipientForm.get('number')!.value };
    if (this.uploadedFileUrl()) {
      data.profileUrl = this.uploadedFileUrl()!;
    }
    const userId = this._userAccountServ.userPayload()._id;
    this._recipientApiServ.createRecipient(data, userId)
      .pipe(take(1))
      .subscribe({
        next: (response: any) => {
          if (response.status === 201) {
            this.uploadedFileUrl.set(null);
            this._messageServ.add({ severity: 'success', summary: 'Recipient', detail: `${data.name} added as recipient successfully!` });
            this.addRecipientForm.reset();
            this._loadingServ.loading.set(false);
            this._recipientApiServ.refetchRecipients.next(true);
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
