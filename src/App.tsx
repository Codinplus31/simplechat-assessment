import  { useState, useEffect } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import Login from './components/Login';
import Chat from './components/Chat';
import { User, Message } from './types';

const API_URL = 'http://localhost:3001';
const socket = io(API_URL);

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchMessages(token);
    }

    socket.on('message', (message: Message) => {
      setMessages((prevMessages) => [...prevMessages, message]);
    });

    return () => {
      socket.off('message');
    };
  }, []);

  const fetchMessages = async (token: string) => {
    try {
      const response = await axios.get<Message[]>(`${API_URL}/messages`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessages(response.data);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const handleLogin = async (username: string, password: string) => {
    try {
      const response = await axios.post<{ token: string; user: User }>(`${API_URL}/login`, { username, password });
      const { token, user } = response.data;
      localStorage.setItem('token', token);
      setUser(user);
      fetchMessages(token);
    } catch (error) {
      console.error('Login error:', error);
      alert('Invalid username or password');
    }
  };

  const handleSendMessage = (message: string) => {
    if (user) {
      socket.emit('sendMessage', { userId: user.id, message });
    }
  };

  return (
    <div className="App">
      {user ? (
        <Chat messages={messages} onSendMessage={handleSendMessage} />
      ) : (
        <Login onLogin={handleLogin} />
      )}
    </div>
  );
}

export default App;

