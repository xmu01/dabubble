import { Timestamp } from "@angular/fire/firestore";

export interface ChannelMessage {
    id?:string;
    message?: string;
    senderId?: string;
    timestamp: Timestamp;
    senderName:string;
    reactionsGrouped?: { reaction: string; userNames: string[], count: number }[];
}
