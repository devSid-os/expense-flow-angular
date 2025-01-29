export interface ExpenseItemModel {
    name: string,
    price: number,
    user?: string,
    _id?: string
};

export interface ExpenseCategoryModel {
    name: string,
    user?: string,
    _id?: string
};

export interface ExpenseEntryModel {
    items: [{ item: ExpenseItemModel, qty: number }],
    category: { _id: string, name: string },
    date: Date,
    description?: string,
    user: string,
    total: number,
    _id: string
}

export interface UpdateExpenseEntryModel {
    entryId: string,
    date: Date,
    category: string,
    items: { item: string, qty: number }[],
    description?: string
}

export interface CreateExpenseEntryModel {
    date: Date,
    category: string,
    items: { item: string, qty: number }[],
    description?: string
}

export interface FetchFilteredEntriesModel {
    categories: string[],
    itemsList: string[],
    fromDate: Date | null,
    endDate: Date | null,
    timePeriod: 'l2d' | 'yesterday' | 'today' | null
}