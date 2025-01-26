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