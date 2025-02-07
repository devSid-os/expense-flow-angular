import { CommonModule } from '@angular/common';
import { Component, computed, EventEmitter, inject, Input, OnInit, Output, Signal, ViewEncapsulation } from '@angular/core';
// SERVICES IMPORT
import { ExpenseDataService } from '../../../Services/Expenses/expense-data.service';
// NG UI COMPONENTS PRIME IMPORTS
import { ButtonModule } from 'primeng/button';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
// MODELS IMPORT
import { ExpenseEntryModel, ExpenseItemModel } from '../../../Models/expenses.model';
import { PaginationModel } from '../../../Models/pagination.model';
import { Lightbox, LightboxConfig } from 'ngx-lightbox';

@Component({
  selector: 'app-expense-list-table',
  imports: [TableModule, IconFieldModule, InputIconModule, ButtonModule, CommonModule, InputTextModule, TagModule],
  templateUrl: './expense-list-table.component.html',
  styleUrl: './expense-list-table.component.scss',
  encapsulation: ViewEncapsulation.None,
})
export class ExpenseListTableComponent implements OnInit {

  private _expenseDataServ: ExpenseDataService = inject(ExpenseDataService);
  private _lightboxConfig: LightboxConfig = inject(LightboxConfig);
  private _lightbox: Lightbox = inject(Lightbox);

  products: any[] = [];
  filtersApplied: Signal<boolean> = computed(() => this._expenseDataServ.expenseFilterApplied());
  @Input('entriesPagination') entriesPagination!: PaginationModel;
  @Input('entries') entries!: ExpenseEntryModel[];
  @Output('onPageChange') onPageChange: EventEmitter<any> = new EventEmitter<any>();

  constructor() {
    this._lightboxConfig.resizeDuration = 1;
    this._lightboxConfig.fadeDuration = 0;
    this._lightboxConfig.enableTransition = false;
    this._lightboxConfig.showDownloadButton = true;
    this._lightboxConfig.disableScrolling = true;
    this._lightboxConfig.centerVertically = true;
    this._lightboxConfig.wrapAround = true;
  }

  ngOnInit(): void {
    this.products = Array.from({ length: 12 }).map((_, i) => `Item #${i}`);
  }

  openAttachmentPreview(mediaUrl: string): void {
    this._lightbox.open([{ src: mediaUrl, caption: '', thumb: '' }], 0);
  }

  removeAllFilters(): void {
    this._expenseDataServ.resetFilters();
    this._expenseDataServ.expenseFilterApplied.set(false);
  }

  openViewEntryDrawer(data: ExpenseEntryModel): void {
    this._expenseDataServ.showViewEntryDrawer.set(true);
    this._expenseDataServ.viewEntryData.set(data);
  }

  getExpenseTotal(items: { item: ExpenseItemModel, qty: number }[]): number {
    const expTotal: number = items.reduce((sum, item) => sum + (item.item.price * item.qty), 0);
    return expTotal;
  }

  getTotalPage(): number {
    return Math.ceil(this.entriesPagination.totalRecords / this.entriesPagination.pageSize);
  }

}