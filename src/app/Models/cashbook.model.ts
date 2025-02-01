export interface CreateCashBookEntryModel {
    date: Date,
    type: 'in' | 'out',
    mode: 'cash' | 'online',
    amount: number,
    remark?: string,
    url?: string
}

export interface UpdateCashBookEntryModel {
    date: Date,
    type: 'in' | 'out',
    mode: 'cash' | 'online',
    amount: number,
    remark?: string,
    url?: string,
    entryId: string,
}

export interface CashbookModel {
    date: Date,
    type: 'in' | 'out',
    mode: 'cash' | 'online',
    amount: number,
    remark?: string,
    attachment?: string,
    _id: string,
    user: string,
    createdAt: Date,
    updatedAt: Date
}

export interface FilteredEntriesModel {
    duration: 'today' | 'yesterday' | 'this_month' | 'last_month' | 'custom' | 'all',
    type: 'in' | 'out' | 'all',
    mode: 'cash' | 'online' | 'all',
    customDateRange: Date[]
};