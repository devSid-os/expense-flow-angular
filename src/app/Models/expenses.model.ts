export interface ExpenseItemModel {
    name: string,
    price: number,
    _id: string
};

export interface ExpenseCategoryModel {
    name: string,
    _id: string
};

export interface ExpenseEntryModel {
    items: [{ item: { name: string, price: number, _id: string }, qty: number }],
    category: string,
    date: Date,
    description?: string,
    total: number,
    _id: string
}

export interface UpdateExpenseEntryModel {
    entryId: string,
    date: Date,
    category: string,
    items: { item: { name: string, price: number, _id: string }, qty: number }[],
    description?: string
}

export interface CreateExpenseEntryModel {
    date: Date,
    category: string,
    items: { item: { name: string, price: number, _id: string }, qty: number }[],
    description?: string
}

export interface FetchFilteredEntriesModel {
    categories: string[],
    itemsList: string[],
    fromDate: Date | null,
    endDate: Date | null,
    timePeriod: 'l2d' | 'yesterday' | 'today' | null
}