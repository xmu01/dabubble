import { Timestamp } from "@angular/fire/firestore";

export interface Channels {
    id?: string;
    name: string;
    description?: string;
    created_by: string;
    created_at: Timestamp;
    members: string[];
}
