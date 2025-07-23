// lib/session.ts
import { IronSession } from 'iron-session';

export interface SessionData extends IronSession<{}> {
  isLoggedIn?: boolean;
}