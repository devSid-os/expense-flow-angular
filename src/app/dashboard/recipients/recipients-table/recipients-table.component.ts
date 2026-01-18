import { CommonModule } from '@angular/common';
import { Component, computed, EventEmitter, inject, Input, OnDestroy, OnInit, Output, Signal, ViewEncapsulation } from '@angular/core';
import { DataView } from 'primeng/dataview';
import { RecipientModel } from '../../../Models/recipient.model';
import { PaginationModel } from '../../../Models/pagination.model';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import moment from 'moment';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged, Subscription } from 'rxjs';
import { ViewRecipientDrawerComponent } from '../../../components/recipient-drawers/view-recipient-drawer/view-recipient-drawer.component';
import { RecipientAvatarComponent } from "../../../components/recipient-avatar/recipient-avatar.component";
import { AddEntryDrawerComponent } from '../../../components/recipient-drawers/add-entry-drawer/add-entry-drawer.component';
import { RecipientDataService } from '../../../Services/Recipients/recipient-data.service';

@Component({
  selector: 'app-recipients-table',
  imports: [CommonModule, DataView, IconFieldModule, InputIconModule, InputTextModule, ReactiveFormsModule, ViewRecipientDrawerComponent, ViewRecipientDrawerComponent, RecipientAvatarComponent, AddEntryDrawerComponent],
  templateUrl: './recipients-table.component.html',
  styleUrl: './recipients-table.component.scss',
  encapsulation: ViewEncapsulation.None
})
export class RecipientsTableComponent implements OnInit, OnDestroy {
  private _recipientDataServ: RecipientDataService = inject(RecipientDataService);
  @Input('data') data!: RecipientModel[];
  @Input('pagination') pagination!: PaginationModel;
  @Output('onFilterSearchChange') onFilterSearchChange: EventEmitter<string> = new EventEmitter<string>();
  searchControl = new FormControl('');
  searchControl$: Subscription | null = null;
  openRecipientDrawer: boolean = false;
  recipientDrawerData: RecipientModel | null = null;
  isAddEntryDrawerOpen: Signal<boolean> = computed(() => this._recipientDataServ.addEntryDrawer().open());
  constructor() {
  }

  ngOnInit(): void {
    this.searchControl$ = this.searchControl.valueChanges
      .pipe(
        debounceTime(500),
        distinctUntilChanged()
      )
      .subscribe({
        next: (value: any) => {
          this.onFilterSearchChange.emit(value);
        }
      })
  }

  ngOnDestroy(): void {
    if (this.searchControl$ instanceof Subscription) this.searchControl$.unsubscribe();
  }

  closeAddEntryDrawer(): void {
    this._recipientDataServ.addEntryDrawer().open.set(false);
    this._recipientDataServ.addEntryDrawer().type.set('in');
    this._recipientDataServ.addEntryDrawer().recipient.set(null);
  }

  openViewRecipientDrawer(data: RecipientModel): void {
    this.openRecipientDrawer = true;
    this.recipientDrawerData = data;
  }

  closeViewRecipientDrawer(): void {
    this.openRecipientDrawer = false;
    this.recipientDrawerData = null;
  }

  abs(n: number): number {
    return Math.abs(n);
  }

  formatTimeAgo(date: string): string {
    return moment(date).fromNow();
  }
}
