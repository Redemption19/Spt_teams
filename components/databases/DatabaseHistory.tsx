// components/databases/DatabaseHistory.tsx
'use client';
import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { History, Download, Upload } from 'lucide-react';
import { useWorkspace } from '@/lib/workspace-context';
import { useAuth } from '@/lib/auth-context';
import { db } from '@/lib/firebase';
import { collection, query, where, orderBy, getDocs, getDoc, doc } from 'firebase/firestore';

interface HistoryEntry {
  id: string;
  type: 'backup' | 'restore';
  date: string;
  user: string;
}

export default function DatabaseHistory() {
  const { currentWorkspace } = useWorkspace();
  const { user } = useAuth();
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!currentWorkspace) return;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        // Fetch backup history
        const backupQuery = query(
          collection(db, 'database_backups'),
          where('workspaceId', '==', currentWorkspace.id),
          orderBy('timestamp', 'desc')
        );
        const backupSnapshot = await getDocs(backupQuery);
        const backupEntries: HistoryEntry[] = backupSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            type: 'backup',
            date: data.timestamp?.toDate ? data.timestamp.toDate().toLocaleString() : '',
            user: data.createdBy || 'Unknown',
          };
        });

        // Fetch restore history (if you have a restore_logs collection, otherwise skip)
        let restoreEntries: HistoryEntry[] = [];
        try {
          const restoreQuery = query(
            collection(db, 'restore_logs'),
            where('workspaceId', '==', currentWorkspace.id),
            orderBy('timestamp', 'desc')
          );
          const restoreSnapshot = await getDocs(restoreQuery);
          restoreEntries = restoreSnapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              type: 'restore',
              date: data.timestamp?.toDate ? data.timestamp.toDate().toLocaleString() : '',
              user: data.userId || 'Unknown',
            };
          });
        } catch (e) {
          // If restore_logs collection doesn't exist, ignore
        }

        // Combine and sort by date descending
        const allEntries = [...backupEntries, ...restoreEntries].sort((a, b) =>
          new Date(b.date).getTime() - new Date(a.date).getTime()
        );

        // Fetch user display names for all unique user IDs
        const userIds = Array.from(new Set(allEntries.map(e => e.user).filter(id => id && id !== 'Unknown')));
        const userMap: Record<string, string> = {};
        await Promise.all(userIds.map(async (userId) => {
          try {
            const userDoc = await getDoc(doc(db, 'users', userId));
            if (userDoc.exists()) {
              const userData = userDoc.data();
              userMap[userId] = userData.displayName || userData.name || userData.email || userId;
            } else {
              userMap[userId] = userId;
            }
          } catch {
            userMap[userId] = userId;
          }
        }));

        // Map user IDs to display names
        const entriesWithNames = allEntries.map(entry => ({
          ...entry,
          user: userMap[entry.user] ? `${userMap[entry.user]} (${entry.user})` : entry.user
        }));

        setHistory(entriesWithNames);
      } catch (err) {
        setError('Failed to load history');
      } finally {
        setLoading(false);
      }
    })();
  }, [currentWorkspace]);

  return (
    <Card className="border border-primary/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <History className="h-5 w-5 text-primary" />
          Backup & Restore History
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="py-8 text-center text-muted-foreground">Loading history...</div>
        ) : error ? (
          <div className="py-8 text-center text-destructive">{error}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs text-left">
              <thead>
                <tr className="border-b border-border">
                  <th className="py-2 px-2 font-semibold">Type</th>
                  <th className="py-2 px-2 font-semibold">Date</th>
                  <th className="py-2 px-2 font-semibold">User</th>
                </tr>
              </thead>
              <tbody>
                {history.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-4 text-center text-muted-foreground">
                      No backup or restore history found.
                    </td>
                  </tr>
                ) : (
                  history.map((entry) => (
                    <tr key={entry.id} className="border-b border-border hover:bg-muted/30">
                      <td className="py-2 px-2 flex items-center gap-1">
                        {entry.type === 'backup' ? (
                          <Download className="h-3 w-3 text-primary" />
                        ) : (
                          <Upload className="h-3 w-3 text-accent" />
                        )}
                        <span className="capitalize">{entry.type}</span>
                      </td>
                      <td className="py-2 px-2">{entry.date}</td>
                      <td className="py-2 px-2">{entry.user}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 