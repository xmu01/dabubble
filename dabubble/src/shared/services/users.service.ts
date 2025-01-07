import { Injectable, computed, inject, signal } from '@angular/core';
import { Firestore, Timestamp, addDoc, arrayUnion, collection, deleteDoc, doc, docData, getDoc, getDocs, onSnapshot, orderBy, query, updateDoc, where } from '@angular/fire/firestore';
import { Users } from '../interfaces/users';
import { Messages } from '../interfaces/messages';
import { catchError, map, Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UsersService {
  private firestore = inject(Firestore);

  users = signal<Users[]>([]);
  activeUser = signal<Users | null>(null);
  activeAnswer = signal<string>('');
  groupedMessages = signal<{ date: string; messages: Messages[] }[]>([]);
  messageChanged = computed(() => this.groupedMessages().length);
  groupedMessageAnswers = signal<{ date: string; messages: Messages[] }[]>([]);
  messageAnswersChanged = computed(() => this.groupedMessageAnswers().length);
  showThread = signal<boolean>(false);
  openThreadMobile = signal<boolean>(false);

  changeThreadVisibility() {
      this.showThread.update(value => !value);
  }
  
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

  getUserNameById(userId: string): Observable<string | null> {
    const userDocRef = doc(this.firestore, 'users', userId);
    return docData(userDocRef).pipe(
      map((data: any) => `${data.firstName || ''} ${data.lastName || ''}`.trim() || null),
      catchError((error) => {
        console.error('Fehler beim Abrufen des Namens:', error);
        return of(null); // Gibt `null` zurück, falls ein Fehler auftritt
      })
    );
  }

  loadMessagePrivateChat(sender: string, receiver: string) {
    const participants = [sender, receiver].sort();

    const q = query(
      collection(this.firestore, "messages"),
      where("chatParticipants", "==", participants),
      orderBy('timestamp', 'asc')
    );

    onSnapshot(q, (querySnapshot) => {
      const messages = querySnapshot.docs.map((doc) => this.setMessageObject(doc.data(), doc.id));

      const grouped = this.groupMessagesByDate(messages);
      this.groupedMessages.set(grouped);
    });
  }

  loadMessageAnswers(messageId: string | undefined) {
      if (!messageId) return;
  
      // Abfrage der ursprünglichen Nachricht
      const messageRef = doc(this.firestore, `messages/${messageId}`);
      getDoc(messageRef).then((messageDoc) => {
        if (messageDoc.exists()) {
          const originalMessage = this.setMessageObject(messageDoc.data(), messageDoc.id);
  
          // Abfrage der Antworten
          const q = query(
            collection(this.firestore, `messages/${messageId}/answers/`),
            orderBy('timestamp', 'asc')
          );
  
          onSnapshot(q, (querySnapshot) => {
            const answers = querySnapshot.docs.map((doc) => this.setMessageObject(doc.data(), doc.id));
  
            // Kombinieren der ursprünglichen Nachricht mit den Antworten
            const allMessages = [originalMessage, ...answers];
            const grouped = this.groupMessagesByDate(allMessages);
  
            // Setzen der gruppierten Nachrichten
            this.groupedMessageAnswers.set(grouped);
          });
        } else {
          console.error('Original message does not exist');
        }
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
      status: obj.status || '',
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
    reactions?: string[],
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

    saveMessageAnswer(message: Messages) {
      const userDocRef = collection(this.firestore, `messages/${this.activeAnswer()}/answers`);
  
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
      reactions: obj.reactions || [],
    };
  }

  async addReactionToPrivateMessage(id: string, emoji: string) {
    await updateDoc(doc(this.firestore, "messages", id), {
      reactions: arrayUnion(emoji)
    });
  }

  async updateUserStatus(id: string, status: string) {
    await updateDoc(doc(this.firestore, "users", id), {
      status: status
    });
  }

  async updateMessage(id: string, message: string) {
    await updateDoc(doc(this.firestore, "messages", id), {
      message: message
    });
  }

  async updateAnswer(id: string, message: string) {
    await updateDoc(doc(this.firestore, `messages/${this.activeAnswer()}/answers`, id), {
      message: message
    });
  }

  toggleReaction(messageId: string, userName: string, reaction: string) {
    const q = query(
      collection(this.firestore, `messages/${messageId}/reactions`),
      where("userName", "==", userName),
      where("reaction", "==", reaction)
    );

    getDocs(q).then((querySnapshot) => {
      if (!querySnapshot.empty) {
        // Reaktion existiert bereits: Entfernen
        querySnapshot.forEach((doc) => {
          deleteDoc(doc.ref).then(() => {
          }).catch((error) => {
            console.error("Fehler beim Entfernen der Reaktion: ", error);
          });
        });
      } else {
        // Reaktion hinzufügen
        const reactionsRef = collection(this.firestore, `messages/${messageId}/reactions`);
        addDoc(reactionsRef, { userName, reaction }).then(() => {
        }).catch((error) => {
          console.error("Fehler beim Hinzufügen der Reaktion: ", error);
        });
      }
    }).catch((error) => {
      console.error("Fehler beim Abrufen der Reaktion: ", error);
    });
  }

  toggleAnswerReaction(messageId: string, userName: string, reaction: string) {
    const q = query(
      collection(this.firestore, `messages/${this.activeAnswer()}/answers/${messageId}/reactions`),
      where("userName", "==", userName),
      where("reaction", "==", reaction)
    );

    getDocs(q).then((querySnapshot) => {
      if (!querySnapshot.empty) {
        // Reaktion existiert bereits: Entfernen
        querySnapshot.forEach((doc) => {
          deleteDoc(doc.ref).then(() => {
          }).catch((error) => {
            console.error("Fehler beim Entfernen der Reaktion: ", error);
          });
        });
      } else {
        // Reaktion hinzufügen
        const reactionsRef = collection(this.firestore, `messages/${this.activeAnswer()}/answers/${messageId}/reactions`);
        addDoc(reactionsRef, { userName, reaction }).then(() => {
        }).catch((error) => {
          console.error("Fehler beim Hinzufügen der Reaktion: ", error);
        });
      }
    }).catch((error) => {
      console.error("Fehler beim Abrufen der Reaktion: ", error);
    });
  }
}