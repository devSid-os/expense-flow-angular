export interface CreateRecipientModel {
    name: string;
    number: string;
    profileUrl?: string;
}

export interface UpdateRecipientModel {
    name: string;
    number: string;
    profileUrl?: string;
}

export interface CreateRecipientEntryModel {
    amount: number;
    recipientId:string;
    remark?: string;
    attachment?: string;
    type: 'in' | 'out';
    mode: 'online' | 'cash';
    date: Date;
}

export interface RecipientModel {
    name: string;
    number: string;
    profileUrl?: string;
    _id: string;
    updatedAt: string;
    createdAt: string;
    in: number;
    out: number;
}