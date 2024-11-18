import { Timestamp } from "@angular/fire/firestore";

export interface Messages {
    id?:string;
    message?: string;
    imgLink?: string;
    reaction?: string;
    timestamp: Timestamp | Date;
    firstName:string;
    lastName:string
}