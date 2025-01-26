export interface UserModel {
    name: string,
    email: string,
    imageUrl?: string,
    verified: boolean,
    googleId?: string,
    _id: string,
    cashIn: number,
    cashOut: number
}