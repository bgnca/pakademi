import React, { useState } from 'react';
import { Participant, Training } from '../types';
import { UserCheck, Lock, FileText, Download, LogOut } from 'lucide-react';

interface ParticipantPortalProps {
  participants: Participant[];
  trainings: Training[];
}

const ParticipantPortal: React.FC<ParticipantPortalProps> = ({ participants, trainings }) => {
  const [tckn, setTckn] = useState('');
  const [password, setPassword] = useState('');
  const [loggedInUser, setLoggedInUser] = useState<Participant | null>(null);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, strict validation and hashing.
    // For demo, we match TCKN. We assume mock data has TCKN '12345678901' for testing if not set.
    const user = participants.find(p => p.tckn === tckn || (tckn === '12345678901' && p.tckn === undefined)); // Backdoor for demo
    
    if (user) {
        setLoggedInUser(user);
    } else {
        alert('Kullanıcı bulunamadı. (Demo için TCKN: 12345678901 deneyebilirsiniz)');
    }
  };

  const handleLogout = () => {
      setLoggedInUser(null);
      setTckn('');
      setPassword('');
  };

  if (loggedInUser) {
    // Fix: Participant uses assignments array instead of a single trainingId
    const userTrainings = trainings.filter(t => (loggedInUser.assignments || []).some(a => a.trainingId === t.id));
      
      return (
          <div className="max-w-4xl mx-auto space-y-6">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                          <UserCheck className="w-6 h-6 text-indigo-600" />
                      </div>
                      <div>
                          <h2 className="text-xl font-bold text-slate-800">Hoşgeldiniz, {loggedInUser.name}</h2>
                          <p className="text-sm text-slate-500">Katılımcı Paneli</p>
                      </div>
                  </div>
                  <button onClick={handleLogout} className="flex items-center gap-2 text-slate-600 hover:text-red-600">
                      <LogOut className="w-4 h-4" /> Çıkış Yap
                  </button>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                  <h3 className="font-bold text-lg mb-4 text-slate-700">Belgelerim & Sertifikalarım</h3>
                  
                  {(!loggedInUser.documents || loggedInUser.documents.length === 0) ? (
                      <div className="text-center py-8 text-slate-400 border-2 border-dashed border-slate-200 rounded-lg">
                          Henüz yüklenmiş bir belgeniz bulunmamaktadır.
                      </div>
                  ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {loggedInUser.documents.map((doc) => (
                              <div key={doc.id} className="border border-slate-200 rounded-lg p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                  <div className="flex items-center gap-3">
                                      <FileText className="w-8 h-8 text-indigo-500" />
                                      <div>
                                          <p className="font-medium text-slate-800">{doc.name}</p>
                                          <p className="text-xs text-slate-400">{new Date(doc.uploadDate).toLocaleDateString()}</p>
                                      </div>
                                  </div>
                                  <button className="text-indigo-600 hover:bg-indigo-50 p-2 rounded-full">
                                      <Download className="w-5 h-5" />
                                  </button>
                              </div>
                          ))}
                      </div>
                  )}
              </div>

               <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                  <h3 className="font-bold text-lg mb-4 text-slate-700">Katıldığım Eğitimler</h3>
                  <div className="space-y-4">
                      {userTrainings.map(t => (
                          <div key={t.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                              <div>
                                  <p className="font-semibold text-slate-900">{t.title}</p>
                                  {/* Fix: Training uses startDate instead of date */}
                                  <p className="text-sm text-slate-500">{new Date(t.startDate).toLocaleDateString()} - {t.location}</p>
                              </div>
                              <span className="px-3 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium">
                                  Kaydınız Onaylandı
                              </span>
                          </div>
                      ))}
                       {userTrainings.length === 0 && <p className="text-slate-500">Kayıtlı eğitim bulunamadı.</p>}
                  </div>
              </div>
          </div>
      );
  }

  return (
    <div className="flex items-center justify-center min-h-[80vh]">
        <div className="bg-white p-8 rounded-2xl shadow-lg border border-slate-100 w-full max-w-md">
            <div className="text-center mb-8">
                <div className="w-16 h-16 bg-indigo-600 rounded-2xl mx-auto flex items-center justify-center mb-4 transform rotate-3">
                    <UserCheck className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-slate-800">Katılımcı Girişi</h2>
                <p className="text-slate-500">Belgelerinizi görüntülemek için giriş yapın</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">T.C. Kimlik No</label>
                    <input 
                        type="text" 
                        required
                        className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                        placeholder="11 haneli TCKN"
                        value={tckn}
                        onChange={e => setTckn(e.target.value)}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Şifre</label>
                    <div className="relative">
                        <input 
                            type="password" 
                            required
                            className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                            placeholder="••••••••"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                        />
                        <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                    </div>
                </div>
                <button 
                    type="submit"
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 rounded-lg transition-colors shadow-lg shadow-indigo-200"
                >
                    Giriş Yap
                </button>
            </form>
            <div className="mt-6 text-center text-xs text-slate-400">
                <p>Demo Giriş: TCKN: 12345678901 / Şifre: (Farketmez)</p>
            </div>
        </div>
    </div>
  );
};

export default ParticipantPortal;