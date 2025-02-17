import { computed, inject, Injectable, signal } from '@angular/core';
import { addDoc, arrayRemove, arrayUnion, collection, deleteDoc, doc, Firestore, getDoc, getDocs, onSnapshot, orderBy, query, updateDoc, where } from '@angular/fire/firestore';
import { Channels } from '../interfaces/channels';
import { ChannelMessage } from '../interfaces/channelMessage';

@Injectable({
  providedIn: 'root'
})
export class ChannelService {
  private firestore = inject(Firestore);
  channels = signal<Channels[]>([]);
  activeChannel = signal<Channels | null>(null);
  activeAnswer = signal<string>('');
  groupedChannelMessages = signal<{ date: string; messages: ChannelMessage[] }[]>([]);
  channelMessageChanged = computed(() => this.groupedChannelMessages().length);
  groupedChannelAnswers = signal<{ date: string; messages: ChannelMessage[] }[]>([]);
  channelAnswersChanged = computed(() => this.groupedChannelMessages().length);
  showThread = signal<boolean>(false);
  openThreadMobile = signal<boolean>(false);


  changeThreadVisibility() {
      this.showThread.update(value => !value);
  }

  constructor() { }

  loadChannels() {
    const channelsQuery = query(collection(this.firestore, 'channels'), orderBy('created_at', 'asc'));
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
    });
  }

  async updateMessage(id: string, message: string) {
    await updateDoc(doc(this.firestore, `channels/${this.activeChannel()?.id}/messages`, id), {
      message: message
    });
  }

  async updateAnswer(id: string, message: string) {
    await updateDoc(doc(this.firestore, `channels/${this.activeChannel()?.id}/messages/${this.activeAnswer()}/answers`, id), {
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

  async addMembers(userIds: string[]): Promise<void> {
    if (!userIds.length) return;
  
    await updateDoc(doc(this.firestore, `channels/${this.activeChannel()?.id}`), {
      members: arrayUnion(...userIds) // Füge mehrere Benutzer-IDs hinzu
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

  loadAnswersChannelChat(channelId: string | undefined, messageId: string | undefined) {
    if (!channelId || !messageId) return;

    // Abfrage der ursprünglichen Nachricht
    const messageRef = doc(this.firestore, `channels/${channelId}/messages/${messageId}`);
    getDoc(messageRef).then((messageDoc) => {
      if (messageDoc.exists()) {
        const originalMessage = this.setChannelMessageObject(messageDoc.data(), messageDoc.id);

        // Abfrage der Antworten
        const q = query(
          collection(this.firestore, `channels/${channelId}/messages/${messageId}/answers/`),
          orderBy('timestamp', 'asc')
        );

        onSnapshot(q, (querySnapshot) => {
          const answers = querySnapshot.docs.map((doc) => this.setChannelMessageObject(doc.data(), doc.id));

          // Kombinieren der ursprünglichen Nachricht mit den Antworten
          const allMessages = [originalMessage, ...answers];
          const grouped = this.groupChannelMessagesByDate(allMessages);

          // Setzen der gruppierten Nachrichten
          this.groupedChannelAnswers.set(grouped);
        });
      } else {
        console.error('Original message does not exist');
      }
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
      created_at: obj.created_at,
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

      })
      .then(() => {
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
      })
      .catch((error) => {
        console.error('Error saving message:', error);
      });
  }

  saveChannelAnswer(message: ChannelMessage) {
    const userDocRef = collection(this.firestore, `channels/${this.activeChannel()?.id}/messages/${this.activeAnswer()}/answers`);

    const newMessage = {
      ...message,
      timestamp: message.timestamp || new Date()
    };

    return addDoc(userDocRef, newMessage)
      .then(() => {
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

  toggleAnswerReaction(messageId: string, userName: string, reaction: string) {
    const q = query(
      collection(this.firestore, `channels/${this.activeChannel()?.id}/messages/${this.activeAnswer()}/answers/${messageId}/reactions`),
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
        const reactionsRef = collection(this.firestore, `channels/${this.activeChannel()?.id}/messages/${this.activeAnswer()}/answers/${messageId}/reactions`);
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
