import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../enviroments/enviroment';
import { BehaviorSubject, catchError, Observable, tap, throwError } from 'rxjs';
import { ExpenseDataService } from './expense-data.service';
import { UserAccountService } from '../account.service';
import { CreateExpenseEntryModel, FetchFilteredEntriesModel, UpdateExpenseEntryModel } from '../../Models/expenses.model';

@Injectable({
    providedIn: 'root'
})
export class ExpenseApiService {
    private _http = inject(HttpClient);
    private _expenseDataServ = inject(ExpenseDataService);
    private _userAccountServ = inject(UserAccountService);
    private _BASEURL: string = `${environment.BACKEND_BASE_URL}/expense`;

    fetchExpenseEntries = new BehaviorSubject<boolean>(false);

    private handleError(error: HttpErrorResponse): Observable<never> {
        console.log('Error: ', error);
        if (error.status === 401) {
            this._userAccountServ.resetCredentials();
        }
        return throwError(() => error);
    }

    addNewExpenseCategory(name: string, userId: string): Observable<Object> {
        return this._http.post(`${this._BASEURL}/createCategory`, { name, id: userId }, { withCredentials: true })
            .pipe(
                tap((response: any) => {
                    if (response.status === 201) {
                        this._expenseDataServ.categories.update(categories => [...categories, response.payload]);
                    }
                }),
                catchError(this.handleError.bind(this))
            );
    }

    getAllUserExpenseCategories(userId: string): Observable<Object> {
        return this._http.get(`${this._BASEURL}/getCategories/${userId}`, { withCredentials: true })
            .pipe(
                tap((response: any) => {
                    if (response.status === 200) {
                        this._expenseDataServ.categories.set(response.payload);
                    }
                }),
                catchError(this.handleError.bind(this))
            );
    }

    deleteExpenseCategory(categoryId: string, userId: string): Observable<Object> {
        return this._http.delete(`${this._BASEURL}/deleteCategory/${userId}/${categoryId}`, { withCredentials: true }).pipe(
            tap((response: any) => {
                if (response.status === 200) {
                    this._expenseDataServ.resetFilters();
                    this._expenseDataServ.categories.set(this._expenseDataServ.categories().filter(category => category._id !== categoryId));
                }
            }),
            catchError(this.handleError.bind(this))
        );
    }

    updateExpenseCategory(name: string, categoryId: string, userId: string): Observable<Object> {
        return this._http.put(`${this._BASEURL}/updateCategory`, { name, categoryId, id: userId }, { withCredentials: true })
            .pipe(
                tap((response: any) => {
                    if (response.status === 200) {

                    }
                }),
                catchError(this.handleError.bind(this))
            );
    }

    addNewExpenseItem(name: string, price: number, userId: string): Observable<Object> {
        return this._http.post(`${this._BASEURL}/createItem`, { name, price, id: userId }, { withCredentials: true })
            .pipe(
                tap((response: any) => {
                    if (response.status === 201) {
                        this._expenseDataServ.items.update(items => [...items, response.payload]);
                    }
                }),
                catchError(this.handleError.bind(this))
            );
    }

    getAllUserExpenseItems(userId: string): Observable<Object> {
        return this._http.get(`${this._BASEURL}/getItems/${userId}`, { withCredentials: true })
            .pipe(
                tap((response: any) => {
                    if (response.status === 200) {
                        this._expenseDataServ.items.set(response.payload);
                    }
                }),
                catchError(this.handleError.bind(this))
            );
    }

    deleteUserExpenseItem(itemId: string, userId: string): Observable<Object> {
        return this._http.delete(`${this._BASEURL}/deleteItem/${userId}/${itemId}`, { withCredentials: true })
            .pipe(
                tap((response: any) => {
                    if (response.status === 200) {
                        this._expenseDataServ.resetFilters();
                        this._expenseDataServ.items.set(this._expenseDataServ.items().filter(item => item._id !== itemId));
                        if (itemId in this._expenseDataServ.itemsCart()) {
                            const cart = { ...this._expenseDataServ.itemsCart() };
                            delete cart[itemId];
                            this._expenseDataServ.itemsCart.set(cart);
                        }
                    }
                }),
                catchError(this.handleError.bind(this))
            );
    }

