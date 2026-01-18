import { HttpErrorResponse } from '@angular/common/http';

export function extractErrorMessage(error: any): string {

    // 1️⃣ If error is already a string
    if (typeof error === 'string') {
        return error;
    }

    // 2️⃣ Angular HttpErrorResponse
    if (error instanceof HttpErrorResponse) {

        const data = error.error;

        // Backend sent a plain string
        if (typeof data === 'string') return data;

        // Common backend message formats
        if (data?.message) return data.message;
        if (data?.error) return data.error;
        if (data?.msg) return data.msg;

        // Array of messages
        if (Array.isArray(data?.errors)) {
            return data.errors.join(', ');
        }

        // Fallback to status text
        if (error.statusText) return error.statusText;

        // Fallback to message Angular gives
        if (error.message) return error.message;
    }

    // 3️⃣ Normal JS Error
    if (error instanceof Error && error.message) {
        return error.message;
    }

    // 4️⃣ Unknown object with possible fields
    if (error?.message) return error.message;
    if (error?.error) return error.error;
    if (error?.msg) return error.msg;

    // 5️⃣ Final fallback
    return 'Something went wrong. Please try again.';
}