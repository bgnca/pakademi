
import React, { useState } from 'react';
import { Participant, Training, ParticipantDocument } from '../types';
import { FileText, Upload, Trash2, Wand2, Loader2, Download, Eye, X } from 'lucide-react';
import { generateCertificateImage } from '../services/geminiService';

interface DocumentManagerProps {
    participants: Participant[];
    setParticipants: React.Dispatch<React.SetStateAction<Participant[]>>;
    trainings: Training[];
}

const DocumentManager: React.FC<DocumentManagerProps> = ({ participants, setParticipants, trainings }) => {
    const [activeTab, setActiveTab] = useState<'list' | 'certificate'>('list');
    const [selectedTrainingId, setSelectedTrainingId] = useState<string>('all');
    const [templateFile, setTemplateFile] = useState<File | null>(null);
    const [templatePreview, setTemplatePreview] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [generationLog, setGenerationLog] = useState<string[]>([]);
    const [previewDocUrl, setPreviewDocUrl] = useState<string | null>(null);

    const filteredParticipants = participants.filter(p => 
        selectedTrainingId === 'all' || p.assignments.some(a => a.trainingId === selectedTrainingId)
    );

    const handleTemplateUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setTemplateFile(file);
            setTemplatePreview(URL.createObjectURL(file));
        }
    };

    const handleManualUpload = (e: React.ChangeEvent<HTMLInputElement>, pId: string) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (ev) => {
                const newDoc: ParticipantDocument = {
                    id: Math.random().toString(36).substr(2, 9),
                    name: file.name,
                    url: ev.target?.result as string,
                    uploadDate: new Date().toISOString(),
                    type: 'OTHER'
                };
                setParticipants(prev => prev.map(p => p.id === pId ? { ...p, documents: [newDoc, ...(p.documents || [])] } : p));
            };
        }
    };

    const handleGenerateCertificates = async () => {
        if (!templateFile || selectedTrainingId === 'all') {
            alert("Lütfen önce bir eğitim seçin ve bir şablon yükleyin.");
            return;
        }

        setIsGenerating(true);
        setGenerationLog([]);
        const reader = new FileReader();
        reader.readAsDataURL(templateFile);
        reader.onload = async () => {
            const base64Template = (reader.result as string).split(',')[1];
            let updatedParticipants = [...participants];

            for (const p of filteredParticipants) {
                setGenerationLog(prev => [...prev, `${p.name} hazırlanıyor...`]);
                const certImage = await generateCertificateImage(base64Template, p.name);
                if (certImage) {
                    const newDoc: ParticipantDocument = {
                        id: Math.random().toString(36).substr(2, 9),
                        name: `${p.name} Sertifika`,
                        url: certImage,
                        uploadDate: new Date().toISOString(),
                        type: 'CERTIFICATE'
                    };
                    updatedParticipants = updatedParticipants.map(up => up.id === p.id ? { ...up, documents: [newDoc, ...(up.documents || [])] } : up);
                    setGenerationLog(prev => [...prev, `✓ ${p.name} bitti.`]);
                }
            }
            setParticipants(updatedParticipants);
            setIsGenerating(false);
        };
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Belge Yönetimi</h2>
                <div className="flex bg-white dark:bg-slate-800 rounded-2xl border dark:border-slate-700 p-1">
                    <button onClick={() => setActiveTab('list')} className={`px-6 py-2 rounded-xl text-xs font-black uppercase ${activeTab==='list'?'bg-pa-500 text-white shadow-lg':'text-slate-400 hover:text-slate-700'}`}>Tüm Belgeler</button>
                    <button onClick={() => setActiveTab('certificate')} className={`px-6 py-2 rounded-xl text-xs font-black uppercase flex items-center gap-2 ${activeTab==='certificate'?'bg-pa-500 text-white shadow-lg':'text-slate-400 hover:text-slate-700'}`}><Wand2 className="w-4 h-4" /> AI Sertifika</button>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-[2rem] border dark:border-slate-700 flex items-center gap-6">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Eğitim Filtresi:</label>
                <select className="border-2 p-3 rounded-2xl dark:bg-slate-700 font-bold text-sm min-w-[200px]" value={selectedTrainingId} onChange={e => setSelectedTrainingId(e.target.value)}>
                    <option value="all">Tüm Eğitimler</option>
                    {trainings.filter(t=>t.price).map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
                </select>
            </div>

            {activeTab === 'list' && (
                <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-sm border dark:border-slate-700 overflow-hidden">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 dark:bg-slate-900 border-b dark:border-slate-700 font-black text-[10px] uppercase tracking-widest">
                            <tr>
                                <th className="px-8 py-5">Katılımcı</th>
                                <th className="px-8 py-5">Belge Adı</th>
                                <th className="px-8 py-5">Yükleme Tarihi</th>
                                <th className="px-8 py-5 text-right">İşlemler</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                            {filteredParticipants.flatMap(p => (p.documents || []).map(doc => (
                                <tr key={doc.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                    <td className="px-8 py-4 dark:text-white font-bold">{p.name}</td>
                                    <td className="px-8 py-4 flex items-center gap-2 dark:text-slate-300">
                                        <FileText className="w-4 h-4 text-pa-500"/> {doc.name}
                                    </td>
                                    <td className="px-8 py-4 text-slate-500 dark:text-slate-400 text-xs font-bold">{new Date(doc.uploadDate).toLocaleDateString()}</td>
                                    <td className="px-8 py-4 text-right flex items-center justify-end gap-2">
                                        <button onClick={() => setPreviewDocUrl(doc.url)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-xl transition-all"><Eye className="w-5 h-5"/></button>
                                        <button onClick={() => {
                                            if (confirm("Bu belgeyi kalıcı olarak silmek istediğinize emin misiniz?")) {
                                                setParticipants(prev => prev.map(up => up.id === p.id ? { ...up, documents: up.documents.filter(d=>d.id!==doc.id) } : up));
                                            }
                                        }} className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-all"><Trash2 className="w-5 h-5"/></button>
                                    </td>
                                </tr>
                            )))}
                        </tbody>
                    </table>
                </div>
            )}

            {activeTab === 'certificate' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-white dark:bg-slate-800 p-10 rounded-[3rem] border dark:border-slate-700 space-y-6">
                        <h3 className="font-black text-lg uppercase tracking-tight">1. Şablon Yükle</h3>
                        <div className="border-4 border-dashed border-slate-100 dark:border-slate-700 rounded-[2.5rem] p-12 text-center relative group">
                            {templatePreview ? (
                                <div className="relative">
                                    <img src={templatePreview} alt="Preview" className="max-h-64 mx-auto rounded-3xl shadow-xl" />
                                    <button onClick={() => {setTemplateFile(null); setTemplatePreview(null);}} className="absolute -top-4 -right-4 bg-red-500 text-white p-3 rounded-full shadow-lg"><X className="w-5 h-5"/></button>
                                </div>
                            ) : (
                                <label className="cursor-pointer block space-y-4">
                                    <Upload className="w-16 h-16 text-slate-200 mx-auto group-hover:text-pa-400 transition-colors" />
                                    <p className="text-sm text-slate-400 font-bold uppercase tracking-widest">Dosya Seçiniz</p>
                                    <input type="file" className="hidden" accept="image/*" onChange={handleTemplateUpload} />
                                </label>
                            )}
                        </div>
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-10 rounded-[3rem] border dark:border-slate-700 space-y-8">
                        <h3 className="font-black text-lg uppercase tracking-tight">2. Üretimi Başlat</h3>
                        <div className="p-8 bg-slate-50 dark:bg-slate-900 rounded-3xl space-y-2">
                            <p className="text-xs font-black uppercase text-slate-400">Hedef Eğitim</p>
                            <p className="text-sm font-black">{trainings.find(t=>t.id===selectedTrainingId)?.title || 'Eğitim Seçilmedi'}</p>
                            <p className="text-[10px] font-bold text-pa-600 mt-2">{filteredParticipants.length} Katılımcı Tespit Edildi</p>
                        </div>
                        <button 
                            onClick={handleGenerateCertificates}
                            disabled={isGenerating || !templateFile || selectedTrainingId === 'all'}
                            className="w-full bg-pa-500 hover:bg-pa-600 text-white py-6 rounded-[2rem] font-black text-lg shadow-xl shadow-pa-500/30 disabled:opacity-50 transition-all flex items-center justify-center gap-3"
                        >
                            {isGenerating ? <Loader2 className="w-6 h-6 animate-spin"/> : <Wand2 className="w-6 h-6"/>}
                            {isGenerating ? 'AI Üretim Yapıyor...' : 'Tüm Sertifikaları Hazırla'}
                        </button>
                        {generationLog.length > 0 && (
                            <div className="h-40 overflow-y-auto bg-slate-950 text-emerald-400 p-6 rounded-[2rem] font-mono text-[10px] space-y-1">
                                {generationLog.map((l, i) => <div key={i}>{l}</div>)}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {previewDocUrl && (
                <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-[100] p-10 backdrop-blur-xl" onClick={() => setPreviewDocUrl(null)}>
                    <img src={previewDocUrl} alt="Preview" className="max-w-full max-h-full rounded-3xl shadow-2xl border-4 border-white/10" />
                    <button className="absolute top-10 right-10 text-white"><X className="w-10 h-10"/></button>
                </div>
            )}
        </div>
    );
};

export default DocumentManager;
