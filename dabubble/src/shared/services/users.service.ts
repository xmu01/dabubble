import { Injectable, inject } from '@angular/core';
import { Firestore, collection, onSnapshot, query } from '@angular/fire/firestore';
import { BehaviorSubject, Observable } from 'rxjs';
import { Users } from '../interfaces/users';

@Injectable({
  providedIn: 'root'
})
export class UsersService {
  private firestore = inject(Firestore);

  private usersSubject = new BehaviorSubject<Users[]>([]);
  users$ = this.usersSubject.asObservable();

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
}
