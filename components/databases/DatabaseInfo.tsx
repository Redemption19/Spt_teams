// components/databases/DatabaseInfo.tsx
'use client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Database, Info } from 'lucide-react';

export default function DatabaseInfo() {
  return (
    <Card className="border border-primary/30 bg-gradient-to-br from-primary/5 to-accent/5">
      <CardHeader className="flex flex-row items-center gap-3 pb-2">
        <Database className="h-6 w-6 text-primary" />
        <CardTitle className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          Database Management
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Info className="h-4 w-4 text-accent" />
          Securely backup and restore your workspace database. Only workspace owners and admins can perform these actions.
        </div>
        <ul className="list-disc list-inside text-xs text-muted-foreground pl-2">
          <li>Backups are encrypted and stored securely.</li>
          <li>Restore will overwrite current data. Use with caution.</li>
          <li>Download backups for offline storage.</li>
        </ul>
      </CardContent>
    </Card>
  );
} 