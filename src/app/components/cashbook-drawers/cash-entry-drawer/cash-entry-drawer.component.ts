import { CommonModule } from '@angular/common';
import { Component, computed, EventEmitter, inject, Input, Output, Signal, ViewEncapsulation } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { DrawerModule } from 'primeng/drawer';
import { ScrollPanelModule } from 'primeng/scrollpanel';
import { SelectModule } from 'primeng/select';
import { CashbookDataService } from '../../../Services/Cashbook/cashbook-data.service';
import { Chip } from 'primeng/chip';

@Component({
  selector: 'app-cash-entry-drawer',
  imports: [CommonModule, DrawerModule, ScrollPanelModule, DatePickerModule, ButtonModule, SelectModule, ReactiveFormsModule, Chip],
  templateUrl: './cash-entry-drawer.component.html',
  styleUrl: './cash-entry-drawer.component.scss',
  encapsulation: ViewEncapsulation.None
})
export class CashEntryDrawerComponent {
  private _formBuilder: FormBuilder = inject(FormBuilder);
  private _cashbookDataServ: CashbookDataService = inject(CashbookDataService);
  @Input('drawerType') drawerType: 'in' | 'out' | null = 'in';
  @Output('onDrawerTypeChange') onDrawerTypeChange: EventEmitter<'in' | 'out'> = new EventEmitter<'in' | 'out'>();
  cashEntryDrawer: Signal<boolean> = computed(() => this._cashbookDataServ.cashEntryDrawer());
  modeOptions: { label: string, value: string }[] = [
    { label: 'Online', value: 'online' },
    { label: 'Cash', value: 'cash' }
  ]

  closeDrawer(): void {
    this._cashbookDataServ.cashEntryDrawer.set(false);
  }
}