    updateUserExpenseItem(name: string, price: number, itemId: string, userId: string): Observable<Object> {
        return this._http.put(`${this._BASEURL}/updateItem`, { name, price, itemId, id: userId }, { withCredentials: true })
            .pipe(
                tap((response: any) => {
                    if (response.status === 200) {
                        const payload = response.payload;
                        var index = -1;
                        this._expenseDataServ.items().some((item, i) => {
                            if (item._id === payload._id) {
                                index = i;
                                return true;
                            }
                            return false;
                        });
                        if (index > -1 && index < this._expenseDataServ.items().length) {
                            this._expenseDataServ.items.set(this._expenseDataServ.items().map((item, i) => (i === index ? payload : item)));
                        }

                        if (payload._id in this._expenseDataServ.itemsCart()) {
                            this._expenseDataServ.itemsCart.update((cart) => {
                                const updatedCart = { ...cart };
                                updatedCart[payload._id] = { ...updatedCart[payload._id], item: payload };
                                return updatedCart;
                            });
                        }

                    }
                }),
                catchError(this.handleError.bind(this))
            );
    }

    private _formatDateToLocal(date: Date) {
        const parsedDate = new Date(date);
        const offsetDate = new Date(parsedDate.getTime() - parsedDate.getTimezoneOffset() * 60000);
        return offsetDate.toISOString().split('T')[0]; // Extract only the date part (YYYY-MM-DD)
    }

    createExpenseEntry(data: CreateExpenseEntryModel, userId: string): Observable<Object> {
        return this._http.post(`${this._BASEURL}/createEntry`, {
            ...data,
            date: this._formatDateToLocal(data.date as Date),
            id: userId
        },
            { withCredentials: true })
            .pipe(
                tap((response: any) => {
                    if (response.status === 201) {
                        this._expenseDataServ.itemsCart.set({});
                        this._expenseDataServ.showExpenseItemsDrawer.set(false);
                        this._expenseDataServ.showAddExpenseDrawer.set(false);
                    }
                }),
                catchError(this.handleError.bind(this))
            );
    }

    getAllUserExpenseEntries(userId: string, page: number, limit: number): Observable<Object> {
        return this._http.get(`${this._BASEURL}/getEntries/${userId}`, { withCredentials: true, params: { page, limit } })
            .pipe(
                tap((response: any) => {
                    if (response.status === 200) {
                        this._expenseDataServ.allEntries().data.set(response.payload);
                        this._expenseDataServ.allEntries().pagination.set({
                            totalRecords: response.totalRecords,
                            currentPage: response.page,
                            pageSize: response.pageSize
                        });
                        this._expenseDataServ.expenseFilterApplied.set(false);
                    }
                }),
                catchError(this.handleError.bind(this))
            );
    }

    deleteUserExpenseEntry(userId: string, entryId: string): Observable<Object> {
        return this._http.delete(`${this._BASEURL}/deleteEntry/${userId}/${entryId}`, { withCredentials: true })
            .pipe(
                tap((response: any) => {
                    if (response.status === 200) {
                        this._expenseDataServ.allEntries().data.update(entries => entries.filter(entry => entry._id !== entryId));
                    }
                }),
                catchError(this.handleError.bind(this))
            );
    }

    updateUserExpenseEntry(data: UpdateExpenseEntryModel, userId: string) {
        return this._http.put(`${this._BASEURL}/updateEntry`, { ...data, date: this._formatDateToLocal(data.date as Date), id: userId }, { withCredentials: true })
            .pipe(
                tap((response: any) => {
                    if (response.status === 200) {
                        this._expenseDataServ.resetFilters();
                    }
                }),
                catchError(this.handleError.bind(this))
            )
    }

    getFilteredUserEntries(data: FetchFilteredEntriesModel, userId: string, page: number, limit: number): Observable<Object> {
        return this._http.post(`${this._BASEURL}/getFilteredEntries`, {
            ...data,
            endDate: data.endDate ? this._formatDateToLocal(data.endDate as Date) : null,
            fromDate: data.endDate ? this._formatDateToLocal(data.fromDate as Date) : null,
            page,
            limit,
            id: userId
        }, { withCredentials: true })
            .pipe(
                tap((response: any) => {
                    if (response.status === 200) {
                        this._expenseDataServ.filteredEntries().data.set(response.payload);
                        this._expenseDataServ.filteredEntries().pagination.set({
                            totalRecords: response.totalRecords,
                            pageSize: response.pageSize,
                            currentPage: response.page
                        });
                        this._expenseDataServ.filters().categories.set([...data.categories]);
                        this._expenseDataServ.filters().items.set([...data.itemsList]);
                        if (data.timePeriod !== null) {
                            this._expenseDataServ.filters().fromDate.set(null);
                            this._expenseDataServ.filters().endDate.set(null);
                            this._expenseDataServ.filters().timePeriod.set(data.timePeriod);
                        }
                        else {
                            this._expenseDataServ.filters().fromDate.set(data.fromDate);
                            this._expenseDataServ.filters().endDate.set(data.endDate);
                            this._expenseDataServ.filters().timePeriod.set(null);
                        }
                        this._expenseDataServ.expenseFilterApplied.set(true);
                    }
                }),
                catchError(this.handleError.bind(this))
            );
    }
}