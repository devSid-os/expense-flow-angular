import { CommonModule } from '@angular/common';
import { Component, computed, EventEmitter, inject, Input, Output, Signal, ViewEncapsulation } from '@angular/core';
// NG UI COMPONENTS PRIME IMPORTS
import { TableModule } from 'primeng/table';
import { FormsModule } from '@angular/forms';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
// MODELS IMPORT
import { CashbookModel } from '../../../Models/cashbook.model';
import { PaginationModel } from '../../../Models/pagination.model';
// IMAGE VIEWER IMPORT
import { Lightbox, LightboxConfig } from 'ngx-lightbox';
import { CashbookDataService } from '../../../Services/Cashbook/cashbook-data.service';

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
  private _cashbookDataServ: CashbookDataService = inject(CashbookDataService);
  @Input('entries') entries!: CashbookModel[];
  @Input('pagination') pagination!: PaginationModel;
  @Output('onPageChange') onPageChange: EventEmitter<any> = new EventEmitter<any>();
  @Output('onTableRowClick') onTableRowClick: EventEmitter<CashbookModel> = new EventEmitter<CashbookModel>();
  selectedEntries: CashbookModel[] = [];
  filtersApplied: Signal<boolean> = computed(() => this._cashbookDataServ.filtersApplied());

  constructor() {
    this._lightboxConfig.resizeDuration = 1;
    this._lightboxConfig.fadeDuration = 0;
    this._lightboxConfig.enableTransition = false;
    this._lightboxConfig.showDownloadButton = true;
    this._lightboxConfig.disableScrolling = true;
    this._lightboxConfig.centerVertically = true;
    this._lightboxConfig.wrapAround = true;
  }

  removeAllFilters(): void {
    this._cashbookDataServ.resetAllFilters();
  }

  getTotalPage(): number {
    return Math.ceil(this.pagination.totalRecords / this.pagination.pageSize);
  }

  openAttachmentPreview(mediaUrl: string): void {
    this._lightbox.open([{ src: mediaUrl, caption: '', thumb: '' }], 0);
  }

}
