import { Injectable, signal, WritableSignal } from '@angular/core';
import { CashbookModel } from '../../Models/cashbook.model';
import { PaginationModel } from '../../Models/pagination.model';

@Injectable({
    providedIn: 'root'
})
export class CashbookDataService {
    selectedFilters: WritableSignal<{
        duration: WritableSignal<'today' | 'yesterday' | 'this_month' | 'last_month' | 'custom' | 'all'>;
        type: WritableSignal<'in' | 'out' | 'all'>;
        mode: WritableSignal<'cash' | 'online' | 'all'>;
        customDateRange: WritableSignal<Date[]>
    }> = signal({
        duration: signal('all'),
        type: signal('all'),
        mode: signal('all'),
        customDateRange: signal([])
    });

    userCashStats: WritableSignal<{
        cashIn: WritableSignal<number>;
        cashOut: WritableSignal<number>;
    }> = signal({
        cashIn: signal(0),
        cashOut: signal(0)
    });

    cashEntryDrawer: WritableSignal<boolean> = signal(false);
    updateCashEntryDrawer: WritableSignal<boolean> = signal(false);

    allCashbookEntries: WritableSignal<{
        data: WritableSignal<CashbookModel[]>,
        pagination: WritableSignal<PaginationModel>
    }> = signal({
        data: signal([]),
        pagination: signal({
            currentPage: 0,
            totalRecords: 0,
            pageSize: 25
        })
    });

    filteredCashbookEntires: WritableSignal<{
        data: WritableSignal<CashbookModel[]>,
        pagination: WritableSignal<PaginationModel>
    }> = signal({
        data: signal([]),
        pagination: signal({
            currentPage: 0,
            totalRecords: 0,
            pageSize: 25
        })
    });

    filtersApplied: WritableSignal<boolean> = signal(false);

    resetAllFilters(): void {
        this.selectedFilters().duration.set('all');
        this.selectedFilters().mode.set('all');
        this.selectedFilters().type.set('all');
        this.selectedFilters().customDateRange.set([]);
        this.filteredCashbookEntires().data.set([]);
        this.filteredCashbookEntires().pagination.set({
            currentPage: 0,
            totalRecords: 0,
            pageSize: 25
        });
        this.filtersApplied.set(false);
    }
}