import { Injectable, inject } from '@angular/core';
import { Firestore, Timestamp, collection, doc, getDoc, onSnapshot, query, where } from '@angular/fire/firestore';
import { BehaviorSubject, Observable } from 'rxjs';
import { Users } from '../interfaces/users';
import { Messages } from '../interfaces/messages';

@Injectable({
  providedIn: 'root'
})
export class UsersService {
  private firestore = inject(Firestore);

  private usersSubject = new BehaviorSubject<Users[]>([]);
  users$ = this.usersSubject.asObservable();

  private selectedUserIdSubject = new BehaviorSubject<string | null>(null);
  selectedUserId$ = this.selectedUserIdSubject.asObservable();

  constructor() { 
    this.subUserList();
  }

  private getUsersRef() {
    return collection(this.firestore, 'users');
  }

  private subUserList() {
    const q = query(this.getUsersRef());
    onSnapshot(q, (list) => {
      const users: Users[] = [];
      list.forEach((element) => {
        users.push(this.setUserObject(element.data(), element.id));
      });
      this.usersSubject.next(users);
    });
  }

  private setUserObject(obj: any, id: string): Users {
    return {
      userId: id,
      firstName: obj.firstName || "",
      lastName: obj.lastName || "",
      avatar: obj.avatar || ""
    };
  }

  getMessagesByUserId(userId: string): Observable<{ date: string; messages: Messages[] }[]> {
    return new Observable<{ date: string; messages: Messages[] }[]>((observer) => {
      const messagesRef = collection(this.firestore, 'messages');
      const q = query(messagesRef, where('userId', '==', userId));
  
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const messages: Messages[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data() as Messages;
  
          const convertedTimestamp = data.timestamp instanceof Timestamp
            ? data.timestamp.toDate()
            : data.timestamp;
  
          messages.push({ ...data, timestamp: convertedTimestamp, id: doc.id });
        });
  
        const groupedMessages = messages.reduce((groups: Record<string, Messages[]>, message) => {
          const date = (message.timestamp as Date).toLocaleDateString(); 
          if (!groups[date]) {
            groups[date] = [];
          }
          groups[date].push(message);
          return groups;
        }, {});
  
        const result = Object.entries(groupedMessages).map(([date, messages]) => ({
          date,
          messages,
        }));
  
        observer.next(result);
      });
  
      return () => unsubscribe();
    });
  }
  
  setSelectedUserId(userId: string): void {
    this.selectedUserIdSubject.next(userId);
  }

}
