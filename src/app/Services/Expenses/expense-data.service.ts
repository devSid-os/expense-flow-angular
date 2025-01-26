import { computed, Injectable, Signal, signal, WritableSignal } from '@angular/core';
import { ExpenseCategoryModel, ExpenseEntryModel, ExpenseItemModel } from '../../Models/expenses.model';
import { PaginationModel } from '../../Models/pagination.model';

@Injectable({
    providedIn: 'root'
})
export class ExpenseDataService {

    // USER EXPENSE ENTRIES PAGINATION
    entriesPagination: WritableSignal<PaginationModel> = signal({
        totalRecords: 0,
        currentPage: 0,
        pageSize: 25
    });

    // ALL USER EXPENSE ENTRIES
    entries: WritableSignal<ExpenseEntryModel[]> = signal([]);

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

    // FILTERED USER EXPENSE ENTRIES
    filteredEntriesPagination: WritableSignal<PaginationModel> = signal({
        totalRecords: 0,
        currentPage: 0,
        pageSize: 25
    });

    // FILTERED EXPENSE ENTRIES
    filteredEntries: WritableSignal<ExpenseEntryModel[]> = signal([]);
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

    resetFilters(): void {
        this.filters().categories.set([]);
        this.filters().items.set([]);
        this.filters().fromDate.set(null);
        this.filters().endDate.set(null);
        this.filters().timePeriod.set(null);
        this.filteredEntriesPagination.set({
            totalRecords: 0,
            pageSize: 25,
            currentPage: 0
        });
        this.filteredEntries.set([]);
    }
}