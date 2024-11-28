import { Timestamp } from "@angular/fire/firestore";

// export interface Messages {
//     id?:string;
//     message?: string;
//     imgLink?: string;
//     reaction?: string;
//     timestamp: Timestamp;
//     firstName:string;
//     lastName:string;
//     userId: string;
// }
export interface Messages {
    id?:string;
    chatParticipants: [];
    message?: string;
    receiverId?: string;
    senderId?: string;
    timestamp: Timestamp;
    senderName:string;
    receiverName:string;
}
