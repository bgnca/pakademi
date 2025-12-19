import React, { useState } from 'react';
import { Instructor, Resume } from '../types';
import { Save, Plus, Trash2, Upload, FileText, Printer, ArrowLeft, Loader2, Sparkles, Download, Mail, Globe, MapPin, Calendar, Briefcase } from 'lucide-react';
import { parseResumeFromDocument } from '../services/geminiService';

interface ResumeBuilderProps {
    instructor: Instructor;
    onSave: (resume: Resume) => void;
    onClose: () => void;
}

const ResumeBuilder: React.FC<ResumeBuilderProps> = ({ instructor, onSave, onClose }) => {
    const [resume, setResume] = useState<Resume>(instructor.resume || {
        summary: '',
        experiences: [],
        educations: [],
        skills: [],
        languages: []
    });
    
    const [viewMode, setViewMode] = useState<'edit' | 'preview'>('edit');
    const [isParsing, setIsParsing] = useState(false);

    // -- Handlers --
    
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsParsing(true);
        try {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = async () => {
                const base64Str = (reader.result as string).split(',')[1];
                const parsedData = await parseResumeFromDocument(base64Str, file.type);
                if (parsedData) {
                    const newResume: Resume = {
                        summary: parsedData.summary || '',
                        skills: parsedData.skills || [],
                        languages: parsedData.languages || [],
                        experiences: (parsedData.experiences || []).map((ex: any) => ({ ...ex, id: Math.random().toString(36).substr(2,9) })),
                        educations: (parsedData.educations || []).map((ed: any) => ({ ...ed, id: Math.random().toString(36).substr(2,9) }))
                    };
                    setResume(newResume);
                    alert("CV başarıyla analiz edildi ve dolduruldu!");
                } else {
                    alert("CV analiz edilemedi.");
                }
                setIsParsing(false);
            };
        } catch (error) {
            console.error(error);
            setIsParsing(false);
            alert("Dosya okuma hatası.");
        }
    };

    const addExperience = () => {
        setResume({
            ...resume,
            experiences: [...resume.experiences, { id: Math.random().toString(), title: '', company: '', dates: '', description: '' }]
        });
    };

    const updateExperience = (id: string, field: string, value: string) => {
        setResume({
            ...resume,
            experiences: resume.experiences.map(e => e.id === id ? { ...e, [field]: value } : e)
        });
    };

    const removeExperience = (id: string) => {
        setResume({ ...resume, experiences: resume.experiences.filter(e => e.id !== id) });
    };
    
    const addEducation = () => {
        setResume({
            ...resume,
            educations: [...resume.educations, { id: Math.random().toString(), degree: '', school: '', dates: '' }]
        });
    };

    const updateEducation = (id: string, field: string, value: string) => {
        setResume({
            ...resume,
            educations: resume.educations.map(e => e.id === id ? { ...e, [field]: value } : e)
        });
    };

    const removeEducation = (id: string) => {
        setResume({ ...resume, educations: resume.educations.filter(e => e.id !== id) });
    };

    const handlePrint = () => {
        // Ensure browser print dialog has time to catch styles
        setTimeout(() => {
            window.print();
        }, 100);
    };

    if (viewMode === 'preview') {
        return (
            <div className="flex flex-col h-full bg-slate-200 dark:bg-slate-900 overflow-y-auto">
                {/* Toolbar */}
                <div className="sticky top-0 z-20 bg-white dark:bg-slate-800 border-b dark:border-slate-700 p-4 flex justify-between items-center shadow-sm no-print">
                    <button onClick={() => setViewMode('edit')} className="flex items-center gap-2 text-slate-600 dark:text-slate-300 hover:text-slate-900">
                        <ArrowLeft className="w-4 h-4" /> Düzenlemeye Dön
                    </button>
                    <div className="flex gap-2">
                         <button 
                            onClick={() => { onSave(resume); onClose(); }}
                            className="flex items-center gap-2 px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
                        >
                            <Save className="w-4 h-4" /> Kaydet & Kapat
                        </button>
                        <button 
                            type="button"
                            onClick={handlePrint}
                            className="flex items-center gap-2 bg-pa-500 text-white px-6 py-2 rounded-lg hover:bg-pa-600 shadow-md"
                        >
                            <Printer className="w-4 h-4" /> PDF Olarak Yazdır
                        </button>
                    </div>
                </div>

                {/* A4 Preview Container */}
                <div className="flex-1 flex justify-center p-8 print:p-0 print:m-0">
                    {/* The A4 Page - Using min-height instead of fixed height to allow expansion */}
                    <div 
                        id="printable-cv" 
                        className="w-[210mm] min-h-[297mm] bg-white shadow-2xl flex relative text-slate-800 print:shadow-none print:w-full print:absolute print:top-0 print:left-0"
                    >
                        {/* LEFT COLUMN (SIDEBAR) */}
                        <div className="w-[30%] bg-pa-900 text-white p-6 flex flex-col gap-6 print:h-full">
                            
                            {/* Profile Image / Initials */}
                            <div className="flex flex-col items-center">
                                <div className="w-32 h-32 bg-pa-500 rounded-full flex items-center justify-center text-4xl font-bold text-white mb-4 shadow-lg border-4 border-pa-700">
                                    {instructor.name.charAt(0)}
                                </div>
                                <h1 className="text-xl font-bold text-center uppercase tracking-wider leading-tight">{instructor.name}</h1>
                                <p className="text-pa-200 text-sm text-center mt-2 font-medium">{instructor.specialty}</p>
                            </div>

                            <hr className="border-pa-700" />

                            {/* Contact Info */}
                            <div>
                                <h3 className="text-xs font-bold uppercase tracking-widest text-pa-400 mb-4 border-b border-pa-700 pb-1">İletişim</h3>
                                <div className="space-y-3 text-sm text-pa-100">
                                    <div className="flex items-center gap-3">
                                        <Mail className="w-4 h-4 text-pa-400 flex-shrink-0" />
                                        <span className="break-all text-xs">{instructor.email}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Globe className="w-4 h-4 text-pa-400 flex-shrink-0" />
                                        <span className="text-xs">paakademi.com</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <MapPin className="w-4 h-4 text-pa-400 flex-shrink-0" />
                                        <span className="text-xs">Türkiye</span>
                                    </div>
                                </div>
                            </div>

                            {/* Skills */}
                            {resume.skills.length > 0 && (
                                <div className="break-inside-avoid">
                                    <h3 className="text-xs font-bold uppercase tracking-widest text-pa-400 mb-4 border-b border-pa-700 pb-1">Uzmanlıklar</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {resume.skills.map((s,i) => (
                                            <span key={i} className="text-[10px] font-semibold bg-pa-800 text-white px-2 py-1 rounded border border-pa-700">
                                                {s}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Languages */}
                            {resume.languages.length > 0 && (
                                <div className="break-inside-avoid">
                                    <h3 className="text-xs font-bold uppercase tracking-widest text-pa-400 mb-4 border-b border-pa-700 pb-1">Diller</h3>
                                    <ul className="space-y-1">
                                        {resume.languages.map((l,i) => (
                                            <li key={i} className="text-sm text-pa-100 flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-pa-400"></div> {l}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>

                        {/* RIGHT COLUMN (MAIN CONTENT) */}
                        <div className="w-[70%] p-8 bg-white text-slate-800">
                            
                            {/* Summary */}
                            {resume.summary && (
                                <div className="mb-8 break-inside-avoid">
                                    <h2 className="text-2xl font-serif text-slate-800 border-b-2 border-pa-100 pb-2 mb-4 flex items-center gap-2">
                                        <span className="bg-pa-600 w-2 h-8 block"></span>
                                        Hakkında
                                    </h2>
                                    <p className="text-slate-600 leading-relaxed text-sm text-justify">
                                        {resume.summary}
                                    </p>
                                </div>
                            )}

                            {/* Experience */}
                            {resume.experiences.length > 0 && (
                                <div className="mb-8">
                                    <h2 className="text-2xl font-serif text-slate-800 border-b-2 border-pa-100 pb-2 mb-6 flex items-center gap-2 break-inside-avoid">
                                        <span className="bg-pa-600 w-2 h-8 block"></span>
                                        Deneyim
                                    </h2>
                                    <div className="space-y-6 border-l-2 border-pa-100 ml-1 pl-6 relative">
                                        {resume.experiences.map((exp, idx) => (
                                            <div key={exp.id} className="relative break-inside-avoid mb-4">
                                                {/* Timeline Dot */}
                                                <div className="absolute -left-[31px] top-1.5 w-4 h-4 bg-white border-4 border-pa-500 rounded-full"></div>
                                                
                                                <div className="flex justify-between items-baseline mb-1">
                                                    <h3 className="text-lg font-bold text-slate-800">{exp.title}</h3>
                                                    <span className="text-xs font-bold text-pa-600 bg-pa-50 px-2 py-1 rounded">{exp.dates}</span>
                                                </div>
                                                <div className="text-sm font-semibold text-slate-500 mb-2 flex items-center gap-1">
                                                    <Briefcase className="w-3 h-3"/> {exp.company}
                                                </div>
                                                <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                                                    {exp.description}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Education */}
                            {resume.educations.length > 0 && (
                                <div className="break-inside-avoid">
                                    <h2 className="text-2xl font-serif text-slate-800 border-b-2 border-pa-100 pb-2 mb-6 flex items-center gap-2 break-inside-avoid">
                                        <span className="bg-pa-600 w-2 h-8 block"></span>
                                        Eğitim
                                    </h2>
                                    <div className="grid grid-cols-1 gap-4">
                                        {resume.educations.map(edu => (
                                            <div key={edu.id} className="bg-pa-50 p-4 rounded-lg border-l-4 border-pa-500 break-inside-avoid">
                                                <h3 className="font-bold text-slate-800">{edu.school}</h3>
                                                <div className="flex justify-between items-center mt-1">
                                                    <span className="text-sm text-slate-600 font-medium">{edu.degree}</span>
                                                    <span className="text-xs text-slate-400 italic flex items-center gap-1">
                                                        <Calendar className="w-3 h-3" /> {edu.dates}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // EDIT MODE
    return (
        <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900">
            {/* Header */}
            <div className="bg-white dark:bg-slate-800 border-b dark:border-slate-700 p-4 flex justify-between items-center">
                <div>
                        <h2 className="text-xl font-bold text-slate-800 dark:text-white">CV Oluşturucu: {instructor.name}</h2>
                        <p className="text-sm text-slate-500">Bilgileri doldurun veya mevcut bir CV yükleyerek otomatik doldurun.</p>
                </div>
                <div className="flex gap-2">
                        <button onClick={onClose} className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">İptal</button>
                        <button onClick={() => setViewMode('preview')} className="bg-pa-500 text-white px-4 py-2 rounded-lg hover:bg-pa-600 flex items-center gap-2">
                            <FileText className="w-4 h-4" /> Önizle
                        </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
                <div className="max-w-4xl mx-auto space-y-8">
                    
                    {/* AI Upload Section */}
                    <div className="bg-gradient-to-r from-pa-50 to-teal-50 dark:from-pa-900/20 dark:to-teal-900/20 p-6 rounded-xl border border-pa-100 dark:border-pa-800 flex items-center justify-between">
                            <div>
                                <h3 className="font-bold text-pa-900 dark:text-pa-300 flex items-center gap-2">
                                    <Sparkles className="w-5 h-5"/> AI ile Otomatik Doldur
                                </h3>
                                <p className="text-sm text-pa-700 dark:text-pa-400">PDF veya Word formatındaki CV'yi yükleyin, yapay zeka analiz etsin.</p>
                            </div>
                            <label className={`cursor-pointer bg-white dark:bg-slate-800 border border-pa-200 dark:border-pa-700 px-4 py-2 rounded-lg text-pa-600 dark:text-pa-400 font-medium hover:bg-pa-50 dark:hover:bg-pa-900/50 transition-colors flex items-center gap-2 ${isParsing ? 'opacity-50 pointer-events-none' : ''}`}>
                                {isParsing ? <Loader2 className="w-4 h-4 animate-spin"/> : <Upload className="w-4 h-4"/>}
                                {isParsing ? 'Analiz Ediliyor...' : 'CV Yükle'}
                                <input type="file" className="hidden" accept=".pdf,.doc,.docx,application/pdf" onChange={handleFileUpload} />
                            </label>
                    </div>

                    {/* Summary */}
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
                        <h3 className="font-bold text-lg mb-4 text-slate-800 dark:text-white">Özet / Hakkında</h3>
                        <textarea 
                            className="w-full h-32 border dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg p-3 focus:ring-2 focus:ring-pa-500 outline-none"
                            placeholder="Profesyonel özetiniz..."
                            value={resume.summary}
                            onChange={e => setResume({...resume, summary: e.target.value})}
                        />
                    </div>

                    {/* Experience */}
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-lg text-slate-800 dark:text-white">Deneyimler</h3>
                            <button onClick={addExperience} className="text-sm text-pa-600 hover:text-pa-700 font-medium flex items-center gap-1">
                                <Plus className="w-4 h-4"/> Ekle
                            </button>
                        </div>
                        <div className="space-y-6">
                            {resume.experiences.map((exp, idx) => (
                                <div key={exp.id} className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg relative group">
                                    <button onClick={() => removeExperience(exp.id)} className="absolute top-4 right-4 text-slate-400 hover:text-red-500"><Trash2 className="w-4 h-4"/></button>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                        <input placeholder="Pozisyon / Ünvan" className="border dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded p-2 text-sm" value={exp.title} onChange={e => updateExperience(exp.id, 'title', e.target.value)} />
                                        <input placeholder="Kurum Adı" className="border dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded p-2 text-sm" value={exp.company} onChange={e => updateExperience(exp.id, 'company', e.target.value)} />
                                        <input placeholder="Tarihler (Örn: 2020 - 2022)" className="border dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded p-2 text-sm" value={exp.dates} onChange={e => updateExperience(exp.id, 'dates', e.target.value)} />
                                    </div>
                                    <textarea placeholder="Açıklama" className="w-full border dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded p-2 text-sm h-24" value={exp.description} onChange={e => updateExperience(exp.id, 'description', e.target.value)} />
                                </div>
                            ))}
                            {resume.experiences.length === 0 && <p className="text-slate-400 text-sm italic text-center">Henüz deneyim eklenmedi.</p>}
                        </div>
                    </div>

                        {/* Education */}
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-lg text-slate-800 dark:text-white">Eğitim</h3>
                            <button onClick={addEducation} className="text-sm text-pa-600 hover:text-pa-700 font-medium flex items-center gap-1">
                                <Plus className="w-4 h-4"/> Ekle
                            </button>
                        </div>
                        <div className="space-y-4">
                            {resume.educations.map((edu, idx) => (
                                <div key={edu.id} className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg relative group">
                                    <button onClick={() => removeEducation(edu.id)} className="absolute top-4 right-4 text-slate-400 hover:text-red-500"><Trash2 className="w-4 h-4"/></button>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <input placeholder="Okul / Üniversite" className="border dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded p-2 text-sm" value={edu.school} onChange={e => updateEducation(edu.id, 'school', e.target.value)} />
                                        <input placeholder="Derece / Bölüm" className="border dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded p-2 text-sm" value={edu.degree} onChange={e => updateEducation(edu.id, 'degree', e.target.value)} />
                                        <input placeholder="Tarihler" className="border dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded p-2 text-sm" value={edu.dates} onChange={e => updateEducation(edu.id, 'dates', e.target.value)} />
                                    </div>
                                </div>
                            ))}
                            {resume.educations.length === 0 && <p className="text-slate-400 text-sm italic text-center">Henüz eğitim eklenmedi.</p>}
                        </div>
                    </div>

                    {/* Skills & Languages */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
                            <h3 className="font-bold text-lg mb-4 text-slate-800 dark:text-white">Yetenekler</h3>
                            <textarea 
                                className="w-full h-32 border dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg p-3 text-sm"
                                placeholder="Her satıra bir yetenek yazın..."
                                value={resume.skills.join('\n')}
                                onChange={e => setResume({...resume, skills: e.target.value.split('\n')})}
                            />
                        </div>
                            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
                            <h3 className="font-bold text-lg mb-4 text-slate-800 dark:text-white">Diller</h3>
                            <textarea 
                                className="w-full h-32 border dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg p-3 text-sm"
                                placeholder="Her satıra bir dil yazın..."
                                value={resume.languages.join('\n')}
                                onChange={e => setResume({...resume, languages: e.target.value.split('\n')})}
                            />
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}

export default ResumeBuilder;