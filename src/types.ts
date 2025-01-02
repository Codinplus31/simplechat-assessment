export interface User {
  id: number;
  username: string;
}

export interface Message {
  id: number;
  sender_id: number;
  recipient_id: number;
  content: string;
  created_at: string;
}
