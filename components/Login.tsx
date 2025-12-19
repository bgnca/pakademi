import React, { useState } from 'react';
import { BrainCircuit, Lock, User } from 'lucide-react';
import { User as UserType } from '../types';

interface LoginProps {
    users: UserType[];
    onLogin: (user: UserType) => void;
}

const Login: React.FC<LoginProps> = ({ users, onLogin }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const user = users.find(u => u.email === email && u.password === password);
        if (user) {
            onLogin(user);
        } else {
            setError('Hatalı e-posta veya şifre.');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 px-4">
            <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-100 dark:border-slate-700">
                <div className="flex flex-col items-center mb-8">
                    <div className="w-16 h-16 bg-pa-500 rounded-2xl flex items-center justify-center mb-4 transform rotate-3 shadow-lg shadow-pa-100 dark:shadow-none">
                        <BrainCircuit className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white">PA Akademi</h1>
                    <p className="text-slate-500 dark:text-slate-400">Yönetim Paneli Girişi</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">E-Posta Adresi</label>
                        <div className="relative">
                            <input 
                                type="email" 
                                required
                                className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-pa-500 outline-none transition-all"
                                placeholder="ornek@paakademi.com"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                            />
                            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Şifre</label>
                        <div className="relative">
                            <input 
                                type="password" 
                                required
                                className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-pa-500 outline-none transition-all"
                                placeholder="••••••••"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                            />
                            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                        </div>
                    </div>
                    
                    {error && <div className="text-red-500 text-sm bg-red-50 dark:bg-red-900/20 p-2 rounded text-center">{error}</div>}

                    <button 
                        type="submit"
                        className="w-full bg-pa-500 hover:bg-pa-600 text-white font-bold py-3 rounded-lg transition-colors shadow-md hover:shadow-lg"
                    >
                        Giriş Yap
                    </button>
                </form>
                
                <div className="mt-6 text-center text-xs text-slate-400">
                    <p>Demo: admin@pa.com / 123456</p>
                </div>
            </div>
        </div>
    );
};

export default Login;
