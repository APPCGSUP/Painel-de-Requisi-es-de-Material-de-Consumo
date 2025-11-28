
import React, { useState } from 'react';
import { User } from '../types';
import { CheckCircleIcon, XCircleIcon } from './Icons';

interface UserManagementProps {
    users: User[];
    setUsers: (users: User[]) => void;
    currentUser: User;
    onSelectUser?: (user: User) => void;
    onDeleteUser?: (userId: string) => void;
}

const UserManagement: React.FC<UserManagementProps> = ({ users, setUsers, currentUser, onSelectUser, onDeleteUser }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [userName, setUserName] = useState('');
    const [userRole, setUserRole] = useState<'separator' | 'confirmer' | 'viewer'>('separator');
    
    // State for delete confirmation modal
    const [userToDelete, setUserToDelete] = useState<User | null>(null);

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
        
        let updatedUsers: User[];

        if (editingUser) {
            // Edit user
            updatedUsers = users.map(u => u.id === editingUser.id ? { ...u, name: userName, role: userRole } : u);
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
            updatedUsers = [...users, newUser];
        }
        
        setUsers(updatedUsers);
        handleCloseModal();
    };

    const handleDeleteClick = (user: User) => {
        if (user.id === currentUser.id) {
            alert('Você não pode excluir o usuário que está logado no sistema.');
            return;
        }
        setUserToDelete(user);
    };

    const confirmDelete = () => {
        if (!userToDelete) return;

        if (onDeleteUser) {
            onDeleteUser(userToDelete.id);
        } else {
            // Fallback to local state update if no delete handler
            setUsers(users.filter(u => u.id !== userToDelete.id));
        }
        setUserToDelete(null);
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
                    className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 transition-colors shadow-lg shadow-blue-900/20 flex items-center gap-2"
                >
                    Adicionar Usuário
                </button>
            </div>
            <div className="overflow-x-auto rounded-lg border border-gray-700">
                <table className="min-w-full text-sm text-left text-gray-300">
                    <thead className="text-xs text-gray-400 uppercase bg-gray-900/50">
                        <tr>
                            <th scope="col" className="px-6 py-4 font-medium">Nome</th>
                            <th scope="col" className="px-6 py-4 font-medium">Função</th>
                            <th scope="col" className="px-6 py-4 font-medium">Status</th>
                            <th scope="col" className="px-6 py-4 font-medium text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700/50">
                        {users.map(user => {
                            const isCurrent = user.id === currentUser.id;
                            return (
                            <tr key={user.id} className={`transition-colors ${isCurrent ? 'bg-blue-900/10' : 'hover:bg-gray-700/30'}`}>
                                <td className="px-6 py-4 font-medium text-white">{user.name}</td>
                                <td className="px-6 py-4 capitalize">
                                    <span className={`px-2.5 py-1 rounded-md text-xs font-bold border ${
                                        user.role === 'separator' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' : 
                                        user.role === 'confirmer' ? 'bg-teal-500/10 text-teal-400 border-teal-500/20' :
                                        'bg-gray-500/10 text-gray-400 border-gray-500/20'
                                    }`}>
                                        {user.role === 'separator' ? 'Separador' : user.role === 'confirmer' ? 'Conferente' : 'Visualizador'}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    {isCurrent ? (
                                        <span className="flex items-center gap-1.5 text-green-400 text-xs font-bold uppercase tracking-wider">
                                            <CheckCircleIcon className="h-4 w-4" /> Ativo
                                        </span>
                                    ) : (
                                        onSelectUser && (
                                            <button 
                                                onClick={() => onSelectUser(user)}
                                                className="text-xs font-medium text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 px-3 py-1.5 rounded border border-gray-700 transition-all"
                                            >
                                                Usar Perfil
                                            </button>
                                        )
                                    )}
                                </td>
                                <td className="px-6 py-4 text-right space-x-4">
                                    <button onClick={() => handleOpenModal(user)} className="font-medium text-blue-400 hover:text-blue-300 hover:underline transition-colors">Editar</button>
                                    <button 
                                        onClick={() => handleDeleteClick(user)} 
                                        className="font-medium text-red-400 hover:text-red-300 hover:underline disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:no-underline transition-colors"
                                        disabled={isCurrent}
                                        title={isCurrent ? "Você não pode excluir o usuário logado" : "Excluir usuário"}
                                    >
                                        Excluir
                                    </button>
                                </td>
                            </tr>
                        )})}
                    </tbody>
                </table>
            </div>

            {/* Add/Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in p-4">
                    <div className="bg-gray-800 rounded-xl shadow-2xl p-6 border border-gray-700 w-full max-w-md m-4 transform scale-100 transition-transform" onClick={(e) => e.stopPropagation()}>
                        <h2 className="text-xl font-bold text-gray-100 mb-6">{editingUser ? 'Editar Usuário' : 'Adicionar Usuário'}</h2>
                        <div className="space-y-5">
                            <div>
                                <label htmlFor="userName" className="block text-sm font-medium text-gray-400 mb-1">Nome Completo</label>
                                <input
                                    type="text"
                                    id="userName"
                                    value={userName}
                                    onChange={e => setUserName(e.target.value)}
                                    className="block w-full bg-gray-900 border border-gray-600 rounded-lg py-2.5 px-3 text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                    placeholder="Ex: Maria Silva"
                                    autoFocus
                                />
                            </div>
                            <div>
                                <label htmlFor="userRole" className="block text-sm font-medium text-gray-400 mb-1">Função no Sistema</label>
                                <select
                                    id="userRole"
                                    value={userRole}
                                    onChange={e => setUserRole(e.target.value as 'separator' | 'confirmer' | 'viewer')}
                                    className="block w-full bg-gray-900 border border-gray-600 rounded-lg py-2.5 px-3 text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                >
                                    <option value="separator">Separador</option>
                                    <option value="confirmer">Conferente</option>
                                    <option value="viewer">Visualizador</option>
                                </select>
                            </div>
                        </div>
                        <div className="mt-8 flex justify-end gap-3">
                            <button onClick={handleCloseModal} className="px-4 py-2.5 bg-gray-700 hover:bg-gray-600 text-gray-200 font-medium rounded-lg transition-colors">Cancelar</button>
                            <button onClick={handleSaveUser} className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg shadow-lg shadow-blue-900/20 transition-colors">Salvar Alterações</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {userToDelete && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in p-4">
                    <div className="bg-gray-800 rounded-xl shadow-2xl p-6 border border-red-500/30 w-full max-w-sm m-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-3 mb-4 text-red-400">
                             <div className="p-2 bg-red-500/10 rounded-full">
                                <XCircleIcon className="h-6 w-6" />
                             </div>
                             <h3 className="text-xl font-bold text-white">Confirmar Exclusão</h3>
                        </div>
                        <p className="text-gray-300 mb-6 leading-relaxed">
                            Tem certeza que deseja remover <b>{userToDelete.name}</b> da equipe?
                            <br/><span className="text-sm text-gray-500 mt-2 block">Esta ação não pode ser desfeita.</span>
                        </p>
                        <div className="flex justify-end gap-3">
                            <button 
                                onClick={() => setUserToDelete(null)} 
                                className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors font-medium"
                            >
                                Cancelar
                            </button>
                            <button 
                                onClick={confirmDelete} 
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-500 shadow-lg shadow-red-900/20 transition-colors font-medium"
                            >
                                Sim, Excluir
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserManagement;
