import  { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import io from 'socket.io-client';
import { Message, User } from '../types';
import { ArrowLeft, Send } from 'lucide-react';

const API_URL = 'https://simplechat-backend.vercel.app';
const socket = io(API_URL);

function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [user, setUser] = useState<User | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { userId } = useParams();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (!token || !storedUser || !userId) {
      navigate('/users');
      return;
    }

    const parsedUser = JSON.parse(storedUser);
    setUser(parsedUser);
    fetchSelectedUser(token, userId);
    socket.emit('join', parsedUser.id);

    socket.on('message', (message: Message) => {
      if (
        (message.sender_id === parsedUser.id && message.recipient_id === Number(userId)) ||
        (message.sender_id === Number(userId) && message.recipient_id === parsedUser.id)
      ) {
        setMessages((prevMessages) => [...prevMessages, message]);
      }
    });

    return () => {
      socket.off('message');
    };
  }, [navigate, userId]);

  const fetchSelectedUser = async (token: string, userId: string) => {
    try {
      const response = await axios.get<User>(`${API_URL}/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSelectedUser(response.data);
      fetchMessages(token, userId);
    } catch (error) {
      console.error('Error fetching selected user:', error);
    }
  };

  const fetchMessages = async (token: string, recipientId: string) => {
    try {
      const response = await axios.get<Message[]>(`${API_URL}/messages`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { recipient_id: recipientId },
      });
      setMessages(response.data);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() && user && selectedUser) {
      socket.emit('sendMessage', {
        senderId: user.id,
        recipientId: selectedUser.id,
        content: newMessage,
      });
      setNewMessage('');
    }
  };

  const getInitial = (username: string) => {
    return username.charAt(0).toUpperCase();
  };

  const getRandomColor = (username: string) => {
    const colors = [
      'bg-pink-500',
      'bg-purple-500',
      'bg-indigo-500',
      'bg-blue-500',
      'bg-green-500',
      'bg-yellow-500',
      'bg-red-500',
    ];
    const index = username.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  if (!selectedUser) return null;

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6 flex items-center space-x-4">
            <button
              onClick={() => navigate('/users')}
              className="text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-6 w-6" />
            </button>
            <div className={`w-12 h-12 rounded-full ${getRandomColor(selectedUser.username)} flex items-center justify-center text-white text-xl font-semibold`}>
              {getInitial(selectedUser.username)}
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">{selectedUser.username}</h2>
              <p className="text-sm text-gray-500">Online</p>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                msg.sender_id === user?.id
                  ? 'bg-indigo-600 text-white rounded-br-none'
                  : 'bg-white text-gray-900 rounded-bl-none shadow'
              }`}
            >
              <p>{msg.content}</p>
              <p className={`text-xs mt-1 ${
                msg.sender_id === user?.id ? 'text-indigo-200' : 'text-gray-500'
              }`}>
                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="bg-white border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <form onSubmit={handleSubmit} className="flex items-center space-x-4">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 rounded-full px-6 py-3 bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
            />
            <button
              type="submit"
              className="rounded-full p-3 bg-indigo-600 text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <Send className="h-5 w-5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Chat;

