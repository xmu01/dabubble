import { computed, inject, Injectable, signal } from '@angular/core';
import { addDoc, arrayRemove, arrayUnion, collection, deleteDoc, doc, Firestore, getDocs, onSnapshot, orderBy, query, updateDoc, where } from '@angular/fire/firestore';
import { Channels } from '../interfaces/channels';
import { ChannelMessage } from '../interfaces/channelMessage';
import { Users } from '../interfaces/users';
import { UsersService } from './users.service';

@Injectable({
  providedIn: 'root'
})
export class ChannelService {
  private firestore = inject(Firestore);
  channels = signal<Channels[]>([]);
  activeChannel = signal<Channels | null>(null);
  groupedChannelMessages = signal<{ date: string; messages: ChannelMessage[] }[]>([]);
  channelMessageChanged = computed(() => this.groupedChannelMessages().length);

  constructor() { }

  loadChannels() {
    const channelsQuery = query(collection(this.firestore, 'channels'));
    onSnapshot(channelsQuery, (querySnapshot) => {
      const channel = querySnapshot.docs.map((doc) => this.setChannelObject(doc.data(), doc.id));
      this.channels.set(channel);
    });
  }

  loadChannel(channelId: string) {
    const channelDocRef = doc(this.firestore, 'channels', channelId);
    onSnapshot(channelDocRef, (doc) => {
      if (doc.exists()) {
        this.activeChannel.set(this.setChannelObject(doc.data(), doc.id));
      }
      console.log(this.activeChannel()?.name);

    });
  }

  async updateMessage(id: string, message: string) {
    await updateDoc(doc(this.firestore, `channels/${this.activeChannel()?.id}/messages`, id), {
      message: message
    });
  }

  async updateChannel(category: string, text: string) {
    if (category == 'name') {
      await updateDoc(doc(this.firestore, `channels/${this.activeChannel()?.id}`), {
        name: text
      });
    }
    if (category == 'description') {
      await updateDoc(doc(this.firestore, `channels/${this.activeChannel()?.id}`), {
        description: text
      });
    }
  }

  async addMembers(userId: string) {
    await updateDoc(doc(this.firestore, `channels/${this.activeChannel()?.id}`), {
      members: arrayUnion(userId)
    });
  }

  async removeMembers(userId: string) {
    await updateDoc(doc(this.firestore, `channels/${this.activeChannel()?.id}`), {
      members: arrayRemove(userId)
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

  private setChannelObject(obj: any, id: string): Channels {
    return {
      id: id,
      name: obj.name || '',
      description: obj.description || '',
      created_by: obj.created_by || '',
      members: obj.members || []
    };
  }

  saveNewChannel(channel: Channels) {
    const channelCollectionRef = collection(this.firestore, `channels`);

    const newChannel = {
      ...channel
    };

    // Erstelle das Hauptdokument (Channel)
    return addDoc(channelCollectionRef, newChannel)
      .then((channelDocRef) => {
        console.log('Channel saved successfully:', channelDocRef.id);

      })
      .then(() => {
        console.log('Messages subcollection initialized successfully.');
      })
      .catch((error) => {
        console.error('Error saving channel or initializing messages:', error);
      });
  }

  saveChannelMessage(message: ChannelMessage, id: string) {
    const userDocRef = collection(this.firestore, `channels/${id}/messages`);

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

  saveChannelAnswer(message: ChannelMessage, id: string) {
    const userDocRef = collection(this.firestore, `channels/${this.activeChannel()?.id}/messages/answers`);

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

  private setChannelMessageObject(obj: any, id: string): ChannelMessage {
    return {
      id: id,
      message: obj.message || '',
      senderName: obj.senderName || '',
      timestamp: obj.timestamp || null,
      senderId: obj.senderId || '',
    };
  }

  toggleReaction(messageId: string, userName: string, reaction: string) {
    const q = query(
      collection(this.firestore, `channels/${this.activeChannel()?.id}/messages/${messageId}/reactions`),
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
        const reactionsRef = collection(this.firestore, `channels/${this.activeChannel()?.id}/messages/${messageId}/reactions`);
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
