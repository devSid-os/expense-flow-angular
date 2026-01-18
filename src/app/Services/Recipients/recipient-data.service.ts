import { Injectable, signal, WritableSignal } from "@angular/core";
import { RecipientModel } from "../../Models/recipient.model";
import { PaginationModel } from "../../Models/pagination.model";
import { Writable } from "stream";

@Injectable({
    providedIn: 'root'
})
export class RecipientDataService {

    recipients: WritableSignal<{
        data: WritableSignal<RecipientModel[]>,
        pagination: WritableSignal<PaginationModel>
    }> = signal({
        data: signal([]),
        pagination: signal({
            totalRecords: 0,
            pageSize: 25,
            currentPage: 0
        })
    });
    filteredApplied: WritableSignal<boolean> = signal(false);
    filteredRecipients: WritableSignal<{
        data: WritableSignal<RecipientModel[]>,
        pagination: WritableSignal<PaginationModel>
    }> = signal({
        data: signal([]),
        pagination: signal({
            totalRecords: 0,
            pageSize: 25,
            currentPage: 0
        })
    });

    addEntryDrawer: WritableSignal<{
        open: WritableSignal<boolean>;
        type: WritableSignal<'in' | 'out'>;
        recipient: WritableSignal<null | string>;
    }> = signal({
        open: signal(false),
        type: signal('in'),
        recipient: signal(null)
    });
}