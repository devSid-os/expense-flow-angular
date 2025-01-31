import { CommonModule } from '@angular/common';
import { Component, EventEmitter, inject, Input, Output, ViewEncapsulation } from '@angular/core';
import { TableModule } from 'primeng/table';
import { CashbookModel } from '../../../Models/cashbook.model';
import { FormsModule } from '@angular/forms';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { Lightbox, LightboxConfig } from 'ngx-lightbox';
import { UserAccountService } from '../../../Services/account.service';
import { CashbookApiService } from '../../../Services/Cashbook/cashbook-api.service';
import { take } from 'rxjs';
import { response } from 'express';
import { HttpErrorResponse } from '@angular/common/http';
import { MessageService } from 'primeng/api';
import { LoadingService } from '../../../Services/loading.service';
import { PaginationModel } from '../../../Models/pagination.model';

@Component({
  selector: 'app-entries-table',
  imports: [CommonModule, TableModule, FormsModule, TagModule, ButtonModule],
  templateUrl: './entries-table.component.html',
  styleUrl: './entries-table.component.scss',
  encapsulation: ViewEncapsulation.None,
  providers: [MessageService]
})
export class EntriesTableComponent {
  private _lightboxConfig: LightboxConfig = inject(LightboxConfig);
  private _lightbox: Lightbox = inject(Lightbox);
  private _userAccountServ: UserAccountService = inject(UserAccountService);
  private _loadingServ: LoadingService = inject(LoadingService);
  private _cashbookApiServ: CashbookApiService = inject(CashbookApiService);
  private _messageServ: MessageService = inject(MessageService);
  private readonly _userId: string = this._userAccountServ.userPayload()._id;
  @Input('entries') entries!: CashbookModel[];
  @Input('pagination') pagination!: PaginationModel;
  @Output('onPageChange') onPageChange: EventEmitter<any> = new EventEmitter<any>();
  selectedEntries: CashbookModel[] = [];

  constructor() {
    this._lightboxConfig.resizeDuration = 1;
    this._lightboxConfig.fadeDuration = 0;
    this._lightboxConfig.enableTransition = false;
    this._lightboxConfig.showDownloadButton = true;
    this._lightboxConfig.disableScrolling = true;
    this._lightboxConfig.centerVertically = true;
    this._lightboxConfig.wrapAround = true;
  }

  getTotalPage(): number {
    return Math.ceil(this.pagination.totalRecords / this.pagination.pageSize);
  }

  openAttachmentPreview(mediaUrl: string): void {
    this._lightbox.open([{ src: mediaUrl, caption: '', thumb: '' }], 0);
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
