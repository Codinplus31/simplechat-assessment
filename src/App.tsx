import  { useState, useEffect } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import Login from './Login.tsx';
import Chat from './Chat.tsx';

const API_URL = 'https://simplechat-backend.vercel.app';
const socket = io(API_URL);

function App() {
  const [user, setUser] = useState(null);
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchMessages(token);
    }

    socket.on('message', (message) => {
      setMessages((prevMessages) => [...prevMessages, message]);
    });

    return () => {
      socket.off('message');
    };
  }, []);

  const fetchMessages = async (token) => {
    try {
      const response = await axios.get(`${API_URL}/messages`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessages(response.data);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const handleLogin = async (username, password) => {
    try {
      const response = await axios.post(`${API_URL}/login`, { username, password });
      const { token } = response.data;
      localStorage.setItem('token', token);
      setUser({ username });
      fetchMessages(token);
    } catch (error) {
      console.error('Login error:', error);
      alert('Invalid username or password');
    }
  };

  const handleSendMessage = (message) => {
    socket.emit('sendMessage', { userId: user.id, message });
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
