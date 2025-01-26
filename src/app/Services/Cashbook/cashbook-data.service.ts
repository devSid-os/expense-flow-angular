import { inject, Injectable, signal, WritableSignal } from "@angular/core";
import { UserAccountService } from "../account.service";

@Injectable({
    providedIn: 'root'
})
export class CashbookDataService {
    private _userAccountService: UserAccountService = inject(UserAccountService);
    selectedFilters: WritableSignal<{
        duration: WritableSignal<string>,
        type: WritableSignal<'in' | 'out' | 'all'>,
        mode: WritableSignal<'cash' | 'online' | 'all'>
    }> = signal({
        duration: signal('all'),
        type: signal('all'),
        mode: signal('all')
    });

    cashIn: WritableSignal<number> = signal(this._userAccountService.userPayload().cashIn);
    cashOut: WritableSignal<number> = signal(this._userAccountService.userPayload().cashOut);
    cashEntryDrawer: WritableSignal<boolean> = signal(false);
}