import { Injectable, computed, inject, signal } from '@angular/core';
import { Firestore, Timestamp, addDoc, arrayUnion, collection, doc, getDocs, onSnapshot, orderBy, query, updateDoc, where } from '@angular/fire/firestore';
import { Users } from '../interfaces/users';
import { Messages } from '../interfaces/messages';
import { Channels } from '../interfaces/channels';
import { ChannelMessage } from '../interfaces/channelMessage';

@Injectable({
  providedIn: 'root'
})
export class UsersService {
  private firestore = inject(Firestore);

  users = signal<Users[]>([]);
  channels = signal<Channels[]>([]);
  activeUser = signal<Users | null>(null);
  activeChannel = signal<Channels | null>(null);
  groupedMessages = signal<{ date: string; messages: Messages[] }[]>([]);
  groupedChannelMessages = signal<{ date: string; messages: ChannelMessage[] }[]>([]);
  messageChanged = computed(() => this.groupedMessages().length);
  channelMessageChanged = computed(() => this.groupedChannelMessages().length);

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
 * Loads all users from Firestore and updates the users signal.
 */
  loadChannels() {
    const channelsQuery = query(collection(this.firestore, 'channels'));
    onSnapshot(channelsQuery, (querySnapshot) => {
      const channel = querySnapshot.docs.map((doc) => this.setChannelObject(doc.data(), doc.id));
      this.channels.set(channel);
    });
  }

  /**
   * Loads a specific user by ID and updates the activeUser signal.
   * @param userId - The ID of the user to load.
   */
  loadUser(userId: string) {
    this.activeChannel.set(null);
    const userDocRef = doc(this.firestore, 'users', userId);
    onSnapshot(userDocRef, (doc) => {
      if (doc.exists()) {
        this.activeUser.set(this.setUserObject(doc.data(), doc.id));
      }
    });
  }

  loadChannel(channelId: string) {
    this.activeUser.set(null);
    const channelDocRef = doc(this.firestore, 'channels', channelId);
    onSnapshot(channelDocRef, (doc) => {
      if (doc.exists()) {
        this.activeChannel.set(this.setChannelObject(doc.data(), doc.id));
      }
    });
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

  loadMessageChannelChat(channelId: string) {
    const q = query(
      collection(this.firestore, `channels/${channelId}/messages`),
      orderBy('timestamp', 'asc')
    );

    onSnapshot(q, (querySnapshot) => {
      const messages = querySnapshot.docs.map((doc) => this.setChannelMessageObject(doc.data(), doc.id));

      const grouped = this.groupChannelMessagesByDate(messages);
      this.groupedChannelMessages.set(grouped);

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

  /**
 * Groups messages by their date.
 */
  private groupChannelMessagesByDate(messages: ChannelMessage[]): { date: string; messages: ChannelMessage[] }[] {
    const grouped = messages.reduce((acc, message) => {
      const dateKey = message.timestamp?.toDate().toISOString().split('T')[0];
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(message);
      return acc;
    }, {} as Record<string, ChannelMessage[]>);

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

  private setChannelObject(obj: any, id: string): Channels {
    return {
      id: id,
      name: obj.name || '',
      description: obj.description || '',
      created_by: obj.created_by || '',
      members: obj.members
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

  saveChannelMessage(message: ChannelMessage, id: string) {
    const userDocRef = collection(this.firestore, `channels/${id}/messages`);

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
      reactions: obj.reactions || [],
    };
  }

  private setChannelMessageObject(obj: any, id: string): ChannelMessage {
    return {
      id: id,
      message: obj.message || '',
      senderName: obj.senderName || '',
      timestamp: obj.timestamp || null,
      senderId: obj.senderId || '',
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

  async updateMessage(id: string, message:string){
    await updateDoc(doc(this.firestore, "messages", id), {
      message: message
    });
  }
}