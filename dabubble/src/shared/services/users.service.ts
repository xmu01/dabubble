import { Injectable, inject, signal, effect } from '@angular/core';
import { Firestore, Timestamp, collection, doc, getDoc, onSnapshot, query } from '@angular/fire/firestore';
import { Users } from '../interfaces/users';
import { Messages } from '../interfaces/messages';

@Injectable({
  providedIn: 'root'
})
export class UsersService {
  private firestore = inject(Firestore);

  // Reactive signals
  users = signal<Users[]>([]);
  messages = signal<Messages[]>([]);
  selectedUserId = signal<string | null>(null);

  constructor() {
    this.subUserMessagesList(); // Initialize the reactive subscription
    this.loadUsers();
  }

  loadUsers() {
    const usersQuery = query(collection(this.firestore, 'users'));
    onSnapshot(usersQuery, (querySnapshot) => {
      const users = querySnapshot.docs.map((doc) => this.setUserObject(doc.data(), doc.id));
      this.users.set(users); // Update the users signal
    }, (error) => console.error('Error loading users:', error));
  }

  private getUsersRef() {
    return collection(this.firestore, 'users');
  }

  private getUserMessagesRef(userId: string) {
    const userDocRef = doc(this.firestore, `users/${userId}`); // Reference to a specific user
    return collection(userDocRef, 'messages'); // Reference to the 'messages' subcollection
  }

  private subUserMessagesList() {
    // Use Angular's global `effect` function to create reactivity
    effect(() => {
      const userId = this.selectedUserId();
      if (!userId) {
        this.messages.set([]);
        return;
      }
      const q = query(this.getUserMessagesRef(userId));
      onSnapshot(q, (list) => {
        const messages: Messages[] = list.docs.map((doc) =>
          this.setUserMessagesObject(doc.data(), doc.id)
        );
        this.messages.set(messages);
      });
    });
  }

  private setUserObject(obj: any, id: string): Users {
    return {
      userId: id,
      firstName: obj.firstName || '',
      lastName: obj.lastName || '',
      avatar: obj.avatar || '',
      email: obj.email || '',
    };
  }

  private setUserMessagesObject(obj: any, id: string): Messages {
    return {
      id: id,
      firstName: obj.firstName || '',
      lastName: obj.lastName || '',
      message: obj.message || '',
      imgLink: obj.imgLink || '',
      reaction: obj.reaction || '',
      timestamp: obj.timestamp || '',
      userId: obj.userId,
    };
  }

  getUserById(userId: string): Promise<Users | null> {
    const userDocRef = doc(this.firestore, `users/${userId}`);
    return getDoc(userDocRef).then((docSnap) => {
      if (docSnap.exists()) {
        return this.setUserObject(docSnap.data(), docSnap.id);
      }
      return null;
    }).catch((error) => {
      console.error('Error fetching user:', error);
      throw error;
    });
  }

  getSubMessagesByUserId(userId: string): Promise<{ date: string; messages: Messages[] }[]> {
    const messagesRef = this.getUserMessagesRef(userId);
    const q = query(messagesRef);

    return new Promise((resolve, reject) => {
      onSnapshot(q, (querySnapshot) => {
        const messages: Messages[] = querySnapshot.docs.map((doc) => {
          const data = doc.data() as Messages;
          const convertedTimestamp =
            data.timestamp instanceof Timestamp ? data.timestamp.toDate() : data.timestamp;

          return { ...data, timestamp: convertedTimestamp, id: doc.id };
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

        resolve(result);
      }, (error) => reject(error));
    });
  }

  setSelectedUserId(userId: string): void {
    this.selectedUserId.set(userId);
  }
}
