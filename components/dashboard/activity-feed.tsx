'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';

const activities = [
  {
    id: '1',
    user: 'John Doe',
    action: 'completed task',
    target: 'Update user interface',
    timestamp: new Date(Date.now() - 1000 * 60 * 15),
    type: 'task',
  },
  {
    id: '2',
    user: 'Sarah Wilson',
    action: 'created project',
    target: 'Mobile App Redesign',
    timestamp: new Date(Date.now() - 1000 * 60 * 30),
    type: 'project',
  },
  {
    id: '3',
    user: 'Mike Chen',
    action: 'submitted report',
    target: 'Q4 Performance Analysis',
    timestamp: new Date(Date.now() - 1000 * 60 * 45),
    type: 'report',
  },
  {
    id: '4',
    user: 'Anna Johnson',
    action: 'joined team',
    target: 'Frontend Development',
    timestamp: new Date(Date.now() - 1000 * 60 * 60),
    type: 'team',
  },
  {
    id: '5',
    user: 'David Brown',
    action: 'updated branch',
    target: 'Central Branch Settings',
    timestamp: new Date(Date.now() - 1000 * 60 * 90),
    type: 'branch',
  },
];

const getActivityBadgeColor = (type: string) => {
  switch (type) {
    case 'task':
      return 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400';
    case 'project':
      return 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400';
    case 'report':
      return 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400';
    case 'team':
      return 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400';
    case 'branch':
      return 'bg-teal-100 text-teal-700 dark:bg-teal-900/20 dark:text-teal-400';
    default:
      return 'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400';
  }
};

export function ActivityFeed() {
  return (
    <Card className="border-border/50 shadow-lg bg-card/90 backdrop-blur-sm card-enhanced">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-80">
          <div className="space-y-4">
            {activities.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-card/80 hover:shadow-sm border border-transparent hover:border-border/30 transition-all duration-200">
                <Avatar className="h-8 w-8 border-2 border-background shadow-sm">
                  <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white text-xs">
                    {activity.user.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-foreground">
                      {activity.user}
                    </span>
                    <Badge className={`text-xs px-2 py-0.5 ${getActivityBadgeColor(activity.type)}`}>
                      {activity.type}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {activity.action} <span className="font-medium text-foreground">&ldquo;{activity.target}&rdquo;</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}