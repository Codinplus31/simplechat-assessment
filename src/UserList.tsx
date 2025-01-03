import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { User } from '../types';
import { LogOut } from 'lucide-react';

const API_URL = 'https://simplechat-backend-f4w5.onrender.com';

const Preloader: React.FC = () => {
  return (
    <div className="flex justify-center items-center h-screen bg-gray-100">
      <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-500"></div>
    </div>
  );
};

function UserList() {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (!token || !storedUser) {
      navigate('/login');
      return;
    }

    setCurrentUser(JSON.parse(storedUser));
    fetchUsers(token);
  }, [navigate]);

  const fetchUsers = async (token: string) => {
    try {
      const response = await axios.get<User[]>(`${API_URL}/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(response.data);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching users:', error);
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
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

  if (isLoading) {
    return <Preloader />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <div className={`w-10 h-10 rounded-full ${getRandomColor(currentUser?.username || '')} flex items-center justify-center text-white font-semibold`}>
                {currentUser && getInitial(currentUser.username)}
              </div>
              <h1 className="ml-3 text-2xl font-semibold text-gray-900">Messages</h1>
            </div>
            <button
              onClick={handleLogout}
              className="inline-flex items-center text-gray-600 hover:text-gray-900"
            >
              <LogOut className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>

      {/* User List */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow">
          <ul className="divide-y divide-gray-200">
            {users.map((user) => (
              <li
                key={user.id}
                className="hover:bg-gray-50 transition-colors duration-150 ease-in-out cursor-pointer"
                onClick={() => navigate(`/chat/${user.id}`)}
              >
                <div className="px-6 py-5 flex items-center space-x-3">
                  <div className={`w-12 h-12 rounded-full ${getRandomColor(user.username)} flex items-center justify-center text-white text-xl font-semibold`}>
                    {getInitial(user.username)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-lg font-medium text-gray-900 truncate">
                      {user.username}
                    </p>
                    <p className="text-sm text-gray-500">
                      Click to start chatting
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default UserList;

