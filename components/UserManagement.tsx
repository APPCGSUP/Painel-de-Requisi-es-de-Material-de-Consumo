import React, { useState } from 'react';
import { User } from '../types';
import { CheckCircleIcon } from './Icons';

interface UserManagementProps {
    users: User[];
    setUsers: React.Dispatch<React.SetStateAction<User[]>>;
    currentUser: User;
    onSelectUser?: (user: User) => void;
}

const UserManagement: React.FC<UserManagementProps> = ({ users, setUsers, currentUser, onSelectUser }) => {
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
            // Update current user if we edited ourselves
            if (currentUser.id === editingUser.id && onSelectUser) {
                onSelectUser({ ...editingUser, name: userName, role: userRole });
            }
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
        if (userId === currentUser.id) {
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
                <div>
                    <h2 className="text-2xl font-bold text-gray-100">Gerenciamento de Usuários</h2>
                    <p className="text-sm text-gray-400 mt-1">Gerencie a equipe e alterne o perfil ativo.</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 transition-colors shadow-lg shadow-blue-900/20"
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
                            <th scope="col" className="px-6 py-3">Status</th>
                            <th scope="col" className="px-6 py-3 text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(user => {
                            const isCurrent = user.id === currentUser.id;
                            return (
                            <tr key={user.id} className={`border-b border-gray-700 transition-colors ${isCurrent ? 'bg-blue-900/10' : 'hover:bg-gray-700/30'}`}>
                                <td className="px-6 py-4 font-medium text-white">{user.name}</td>
                                <td className="px-6 py-4 capitalize">
                                    <span className={`px-2 py-1 rounded text-xs font-bold border ${user.role === 'separator' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' : 'bg-teal-500/10 text-teal-400 border-teal-500/20'}`}>
                                        {user.role === 'separator' ? 'Separador' : 'Conferente'}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    {isCurrent ? (
                                        <span className="flex items-center gap-1 text-green-400 text-xs font-bold uppercase tracking-wider">
                                            <CheckCircleIcon className="h-4 w-4" /> Ativo
                                        </span>
                                    ) : (
                                        onSelectUser && (
                                            <button 
                                                onClick={() => onSelectUser(user)}
                                                className="text-xs font-medium text-gray-500 hover:text-white bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded border border-gray-600 transition-all"
                                            >
                                                Usar este Perfil
                                            </button>
                                        )
                                    )}
                                </td>
                                <td className="px-6 py-4 text-right space-x-3">
                                    <button onClick={() => handleOpenModal(user)} className="font-medium text-blue-400 hover:text-blue-300 hover:underline">Editar</button>
                                    <button 
                                        onClick={() => handleDeleteUser(user.id)} 
                                        className="font-medium text-red-400 hover:text-red-300 hover:underline disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:no-underline"
                                        disabled={isCurrent}
                                    >
                                        Excluir
                                    </button>
                                </td>
                            </tr>
                        )})}
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
                    <div className="bg-gray-800 rounded-lg shadow-2xl p-6 border border-gray-700 w-full max-w-md m-4 transform scale-100 transition-transform">
                        <h2 className="text-xl font-bold text-gray-100">{editingUser ? 'Editar Usuário' : 'Adicionar Usuário'}</h2>
                        <div className="mt-6 space-y-4">
                            <div>
                                <label htmlFor="userName" className="block text-sm font-medium text-gray-400">Nome</label>
                                <input
                                    type="text"
                                    id="userName"
                                    value={userName}
                                    onChange={e => setUserName(e.target.value)}
                                    className="mt-1 block w-full bg-gray-900 border border-gray-600 rounded-md py-2 px-3 text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                    placeholder="Ex: Maria Silva"
                                />
                            </div>
                            <div>
                                <label htmlFor="userRole" className="block text-sm font-medium text-gray-400">Função</label>
                                <select
                                    id="userRole"
                                    value={userRole}
                                    onChange={e => setUserRole(e.target.value as 'separator' | 'confirmer')}
                                    className="mt-1 block w-full bg-gray-900 border border-gray-600 rounded-md py-2 px-3 text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                >
                                    <option value="separator">Separador</option>
                                    <option value="confirmer">Conferente</option>
                                </select>
                            </div>
                        </div>
                        <div className="mt-8 flex justify-end gap-3">
                            <button onClick={handleCloseModal} className="px-4 py-2 bg-gray-700 text-gray-300 font-semibold rounded-md hover:bg-gray-600 transition-colors">Cancelar</button>
                            <button onClick={handleSaveUser} className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-500 shadow-lg shadow-blue-900/20 transition-colors">Salvar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserManagement;