
import React, { useState, useRef, useEffect } from 'react';
import { Participant, Training, PaymentStatus, InteractionType, InteractionLog, PaymentMethod } from '../types';
import { Search, Plus, X, Mail, Phone, Loader2, Trash2, ChevronRight, Users, Table as TableIcon, Download } from 'lucide-center';
import { saveParticipantToFirestore, deleteParticipantFromFirestore, db } from '../services/firestoreService';
import { collection, onSnapshot, query } from 'firebase/firestore';
import * as XLSX from 'xlsx';

// Lucide icons fix for import error if present in some environments
import { Search as SearchIcon, Plus as PlusIcon, X as XIcon, Mail as MailIcon, Phone as PhoneIcon, Loader2 as LoaderIcon, Trash2 as TrashIcon, ChevronRight as ChevronIcon, Users as UsersIcon, Table as TableIconSet, Download as DownloadIcon } from 'lucide-react';

interface ParticipantManagerProps {
  participants: Participant[]; 
  trainings: Training[];
  setParticipants: React.Dispatch<React.SetStateAction<Participant[]>>;
  globalChecklist: {id: string, label: string}[];
  actionOptions: string[];
  contactStatusOptions: string[];
  regStatusOptions: string[];
  initialFilter?: string;
}

const ParticipantManager: React.FC<ParticipantManagerProps> = ({ 
    participants: initialParticipants, trainings, setParticipants, 
    globalChecklist, actionOptions, contactStatusOptions, regStatusOptions, 
    initialFilter 
}) => {
  const isLeadsView = initialFilter === 'participants-leads';
  const isFutureView = initialFilter === 'participants-future';
  const isRegisteredView = initialFilter === 'participants-registered';
  
  const [dbParticipants, setDbParticipants] = useState<Participant[]>([]);
  const [filterTraining, setFilterTraining] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedParticipantId, setSelectedParticipantId] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isSavingManual, setIsSavingManual] = useState(false);
  
  const [isAddLeadModalOpen, setIsAddLeadModalOpen] = useState(false);

  const excelInputRef = useRef<HTMLInputElement>(null);

  // FIRESTORE CANLI SENKRONİZASYON (App.tsx'te de var ama burada lokal state yönetimi için kalabilir)
  useEffect(() => {
    const q = query(collection(db, "katilimcilar"));
    const unsub = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Participant));
      setDbParticipants(docs);
    }, (error) => {
      console.error("Firestore bağlantı hatası:", error);
    });
    return () => unsub();
  }, []);

  // ÖRNEK ŞABLON İNDİRME
  const downloadTemplate = () => {
    const templateData = [
      { "Ad Soyad": "Ahmet Yılmaz", "Telefon": "05320000000", "E-posta": "ahmet@ornek.com", "Eğitim": trainings[0]?.title || "Eğitim Adı" }
    ];
    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Katılımcı Listesi");
    XLSX.writeFile(wb, "PA_Akademi_Katilimci_Aktarim_Sablonu.xlsx");
  };

  // EXCEL İÇE AKTARMA (GELİŞMİŞ)
  const handleExcelImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    const reader = new FileReader();
    
    reader.onload = async (evt) => {
      try {
        const arrayBuffer = evt.target?.result;
        if (!arrayBuffer) throw new Error("Dosya okunamadı.");

        const data = new Uint8Array(arrayBuffer as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        if (jsonData.length === 0) {
            alert("Dosya boş görünüyor.");
            setIsImporting(false);
            return;
        }

        let successCount = 0;
        for (const row of jsonData as any) {
          const getVal = (keys: string[]) => {
            const foundKey = Object.keys(row).find(k => keys.some(key => k.toLowerCase().trim() === key.toLowerCase()));
            return foundKey ? row[foundKey] : '';
          };

          const name = getVal(['ad soyad', 'isim', 'ad', 'katılımcı', 'name']);
          const phone = String(getVal(['telefon', 'tel', 'phone', 'gsm']) || '');
          const email = getVal(['e-posta', 'eposta', 'email', 'mail']);
          const trainingName = getVal(['eğitim', 'egitim', 'training', 'branş']);

          if (!name) continue;

          const newParticipant: any = {
            name: String(name),
            phone: phone,
            email: String(email),
            assignments: [],
            interactionLog: [{
                id: Math.random().toString(36).substr(2, 9),
                date: new Date().toISOString(),
                type: InteractionType.NOTE,
                note: 'Excel ile buluta aktarıldı.',
                performedBy: 'Sistem'
            }],
            documents: []
          };
          
          if (trainingName) {
              const foundT = trainings.find(t => t.title.toLowerCase().trim().includes(String(trainingName).toLowerCase().trim()));
              if (foundT) {
                  newParticipant.assignments.push({
                      trainingId: foundT.id,
                      regStatus: 'Kayıtlı',
                      paymentStatus: PaymentStatus.PENDING,
                      registrationDate: new Date().toISOString(),
                      discount: 0,
                      participationType: 'ONLINE',
                      payments: [],
                      attendance: {},
                      checklistState: {}
                  });
              }
          }

          try {
            await saveParticipantToFirestore(newParticipant);
            successCount++;
          } catch (err) {
            console.error(`Kayıt eklenemedi: ${name}`, err);
          }
        }
        alert(`${successCount} katılımcı başarıyla bulut veritabanına aktarıldı.`);
      } catch (error) {
        console.error("Excel Aktarım Hatası:", error);
        alert("Excel dosyası işlenirken hata oluştu.");
      } finally {
        setIsImporting(false);
        if (excelInputRef.current) excelInputRef.current.value = '';
      }
    };

    reader.readAsArrayBuffer(file);
  };

  const filteredParticipants = dbParticipants.filter(p => {
    const matchesSearch = p.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.phone?.includes(searchTerm);
    if (!matchesSearch) return false;

    if (isFutureView) return p.assignments?.some(a => a.regStatus === 'Diğer Eğitime Katılacak');
    if (isRegisteredView) return p.assignments?.some(a => a.regStatus === 'Kayıtlı');
    if (isLeadsView) return !p.assignments || p.assignments.length === 0 || p.assignments.some(a => a.regStatus !== 'Kayıtlı' && a.regStatus !== 'Diğer Eğitime Katılacak');

    if (filterTraining !== 'all') {
        return p.assignments?.some(a => a.trainingId === filterTraining);
    }
    return true;
  });

  const handleManualAdd = async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setIsSavingManual(true);
      try {
          const formData = new FormData(e.currentTarget);
          const trainingId = formData.get('trainingId') as string;
          const newP: any = {
              name: formData.get('name') as string,
              phone: formData.get('phone') as string,
              email: formData.get('email') as string,
              assignments: trainingId ? [{
                  trainingId,
                  regStatus: regStatusOptions[0],
                  paymentStatus: PaymentStatus.PENDING,
                  registrationDate: new Date().toISOString(),
                  discount: 0,
                  participationType: 'ONLINE',
                  payments: [],
                  attendance: {},
                  checklistState: {}
              }] : [],
              interactionLog: [],
              documents: []
          };
          await saveParticipantToFirestore(newP);
          setIsAddLeadModalOpen(false);
      } catch (error) {
          console.error("Kayıt hatası:", error);
          alert("Buluta kayıt yapılırken bir hata oluştu.");
      } finally {
          setIsSavingManual(false);
      }
  };

  return (
    <div className="space-y-6">
       <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h2 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight flex items-center gap-3">
                <UsersIcon className="w-8 h-8 text-pa-500"/>
                {isLeadsView ? 'Katılımcı Havuzu' : isFutureView ? 'Gelecek Planlananlar' : 'Kesin Kayıtlılar'}
            </h2>
            <p className="text-sm text-slate-500 font-bold italic">Canlı Firestore Veritabanı (gen-lang-client-0720632366)</p>
        </div>
        <div className="flex flex-wrap gap-2">
                 <button 
                    onClick={downloadTemplate}
                    className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-pa-500 px-5 py-2.5 rounded-2xl flex items-center gap-2 text-sm font-black transition-all active:scale-95"
                 >
                    <DownloadIcon className="w-4 h-4"/> Şablonu İndir
                 </button>
                 <input type="file" ref={excelInputRef} className="hidden" accept=".xlsx, .xls" onChange={handleExcelImport} />
                 <button 
                    onClick={() => excelInputRef.current?.click()} 
                    disabled={isImporting}
                    className="bg-indigo-50 text-indigo-600 border border-indigo-100 hover:bg-indigo-100 px-5 py-2.5 rounded-2xl flex items-center gap-2 text-sm font-black transition-all active:scale-95 disabled:opacity-50"
                 >
                    {isImporting ? <LoaderIcon className="w-5 h-5 animate-spin"/> : <TableIconSet className="w-5 h-5"/>}
                    Excel'den Aktar
                 </button>
                 <button onClick={() => setIsAddLeadModalOpen(true)} className="bg-pa-500 hover:bg-pa-600 text-white px-5 py-2.5 rounded-2xl flex items-center gap-2 text-sm font-black shadow-xl shadow-pa-500/20 transition-all active:scale-95">
                    <PlusIcon className="w-5 h-5"/> Manuel Ekle
                 </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 p-5 rounded-[2rem] shadow-sm border dark:border-slate-700 flex flex-col lg:flex-row gap-4 items-center">
        <div className="flex-1 relative w-full">
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input className="w-full pl-12 pr-4 py-4 border-2 border-slate-100 dark:border-slate-700 rounded-2xl outline-none focus:border-pa-500 font-bold text-sm bg-slate-50/50 dark:bg-slate-900 transition-all" placeholder="İsim, telefon veya e-posta ile ara..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
        <select className="w-full lg:w-64 px-4 py-4 border-2 border-slate-100 dark:border-slate-700 rounded-2xl dark:bg-slate-900 font-black text-sm outline-none focus:border-pa-500" value={filterTraining} onChange={e => setFilterTraining(e.target.value)}>
            <option value="all">Tüm Eğitimler</option>
            {trainings.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
        </select>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-sm border dark:border-slate-700 overflow-hidden">
        <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-900 border-b dark:border-slate-800 font-black text-[10px] uppercase text-slate-400 tracking-widest">
                <tr>
                    <th className="px-8 py-5">Katılımcı</th>
                    <th className="px-8 py-5">Branş Ataması</th>
                    <th className="px-8 py-5">Statü</th>
                    <th className="px-8 py-5 text-right">İşlemler</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredParticipants.length > 0 ? filteredParticipants.map(p => (
                    <tr key={p.id} className="hover:bg-pa-50/20 dark:hover:bg-slate-900/50 transition-all group">
                        <td className="px-8 py-6 cursor-pointer" onClick={() => setSelectedParticipantId(p.id)}>
                            <div className="font-black text-slate-800 dark:text-white group-hover:text-pa-600 leading-tight">{p.name}</div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase mt-1">{p.phone}</div>
                        </td>
                        <td className="px-8 py-6">
                            <div className="flex flex-wrap gap-1">
                                {p.assignments?.map(a => {
                                    const t = trainings.find(x => x.id === a.trainingId);
                                    return (
                                        <span key={a.trainingId} className="text-[9px] font-black bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded text-slate-600 dark:text-slate-300">{t?.title.substring(0, 15)}...</span>
                                    );
                                }) || <span className="text-[9px] text-slate-400 italic">Eğitim yok</span>}
                            </div>
                        </td>
                        <td className="px-8 py-6 text-xs font-bold text-pa-600 uppercase tracking-tighter italic">
                             {p.assignments?.[0]?.regStatus || 'Aday'}
                        </td>
                        <td className="px-8 py-6 text-right space-x-2">
                             <button onClick={() => setSelectedParticipantId(p.id)} className="bg-slate-100 dark:bg-slate-700 p-2 rounded-xl text-slate-500 hover:bg-pa-500 hover:text-white transition-all">
                                <ChevronIcon className="w-5 h-5"/>
                             </button>
                             <button onClick={async () => { if(confirm("Bu katılımcı silinecektir. Onaylıyor musunuz?")) await deleteParticipantFromFirestore(p.id!) }} className="p-2 text-red-300 hover:text-red-500 transition-all">
                                <TrashIcon className="w-5 h-5"/>
                             </button>
                        </td>
                    </tr>
                )) : (
                    <tr>
                        <td colSpan={4} className="px-8 py-32 text-center text-slate-400 italic font-medium">
                            <UsersIcon className="w-16 h-16 text-slate-200 mx-auto mb-4 opacity-50"/>
                            <p>Gösterilecek kayıt bulunamadı.</p>
                        </td>
                    </tr>
                )}
            </tbody>
        </table>
      </div>

      {isAddLeadModalOpen && (
           <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4 backdrop-blur-md">
                <div className="bg-white dark:bg-slate-800 rounded-[3rem] w-full max-w-lg p-12 shadow-2xl animate-in zoom-in-95">
                    <div className="flex justify-between items-center mb-10">
                        <h3 className="text-2xl font-black dark:text-white uppercase tracking-tight">Yeni Kayıt</h3>
                        <button onClick={() => setIsAddLeadModalOpen(false)} className="p-2"><XIcon className="w-8 h-8 text-slate-400" /></button>
                    </div>
                    <form onSubmit={handleManualAdd} className="space-y-6">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Ad Soyad</label>
                            <input name="name" required className="w-full p-5 border-2 rounded-[1.5rem] font-bold text-sm outline-none focus:border-pa-500 dark:bg-slate-700 dark:text-white" placeholder="Ahmet Yılmaz" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Telefon</label>
                                <input name="phone" required className="w-full p-5 border-2 rounded-[1.5rem] font-bold text-sm outline-none focus:border-pa-500 dark:bg-slate-700 dark:text-white" placeholder="05XX..." />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">E-posta</label>
                                <input name="email" type="email" className="w-full p-5 border-2 rounded-[1.5rem] font-bold text-sm outline-none focus:border-pa-500 dark:bg-slate-700 dark:text-white" placeholder="ahmet@mail.com" />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Eğitim Seçimi</label>
                            <select name="trainingId" className="w-full p-5 border-2 rounded-[1.5rem] font-black text-sm outline-none focus:border-pa-500 dark:bg-slate-700 dark:text-white">
                               <option value="">İsteğe Bağlı</option>
                               {trainings.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
                            </select>
                        </div>
                        <button 
                            type="submit" 
                            disabled={isSavingManual}
                            className="w-full bg-pa-500 hover:bg-pa-600 text-white py-5 rounded-[2rem] font-black shadow-xl transition-all text-lg flex items-center justify-center gap-2"
                        >
                            {isSavingManual ? <LoaderIcon className="w-6 h-6 animate-spin"/> : 'Kaydet'}
                        </button>
                    </form>
                </div>
           </div>
      )}
    </div>
  );
};

export default ParticipantManager;
