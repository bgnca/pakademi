
import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import TrainingManager from './components/TrainingManager';
import ParticipantManager from './components/ParticipantManager';
import FinancialReport from './components/FinancialReport';
import AIAssistant from './components/AIAssistant';
import InstructorManager from './components/InstructorManager';
import AdManager from './components/AdManager';
import DocumentManager from './components/DocumentManager';
import Alerts from './components/Alerts';
import Login from './components/Login';
import Settings from './components/Settings';
import { Training, Participant, Instructor, Expense, TrainingStatus, PaymentStatus, InteractionType, Notification, User, InstructorCandidate, TrainingAssignment } from './types';
import { db } from './services/firestoreService';
import { collection, onSnapshot, query } from 'firebase/firestore';

const INITIAL_USERS: User[] = [
    { id: 'u1', name: 'Ahmet Yılmaz (Admin)', email: 'admin@pa.com', password: '123456', role: 'ADMIN' },
    { id: 'u2', name: 'Selin Demir', email: 'selin@pa.com', password: '123456', role: 'MANAGER' },
];

const INITIAL_INSTRUCTORS: Instructor[] = [
    { id: 'i1', name: 'Prof. Dr. Caner Başkurt', title: 'Spor Psikoloğu', email: 'caner@pa.com', phone: '05321112233', specialty: 'Elit Sporcularda Zihinsel Hazırlık ve Performans', defaultCommissionRate: 40 },
    { id: 'i2', name: 'Doç. Dr. Ayşe Yılmaz', title: 'Klinik Psikolog', email: 'ayse@pa.com', phone: '05330004455', specialty: 'Bilişsel Davranışçı Terapi (BDT) ve OKB', defaultCommissionRate: 35 }
];

