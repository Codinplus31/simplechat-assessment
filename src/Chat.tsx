import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import io from 'socket.io-client';
import { Message, User } from './types';
import { ArrowLeft, Send } from 'lucide-react';
import Preloader from './Preloader';

const API_URL = 'https://simplechat-backend-f4w5.onrender.com';
const socket = io(API_URL);

function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [user, setUser] = useState<User | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isUserOnline, setIsUserOnline] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<number>();
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

    // Connect to socket
    socket.connect();
    console.log('Connecting to socket...');

    socket.on('connect', () => {
      console.log('Socket connected');
      socket.emit('user_connected', parsedUser.id);
    });

    // Listen for user status changes
    socket.on('user_status_change', ({ userId: statusUserId, status }) => {
      console.log(`User status change: ${statusUserId} - ${status}`);
      if (statusUserId === Number(userId)) {
        setIsUserOnline(status === 'online');
      }
    });

    // Listen for typing status
    socket.on('typing_status', ({ userId: typingUserId, isTyping: userIsTyping }) => {
      console.log(`Typing status: ${typingUserId} - ${userIsTyping}`);
      if (typingUserId === Number(userId)) {
        setIsTyping(userIsTyping);
      }
    });

    socket.on('message', (message: Message) => {
      console.log('Received message:', message);
      if (
        (message.sender_id === parsedUser.id && message.recipient_id === Number(userId)) ||
        (message.sender_id === Number(userId) && message.recipient_id === parsedUser.id)
      ) {
        setMessages((prevMessages) => [...prevMessages, message]);
        setIsTyping(false);
      }
    });

    return () => {
      console.log('Disconnecting socket...');
      socket.off('connect');
      socket.off('user_status_change');
      socket.off('typing_status');
      socket.off('message');
      socket.disconnect();
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
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching messages:', error);
      setIsLoading(false);
    }
  };

  const handleTyping = useCallback(() => {
    if (user && selectedUser) {
      console.log('Emitting start_typing event');
      socket.emit('start_typing', {
        userId: user.id,
        recipientId: selectedUser.id
      });

      // Clear existing timeout
      if (typingTimeoutRef.current) {
        window.clearTimeout(typingTimeoutRef.current);
      }

      // Set new timeout
      typingTimeoutRef.current = window.setTimeout(() => {
        console.log('Emitting stop_typing event');
        socket.emit('stop_typing', {
          userId: user.id,
          recipientId: selectedUser.id
        });
      }, 1000);
    }
  }, [user, selectedUser]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() && user && selectedUser) {
      console.log('Sending message:', newMessage);
      socket.emit('sendMessage', {
        senderId: user.id,
        recipientId: selectedUser.id,
        content: newMessage,
      });
      setNewMessage('');
      
      // Clear typing timeout
      if (typingTimeoutRef.current) {
        window.clearTimeout(typingTimeoutRef.current);
      }
      console.log('Emitting stop_typing event after sending message');
      socket.emit('stop_typing', {
        userId: user.id,
        recipientId: selectedUser.id
      });
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

  if (isLoading) {
    return <Preloader />;
  }

  if (!selectedUser) return null;

  const getUserStatus = () => {
    if (isTyping) return 'typing...';
    if (isUserOnline) return 'online';
    return 'offline';
  };

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
            <div className={`w-12 h-12 rounded-full ${getRandomColor(selectedUser?.username || '')} flex items-center justify-center text-white text-xl font-semibold relative`}>
              {selectedUser && getInitial(selectedUser.username)}
              {isUserOnline && (
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full ring-2 ring-white" />
              )}
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">{selectedUser?.username}</h2>
              <p className="text-sm text-gray-500">
                {getUserStatus()}
              </p>
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
              onChange={(e) => {
                setNewMessage(e.target.value);
                handleTyping();
              }}
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

