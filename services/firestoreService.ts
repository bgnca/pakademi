
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, doc, updateDoc, deleteDoc, getDocs } from "firebase/firestore";

const firebaseConfig = {
  projectId: "gen-lang-client-0720632366",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

export const participantsRef = collection(db, "katilimcilar");

/**
 * Yeni bir katılımcıyı Firestore'a kaydeder.
 */
export const saveParticipantToFirestore = async (data: any) => {
  try {
    // ID alanını Firestore doküman ID'si olarak kullanacağımız için veriden siliyoruz
    const { id, ...cleanData } = data;
    return await addDoc(participantsRef, cleanData);
  } catch (error) {
    console.error("Firestore Save Error:", error);
    throw error;
  }
};

/**
 * Mevcut katılımcıyı günceller.
 */
export const updateParticipantInFirestore = async (id: string, data: any) => {
  try {
    const docRef = doc(db, "katilimcilar", id);
    // ID alanının doküman içeriğinde tekrar etmesini önlemek için siliyoruz
    const { id: _, ...cleanData } = data;
    return await updateDoc(docRef, cleanData);
  } catch (error) {
    console.error("Firestore Update Error:", error);
    throw error;
  }
};

/**
 * Katılımcıyı Firestore'dan siler.
 */
export const deleteParticipantFromFirestore = async (id: string) => {
  try {
    const docRef = doc(db, "katilimcilar", id);
    return await deleteDoc(docRef);
  } catch (error) {
    console.error("Firestore Delete Error:", error);
    throw error;
  }
};

/**
 * Tüm katılımcıları tek seferlik çeker (Opsiyonel kullanım için).
 */
export const getAllParticipants = async () => {
    try {
        const snapshot = await getDocs(participantsRef);
        return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (error) {
        console.error("Firestore Get All Error:", error);
        return [];
    }
};
