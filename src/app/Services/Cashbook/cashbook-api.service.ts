import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { environment } from "../../../enviroments/enviroment";
import { catchError, Observable, tap, throwError } from "rxjs";
import { UserAccountService } from "../account.service";

@Injectable({
    providedIn: 'root'
})
export class CashbookApiService {
    private _http: HttpClient = inject(HttpClient);
    private _userAccountServ: UserAccountService = inject(UserAccountService);
    private readonly _BASEURL = `${environment.BACKEND_BASE_URL}/cashbook`;

    private handleError(error: HttpErrorResponse): Observable<never> {
        console.log("Error: ", error);
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


    createEntry(date: Date, type: 'in' | 'out', mode: 'cash' | 'online', amount: number, description: string, url: string, userId: string): Observable<Object> {
        return this._http.post(`${this._BASEURL}/createEntry`, {
            date: this._formatDateToLocal(date),
            type,
            mode,
            amount,
            description,
            url,
            id: userId
        }, { withCredentials: true })
            .pipe(
                tap((response: any) => {
                    console.log(response);
                }),
                catchError(this.handleError.bind(this))
            )
    }
}