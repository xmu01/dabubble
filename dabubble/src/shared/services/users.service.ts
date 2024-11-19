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

  private messagesSubject = new BehaviorSubject<Messages[]>([]);
  messages$ = this.messagesSubject.asObservable();

  private selectedUserIdSubject = new BehaviorSubject<string | null>(null);
  selectedUserId$ = this.selectedUserIdSubject.asObservable();

  constructor() {
    this.subUserList();
    this.subUserMessagesList();
  }

  private getUsersRef() {
    return collection(this.firestore, 'users');
  }

  private getUserMessagesRef(userId: string) {
    const userDocRef = doc(this.firestore, `users/${userId}`); // Reference to a specific user
    return collection(userDocRef, 'messages'); // Reference to the 'messages' subcollection
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

  private subUserMessagesList() {
    this.selectedUserId$.subscribe((userId) => {
      if (!userId) {
        return;
      }
      const q = query(this.getUserMessagesRef(userId));
      onSnapshot(q, (list) => {
        const messages: Messages[] = [];
        list.forEach((element) => {
          messages.push(this.setUserMessagesObject(element.data(), element.id));
        });
        this.messagesSubject.next(messages);
      });
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

  private setUserMessagesObject(obj: any, id: string): Messages {
    return {
      id: id,
      firstName: obj.firstName || "",
      lastName: obj.lastName || "",
      message: obj.message || "",
      imgLink: obj.firstName || "",
      reaction: obj.reaction || "",
      timestamp: obj.timestamp || "",
      userId: obj.userId
    };
  }

  getUserById(userId: string): Observable<Users | null> {
    return new Observable<Users | null>((observer) => {
      const userDocRef = doc(this.firestore, `users/${userId}`);

      getDoc(userDocRef).then((docSnap) => {
        if (docSnap.exists()) {
          const user = this.setUserObject(docSnap.data(), docSnap.id);
          observer.next(user);
        } else {
          observer.next(null);
        }
      }).catch((error) => {
        console.error('Error fetching user:', error);
        observer.error(error);
      });
    });
  }

  getSubMessagesByUserId(userId: string): Observable<{ date: string; messages: Messages[] }[]> {
    return new Observable<{ date: string; messages: Messages[] }[]>((observer) => {
      const messagesRef = this.getUserMessagesRef(userId);
      const q = query(messagesRef);

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
