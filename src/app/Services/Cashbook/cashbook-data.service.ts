import { Injectable, signal, WritableSignal } from "@angular/core";
import { CashbookModel } from "../../Models/cashbook.model";
import { PaginationModel } from "../../Models/pagination.model";

@Injectable({
    providedIn: 'root'
})
export class CashbookDataService {
    selectedFilters: WritableSignal<{
        duration: WritableSignal<string>;
        type: WritableSignal<'in' | 'out' | 'all'>;
        mode: WritableSignal<'cash' | 'online' | 'all'>;
    }> = signal({
        duration: signal('all'),
        type: signal('all'),
        mode: signal('all')
    });

    userCashStats: WritableSignal<{
        cashIn: WritableSignal<number>;
        cashOut: WritableSignal<number>;
    }> = signal({
        cashIn: signal(0),
        cashOut: signal(0)
    });

    cashEntryDrawer: WritableSignal<boolean> = signal(false);

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
}