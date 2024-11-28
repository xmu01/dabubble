import { Injectable, inject, signal } from '@angular/core';
import { Firestore, Timestamp, addDoc, collection, doc, getDocs, onSnapshot, orderBy, query, where } from '@angular/fire/firestore';
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
  // loadMessages(userId: string) {
  //   const userDocRef = doc(this.firestore, `users/${userId}`);
  //   const messagesQuery = query(
  //     collection(userDocRef, 'messages'),
  //     orderBy('timestamp', 'asc')
  //   );

  //   onSnapshot(messagesQuery, (querySnapshot) => {
  //     const messages = querySnapshot.docs.map((doc) => this.setMessageObject(doc.data(), doc.id));
  //     const grouped = this.groupMessagesByDate(messages);
  //     this.groupedMessages.set(grouped);
  //   });
  // }

  loadMessagePrivateChat(sender: string, receiver: string) {
    const participants = [sender, receiver].sort();

    const q = query(
      collection(this.firestore, "messages"),
      where("chatParticipants", "==", participants),
      orderBy('timestamp', 'asc')
    );

    onSnapshot(q, (querySnapshot) => {
      const messages = querySnapshot.docs.map((doc) => this.setMessageObject(doc.data(), doc.id));      
      console.log(messages);
      
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

  saveMessage(message: {
    chatParticipants: string[],
    message?: string,
    receiverId: string,
    senderId: string,
    timestamp?: Timestamp,
    senderName: string,
    receiverName: string,
  }) {
    const userDocRef = collection(this.firestore, `messages`);

    // Automatisch ein Timestamp hinzufügen, falls nicht angegeben
    const newMessage = {
      ...message,
      timestamp: message.timestamp || new Date()
    };

    return addDoc(userDocRef, newMessage)
      .then(() => {
        console.log('Message saved successfully');
      })
      .catch((error) => {
        console.error('Error saving message:', error);
      });
  }


  private setMessageObject(obj: any, id: string): Messages {
    return {
      id: id,
      message: obj.message || '',
      senderName: obj.senderName || '',
      receiverName: obj.receiverName || '',
      timestamp: obj.timestamp || null,
      receiverId: obj.receiverId || '',
      senderId: obj.senderId || '',
      chatParticipants: obj.chatParticipants || [],
    };
  }
}