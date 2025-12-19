import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { Trash2, UserPlus, Shield, User as UserIcon, X, Briefcase } from 'lucide-react';

interface AdminPanelProps {
    users: User[];
    setUsers: React.Dispatch<React.SetStateAction<User[]>>;
    currentUser: User;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ users, setUsers, currentUser }) => {
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newUser, setNewUser] = useState<Partial<User>>({ role: 'STAFF' });

    const handleAddUser = (e: React.FormEvent) => {
        e.preventDefault();
        const user: User = {
            id: Math.random().toString(36).substr(2, 9),
            name: newUser.name!,
            email: newUser.email!,
            password: newUser.password!, // In demo only
            role: newUser.role as UserRole
        };
        setUsers([...users, user]);
        setIsAddModalOpen(false);
        setNewUser({ role: 'STAFF' });
    };

    const handleDeleteUser = (id: string) => {
        if (confirm('Bu kullanıcıyı silmek istediğinize emin misiniz?')) {
            setUsers(users.filter(u => u.id !== id));
        }
    };

    const getRoleBadge = (role: UserRole) => {
        switch(role) {
            case 'ADMIN': return <span className="inline-flex items-center gap-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-2 py-1 rounded text-xs font-bold"><Shield className="w-3 h-3"/> Admin</span>;
            case 'MANAGER': return <span className="inline-flex items-center gap-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded text-xs font-bold"><Briefcase className="w-3 h-3"/> Yönetici</span>;
            default: return <span className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-1 rounded text-xs font-medium"><UserIcon className="w-3 h-3"/> Personel</span>;
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Yönetici Paneli & Kullanıcılar</h2>
                <button 
                    onClick={() => setIsAddModalOpen(true)}
                    className="bg-pa-500 hover:bg-pa-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm"
                >
                    <UserPlus className="w-4 h-4" /> Yeni Kullanıcı
                </button>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-900 border-b dark:border-slate-700">
                        <tr>
                            <th className="px-6 py-4 font-semibold text-slate-500 dark:text-slate-400">Kullanıcı</th>
                            <th className="px-6 py-4 font-semibold text-slate-500 dark:text-slate-400">Rol</th>
                            <th className="px-6 py-4 font-semibold text-slate-500 dark:text-slate-400">İşlemler</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                        {users.map(user => (
                            <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-pa-100 dark:bg-pa-900 flex items-center justify-center text-pa-700 dark:text-pa-300 font-bold">
                                            {user.name.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="font-medium text-slate-900 dark:text-white">{user.name}</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">{user.email}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    {getRoleBadge(user.role)}
                                </td>
                                <td className="px-6 py-4">
                                    {user.id !== currentUser.id && (
                                        <button 
                                            onClick={() => handleDeleteUser(user.id)}
                                            className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {isAddModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 w-full max-w-md border dark:border-slate-700">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white">Yeni Kullanıcı Ekle</h3>
                            <button onClick={() => setIsAddModalOpen(false)}><X className="w-5 h-5 text-slate-500" /></button>
                        </div>
                        <form onSubmit={handleAddUser} className="space-y-4">
                            <input 
                                required 
                                placeholder="Ad Soyad" 
                                className="w-full border dark:border-slate-600 dark:bg-slate-700 dark:text-white p-2 rounded outline-none focus:ring-2 focus:ring-pa-500"
                                value={newUser.name || ''} 
                                onChange={e => setNewUser({...newUser, name: e.target.value})} 
                            />
                            <input 
                                required 
                                type="email" 
                                placeholder="E-Posta" 
                                className="w-full border dark:border-slate-600 dark:bg-slate-700 dark:text-white p-2 rounded outline-none focus:ring-2 focus:ring-pa-500"
                                value={newUser.email || ''} 
                                onChange={e => setNewUser({...newUser, email: e.target.value})} 
                            />
                            <input 
                                required 
                                type="password" 
                                placeholder="Şifre" 
                                className="w-full border dark:border-slate-600 dark:bg-slate-700 dark:text-white p-2 rounded outline-none focus:ring-2 focus:ring-pa-500"
                                value={newUser.password || ''} 
                                onChange={e => setNewUser({...newUser, password: e.target.value})} 
                            />
                            <select 
                                className="w-full border dark:border-slate-600 dark:bg-slate-700 dark:text-white p-2 rounded outline-none focus:ring-2 focus:ring-pa-500"
                                value={newUser.role}
                                onChange={e => setNewUser({...newUser, role: e.target.value as UserRole})}
                            >
                                <option value="STAFF">Personel</option>
                                <option value="MANAGER">Yönetici</option>
                                <option value="ADMIN">Admin</option>
                            </select>
                            <button type="submit" className="w-full bg-pa-500 hover:bg-pa-600 text-white py-2 rounded font-medium">Oluştur</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminPanel;