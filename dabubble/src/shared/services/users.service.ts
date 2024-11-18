import { Injectable, inject } from '@angular/core';
import { Firestore, collection, doc, getDoc, onSnapshot, query, where } from '@angular/fire/firestore';
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

  getMessagesByUserId(userId: string): Observable<Messages[]> {
    return new Observable<Messages[]>((observer) => {
      const messagesRef = collection(this.firestore, 'messages');
      const q = query(messagesRef, where('userId', '==', userId)); 

      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const messages: Messages[] = [];
        querySnapshot.forEach((doc) => {
          messages.push({ ...(doc.data() as Messages), id: doc.id });
        });
        observer.next(messages); 
      });

      return () => unsubscribe();
    });
  }

  setSelectedUserId(userId: string): void {
    this.selectedUserIdSubject.next(userId);
  }

}
