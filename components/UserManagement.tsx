import React, { useState } from 'react';
import { User } from '../types';

interface UserManagementProps {
    users: User[];
    setUsers: React.Dispatch<React.SetStateAction<User[]>>;
    currentUser: User;
}

const UserManagement: React.FC<UserManagementProps> = ({ users, setUsers, currentUser: loggedInUser }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [userName, setUserName] = useState('');
    const [userRole, setUserRole] = useState<'separator' | 'confirmer'>('separator');

    const handleOpenModal = (user: User | null = null) => {
        setEditingUser(user);
        setUserName(user ? user.name : '');
        setUserRole(user ? user.role : 'separator');
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingUser(null);
        setUserName('');
        setUserRole('separator');
    };

    const handleSaveUser = () => {
        if (!userName.trim()) {
            alert('O nome do usuário não pode estar em branco.');
            return;
        }
        if (editingUser) {
            // Edit user
            setUsers(users.map(u => u.id === editingUser.id ? { ...u, name: userName, role: userRole } : u));
        } else {
            // Add new user
            const newUser: User = {
                id: `user${Date.now()}`,
                name: userName,
                role: userRole,
            };
            setUsers([...users, newUser]);
        }
        handleCloseModal();
    };

    const handleDeleteUser = (userId: string) => {
        if (userId === loggedInUser.id) {
            alert('Você não pode excluir o usuário que está logado no sistema.');
            return;
        }
        if (window.confirm('Tem certeza que deseja excluir este usuário?')) {
            setUsers(prevUsers => prevUsers.filter(u => u.id !== userId));
        }
    };

    return (
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-100">Gerenciamento de Usuários</h2>
                <button
                    onClick={() => handleOpenModal()}
                    className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700"
                >
                    Adicionar Usuário
                </button>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full text-sm text-left text-gray-300">
                    <thead className="text-xs text-gray-400 uppercase bg-gray-700/50">
                        <tr>
                            <th scope="col" className="px-6 py-3">Nome</th>
                            <th scope="col" className="px-6 py-3">Função</th>
                            <th scope="col" className="px-6 py-3 text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(user => (
                            <tr key={user.id} className="border-b border-gray-700 hover:bg-gray-700/30">
                                <td className="px-6 py-4 font-medium">{user.name}</td>
                                <td className="px-6 py-4 capitalize">{user.role === 'separator' ? 'Separador' : 'Conferente'}</td>
                                <td className="px-6 py-4 text-right space-x-2">
                                    <button onClick={() => handleOpenModal(user)} className="font-medium text-blue-400 hover:underline">Editar</button>
                                    <button 
                                        onClick={() => handleDeleteUser(user.id)} 
                                        className="font-medium text-red-400 hover:underline disabled:text-gray-500 disabled:cursor-not-allowed disabled:hover:no-underline"
                                        disabled={user.id === loggedInUser.id}
                                    >
                                        Excluir
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-gray-800 rounded-lg shadow-2xl p-6 border border-gray-700 w-full max-w-md m-4">
                        <h2 className="text-xl font-bold text-gray-100">{editingUser ? 'Editar Usuário' : 'Adicionar Usuário'}</h2>
                        <div className="mt-6 space-y-4">
                            <div>
                                <label htmlFor="userName" className="block text-sm font-medium text-gray-400">Nome</label>
                                <input
                                    type="text"
                                    id="userName"
                                    value={userName}
                                    onChange={e => setUserName(e.target.value)}
                                    className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-gray-200"
                                />
                            </div>
                            <div>
                                <label htmlFor="userRole" className="block text-sm font-medium text-gray-400">Função</label>
                                <select
                                    id="userRole"
                                    value={userRole}
                                    onChange={e => setUserRole(e.target.value as 'separator' | 'confirmer')}
                                    className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-gray-200"
                                >
                                    <option value="separator">Separador</option>
                                    <option value="confirmer">Conferente</option>
                                </select>
                            </div>
                        </div>
                        <div className="mt-8 flex justify-end gap-4">
                            <button onClick={handleCloseModal} className="px-4 py-2 bg-gray-600 text-white font-semibold rounded-md hover:bg-gray-700">Cancelar</button>
                            <button onClick={handleSaveUser} className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700">Salvar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserManagement;