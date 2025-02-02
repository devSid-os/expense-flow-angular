import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../enviroments/enviroment';
import { BehaviorSubject, catchError, Observable, tap, throwError } from 'rxjs';
import { UserAccountService } from '../account.service';
import { CreateCashBookEntryModel, FilteredEntriesModel, UpdateCashBookEntryModel } from '../../Models/cashbook.model';
import { CashbookDataService } from './cashbook-data.service';

@Injectable({
    providedIn: 'root'
})
export class CashbookApiService {
    private _http: HttpClient = inject(HttpClient);
    private _userAccountServ: UserAccountService = inject(UserAccountService);
    private _cashBookDataServ: CashbookDataService = inject(CashbookDataService);
    private readonly _BASEURL = `${environment.BACKEND_BASE_URL}/cashbook`;

    reFetchEntries: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

    private handleError(error: HttpErrorResponse): Observable<never> {
        console.log('Error: ', error);
        if (error.status === 401) {
            this._userAccountServ.resetCredentials();
        }
        return throwError(() => error);
    }

    private _formatDateToLocal(date: Date) {
        const parsedDate = new Date(date);
        const offsetDate = new Date(parsedDate.getTime() - parsedDate.getTimezoneOffset() * 60000);
        return offsetDate.toISOString().split('T')[0]; // Extract only the date part (YYYY-MM-DD)
    }

    createEntry(data: CreateCashBookEntryModel, userId: string): Observable<Object> {
        return this._http.post(`${this._BASEURL}/createEntry`, {
            ...data,
            date: this._formatDateToLocal(data.date as Date),
            id: userId
        }, { withCredentials: true })
            .pipe(
                tap((response: any) => {
                    if (response.status === 201) {
                        this._cashBookDataServ.userCashStats().cashIn.set(response.cashIn);
                        this._cashBookDataServ.userCashStats().cashOut.set(response.cashOut);
                    }
                }),
                catchError(this.handleError.bind(this))
            )
    }

    deleteEntry(entryId: string, userId: string): Observable<Object> {
        return this._http.delete(`${this._BASEURL}/deleteEntry/${userId}/${entryId}`, { withCredentials: true })
            .pipe(
                tap((response: any) => {
                    if (response.status === 200) {
                        this._cashBookDataServ.userCashStats().cashIn.set(response.cashIn);
                        this._cashBookDataServ.userCashStats().cashOut.set(response.cashOut);
                    }
                }),
                catchError(this.handleError.bind(this))
            )
    }

    updateEntry(data: UpdateCashBookEntryModel, userId: string): Observable<Object> {
        return this._http.put(`${this._BASEURL}/updateEntry`, {
            ...data,
            id: userId
        }, { withCredentials: true })
            .pipe(
                tap((response: any) => {
                    if (response.status === 200) {
                        this._cashBookDataServ.userCashStats().cashIn.set(response.cashIn);
                        this._cashBookDataServ.userCashStats().cashOut.set(response.cashOut);
                    }
                }),
                catchError(this.handleError.bind(this))
            )
    }

    getAllEntries(userId: string, page: number, pageSize: number): Observable<Object> {
        return this._http.get(`${this._BASEURL}/getAllEntries/${userId}`, { withCredentials: true, params: { page, limit: pageSize } })
            .pipe(
                tap((response: any) => {
                    if (response.status === 200) {
                        this._cashBookDataServ.resetAllFilters();
                        this._cashBookDataServ.userCashStats().cashIn.set(response.cashIn);
                        this._cashBookDataServ.userCashStats().cashOut.set(response.cashOut);
                        this._cashBookDataServ.allCashbookEntries().data.set(response.payload[0].data);
                        this._cashBookDataServ.allCashbookEntries().pagination.set({
                            currentPage: response.payload[0].pagination.page,
                            totalRecords: response.payload[0].pagination.totalRecords,
                            pageSize: response.payload[0].pagination.pageSize
                        });
                    }
                }),
                catchError(this.handleError.bind(this))
            );
    }

    getFilteredEntries(data: FilteredEntriesModel, page: number, pageSize: number, userId: string) {
        return this._http.post(`${this._BASEURL}/getFilteredEntries`, {
            ...data,
            id: userId,
            customDateRange: data.duration === 'custom' ? [this._formatDateToLocal(data.customDateRange[0]), this._formatDateToLocal(data.customDateRange[1])] : []
        }, { withCredentials: true, params: { page, limit: pageSize } })
            .pipe(
                tap((response: any) => {
                    if (response.status === 200) {
                        this._cashBookDataServ.filteredCashbookEntires().data.set(response.payload[0].data);
                        this._cashBookDataServ.filteredCashbookEntires().pagination.set({
                            currentPage: response.payload[0].pagination.page,
                            totalRecords: response.payload[0].pagination.totalRecords,
                            pageSize: response.payload[0].pagination.pageSize
                        });
                        this._cashBookDataServ.selectedFilters().duration.set(data.duration || 'all');
                        this._cashBookDataServ.selectedFilters().mode.set(data.mode || 'all');
                        this._cashBookDataServ.selectedFilters().type.set(data.type || 'all');
                        this._cashBookDataServ.selectedFilters().customDateRange.set(data.customDateRange || []);
                        this._cashBookDataServ.filtersApplied.set(true);
                    }
                }),
                catchError(this.handleError.bind(this))
            )
    }
}