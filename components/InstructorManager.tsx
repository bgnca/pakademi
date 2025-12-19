
import React, { useState } from 'react';
import { Instructor, InstructorCandidate, CandidateStatus, Training, UserRole, User, InteractionType, InteractionLog, Participant } from '../types';
import { Mail, Briefcase, Plus, Phone, X, Edit2, Save, Send, Trash2, Calendar, DollarSign, FileText, ArrowLeft, Loader2, Sparkles, User as UserIcon, Clock, History, Edit3, ChevronRight } from 'lucide-react';
import ResumeBuilder from './ResumeBuilder';

interface InstructorManagerProps {
    instructors: Instructor[];
    setInstructors: React.Dispatch<React.SetStateAction<Instructor[]>>;
    candidates: InstructorCandidate[];
    setCandidates: React.Dispatch<React.SetStateAction<InstructorCandidate[]>>;
    trainings: Training[];
    participants: Participant[];
    initialFilter?: string;
    currentUser: User;
}

const InstructorManager: React.FC<InstructorManagerProps> = ({ instructors, setInstructors, candidates, setCandidates, trainings, participants, initialFilter, currentUser }) => {
    const activeTabFilter = initialFilter === 'instructors-candidates' ? 'candidates' : 'active';
    
    const [isInstructorModalOpen, setIsInstructorModalOpen] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [isCandidateModalOpen, setIsCandidateModalOpen] = useState(false);
    const [isCandidateDetailOpen, setIsCandidateDetailOpen] = useState(false);
    const [isResumeOpen, setIsResumeOpen] = useState(false);
    const [editingInstructor, setEditingInstructor] = useState<Partial<Instructor> | null>(null);
    const [selectedInstructor, setSelectedInstructor] = useState<Instructor | null>(null);
    const [selectedCandidate, setSelectedCandidate] = useState<InstructorCandidate | null>(null);
    const [newCandidateNote, setNewCandidateNote] = useState('');

    const handleSave = () => {
        if (!editingInstructor?.name) return;
        const index = instructors.findIndex(i => i.id === editingInstructor.id);
        if (index > -1) {
            setInstructors(instructors.map(i => i.id === editingInstructor.id ? editingInstructor as Instructor : i));
        } else {
            setInstructors([...instructors, editingInstructor as Instructor]);
        }
        setIsInstructorModalOpen(false);
    };

    const handleSaveCandidate = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const newCandidate: InstructorCandidate = {
            id: Math.random().toString(36).substr(2, 9),
            name: formData.get('name') as string,
            title: formData.get('title') as string,
            email: formData.get('email') as string,
            phone: formData.get('phone') as string,
            specialty: formData.get('specialty') as string,
            status: CandidateStatus.NEW,
            interactionLog: []
        };
        setCandidates([...candidates, newCandidate]);
        setIsCandidateModalOpen(false);
    };

    const updateCandidateStatus = (status: CandidateStatus) => {
        if(!selectedCandidate) return;
        const updated = candidates.map(c => c.id === selectedCandidate.id ? { ...c, status } : c);
        setCandidates(updated);
        setSelectedCandidate({ ...selectedCandidate, status });
    };

    const addCandidateNote = () => {
        if(!selectedCandidate || !newCandidateNote.trim()) return;
        const newLog: InteractionLog = {
            id: Math.random().toString(36).substr(2, 9),
            date: new Date().toISOString(),
            type: InteractionType.NOTE,
            note: newCandidateNote,
            performedBy: currentUser.name
        };
        const updated = candidates.map(c => c.id === selectedCandidate.id ? { ...c, interactionLog: [newLog, ...(c.interactionLog || [])] } : c);
        setCandidates(updated);
        setSelectedCandidate({ ...selectedCandidate, interactionLog: [newLog, ...(selectedCandidate.interactionLog || [])] });
        setNewCandidateNote('');
    };

    const handleSendEmail = (email: string) => {
        window.open(`mailto:${email}?subject=PA Akademi Eğitim Süreçleri Hakkında`, '_blank');
    };

    const getEarningsPerTraining = (instId: string) => {
        const instTrainings = trainings.filter(t => t.instructorIds?.includes(instId));
        return instTrainings.map(t => {
            const trainingParticipants = participants.filter(p => p.assignments.some(a => a.trainingId === t.id));
            const gross = trainingParticipants.reduce((sum, p) => {
                const a = p.assignments.find(x => x.trainingId === t.id);
                return sum + (a?.payments.reduce((ps, pay) => ps + pay.amount, 0) || 0);
            }, 0);
            const instructorShare = gross * ((selectedInstructor?.defaultCommissionRate || 40) / 100);
            return {
                id: t.id,
                title: t.title,
                participantCount: trainingParticipants.length,
                gross,
                instructorShare
            };
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight">
                        {activeTabFilter === 'active' ? 'Anlaşmalı Eğitmenler' : 'Görüşmedeki Eğitmenler'}
                    </h2>
                    <p className="text-sm text-slate-500 font-bold">Akademik kadro ve aday havuzu yönetimi</p>
                </div>
                <button 
                    onClick={() => {
                        if (activeTabFilter === 'active') {
                            setEditingInstructor({
                                id: Math.random().toString(36).substr(2, 9),
                                name: '',
                                title: '',
                                email: '',
                                phone: '',
                                specialty: '',
                                defaultCommissionRate: 40
                            });
                            setIsInstructorModalOpen(true);
                        } else {
                            setIsCandidateModalOpen(true);
                        }
                    }} 
                    className="bg-pa-500 hover:bg-pa-600 text-white px-6 py-3 rounded-2xl flex items-center gap-2 text-sm font-black shadow-xl shadow-pa-500/20 transition-all active:scale-95"
                >
                    <Plus className="w-5 h-5"/> {activeTabFilter === 'active' ? 'Yeni Eğitmen' : 'Aday Ekle'}
                </button>
            </div>

            {activeTabFilter === 'active' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {instructors.map(inst => (
                        <div 
                            key={inst.id} 
                            onClick={() => { setSelectedInstructor(inst); setIsDetailModalOpen(true); }}
                            className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-700 hover:shadow-2xl hover:-translate-y-1 transition-all group relative overflow-hidden cursor-pointer"
                        >
                            <div className="absolute top-0 right-0 w-24 h-24 bg-pa-50 dark:bg-pa-900/30 rounded-bl-[3rem] -mr-4 -mt-4 transition-all group-hover:bg-pa-500 group-hover:text-white flex items-center justify-center">
                                <span className="font-black text-pa-300 group-hover:text-white/20 text-4xl mr-2 mt-2">{inst.name.charAt(0)}</span>
                            </div>
                            
                            <div className="relative z-10">
                                <div className="mb-6">
                                    <h3 className="font-black text-xl text-slate-900 dark:text-white leading-tight">{inst.name}</h3>
                                    <p className="text-xs font-black text-pa-500 uppercase tracking-widest mt-1">{inst.title}</p>
                                </div>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 font-medium leading-relaxed italic border-l-4 border-pa-100 pl-4">{inst.specialty}</p>
                                
                                <div className="mt-8 flex gap-2">
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); handleSendEmail(inst.email); }} 
                                        className="flex-1 bg-pa-500 hover:bg-pa-600 text-white py-3 rounded-2xl text-xs font-black flex items-center justify-center gap-2 transition-all shadow-lg shadow-pa-500/20 active:scale-95"
                                    >
                                        <Mail className="w-4 h-4" /> E-posta
                                    </button>
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); setEditingInstructor(inst); setIsInstructorModalOpen(true); }} 
                                        className="p-3 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-500 dark:text-slate-300 rounded-2xl transition-all"
                                    >
                                        <Edit2 className="w-4 h-4"/>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {candidates.map(c => (
                        <div 
                            key={c.id} 
                            onClick={() => { setSelectedCandidate(c); setIsCandidateDetailOpen(true); }}
                            className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-700 hover:shadow-xl transition-all cursor-pointer group"
                        >
                             <div className="flex justify-between items-start mb-6">
                                <span className={`text-[10px] font-black px-3 py-1 rounded-full border uppercase tracking-widest ${
                                    c.status === CandidateStatus.REJECTED ? 'bg-red-50 border-red-100 text-red-600' : 
                                    c.status === CandidateStatus.AGREED ? 'bg-emerald-50 border-emerald-100 text-emerald-600' :
                                    'bg-amber-50 border-amber-100 text-amber-600'
                                }`}>{c.status}</span>
                                <button onClick={(e) => { e.stopPropagation(); handleSendEmail(c.email); }} className="p-2.5 bg-slate-50 dark:bg-slate-900 text-slate-400 hover:text-pa-500 rounded-xl transition-all"><Mail className="w-4 h-4"/></button>
                            </div>
                            <h3 className="font-black text-xl text-slate-900 dark:text-white leading-tight group-hover:text-pa-600 transition-colors">{c.name}</h3>
                            <p className="text-[10px] font-black text-pa-500 uppercase tracking-widest mt-1 mb-4">{c.title}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 font-medium italic border-l-2 border-slate-100 pl-3">{c.specialty}</p>
                            <div className="pt-4 border-t border-slate-50 flex items-center gap-2 text-slate-400 text-[10px] font-bold">
                                <History className="w-3 h-3"/> {c.interactionLog?.length || 0} Görüşme Notu
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* INSTRUCTOR DETAIL MODAL */}
            {isDetailModalOpen && selectedInstructor && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-md">
                    <div className="bg-white dark:bg-slate-800 rounded-[3rem] w-full max-w-5xl h-[90vh] overflow-hidden shadow-2xl flex flex-col">
                        <div className="p-8 border-b dark:border-slate-700 flex justify-between items-center bg-pa-50 dark:bg-slate-900">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 bg-pa-500 rounded-2xl flex items-center justify-center text-white text-2xl font-black">{selectedInstructor.name.charAt(0)}</div>
                                <div>
                                    <h3 className="text-2xl font-black dark:text-white">{selectedInstructor.name}</h3>
                                    <p className="text-pa-600 font-bold text-sm uppercase">{selectedInstructor.title}</p>
                                </div>
                            </div>
                            <button onClick={() => setIsDetailModalOpen(false)} className="p-3 hover:bg-white/50 rounded-2xl transition-all"><X className="w-6 h-6"/></button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-10 grid grid-cols-1 md:grid-cols-3 gap-10">
                            <div className="md:col-span-2 space-y-10">
                                <div>
                                    <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-6">Eğitim Bazlı Hakediş Detayları</h4>
                                    <div className="space-y-4">
                                        {getEarningsPerTraining(selectedInstructor.id).map(earn => (
                                            <div key={earn.id} className="bg-slate-50 dark:bg-slate-900 p-6 rounded-3xl border dark:border-slate-800 flex justify-between items-center group hover:border-pa-200 transition-all">
                                                <div className="space-y-1">
                                                    <p className="font-black text-slate-800 dark:text-white">{earn.title}</p>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                                        <UserIcon className="w-3 h-3"/> {earn.participantCount} Katılımcı • Brüt: ₺{earn.gross.toLocaleString()}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[9px] font-black text-pa-500 uppercase tracking-widest mb-1">Eğitmen Payı</p>
                                                    <p className="text-xl font-black text-pa-600">₺{earn.instructorShare.toLocaleString()}</p>
                                                </div>
                                            </div>
                                        ))}
                                        {getEarningsPerTraining(selectedInstructor.id).length === 0 && (
                                            <p className="text-center py-10 text-slate-400 italic font-medium">Henüz bu eğitmene tanımlı bir eğitim kazancı bulunmuyor.</p>
                                        )}
                                    </div>
                                </div>

                                <div className="pt-6 border-t dark:border-slate-800">
                                    <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4">Akademik Öz Geçmiş</h4>
                                    {selectedInstructor.resume ? (
                                        <div className="space-y-4">
                                            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-4">{selectedInstructor.resume.summary}</p>
                                            <button onClick={() => setIsResumeOpen(true)} className="text-pa-600 font-black text-sm flex items-center gap-2 hover:underline">
                                                <FileText className="w-4 h-4"/> Tüm Öz Geçmişi Gör / Düzenle
                                            </button>
                                        </div>
                                    ) : (
                                        <button onClick={() => setIsResumeOpen(true)} className="w-full py-12 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-3xl text-slate-400 text-sm italic hover:bg-slate-50 transition-all">
                                            Öz geçmiş henüz yüklenmemiş. Eklemek veya AI ile oluşturmak için tıklayın.
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="bg-pa-900 text-white p-8 rounded-[2.5rem] shadow-xl relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-4 opacity-10"><DollarSign className="w-16 h-16"/></div>
                                    <h4 className="text-[10px] font-black text-pa-300 uppercase tracking-widest mb-2">Toplam Kazanç</h4>
                                    <p className="text-4xl font-black mb-1">₺{getEarningsPerTraining(selectedInstructor.id).reduce((s,e)=>s+e.instructorShare, 0).toLocaleString()}</p>
                                    <div className="mt-6 pt-6 border-t border-pa-800">
                                        <div className="flex justify-between text-[10px] font-black uppercase mb-1">
                                            <span className="text-pa-400 tracking-tighter">Anlaşma Oranı</span>
                                            <span className="text-white">%{selectedInstructor.defaultCommissionRate}</span>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="bg-slate-50 dark:bg-slate-900 p-8 rounded-[2.5rem] border dark:border-slate-800 space-y-6">
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">İletişim</h4>
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-white dark:bg-slate-800 rounded-xl flex items-center justify-center border dark:border-slate-700"><Phone className="w-4 h-4 text-pa-500"/></div>
                                            <span className="text-sm font-bold dark:text-white">{selectedInstructor.phone || '-'}</span>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-white dark:bg-slate-800 rounded-xl flex items-center justify-center border dark:border-slate-700"><Mail className="w-4 h-4 text-pa-500"/></div>
                                            <span className="text-sm font-bold dark:text-white truncate">{selectedInstructor.email}</span>
                                        </div>
                                    </div>
                                    <button onClick={() => handleSendEmail(selectedInstructor.email)} className="w-full bg-pa-500 hover:bg-pa-600 text-white py-4 rounded-2xl font-black text-xs shadow-lg transition-all active:scale-95 uppercase tracking-widest">Mesaj Gönder</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Resume Builder, Add/Edit modals remain the same logic ... */}
            {isResumeOpen && selectedInstructor && (
                <div className="fixed inset-0 z-[100] bg-white dark:bg-slate-900">
                    <ResumeBuilder 
                        instructor={selectedInstructor} 
                        onSave={(resume) => {
                            const updated = instructors.map(i => i.id === selectedInstructor.id ? {...i, resume} : i);
                            setInstructors(updated);
                            setSelectedInstructor({...selectedInstructor, resume});
                        }} 
                        onClose={() => setIsResumeOpen(false)} 
                    />
                </div>
            )}

            {isInstructorModalOpen && editingInstructor && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-[3rem] w-full max-w-lg p-10 shadow-2xl">
                        <div className="flex justify-between items-center mb-8">
                            <h3 className="text-2xl font-black dark:text-white">{editingInstructor.name ? 'Eğitmeni Düzenle' : 'Yeni Eğitmen Kaydı'}</h3>
                            <button onClick={() => setIsInstructorModalOpen(false)}><X className="w-6 h-6 text-slate-500" /></button>
                        </div>
                        <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-5">
                            <input required className="w-full p-4 border dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-2xl" placeholder="Tam Ad Soyad" value={editingInstructor.name} onChange={e => setEditingInstructor({...editingInstructor, name: e.target.value})} />
                            <input required className="w-full p-4 border dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-2xl" placeholder="Ünvan" value={editingInstructor.title} onChange={e => setEditingInstructor({...editingInstructor, title: e.target.value})} />
                            <input required className="w-full p-4 border dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-2xl" placeholder="E-posta" value={editingInstructor.email} onChange={e => setEditingInstructor({...editingInstructor, email: e.target.value})} />
                            <input required className="w-full p-4 border dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-2xl" placeholder="Telefon" value={editingInstructor.phone} onChange={e => setEditingInstructor({...editingInstructor, phone: e.target.value})} />
                            <input required className="w-full p-4 border dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-2xl" placeholder="Uzmanlık" value={editingInstructor.specialty} onChange={e => setEditingInstructor({...editingInstructor, specialty: e.target.value})} />
                            <div className="flex items-center gap-4">
                                <label className="text-xs font-black uppercase text-slate-400">Komisyon %</label>
                                <input type="number" className="flex-1 p-4 border dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-2xl" value={editingInstructor.defaultCommissionRate} onChange={e => setEditingInstructor({...editingInstructor, defaultCommissionRate: Number(e.target.value)})} />
                            </div>
                            <button type="submit" className="w-full bg-pa-500 text-white py-5 rounded-[2rem] font-black shadow-2xl transition-all">Bilgileri Kaydet</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InstructorManager;
