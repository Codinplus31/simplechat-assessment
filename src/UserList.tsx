
import { User } from './types';

interface UserListProps {
  users: User[];
  onSelectUser: (user: User) => void;
  selectedUser: User | null;
}

function UserList({ users, onSelectUser, selectedUser }: UserListProps) {
  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden">
      <h2 className="text-lg font-semibold p-4 bg-indigo-600 text-white">Users</h2>
      <ul className="divide-y divide-gray-200">
        {users.map((user) => (
          <li
            key={user.id}
            className={`p-4 cursor-pointer hover:bg-gray-50 ${
              selectedUser?.id === user.id ? 'bg-indigo-100' : ''
            }`}
            onClick={() => onSelectUser(user)}
          >
            {user.username}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default UserList;

              
