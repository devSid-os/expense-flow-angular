import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../enviroments/enviroment';
import { CreateRecipientEntryModel, CreateRecipientModel, UpdateRecipientModel } from '../../Models/recipient.model';
import { BehaviorSubject, catchError, Observable, tap, throwError } from 'rxjs';
import { UserAccountService } from '../account.service';
import { RecipientDataService } from './recipient-data.service';

@Injectable({
    providedIn: 'root'
})
export class RecipientApiService {
    private _http = inject(HttpClient);
    private _userAccountServ: UserAccountService = inject(UserAccountService);
    private _recipientDataServ: RecipientDataService = inject(RecipientDataService);
    private _BASEURL: string = `${environment.BACKEND_BASE_URL}/recipient`;
    refetchRecipients: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

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

    createRecipient(data: CreateRecipientModel, userId: string): Observable<object> {
        return this._http.post(`${this._BASEURL}/createRecipient`, {
            ...data,
            id: userId
        }, { withCredentials: true })
            .pipe(
                tap((response: any) => {
                    if (response.status === 201) {

                    }
                }),
                catchError(this.handleError.bind(this))
            );
    }

    deleteRecipient(recipientId: string, userId: string): Observable<object> {
        return this._http.delete(`${this._BASEURL}/deleteRecipient/${userId}/${recipientId}`, { withCredentials: true })
            .pipe(
                tap((response: any) => {
                    if (response.status === 200) {

                    }
                }),
                catchError(this.handleError.bind(this))
            )
    }

    updateRecipient(data: UpdateRecipientModel, recipientId: string, userId: String): Observable<object> {
        return this._http.put(`${this._BASEURL}/updateRecipient`, { id: userId, ...data, recipientId }, { withCredentials: true })
            .pipe(
                tap((response: any) => {
                    if (response.status === 200) {

                    }
                }),
                catchError(this.handleError.bind(this))
            );
    }

    getAllRecipients(page: number, limit: number, userId: string): Observable<object> {
        return this._http.get(`${this._BASEURL}/getRecipients/${userId}`, { params: { page, limit }, withCredentials: true })
            .pipe(
                tap((response: any) => {
                    if (response.status === 200) {
                        this._recipientDataServ.recipients().data.set(response.payload[0].data);
                        this._recipientDataServ.recipients().pagination.set({
                            currentPage: response.payload[0].pagination.page,
                            totalRecords: response.payload[0].pagination.totalRecords,
                            pageSize: response.payload[0].pagination.pageSize
                        });
                        this._recipientDataServ.filteredApplied.set(false);
                    }
                }),
                catchError(this.handleError.bind(this))
            );
    }

    getFilteredRecipients(searchQuery: string, page: number, limit: number, userId: string, updateState:boolean = true): Observable<object> {
        return this._http.get(`${this._BASEURL}/getFilteredRecipients/${userId}`, { withCredentials: true, params: { page, limit, searchQuery } })
            .pipe(
                tap((response: any) => {
                    if (response.status === 200) {
                        if (updateState) {
                            this._recipientDataServ.filteredRecipients().data.set(response.payload[0].data);
                            this._recipientDataServ.filteredRecipients().pagination.set({
                                currentPage: response.payload[0].pagination.page,
                                totalRecords: response.payload[0].pagination.totalRecords,
                                pageSize: response.payload[0].pagination.pageSize
                            });
                            this._recipientDataServ.filteredApplied.set(true);
                        }
                    }
                }),
                catchError(this.handleError.bind(this))
            );
    }

    createRecipientEntry(data: CreateRecipientEntryModel, userId: string): Observable<object> {
        return this._http.post(`${this._BASEURL}/createRecipientEntry`, {
            id: userId,
            ...data
        }, { withCredentials: true })
            .pipe(
                tap((response: any) => {
                    if (response.status === 201) {

                    }
                }),
                catchError(this.handleError.bind(this))
            )
    }

    getRecipientEntries(recipientId: string, page: number, limit: number, startDate: Date | null = null, endDate: Date | null = null): Observable<object> {
        const params: any = {
            page,
            limit
        }
        if (startDate) {
            params['startDate'] = this._formatDateToLocal(startDate);
        }
        if (endDate) {
            params['endDate'] = this._formatDateToLocal(endDate);
        }

        return this._http.get(`${this._BASEURL}/getRecipientEntries/${recipientId}`, { withCredentials: true, params })
            .pipe(
                tap((response: any) => {
                    if (response.status !== 200) {
                        throw new Error('Failed to fetch recipient entries');
                    }
                }),
                catchError(this.handleError.bind(this))
            )
    }

}