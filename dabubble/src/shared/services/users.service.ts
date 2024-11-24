import { Injectable, inject, signal } from '@angular/core';
import { Firestore, collection, doc, onSnapshot, orderBy, query } from '@angular/fire/firestore';
import { Users } from '../interfaces/users';
import { Messages } from '../interfaces/messages';

@Injectable({
  providedIn: 'root'
})
export class UsersService {
  private firestore = inject(Firestore);

  users = signal<Users[]>([]);
  activeUser = signal<Users | null>(null);
  groupedMessages = signal<{ date: string; messages: Messages[] }[]>([]);

  constructor() { }

  /**
   * Loads all users from Firestore and updates the users signal.
   */
  loadUsers() {
    const usersQuery = query(collection(this.firestore, 'users'));
    onSnapshot(usersQuery, (querySnapshot) => {
      const users = querySnapshot.docs.map((doc) => this.setUserObject(doc.data(), doc.id));
      this.users.set(users);
    });
  }

  /**
   * Loads a specific user by ID and updates the activeUser signal.
   * @param userId - The ID of the user to load.
   */
  loadUser(userId: string) {
    const userDocRef = doc(this.firestore, 'users', userId);
    onSnapshot(userDocRef, (doc) => {
      if (doc.exists()) {
        this.activeUser.set(this.setUserObject(doc.data(), doc.id));
      }
    });
  }

  /**
   * Loads messages for a specific user and groups them by date.
   * @param userId - The ID of the user whose messages to load.
   */
  loadMessages(userId: string) {
    const userDocRef = doc(this.firestore, `users/${userId}`);
    const messagesQuery = query(
      collection(userDocRef, 'messages'),
      orderBy('timestamp', 'asc')
    );

    onSnapshot(messagesQuery, (querySnapshot) => {
      const messages = querySnapshot.docs.map((doc) => this.setMessageObject(doc.data(), doc.id));
      const grouped = this.groupMessagesByDate(messages);
      this.groupedMessages.set(grouped);
    });
  }

  /**
   * Groups messages by their date.
   */
  private groupMessagesByDate(messages: Messages[]): { date: string; messages: Messages[] }[] {
    const grouped = messages.reduce((acc, message) => {
      const dateKey = message.timestamp?.toDate().toISOString().split('T')[0];
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(message);
      return acc;
    }, {} as Record<string, Messages[]>);

    return Object.keys(grouped)
      .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())
      .map((date) => ({ date, messages: grouped[date] }));
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

  private setMessageObject(obj: any, id: string): Messages {
    return {
      id: id,
      message: obj.message || '',
      imgLink: obj.imgLink || '',
      reaction: obj.reaction || '',
      timestamp: obj.timestamp || null,
      firstName: obj.firstName || '',
      lastName: obj.lastName || '',
      userId: obj.userId || '',
    };
  }
}