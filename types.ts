

export enum TrainingStatus {
  PLANNING = 'Planlama',
  REGISTRATION_PREP = 'Kayda Hazırlanıyor',
  REGISTRATION_OPEN = 'Kayda Açık',
  COMPLETED = 'Tamamlandı',
  CANCELLED = 'İptal'
}

export interface ScheduleDay {
    id: string;
    date: string;
    startTime: string;
    endTime: string;
}

export interface TrainingGoals {
    targetLeads: number;
    targetParticipants: number;
    targetRevenue: number;
    marketingBudget?: number;
    customGoals?: string;
}

export interface Task {
  id: string;
  title: string;
  isCompleted: boolean;
}

export interface Training {
  id: string;
  parentTrainingId?: string; 
  title: string;
  description: string;
  content: string; 
  instructorIds: string[]; 
  startDate: string;
  endDate: string;
  schedule: ScheduleDay[];
  price: number;
  earlyBirdPrice: number;
  specialPrice: number;
  quota: number;
  status: TrainingStatus;
  location: string;
  tasks: Task[];
  goals: TrainingGoals;
}

export enum PaymentStatus {
  PAID = 'Ödendi',
  PARTIAL = 'Kısmi Ödeme',
  PENDING = 'Bekliyor',
  REFUNDED = 'İade'
}

export enum InteractionType {
  CALL = 'Arama',
  EMAIL = 'E-posta',
  NOTE = 'Not',
  MEETING = 'Görüşme'
}

export interface InteractionLog {
  id: string;
  date: string;
  type: InteractionType;
  note: string;
  performedBy: string;
}

export enum PaymentMethod {
  CREDIT_CARD = 'POS',
  BANK_TRANSFER = 'Havale/EFT',
  CASH = 'Nakit',
  ONLINE = 'Online Ödeme'
}

export interface PaymentRecord {
  id: string;
  amount: number;
  method: PaymentMethod;
  date: string;
  description?: string;
  receiptUrl?: string; 
}

export interface ParticipantDocument {
  id: string;
  name: string;
  url: string;
  uploadDate: string;
  type: 'CERTIFICATE' | 'INVOICE' | 'OTHER';
}

export type ParticipationType = 'ONLINE' | 'HYBRID' | 'IN_PERSON';

// New: Operational details for a specific training assignment
export interface TrainingAssignment {
  trainingId: string;
  regStatus: string;
  paymentStatus: PaymentStatus;
  registrationDate: string;
  discount: number;
  participationType: ParticipationType;
  payments: PaymentRecord[];
  attendance: Record<string, boolean>; // scheduleDayId -> isAttended
  checklistState: Record<string, boolean>; // checklistId -> isChecked
  nextAction?: string;
  currentContactStatus?: string;
}

// Added CrmStatus for tracking and AI assistant analysis
export enum CrmStatus {
  NEW = 'Yeni',
  CONTACTED = 'İletişime Geçildi',
  TO_CALL = 'Aranacak',
  NO_ANSWER = 'Ulaşılamadı'
}

export interface Participant {
  id: string;
  name: string;
  phone: string;
  email: string;
  tckn?: string;
  
  // A participant can now be assigned to multiple trainings
  assignments: TrainingAssignment[];
  
  // Shared profile data
  interactionLog: InteractionLog[];
  documents: ParticipantDocument[];
  notes?: string;

  // Compatibility fields for legacy AI Assistant logic
  crmStatus?: CrmStatus;
  nextContactDate?: string;
}

export interface Experience {
  id: string;
  title: string;
  company: string;
  dates: string;
  description: string;
}

export interface Education {
  id: string;
  degree: string;
  school: string;
  dates: string;
}

export interface Resume {
  summary: string;
  experiences: Experience[];
  educations: Education[];
  skills: string[];
  languages: string[];
}

export interface Instructor {
  id: string;
  name: string;
  title: string; 
  phone: string; 
  email: string;
  specialty: string;
  defaultCommissionRate: number;
  resume?: Resume;
}

export enum CandidateStatus {
  NEW = 'Yeni Aday',
  CONTACTED = 'İletişime Geçildi',
  INTERVIEWED = 'Görüşüldü',
  OFFER_SENT = 'Teklif İletildi',
  AGREED = 'Anlaşıldı',
  REJECTED = 'Olumsuz'
}

export interface InstructorCandidate {
  id: string;
  name: string;
  title: string;
  phone: string;
  email: string;
  specialty: string;
  status: CandidateStatus;
  notes?: string;
  interactionLog?: InteractionLog[];
}

export interface Notification {
    id: string;
    title: string;
    message: string;
    type: 'ALERT' | 'INFO' | 'SUCCESS';
    date: string;
    isRead: boolean;
}

export type UserRole = 'ADMIN' | 'MANAGER' | 'STAFF';
export interface User {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    password?: string;
}

export interface Expense {
  id: string;
  trainingId: string;
  description: string;
  amount: number;
  type: string;
}

export interface AdCampaign {
  id: string;
  platform: string;
  trainingId: string;
  budget: number;
  spent: number;
  clicks: number;
  leads: number;
  status: string;
}