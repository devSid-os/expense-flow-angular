import { computed, Injectable, Signal, signal, WritableSignal } from '@angular/core';
import { ExpenseCategoryModel, ExpenseEntryModel, ExpenseItemModel } from '../../Models/expenses.model';
import { PaginationModel } from '../../Models/pagination.model';

@Injectable({
    providedIn: 'root'
})
export class ExpenseDataService {

    // ALL EXPENSE ENTRIES DATA AND PAGINATION
    allEntries: WritableSignal<{
        data: WritableSignal<ExpenseEntryModel[]>,
        pagination: WritableSignal<PaginationModel>
    }> = signal({
        data: signal([]),
        pagination: signal({
            totalRecords: 0,
            currentPage: 0,
            pageSize: 25
        })
    });

    // ALL USER EXPENSE CATEGORIES
    categories: WritableSignal<ExpenseCategoryModel[]> = signal([]);

    // ALL USER EXPENSE ITEMS
    items: WritableSignal<ExpenseItemModel[]> = signal([]);

    // USER EXPENSE ITEMS CART(OBJECT)
    itemsCart: WritableSignal<{ [itemId: string]: { item: ExpenseItemModel; qty: number } }> = signal({});

    // USER EXPENSE ITEMS CART(ARRAY)
    itemsCartArray: Signal<{ item: ExpenseItemModel, qty: number }[]> = computed(() => Object.entries(this.itemsCart()).map(([itemId, data]) => ({ ...data })));

    // CART TOTAL
    cartTotalAmount: Signal<number> = computed(() => this.itemsCartArray().reduce((acc, item) => { return acc + (item.item.price * item.qty) }, 0));

    // EDIT EXPENSE ITEMS CART
    editItemsCart: WritableSignal<{ [itemId: string]: { item: ExpenseItemModel; qty: number } }> = signal({});

    // USER EDIT EXPENSE ITEMS CART(ARRAY)
    editItemsCartArray: Signal<{ item: ExpenseItemModel, qty: number }[]> = computed(() => Object.entries(this.editItemsCart()).map(([itemId, data]) => ({ ...data })));

    // EDIT CART TOTAL
    editCartTotalAmount: Signal<number> = computed(() => this.editItemsCartArray().reduce((acc, item) => { return acc + (item.item.price * item.qty) }, 0));

    // FILTERED EXPENSE ENTRIES AND PAGINATION
    filteredEntries: WritableSignal<{
        data: WritableSignal<ExpenseEntryModel[]>,
        pagination: WritableSignal<PaginationModel>
    }> = signal({
        data: signal([]),
        pagination: signal({
            totalRecords: 0,
            currentPage: 0,
            pageSize: 25
        })
    })

    expenseFilterApplied: WritableSignal<boolean> = signal(false);
    filters: WritableSignal<{
        items: WritableSignal<string[]>,
        categories: WritableSignal<string[]>,
        fromDate: WritableSignal<Date | null>,
        endDate: WritableSignal<Date | null>,
        timePeriod: WritableSignal<'l2d' | 'yesterday' | 'today' | null>
    }> = signal({
        items: signal([]),
        categories: signal([]),
        fromDate: signal(null),
        endDate: signal(null),
        timePeriod: signal(null)
    })

    // UI VARIABLES
    showAddExpenseDrawer: WritableSignal<boolean> = signal(false);
    showExpenseItemsDrawer: WritableSignal<boolean> = signal(false);
    showEditExpenseDrawer: WritableSignal<boolean> = signal(false);
    showViewEntryDrawer: WritableSignal<boolean> = signal(false);
    viewEntryData: WritableSignal<ExpenseEntryModel | null> = signal(null);

    resetFilters(): void {
        this.filters().categories.set([]);
        this.filters().items.set([]);
        this.filters().fromDate.set(null);
        this.filters().endDate.set(null);
        this.filters().timePeriod.set(null);
        this.filteredEntries().pagination.set({
            totalRecords: 0,
            pageSize: 25,
            currentPage: 0
        });
        this.filteredEntries().data.set([]);
    }
}