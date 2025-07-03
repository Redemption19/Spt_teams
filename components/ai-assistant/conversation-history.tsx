import React, { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Search, Filter } from 'lucide-react';

export interface ConversationMessage {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  topic?: string;
  type?: string; // e.g., 'report', 'task', 'onboarding', etc.
}

interface ConversationHistoryProps {
  messages: ConversationMessage[];
  topics?: string[];
  types?: string[];
  onSelectMessage?: (msg: ConversationMessage) => void;
}

export const ConversationHistory: React.FC<ConversationHistoryProps> = ({
  messages,
  topics = [],
  types = [],
  onSelectMessage,
}) => {
  const [search, setSearch] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedDate, setSelectedDate] = useState('');

  // Filtered messages
  const filteredMessages = useMemo(() => {
    return messages.filter((msg) => {
      const matchesSearch =
        !search || msg.content.toLowerCase().includes(search.toLowerCase());
      const matchesTopic = !selectedTopic || msg.topic === selectedTopic;
      const matchesType = !selectedType || msg.type === selectedType;
      const matchesDate =
        !selectedDate ||
        msg.timestamp.toISOString().slice(0, 10) === selectedDate;
      return matchesSearch && matchesTopic && matchesType && matchesDate;
    });
  }, [messages, search, selectedTopic, selectedType, selectedDate]);

  // Unique topics/types for dropdowns
  const uniqueTopics = useMemo(
    () => Array.from(new Set(messages.map((m) => m.topic).filter(Boolean))),
    [messages]
  );
  const uniqueTypes = useMemo(
    () => Array.from(new Set(messages.map((m) => m.type).filter(Boolean))),
    [messages]
  );

  return (
    <Card className="w-full bg-card border border-border rounded-2xl shadow-lg">
      <CardHeader className="pb-2 flex flex-col gap-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Search className="h-5 w-5 text-primary" />
          Conversation History
        </CardTitle>
        <div className="flex flex-wrap gap-2 mt-2">
          <Input
            type="text"
            placeholder="Search messages..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-48 bg-background border-border rounded-lg"
          />
          <select
            value={selectedTopic}
            onChange={(e) => setSelectedTopic(e.target.value)}
            className="bg-background border border-border rounded-lg px-2 py-1 text-sm"
          >
            <option value="">All Topics</option>
            {uniqueTopics.map((topic) => (
              <option key={topic} value={topic}>{topic}</option>
            ))}
          </select>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="bg-background border border-border rounded-lg px-2 py-1 text-sm"
          >
            <option value="">All Types</option>
            {uniqueTypes.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-background border border-border rounded-lg px-2 py-1 text-sm"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="max-h-[400px] overflow-y-auto custom-scrollbar flex flex-col gap-3 pt-2">
        {filteredMessages.length === 0 ? (
          <div className="text-muted-foreground text-center py-8">No messages found.</div>
        ) : (
          filteredMessages.map((msg) => (
            <div
              key={msg.id}
              className={`p-3 rounded-xl transition-colors cursor-pointer ${
                msg.isUser
                  ? 'bg-gradient-to-br from-primary/10 to-accent/10 text-primary-foreground text-right ml-auto'
                  : 'bg-secondary text-foreground text-left mr-auto'
              } hover:bg-accent/10`}
              onClick={() => onSelectMessage?.(msg)}
            >
              <div className="text-sm leading-relaxed">{msg.content.slice(0, 200)}{msg.content.length > 200 ? '...' : ''}</div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-muted-foreground">
                  {msg.timestamp.toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                </span>
                {msg.topic && <Badge variant="outline" className="text-xs">{msg.topic}</Badge>}
                {msg.type && <Badge variant="secondary" className="text-xs">{msg.type}</Badge>}
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}; 