const INITIAL_TRAININGS: Training[] = [
    { 
        id: 't1', 
        title: 'Spor Psikolojisi Branşı', 
        description: 'Ana Kategori', 
        content: '', 
        instructorIds: [], 
        startDate: '2024-01-01', 
        endDate: '2025-12-31', 
        schedule: [], 
        price: 0, 
        earlyBirdPrice: 0, 
        specialPrice: 0, 
        quota: 0, 
        status: TrainingStatus.PLANNING, 
        location: 'Online', 
        tasks: [], 
        goals: { targetLeads: 100, targetParticipants: 20, targetRevenue: 50000 } 
    },
    { 
        id: 't1-1', 
        parentTrainingId: 't1',
        title: 'Sporcularda Performans Odaklı Zihinsel Beceriler', 
        description: 'Uygulamalı Eğitim', 
        content: 'Modül 1: Odaklanma Teknikleri\nModül 2: Kaygı Yönetimi', 
        instructorIds: ['i1'], 
        startDate: '2024-10-15', 
        endDate: '2024-12-15', 
        schedule: [{ id: 's1', date: '2024-10-15', startTime: '19:00', endTime: '22:00' }], 
        price: 4500, 
        earlyBirdPrice: 3800, 
        specialPrice: 3500, 
        quota: 30, 
        status: TrainingStatus.REGISTRATION_OPEN, 
        location: 'Online (Zoom)', 
        tasks: [], 
        goals: { targetLeads: 150, targetParticipants: 25, targetRevenue: 100000 } 
    }
];

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  const [notifications, setNotifications] = useState<Notification[]>([
      { id: '1', title: 'Haftalık Rapor Hazır', message: 'Geçen haftanın finansal özeti AI tarafından analiz edildi.', type: 'INFO', date: new Date().toISOString(), isRead: false },
      { id: '2', title: 'Kontenjan Uyarısı', message: 'Spor Psikolojisi Eğitimi %90 doluluğa ulaştı.', type: 'ALERT', date: new Date().toISOString(), isRead: false }
  ]);
  
  const [trainings, setTrainings] = useState<Training[]>(() => {
      const saved = localStorage.getItem('pa_trainings');
      return saved ? JSON.parse(saved) : INITIAL_TRAININGS;
  });

  // Katılımcılar artık Firestore'dan çekilecek
  const [participants, setParticipants] = useState<Participant[]>([]);
  
  const [instructors, setInstructors] = useState<Instructor[]>(() => {
    const saved = localStorage.getItem('pa_instructors');
    return saved ? JSON.parse(saved) : INITIAL_INSTRUCTORS;
  });
  const [candidates, setCandidates] = useState<InstructorCandidate[]>([]);
  
  const [globalChecklist, setGlobalChecklist] = useState<{id: string, label: string}[]>(() => {
      const saved = localStorage.getItem('pa_checklist_config');
      return saved ? JSON.parse(saved) : [
          { id: 'c1', label: 'Kayıt sisteme işlendi' },
          { id: 'c2', label: 'Fatura e-arşiv olarak kesildi' },
          { id: 'c3', label: 'Hoşgeldin maili iletildi' },
          { id: 'c4', label: 'Eğitim WhatsApp grubuna alındı' }
      ];
  });
  
  const [actionOptions, setActionOptions] = useState<string[]>(() => {
      const saved = localStorage.getItem('pa_action_options');
      return saved ? JSON.parse(saved) : ['Tekrar aranacak', 'E-posta gönderilecek', 'Yanıt bekleniyor', 'Kayıt linki iletilecek'];
  });
  const [contactStatusOptions, setContactStatusOptions] = useState<string[]>(() => {
      const saved = localStorage.getItem('pa_contact_status_options');
      return saved ? JSON.parse(saved) : ['Ulaşılamadı', 'Görüşüldü', 'Meşgul', 'Dönüş Yapacak'];
  });
  const [regStatusOptions, setRegStatusOptions] = useState<string[]>(() => {
      const saved = localStorage.getItem('pa_reg_status_options');
      return saved ? JSON.parse(saved) : ['Kayıtlı', 'Kayıt Olacak', 'Düşünme Aşamasında', 'Diğer Eğitime Katılacak', 'Olumsuz'];
  });

  const [expenses, setExpenses] = useState<Expense[]>([]);

  // Firestore Real-time Sync for Participants
  useEffect(() => {
    const q = query(collection(db, "katilimcilar"));
    const unsub = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Participant));
      setParticipants(docs);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
      localStorage.setItem('pa_trainings', JSON.stringify(trainings));
      // Artık katılımcıları localStorage'a kaydetmiyoruz, Firestore ana kaynak.
      localStorage.setItem('pa_instructors', JSON.stringify(instructors));
      localStorage.setItem('pa_checklist_config', JSON.stringify(globalChecklist));
      localStorage.setItem('pa_action_options', JSON.stringify(actionOptions));
      localStorage.setItem('pa_contact_status_options', JSON.stringify(contactStatusOptions));
      localStorage.setItem('pa_reg_status_options', JSON.stringify(regStatusOptions));
  }, [trainings, instructors, globalChecklist, actionOptions, contactStatusOptions, regStatusOptions]);

  useEffect(() => {
    if (isDarkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [isDarkMode]);

  const renderContent = () => {
    if (activeTab.startsWith('trainings')) return (
        <TrainingManager 
            trainings={trainings} 
            instructors={instructors} 
            setTrainings={setTrainings} 
            participants={participants} 
            initialFilter={activeTab}
            setCandidates={setCandidates} 
        />
    );
    if (activeTab.startsWith('instructors')) return <InstructorManager instructors={instructors} setInstructors={setInstructors} candidates={candidates} setCandidates={setCandidates} trainings={trainings} participants={participants} initialFilter={activeTab} currentUser={currentUser!} />;
    if (activeTab.startsWith('participants')) return (
        <ParticipantManager 
            participants={participants} 
            trainings={trainings} 
            setParticipants={setParticipants} 
            globalChecklist={globalChecklist} 
            actionOptions={actionOptions}
            contactStatusOptions={contactStatusOptions}
            regStatusOptions={regStatusOptions}
            initialFilter={activeTab} 
        />
    );
    
    switch (activeTab) {
      case 'dashboard': return <Dashboard trainings={trainings} participants={participants} />;
      case 'financials': return <FinancialReport trainings={trainings} participants={participants} instructors={instructors} expenses={expenses} setExpenses={setExpenses} />;
      case 'ai-assistant': return <AIAssistant trainings={trainings} participants={participants} instructors={instructors} />;
      case 'documents': return <DocumentManager participants={participants} setParticipants={setParticipants} trainings={trainings} />;
      case 'ads': return <AdManager trainings={trainings} />; 
      case 'alerts': return <Alerts trainings={trainings} participants={participants} />;
      case 'settings': return (
        <Settings 
            checklist={globalChecklist} 
            setChecklist={setGlobalChecklist} 
            actionOptions={actionOptions}
            setActionOptions={setActionOptions}
            contactStatusOptions={contactStatusOptions}
            setContactStatusOptions={setContactStatusOptions}
            regStatusOptions={regStatusOptions}
            setRegStatusOptions={setRegStatusOptions}
        />
      );
      default: return <Dashboard trainings={trainings} participants={participants} />;
    }
  };

  if (!currentUser) return <Login onLogin={setCurrentUser} users={INITIAL_USERS} />;

  return (
    <Layout 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        currentUser={currentUser}
        onLogout={() => setCurrentUser(null)}
        isDarkMode={isDarkMode}
        toggleDarkMode={() => setIsDarkMode(!isDarkMode)}
        notifications={notifications}
        setNotifications={setNotifications}
    >
      {renderContent()}
    </Layout>
  );
}

export default App;
