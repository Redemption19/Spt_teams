import { db } from '@/lib/firebase';
import {
  collection,
  query,
  orderBy,
  addDoc,
  onSnapshot,
  serverTimestamp,
  Unsubscribe,
  DocumentData,
} from 'firebase/firestore';

export interface AIChatMessage {
  id?: string;
  content: string;
  isUser: boolean;
  timestamp: any; // Firestore Timestamp or Date
  topic?: string;
  type?: string;
}

// Real-time chat history listener
export function listenToAIChatHistory(
  workspaceId: string,
  userId: string,
  onUpdate: (messages: AIChatMessage[]) => void
): Unsubscribe {
  const ref = collection(db, 'aiChats', `${workspaceId}_${userId}`, 'messages');
  const q = query(ref, orderBy('timestamp', 'asc'));
  return onSnapshot(q, (snapshot) => {
    const messages: AIChatMessage[] = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as AIChatMessage[];
    onUpdate(messages);
  });
}

// Save a new message
export async function saveAIMessage(
  workspaceId: string,
  userId: string,
  message: Omit<AIChatMessage, 'id' | 'timestamp'>
) {
  const ref = collection(db, 'aiChats', `${workspaceId}_${userId}`, 'messages');
  await addDoc(ref, {
    ...message,
    timestamp: serverTimestamp(),
  });
} 