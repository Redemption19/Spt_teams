import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TaskService } from '@/lib/task-service';
import { NotificationService, type Notification } from '@/lib/notification-service';
import { ProjectService } from '@/lib/project-service';
import { useAuth } from '@/lib/auth-context';
import { useWorkspace } from '@/lib/workspace-context';
import { AlertCircle, CheckCircle, Info, Plus } from 'lucide-react';

interface Task {
  id: string;
  title: string;
  status: 'todo' | 'in-progress' | 'review' | 'completed';
  projectId: string;
  assignedTo?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate?: Date;
}

// Using Notification type from notification-service

export const TaskNotificationDebug: React.FC = () => {
  const { user } = useAuth();
  const { currentWorkspace, getUserRole } = useWorkspace();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const loadData = async () => {
    if (!user?.uid || !currentWorkspace?.id) return;
    
    setLoading(true);
    try {
      // Load tasks from all projects in workspace
      const allTasks = await TaskService.getWorkspaceTasks(currentWorkspace.id);
      setTasks(allTasks || []);
      
      // Load notifications
      const userNotifications = await NotificationService.getUserNotifications(
        user.uid,
        currentWorkspace.id,
        getUserRole(currentWorkspace.id) || 'member'
      );
      setNotifications(userNotifications || []);
      
      console.log('🔍 DEBUG COMPONENT - Tasks loaded:', allTasks);
      console.log('🔍 DEBUG COMPONENT - Notifications loaded:', userNotifications);
    } catch (error) {
      console.error('Error loading debug data:', error);
      setMessage('Error loading data: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const markTaskCompleted = async (taskId: string) => {
    try {
      await TaskService.updateTaskStatus(taskId, 'completed');
      setMessage(`Task ${taskId} marked as completed!`);
      loadData(); // Reload data
    } catch (error) {
      console.error('Error updating task:', error);
      setMessage('Error updating task: ' + (error as Error).message);
    }
  };

  const createTestNotification = async () => {
    if (!user?.uid || !currentWorkspace?.id) return;
    
    try {
      await NotificationService.createNotification({
        userId: user.uid,
        workspaceId: currentWorkspace.id,
        title: 'Test Critical Alert',
        message: 'This is a test urgent notification to verify the critical alerts system.',
        type: 'system_alert',
        priority: 'urgent',
        metadata: {
          source: 'debug-component',
          timestamp: new Date().toISOString()
        }
      });
      setMessage('Test notification created!');
      loadData(); // Reload data
    } catch (error) {
      console.error('Error creating notification:', error);
      setMessage('Error creating notification: ' + (error as Error).message);
    }
  };

  const createTestTask = async () => {
    if (!currentWorkspace?.id || !user?.uid) return;
    
    try {
      // Get the first project or create a default one
      const projects = await ProjectService.getWorkspaceProjects(currentWorkspace.id);
      let projectId = projects?.[0]?.id;
      
      if (!projectId) {
        setMessage('No projects found. Please create a project first.');
        return;
      }
      
      const newTask = {
        title: `Test Task ${Date.now()}`,
        description: 'This is a test task created by the debug component',
        status: 'todo' as const,
        priority: 'medium' as const,
        projectId,
        assignedTo: user.uid,
        workspaceId: currentWorkspace.id,
        createdBy: user.uid,
        tags: []
      };
      
      await TaskService.createTask(newTask);
      setMessage('Test task created!');
      loadData(); // Reload data
    } catch (error) {
      console.error('Error creating task:', error);
      setMessage('Error creating task: ' + (error as Error).message);
    }
  };

  useEffect(() => {
    loadData();
  }, [user?.uid, currentWorkspace?.id]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in-progress': return 'bg-blue-100 text-blue-800';
      case 'review': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Task & Notification Debug Panel
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            <Button onClick={loadData} disabled={loading}>
              Refresh Data
            </Button>
            <Button onClick={createTestTask} variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Create Test Task
            </Button>
            <Button onClick={createTestNotification} variant="outline">
              <AlertCircle className="h-4 w-4 mr-2" />
              Create Test Alert
            </Button>
          </div>
          
          {message && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm text-blue-800">{message}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tasks Section */}
        <Card>
          <CardHeader>
            <CardTitle>Tasks ({tasks.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {tasks.length === 0 ? (
              <p className="text-gray-500 text-sm">No tasks found. Create a test task to see completion tracking.</p>
            ) : (
              <div className="space-y-3">
                {tasks.map((task) => (
                  <div key={task.id} className="border rounded-lg p-3 space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{task.title}</h4>
                        <p className="text-xs text-gray-500">ID: {task.id}</p>
                      </div>
                      <div className="flex gap-2">
                        <Badge className={getStatusColor(task.status)}>
                          {task.status}
                        </Badge>
                        <Badge className={getPriorityColor(task.priority)}>
                          {task.priority}
                        </Badge>
                      </div>
                    </div>
                    
                    {task.status !== 'completed' && (
                      <Button 
                        size="sm" 
                        onClick={() => markTaskCompleted(task.id)}
                        className="w-full"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Mark as Completed
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Notifications Section */}
        <Card>
          <CardHeader>
            <CardTitle>Notifications ({notifications.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {notifications.length === 0 ? (
              <p className="text-gray-500 text-sm">No notifications found. Create a test alert to see critical alerts tracking.</p>
            ) : (
              <div className="space-y-3">
                {notifications.map((notification) => (
                  <div key={notification.id} className="border rounded-lg p-3 space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{notification.title}</h4>
                        <p className="text-xs text-gray-600">{notification.message}</p>
                        <p className="text-xs text-gray-500">ID: {notification.id}</p>
                      </div>
                      <div className="flex gap-2">
                        <Badge className={getPriorityColor(notification.priority)}>
                          {notification.priority}
                        </Badge>
                        {!notification.read && (
                          <Badge variant="secondary">Unread</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>How to Test Completion Rate & Critical Alerts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-medium text-sm">To increase Completion Rate:</h4>
            <ol className="text-sm text-gray-600 space-y-1 ml-4">
              <li>1. Create test tasks using the "Create Test Task" button above</li>
              <li>2. Mark tasks as completed using the "Mark as Completed" button</li>
              <li>3. Refresh the Department Overview page to see updated completion rate</li>
            </ol>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-medium text-sm">To see Critical Alerts:</h4>
            <ol className="text-sm text-gray-600 space-y-1 ml-4">
              <li>1. Create test notifications using the "Create Test Alert" button above</li>
              <li>2. The system counts notifications with 'urgent' or 'high' priority as critical</li>
              <li>3. Refresh the Department Overview page to see updated critical alerts count</li>
            </ol>
          </div>
          
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-sm text-yellow-800">
              <strong>Current Status:</strong> You have {tasks.filter(t => t.status === 'completed').length} completed out of {tasks.length} total tasks, 
              and {notifications.filter(n => n.priority === 'urgent' || n.priority === 'high').length} critical alerts.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};