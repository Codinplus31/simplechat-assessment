export interface User {
  id: number;
  username: string;
}

export interface Message {
  id: number;
  user_id: number;
  content: string;
  created_at: string;
}

