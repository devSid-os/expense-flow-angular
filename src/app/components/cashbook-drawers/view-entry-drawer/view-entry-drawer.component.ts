import { CommonModule } from '@angular/common';
import { take } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { LoadingService } from '../../../Services/loading.service';
import { UserAccountService } from '../../../Services/account.service';
import { CashbookApiService } from '../../../Services/Cashbook/cashbook-api.service';
import { ConfirmationService, MessageService } from 'primeng/api';
import { DrawerModule } from 'primeng/drawer';
import { ScrollPanelModule } from 'primeng/scrollpanel';
import { CashbookModel } from '../../../Models/cashbook.model';
import { Lightbox, LightboxConfig } from 'ngx-lightbox';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-view-entry-drawer',
  imports: [ScrollPanelModule, DrawerModule, CommonModule, ConfirmDialog, ButtonModule],
  templateUrl: './view-entry-drawer.component.html',
  styleUrl: './view-entry-drawer.component.scss',
  providers: [MessageService, ConfirmationService]
})
export class ViewEntryDrawerComponent {
  private _confirmationServ: ConfirmationService = inject(ConfirmationService);
  private _lightboxConfig: LightboxConfig = inject(LightboxConfig);
  private _lightbox: Lightbox = inject(Lightbox);
  private _loadingServ: LoadingService = inject(LoadingService);
  private _cashbookApiServ: CashbookApiService = inject(CashbookApiService);
  private _messageServ: MessageService = inject(MessageService);
  private _userAccountServ: UserAccountService = inject(UserAccountService);
  private readonly _userId: string = this._userAccountServ.userPayload()._id;
  @Input('isViewEntryDrawerOpen') isViewEntryDrawerOpen!: boolean;
  @Input('entryData') entryData!: CashbookModel;
  @Output('onCloseDrawer') onCloseDrawer: EventEmitter<false> = new EventEmitter<false>();

  constructor() {
    this._lightboxConfig.resizeDuration = 1;
    this._lightboxConfig.fadeDuration = 0;
    this._lightboxConfig.enableTransition = false;
    this._lightboxConfig.showDownloadButton = true;
    this._lightboxConfig.disableScrolling = true;
    this._lightboxConfig.centerVertically = true;
    this._lightboxConfig.wrapAround = true;
  }

  openAttachmentPreview(mediaUrl: string): void {
    this._lightbox.open([{ src: mediaUrl, caption: '', thumb: '' }], 0);
  }

  showDeleteEntryConfirmation(entryId: string): void {
    this._confirmationServ.confirm({
      header: `Delete Cashbook Entry`,
      message: `Are you sure, you want to delete this entry`,
      accept: () => {
        this.deleteCashbookEntry(entryId);
      },
      reject: () => {

      },
    });
  }

  deleteCashbookEntry(entryId: string): void {
    this._loadingServ.loading.set(true);
    this._cashbookApiServ.deleteEntry(entryId, this._userId)
      .pipe(take(1))
      .subscribe({
        next: (response: any) => {
          if (response.status === 200) {
            this._messageServ.add({ severity: 'success', summary: 'Success', detail: 'Cashbook Entry deleted successfully' });
            this._loadingServ.loading.set(false);
            this.onCloseDrawer.emit(!true);
            this._cashbookApiServ.reFetchEntries.next(true);
          }
        },
        error: (error: HttpErrorResponse) => {
          if (error.status === 400) {
            this._messageServ.add({ severity: 'error', summary: 'Error', detail: error.error.error });
          }
          this._loadingServ.loading.set(false);
        }
      });
  }
}
