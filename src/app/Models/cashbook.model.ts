export interface CreateCashBookEntryModel {
    date: Date, type: 'in' | 'out',
    mode: 'cash' | 'online',
    amount: number,
    description?: string,
    url?: string
}

export interface CashbookModel {
    date: Date,
    type: 'in' | 'out',
    mode: 'cash' | 'online',
    amount: number,
    remark?: string,
    attachment?: string,
    id: string,
    user: string
}