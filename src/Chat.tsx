import  { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import io from 'socket.io-client';
import { Message, User } from './types';
import UserList from './UserList';

const API_URL = 'https://simplechat-backend.vercel.app';
const socket = io(API_URL);

function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (!token || !storedUser) {
      navigate('/login');
      return;
    }

    const parsedUser = JSON.parse(storedUser);
    setUser(parsedUser);
    fetchUsers(token);
    
    console.log('Joining room:', parsedUser.id);
    socket.emit('join', parsedUser.id);

    socket.on('message', (message: Message) => {
      console.log('Received message:', message);
      if (
        (message.sender_id === parsedUser.id && message.recipient_id === selectedUser?.id) ||
        (message.sender_id === selectedUser?.id && message.recipient_id === parsedUser.id)
      ) {
        setMessages((prevMessages) => [...prevMessages, message]);
      }
    });

    return () => {
      socket.off('message');
    };
  }, [navigate, selectedUser]);

  const fetchUsers = async (token: string) => {
    try {
      const response = await axios.get<User[]>(`${API_URL}/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchMessages = async () => {
    if (!user || !selectedUser) return;

    try {
      const token = localStorage.getItem('token');
      const response = await axios.get<Message[]>(`${API_URL}/messages`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { recipient_id: selectedUser.id },
      });
      setMessages(response.data);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  useEffect(() => {
    if (selectedUser) {
      fetchMessages();
    }
  }, [selectedUser]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() && user && selectedUser) {
      alert(`Sending message: ${JSON.stringify({
        senderId: user.id,
        recipientId: selectedUser.id,
        content: newMessage,
      })}`);
      socket.emit('sendMessage', {
        senderId: user.id,
        recipientId: selectedUser.id,
        content: newMessage,
      });
      setNewMessage('');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Chat App</h1>
          <button
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            Logout
          </button>
        </div>
      </div>
      <div className="flex-1 flex overflow-hidden">
        <div className="w-1/4 p-4 overflow-y-auto">
          <UserList users={users} onSelectUser={setSelectedUser} selectedUser={selectedUser} />
        </div>
        <div className="flex-1 flex flex-col p-4">
          {selectedUser ? (
            <>
              <div className="bg-white shadow-md rounded-lg p-4 mb-4">
                <h2 className="text-xl font-semibold">Chat with {selectedUser.username}</h2>
              </div>
              <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`p-3 rounded-lg ${
                      msg.sender_id === user?.id ? 'bg-indigo-100 ml-auto' : 'bg-white'
                    }`}
                    style={{ maxWidth: '70%' }}
                  >
                    <p>{msg.content}</p>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
              <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-4">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    type="submit"
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                  >
                    Send
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-xl text-gray-500">Select a user to start chatting</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Chat;

