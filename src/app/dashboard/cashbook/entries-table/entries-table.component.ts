import { CommonModule } from '@angular/common';
import { Component, EventEmitter, inject, Input, Output, ViewEncapsulation } from '@angular/core';
import { TableModule } from 'primeng/table';
import { CashbookModel } from '../../../Models/cashbook.model';
import { FormsModule } from '@angular/forms';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { Lightbox, LightboxConfig } from 'ngx-lightbox';
import { PaginationModel } from '../../../Models/pagination.model';

@Component({
  selector: 'app-entries-table',
  imports: [CommonModule, TableModule, FormsModule, TagModule, ButtonModule],
  templateUrl: './entries-table.component.html',
  styleUrl: './entries-table.component.scss',
  encapsulation: ViewEncapsulation.None
})
export class EntriesTableComponent {
  private _lightboxConfig: LightboxConfig = inject(LightboxConfig);
  private _lightbox: Lightbox = inject(Lightbox);
  @Input('entries') entries!: CashbookModel[];
  @Input('pagination') pagination!: PaginationModel;
  @Output('onPageChange') onPageChange: EventEmitter<any> = new EventEmitter<any>();
  @Output('onTableRowClick') onTableRowClick: EventEmitter<CashbookModel> = new EventEmitter<CashbookModel>();
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

}
