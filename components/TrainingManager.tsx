
import React, { useState, useMemo, useEffect } from 'react';
import { Training, Instructor, TrainingStatus, Participant, ScheduleDay, TrainingGoals, InstructorCandidate, CandidateStatus } from '../types';
import { Plus, Edit2, Trash2, Calendar, User, Clock, BrainCircuit, Sparkles, X, Layers, Wand2, Loader2, Save, Target, BookOpen, DollarSign, Info, LayoutList, ChevronRight, Folder, FolderPlus, ArrowLeft, ExternalLink, UserPlus } from 'lucide-react';
import { generateTrainingPlan, analyzeGoals } from '../services/geminiService';

interface TrainingManagerProps {
  trainings: Training[];
  instructors: Instructor[];
  setTrainings: React.Dispatch<React.SetStateAction<Training[]>>;
  participants: Participant[];
  initialFilter?: string;
  setCandidates?: React.Dispatch<React.SetStateAction<InstructorCandidate[]>>;
}

const TrainingManager: React.FC<TrainingManagerProps> = ({ trainings, instructors, setTrainings, participants, initialFilter, setCandidates }) => {
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState<'details' | 'content' | 'goals'>('details');
  const [editingTraining, setEditingTraining] = useState<Partial<Training> | null>(null);
  
  // AI Bot State
  const [showAiBot, setShowAiBot] = useState(false);
  const [aiInput, setAiInput] = useState({ title: '', content: '', prefs: '' });
  const [aiResult, setAiResult] = useState<{text: string, sources: any[], parsedInstructors: any[]}>({ text: '', sources: [], parsedInstructors: [] });
  const [isAiLoading, setIsAiLoading] = useState(false);
  
  const [isGoalAnalyzing, setIsGoalAnalyzing] = useState(false);
  const [goalAnalysis, setGoalAnalysis] = useState('');

  // Breadcrumb navigation
  const breadcrumbs = useMemo(() => {
    const list: Training[] = [];
    let currentId = currentFolderId;
    while (currentId) {
        const found = trainings.find(t => t.id === currentId);
        if (found) {
            list.unshift(found);
            currentId = found.parentTrainingId || null;
        } else {
            currentId = null;
        }
    }
    return list;
  }, [currentFolderId, trainings]);

  // Filtering based on side menu selection - FIXED VERSION
  const displayedTrainings = useMemo(() => {
    // If a specific status tab is selected from side menu
    if (initialFilter === 'trainings-active') {
        return trainings.filter(t => t.price > 0 && (t.status === TrainingStatus.REGISTRATION_OPEN || t.status === TrainingStatus.REGISTRATION_PREP));
    }
    if (initialFilter === 'trainings-completed') {
        return trainings.filter(t => t.price > 0 && t.status === TrainingStatus.COMPLETED);
    }
    if (initialFilter === 'trainings-planned') {
        return trainings.filter(t => t.price > 0 && t.status === TrainingStatus.PLANNING);
    }

    // Default: Hierarchical folder view
    return trainings.filter(t => (t.parentTrainingId || null) === currentFolderId);
  }, [trainings, currentFolderId, initialFilter]);

  // Reset folder view when initialFilter changes (e.g. clicking 'All Trainings' again)
  useEffect(() => {
      if (!initialFilter?.includes('-')) {
          setCurrentFolderId(null);
      }
  }, [initialFilter]);

  const handleOpenAddModal = (isFolder: boolean = false) => {
      setEditingTraining({
          id: Math.random().toString(36).substr(2, 9),
          parentTrainingId: currentFolderId || undefined,
          title: isFolder ? 'Yeni Ana Başlık' : '',
          description: '',
          content: '',
          instructorIds: [],
          status: TrainingStatus.PLANNING,
          tasks: [],
          schedule: [],
          price: 0,
          earlyBirdPrice: 0,
          specialPrice: 0,
          quota: 20,
          startDate: new Date().toISOString().split('T')[0],
          endDate: new Date().toISOString().split('T')[0],
          goals: { targetLeads: 0, targetParticipants: 0, targetRevenue: 0, marketingBudget: 0, customGoals: '' }
      });
      setModalTab('details');
      setIsModalOpen(true);
  };

  const handleSave = () => {
      if (!editingTraining?.title) return;
      const index = trainings.findIndex(t => t.id === editingTraining.id);
      if (index > -1) {
          const updated = [...trainings];
          updated[index] = editingTraining as Training;
          setTrainings(updated);
      } else {
          setTrainings([...trainings, editingTraining as Training]);
      }
      setIsModalOpen(false);
  };

  const runAiPlanner = async () => {
      setIsAiLoading(true);
      const result = await generateTrainingPlan(aiInput.title, aiInput.content, aiInput.prefs);
      
      let parsed: any[] = [];
      const match = result.text.match(/---INSTRUCTORS_JSON_START---([\s\S]*?)---INSTRUCTORS_JSON_END---/);
      if (match && match[1]) {
          try {
              parsed = JSON.parse(match[1]);
          } catch (e) {
              console.error("JSON parsing error", e);
          }
      }
      
      setAiResult({
          text: result.text.replace(/---INSTRUCTORS_JSON_START---[\s\S]*?---INSTRUCTORS_JSON_END---/, ""),
          sources: result.sources,
          parsedInstructors: parsed
      });
      setIsAiLoading(false);
  };

  const addInstructorToCandidates = (inst: any) => {
      if (!setCandidates) return;
      const newCand: InstructorCandidate = {
          id: Math.random().toString(36).substr(2, 9),
          name: inst.name,
          title: inst.title,
          email: inst.email || '',
          phone: inst.phone || '',
          specialty: inst.specialty || '',
          status: CandidateStatus.NEW,
          interactionLog: [{
              id: 'log1',
              date: new Date().toISOString(),
              type: 'Not' as any,
              note: 'AI Planlama Botu tarafından internet araştırması sonucu eklendi.',
              performedBy: 'AI System'
          }]
      };
      setCandidates(prev => [...prev, newCand]);
      alert(`${inst.name} Aday Eğitmen havuzuna eklendi.`);
  };

  const runGoalAnalysis = async () => {
      if (!editingTraining?.id || !editingTraining?.goals) return;
      setIsGoalAnalyzing(true);
      const analysis = await analyzeGoals(editingTraining.title || '', editingTraining.goals, editingTraining.content || '');
      setGoalAnalysis(analysis);
      setIsGoalAnalyzing(false);
  };

  const getStatusLabel = () => {
      if(initialFilter === 'trainings-active') return "Aktif Eğitimler";
      if(initialFilter === 'trainings-completed') return "Sonlanan Eğitimler";
      if(initialFilter === 'trainings-planned') return "Planlanan Eğitimler";
      return currentFolderId ? breadcrumbs[breadcrumbs.length-1].title : 'Eğitim Branşları';
  };

  const isStatusView = initialFilter?.includes('-');

  return (
    <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
                {!isStatusView && (
                    <div className="flex items-center gap-2 mb-1">
                        <button onClick={() => setCurrentFolderId(null)} className="text-pa-500 hover:underline text-xs font-black uppercase tracking-widest">Eğitimler</button>
                        {breadcrumbs.map(bc => (
                            <React.Fragment key={bc.id}>
                                <ChevronRight className="w-3 h-3 text-slate-400"/>
                                <button onClick={() => setCurrentFolderId(bc.id)} className="text-slate-400 hover:text-pa-500 text-xs font-black uppercase tracking-widest truncate max-w-[150px]">{bc.title}</button>
                            </React.Fragment>
                        ))}
                    </div>
                )}
                <h2 className="text-3xl font-black text-slate-800 dark:text-white uppercase tracking-tight flex items-center gap-3">
                    {getStatusLabel()}
                </h2>
            </div>
            <div className="flex gap-2">
                <button onClick={() => setShowAiBot(true)} className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-3 rounded-2xl flex items-center gap-2 text-sm font-black shadow-xl shadow-purple-500/20 active:scale-95 transition-all">
                    <Wand2 className="w-5 h-5"/> AI Planlama Botu
                </button>
                {!isStatusView && (
                   <button onClick={() => handleOpenAddModal(true)} className="bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 text-slate-700 dark:text-slate-200 px-5 py-3 rounded-2xl flex items-center gap-2 text-sm font-black shadow-sm hover:bg-slate-50 active:scale-95 transition-all">
                       <FolderPlus className="w-5 h-5 text-pa-500"/> Yeni Klasör
                   </button>
                )}
                <button onClick={() => handleOpenAddModal(false)} className="bg-pa-500 hover:bg-pa-600 text-white px-5 py-3 rounded-2xl flex items-center gap-2 text-sm font-black shadow-xl shadow-pa-500/20 active:scale-95 transition-all">
                    <Plus className="w-5 h-5"/> Yeni Eğitim
                </button>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {currentFolderId && !isStatusView && (
                <div 
                    onClick={() => setCurrentFolderId(breadcrumbs[breadcrumbs.length-2]?.id || null)}
                    className="bg-slate-100 dark:bg-slate-800/30 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-[2.5rem] p-8 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-200 transition-all opacity-60 group"
                >
                    <ArrowLeft className="w-12 h-12 text-slate-400 group-hover:-translate-x-2 transition-transform" />
                    <span className="text-sm font-black uppercase text-slate-400 mt-4 tracking-widest">Geri Dön</span>
                </div>
            )}
            
            {displayedTrainings.map(t => {
                const subCount = trainings.filter(x => x.parentTrainingId === t.id).length;
                const isFolder = !isStatusView && (subCount > 0 || !t.price);

                return (
                    <div 
                        key={t.id} 
                        onClick={() => isFolder ? setCurrentFolderId(t.id) : (setEditingTraining(t), setIsModalOpen(true))}
                        className={`bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-sm border dark:border-slate-700 overflow-hidden hover:shadow-2xl hover:-translate-y-1 transition-all cursor-pointer group relative ${isFolder ? 'border-pa-100' : ''}`}
                    >
                        {isFolder && (
                            <div className="absolute top-0 left-0 w-full h-2 bg-pa-500"></div>
                        )}
                        <div className="p-8">
                            <div className="flex justify-between items-start mb-6">
                                {isFolder ? (
                                    <div className="p-4 bg-pa-50 dark:bg-pa-900/30 rounded-2xl">
                                        <Folder className="w-8 h-8 text-pa-500"/>
                                    </div>
                                ) : (
                                    <span className={`text-[10px] font-black px-3 py-1 rounded-full border uppercase tracking-widest shadow-sm ${t.status === TrainingStatus.REGISTRATION_OPEN ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-100 text-slate-500'}`}>
                                        {t.status}
                                    </span>
                                )}
                                {subCount > 0 && !isStatusView && (
                                    <span className="text-[10px] font-black bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full border border-indigo-100 uppercase">{subCount} Alt Başlık</span>
                                )}
                            </div>
                            <h3 className="font-black text-xl text-slate-900 dark:text-white group-hover:text-pa-500 transition-colors line-clamp-2 leading-tight mb-4">{t.title}</h3>
                            {!isFolder && (
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest"><Calendar className="w-3.5 h-3.5 text-pa-400"/> {t.startDate}</div>
                                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest"><User className="w-3.5 h-3.5 text-pa-400"/> {t.instructorIds?.length || 0} Eğitmen</div>
                                </div>
                            )}
                        </div>
                        {!isFolder ? (
                            <div className="px-8 py-5 bg-slate-50 dark:bg-slate-900/50 border-t dark:border-slate-700 flex justify-between items-center">
                                <div className="flex flex-col">
                                    <span className="text-[9px] text-slate-400 uppercase font-black tracking-widest">Eğitim Ücreti</span>
                                    <span className="font-black text-pa-600 text-xl">₺{t.price?.toLocaleString()}</span>
                                </div>
                                <button className="p-3 bg-white dark:bg-slate-700 rounded-2xl text-slate-400 hover:text-pa-500 shadow-sm border dark:border-slate-600 transition-all"><ChevronRight className="w-5 h-5"/></button>
                            </div>
                        ) : (
                            <div className="px-8 py-5 bg-pa-50/50 dark:bg-pa-900/10 border-t dark:border-slate-700 flex justify-between items-center group-hover:bg-pa-50 transition-all">
                                <span className="text-[10px] font-black text-pa-600 uppercase tracking-widest italic">İçeriği Gör</span>
                                <ChevronRight className="w-5 h-5 text-pa-400 group-hover:translate-x-1 transition-transform"/>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
        
        {/* Modals remain the same ... */}
        {showAiBot && (
            <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[100] p-4 backdrop-blur-xl">
                 <div className="bg-white dark:bg-slate-800 rounded-[3.5rem] w-full max-w-6xl h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95">
                      <div className="p-10 border-b dark:border-slate-700 flex justify-between items-center bg-purple-50 dark:bg-purple-900/20">
                          <div className="flex items-center gap-6">
                              <div className="w-20 h-20 bg-purple-600 rounded-[2.5rem] flex items-center justify-center text-white shadow-2xl shadow-purple-500/40"><BrainCircuit className="w-10 h-10"/></div>
                              <div>
                                  <h3 className="text-3xl font-black dark:text-white uppercase tracking-tighter leading-none">AI Planlama Botu</h3>
                                  <p className="text-purple-600 dark:text-purple-400 font-bold text-sm mt-2 flex items-center gap-2"><Sparkles className="w-4 h-4"/> Google Search Grounding Aktif</p>
                              </div>
                          </div>
                          <button onClick={() => setShowAiBot(false)} className="p-4 hover:bg-white/50 rounded-3xl transition-all"><X className="w-8 h-8 text-slate-400" /></button>
                      </div>

                      <div className="flex-1 flex overflow-hidden">
                           <div className="w-[400px] p-10 border-r dark:border-slate-700 space-y-8 bg-slate-50 dark:bg-slate-900/50">
                                <div className="space-y-3">
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Eğitim Başlığı</label>
                                    <input className="w-full p-5 border-2 rounded-[1.5rem] font-bold text-sm dark:bg-slate-800 outline-none focus:border-purple-500 transition-all" placeholder="Örn: Spor Psikolojisinde Performans" value={aiInput.title} onChange={e => setAiInput({...aiInput, title: e.target.value})} />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">İçerik Özeti</label>
                                    <textarea className="w-full h-32 p-5 border-2 rounded-[1.5rem] font-bold text-sm dark:bg-slate-800 outline-none focus:border-purple-500 transition-all resize-none" placeholder="Hangi modüller olmalı?" value={aiInput.content} onChange={e => setAiInput({...aiInput, content: e.target.value})} />
                                </div>
                                <button 
                                    onClick={runAiPlanner}
                                    disabled={isAiLoading || !aiInput.title}
                                    className="w-full bg-purple-600 hover:bg-purple-700 text-white py-6 rounded-[2rem] font-black text-lg shadow-2xl disabled:opacity-50 transition-all flex items-center justify-center gap-3"
                                >
                                    {isAiLoading ? <Loader2 className="w-6 h-6 animate-spin"/> : <Sparkles className="w-6 h-6"/>}
                                    Taslak Oluştur
                                </button>
                           </div>

                           <div className="flex-1 p-10 overflow-y-auto custom-scrollbar bg-white dark:bg-slate-800">
                                {aiResult.text ? (
                                    <div className="prose prose-sm prose-slate dark:prose-invert max-w-none bg-slate-50 dark:bg-slate-900/50 p-10 rounded-[3rem] border dark:border-slate-700">
                                        <div className="whitespace-pre-wrap leading-relaxed text-slate-700 dark:text-slate-300 font-medium">{aiResult.text}</div>
                                    </div>
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center opacity-20 space-y-6">
                                        <Sparkles className="w-32 h-32 text-purple-500" />
                                        <p className="text-3xl font-black uppercase tracking-tighter italic">Taslak plan oluşturun...</p>
                                    </div>
                                )}
                           </div>
                      </div>
                 </div>
            </div>
        )}

        {isModalOpen && editingTraining && (
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-md">
                <div className="bg-white dark:bg-slate-800 rounded-[3rem] w-full max-w-6xl h-[90vh] overflow-hidden shadow-2xl flex flex-col">
                    <div className="p-8 border-b dark:border-slate-700 flex flex-col md:flex-row justify-between items-center bg-white dark:bg-slate-800 z-10 gap-6">
                        <div className="flex-1">
                            <h3 className="text-2xl font-black dark:text-white uppercase tracking-tight">{editingTraining.title || 'Yeni Eğitim Taslağı'}</h3>
                            <div className="flex gap-8 mt-6 overflow-x-auto no-scrollbar">
                                <button onClick={() => setModalTab('details')} className={`flex items-center gap-2 text-xs font-black pb-3 border-b-4 transition-all uppercase tracking-widest shrink-0 ${modalTab === 'details' ? 'border-pa-500 text-pa-600' : 'border-transparent text-slate-400'}`}>
                                    <Info className="w-4 h-4"/> Temel Bilgiler
                                </button>
                                <button onClick={() => setModalTab('content')} className={`flex items-center gap-2 text-xs font-black pb-3 border-b-4 transition-all uppercase tracking-widest shrink-0 ${modalTab === 'content' ? 'border-pa-500 text-pa-600' : 'border-transparent text-slate-400'}`}>
                                    <BookOpen className="w-4 h-4"/> Müfredat
                                </button>
                                <button onClick={() => setModalTab('goals')} className={`flex items-center gap-2 text-xs font-black pb-3 border-b-4 transition-all uppercase tracking-widest shrink-0 ${modalTab === 'goals' ? 'border-pa-500 text-pa-600' : 'border-transparent text-slate-400'}`}>
                                    <Target className="w-4 h-4"/> Hedefler
                                </button>
                            </div>
                        </div>
                        <button onClick={() => setIsModalOpen(false)} className="p-4 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-3xl transition-all"><X className="w-8 h-8 text-slate-400"/></button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-10 custom-scrollbar bg-slate-50/20 dark:bg-slate-900/10">
                        {modalTab === 'details' && (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                                <div className="space-y-8">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Eğitim Başlığı</label>
                                        <input className="w-full p-6 border-2 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-[2rem] font-bold text-lg outline-none focus:border-pa-500 transition-all shadow-inner" value={editingTraining.title} onChange={e => setEditingTraining({...editingTraining, title: e.target.value})} />
                                    </div>
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Başlangıç</label>
                                            <input type="date" className="w-full p-5 border rounded-[1.5rem] dark:bg-slate-700 outline-none font-bold text-sm" value={editingTraining.startDate} onChange={e => setEditingTraining({...editingTraining, startDate: e.target.value})} />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Bitiş</label>
                                            <input type="date" className="w-full p-5 border rounded-[1.5rem] dark:bg-slate-700 outline-none font-bold text-sm" value={editingTraining.endDate} onChange={e => setEditingTraining({...editingTraining, endDate: e.target.value})} />
                                        </div>
                                    </div>
                                    <div className="bg-white dark:bg-slate-800 p-8 rounded-[3rem] border dark:border-slate-700 shadow-sm space-y-6">
                                        <h4 className="text-[10px] font-black text-pa-600 uppercase tracking-widest border-b pb-4">Ücretlendirme Yapısı (₺)</h4>
                                        <div className="grid grid-cols-3 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-[9px] font-black text-slate-400 uppercase">Liste</label>
                                                <input type="number" className="w-full p-4 border rounded-2xl dark:bg-slate-700 text-sm font-black" value={editingTraining.price} onChange={e => setEditingTraining({...editingTraining, price: Number(e.target.value)})} />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[9px] font-black text-amber-500 uppercase">Erken</label>
                                                <input type="number" className="w-full p-4 border border-amber-100 bg-amber-50/20 rounded-2xl dark:bg-slate-700 text-sm font-black" value={editingTraining.earlyBirdPrice} onChange={e => setEditingTraining({...editingTraining, earlyBirdPrice: Number(e.target.value)})} />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[9px] font-black text-pa-500 uppercase">Özel</label>
                                                <input type="number" className="w-full p-4 border border-pa-100 bg-pa-50/20 rounded-2xl dark:bg-slate-700 text-sm font-black" value={editingTraining.specialPrice} onChange={e => setEditingTraining({...editingTraining, specialPrice: Number(e.target.value)})} />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Durum Etiketi</label>
                                        <select className="w-full p-6 border rounded-[2rem] font-black outline-none shadow-sm dark:bg-slate-700" value={editingTraining.status} onChange={e => setEditingTraining({...editingTraining, status: e.target.value as TrainingStatus})}>
                                            {Object.values(TrainingStatus).map(s => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div className="space-y-8">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Ders Takvimi & Oturumlar</label>
                                        <div className="bg-white dark:bg-slate-800 p-8 rounded-[3rem] border dark:border-slate-700 shadow-sm space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar">
                                            {editingTraining.schedule?.map((s, i) => (
                                                <div key={i} className="flex gap-3 items-center p-3 bg-slate-50 dark:bg-slate-900 rounded-2xl border dark:border-slate-700 group transition-all">
                                                    <input type="date" className="flex-1 p-2 text-xs font-bold border rounded-xl dark:bg-slate-800 outline-none" value={s.date} onChange={e => {
                                                        const newS = [...(editingTraining.schedule || [])];
                                                        newS[i].date = e.target.value;
                                                        setEditingTraining({...editingTraining, schedule: newS});
                                                    }} />
                                                    <div className="flex items-center gap-1">
                                                        <Clock className="w-3 h-3 text-slate-400"/>
                                                        <input type="time" className="w-20 p-2 text-xs font-bold border rounded-xl dark:bg-slate-800 outline-none" value={s.startTime} onChange={e => {
                                                            const newS = [...(editingTraining.schedule || [])];
                                                            newS[i].startTime = e.target.value;
                                                            setEditingTraining({...editingTraining, schedule: newS});
                                                        }} />
                                                    </div>
                                                    <button onClick={() => {
                                                        const newS = (editingTraining.schedule || []).filter((_, idx) => idx !== i);
                                                        setEditingTraining({...editingTraining, schedule: newS});
                                                    }} className="text-red-500 font-bold p-2 hover:bg-red-50 rounded-xl opacity-0 group-hover:opacity-100 transition-all">×</button>
                                                </div>
                                            ))}
                                            <button onClick={() => setEditingTraining({...editingTraining, schedule: [...(editingTraining.schedule || []), {id: Math.random().toString(), date: '', startTime: '09:00', endTime: '12:00'}]})} className="w-full py-4 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-[2rem] text-xs font-black text-pa-600 hover:bg-pa-50 transition-all uppercase">+ Yeni Oturum Ekle</button>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Eğitmen Atamaları</label>
                                        <div className="grid grid-cols-1 gap-3 p-6 bg-white dark:bg-slate-800 border rounded-[2.5rem] dark:border-slate-700 shadow-sm max-h-48 overflow-y-auto custom-scrollbar">
                                            {instructors.map(inst => (
                                                <label key={inst.id} className={`flex items-center gap-4 text-xs font-black p-4 rounded-2xl border transition-all cursor-pointer ${editingTraining.instructorIds?.includes(inst.id) ? 'bg-pa-50 border-pa-500 text-pa-700 shadow-md translate-x-1' : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-400'}`}>
                                                    <input type="checkbox" className="w-5 h-5 rounded-full text-pa-500 border-2" checked={editingTraining.instructorIds?.includes(inst.id)} onChange={e => {
                                                        const ids = editingTraining.instructorIds || [];
                                                        const newIds = e.target.checked ? [...ids, inst.id] : ids.filter(id => id !== inst.id);
                                                        setEditingTraining({...editingTraining, instructorIds: newIds});
                                                    }} />
                                                    {inst.name}
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                        {modalTab === 'content' && (
                            <div className="space-y-6">
                                <h3 className="font-black text-slate-700 dark:text-white flex items-center gap-3 text-xl uppercase"><BookOpen className="w-8 h-8 text-pa-500"/> Detaylı Müfredat</h3>
                                <textarea className="w-full h-[500px] p-10 border-2 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-[3.5rem] font-medium text-base leading-relaxed shadow-inner outline-none focus:border-pa-500 transition-all" placeholder="Ders içerikleri..." value={editingTraining.content} onChange={e => setEditingTraining({...editingTraining, content: e.target.value})} />
                            </div>
                        )}
                        {modalTab === 'goals' && (
                            <div className="space-y-10">
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                    <div className="bg-indigo-50 dark:bg-indigo-900/20 p-8 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-900/30">
                                        <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest block mb-4">Hedef Başvuru</label>
                                        <input type="number" className="w-full bg-transparent font-black text-4xl outline-none" value={editingTraining.goals?.targetLeads} onChange={e => setEditingTraining({...editingTraining, goals: {...editingTraining.goals!, targetLeads: Number(e.target.value)}})} />
                                    </div>
                                </div>
                                <button onClick={runGoalAnalysis} disabled={isGoalAnalyzing} className="w-full bg-pa-900 text-white py-8 rounded-[3rem] text-xl font-black flex items-center justify-center gap-4 shadow-2xl active:scale-95 transition-all">
                                    {isGoalAnalyzing ? <Loader2 className="w-8 h-8 animate-spin"/> : <Sparkles className="w-8 h-8 text-pa-400"/>} AI Analiz Yap
                                </button>
                                {goalAnalysis && (
                                    <div className="bg-white dark:bg-slate-900 p-10 rounded-[3rem] border-4 border-pa-50 shadow-inner whitespace-pre-wrap leading-relaxed text-slate-700 dark:text-slate-300 font-medium">
                                        {goalAnalysis}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="p-10 border-t dark:border-slate-700 flex justify-end gap-4 bg-slate-50 dark:bg-slate-900/50">
                         <button onClick={() => setIsModalOpen(false)} className="px-10 py-5 rounded-[2rem] text-slate-500 font-black hover:bg-slate-100 transition-all uppercase text-xs tracking-widest">İptal Et</button>
                         <button onClick={handleSave} className="bg-pa-500 text-white px-20 py-5 rounded-[2.5rem] font-black shadow-2xl shadow-pa-500/30 hover:scale-[1.02] active:scale-95 transition-all uppercase text-sm tracking-widest">Kaydı Tamamla</button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default TrainingManager;
