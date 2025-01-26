import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../enviroments/enviroment';
import { BehaviorSubject, catchError, Observable, tap, throwError } from 'rxjs';
import { ExpenseDataService } from './expense-data.service';
import { UserAccountService } from '../account.service';

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
        console.log("Error: ", error);
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
        return this._http.put(`${this._BASEURL}/updateCategory/${userId}`, { name, categoryId }, { withCredentials: true })
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
        return this._http.put(`${this._BASEURL}/editItem/${userId}`, { name, price, itemId }, { withCredentials: true })
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
                        if (payload._id in this._expenseDataServ.editItemsCart()) {
                            this._expenseDataServ.editItemsCart.update((cart) => {
                                const updatedCart = { ...cart };
                                updatedCart[payload._id] = { ...updatedCart[payload._id], item: payload };
                                return updatedCart;
                            });
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

    createExpenseEntry(date: Date, category: string, items: { item: string, qty: number }[], description: string, userId: string): Observable<Object> {
        return this._http.post(`${this._BASEURL}/createEntry`, { date, category, items, description, id: userId }, { withCredentials: true })
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
                        this._expenseDataServ.entries.set(response.payload);
                        this._expenseDataServ.entriesPagination.set({
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
                        this._expenseDataServ.entries.update(entries => entries.filter(entry => entry._id !== entryId));
                    }
                }),
                catchError(this.handleError.bind(this))
            );
    }

    updateUserExpenseEntry(date: Date, category: string, items: { item: string, qty: number }[], description: string, entryId: string, userId: string) {
        return this._http.put(`${this._BASEURL}/updateEntry/${userId}`, {
            date,
            category,
            items,
            description,
            entryId
        }, { withCredentials: true })
            .pipe(
                tap((response: any) => {
                    if (response.status === 200) {
                        this._expenseDataServ.resetFilters();
                    }
                }),
                catchError(this.handleError.bind(this))
            )
    }

    getFilteredUserEntries(categories: string[], itemsList: string[], fromDate: Date | null, endDate: Date | null, timePeriod: 'l2d' | 'yesterday' | 'today' | null, userId: string, page: number, limit: number): Observable<Object> {
        return this._http.post(`${this._BASEURL}/getFilteredEntries`, {
            categories,
            itemsList,
            fromDate,
            endDate,
            timePeriod,
            page,
            limit,
            id: userId
        }, { withCredentials: true })
            .pipe(
                tap((response: any) => {
                    if (response.status === 200) {
                        this._expenseDataServ.filteredEntries.set(response.payload);
                        this._expenseDataServ.filteredEntriesPagination.set({
                            totalRecords: response.totalRecords,
                            pageSize: response.pageSize,
                            currentPage: response.page
                        });
                        this._expenseDataServ.filters().categories.set(categories);
                        this._expenseDataServ.filters().items.set(itemsList);
                        if (timePeriod !== null) {
                            this._expenseDataServ.filters().fromDate.set(null);
                            this._expenseDataServ.filters().endDate.set(null);
                            this._expenseDataServ.filters().timePeriod.set(timePeriod);
                        }
                        else {
                            this._expenseDataServ.filters().fromDate.set(fromDate);
                            this._expenseDataServ.filters().endDate.set(endDate);
                            this._expenseDataServ.filters().timePeriod.set(null);
                        }
                        this._expenseDataServ.expenseFilterApplied.set(true);
                    }
                }),
                catchError(this.handleError.bind(this))
            );
    }
}