export interface EntryModel {
    items?: [{ item: { name: string, price: number, _id: string }, qty: number }];
    category?: string;
    remark?: string;
    createdAt: Date;
    updatedAt: Date;
    date: Date;
    attachment?: string;
    _id: string;
    mode: 'online' | 'cash';
    amount: number;
    entryType: 'cashbook' | 'expense' | 'recipient';
    type: 'in' | 'out';
}