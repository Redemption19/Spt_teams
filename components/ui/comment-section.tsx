'use client';

import React from 'react';
import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  MessageSquare,
  Send,
  MoreVertical,
  Edit,
  Trash2,
  Clock,
  User,
  Reply,
  Heart,
  Loader2,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Comment, Project, Task } from '@/lib/types';
import { CommentService } from '@/lib/comment-service';
import { convertTimestamps } from '@/lib/firestore-utils';
import { format, formatDistanceToNow } from 'date-fns';

interface CommentSectionProps {
  type: 'project' | 'task';
  entityId: string;
  entity: Project | Task;
  comments: Comment[];
  currentUserId: string;
  currentUserName: string;
  currentUserRole: string;
  onCommentsUpdate: () => void;
  className?: string;
}

interface CommentItemProps {
  comment: Comment;
  currentUserId: string;
  currentUserRole: string;
  onEdit: (commentId: string, newContent: string) => void;
  onDelete: (commentId: string) => void;
  canEdit: boolean;
  canDelete: boolean;
}

const CommentItem = ({ 
  comment, 
  currentUserId, 
  currentUserRole, 
  onEdit, 
  onDelete, 
  canEdit, 
  canDelete 
}: CommentItemProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const handleSaveEdit = () => {
    if (editContent.trim() && editContent !== comment.content) {
      onEdit(comment.id, editContent.trim());
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditContent(comment.content);
    setIsEditing(false);
  };

  const formatCommentTime = (date: Date) => {
    const now = new Date();
    
    // Ensure we have a proper Date object
    let convertedDate: Date;
    if (date instanceof Date && !isNaN(date.getTime())) {
      convertedDate = date;
    } else {
      const converted = convertTimestamps(date);
      if (converted instanceof Date && !isNaN(converted.getTime())) {
        convertedDate = converted;
      } else {
        convertedDate = new Date(date as any);
        if (isNaN(convertedDate.getTime())) {
          convertedDate = new Date(); // Use current time as fallback
        }
      }
    }
    
    const diffInHours = (now.getTime() - convertedDate.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return formatDistanceToNow(convertedDate, { addSuffix: true });
    } else {
      return format(convertedDate, 'MMM dd, yyyy \'at\' HH:mm');
    }
  };

  const getRoleBadgeColor = (role?: string) => {
    switch (role) {
      case 'owner': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'admin': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'member': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  return (
    <div className="flex space-x-3 group">
      <Avatar className="h-8 w-8 flex-shrink-0">
        <AvatarFallback className="text-xs">
          {comment.authorName?.charAt(0).toUpperCase() || comment.authorId.charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      
      <div className="flex-1 min-w-0">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-1 sm:space-y-0">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-foreground">
              {comment.authorName || comment.authorId}
            </span>
            {comment.authorRole && (
              <Badge variant="outline" className={`text-xs ${getRoleBadgeColor(comment.authorRole)}`}>
                {comment.authorRole}
              </Badge>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>{formatCommentTime(comment.createdAt)}</span>
              {comment.isEdited && (
                <span className="text-muted-foreground">(edited)</span>
              )}
            </div>
            
            {(canEdit || canDelete) && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <MoreVertical className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-32">
                  {canEdit && (
                    <DropdownMenuItem onClick={() => setIsEditing(true)}>
                      <Edit className="h-3 w-3 mr-2" />
                      Edit
                    </DropdownMenuItem>
                  )}
                  {canDelete && (
                    <DropdownMenuItem 
                      onClick={() => setIsDeleteDialogOpen(true)}
                      className="text-red-600 focus:text-red-600"
                    >
                      <Trash2 className="h-3 w-3 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
        
        <div className="mt-1">
          {isEditing ? (
            <div className="space-y-2">
              <Textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="min-h-[60px] text-sm"
                placeholder="Edit your comment..."
              />
              <div className="flex items-center space-x-2">
                <Button size="sm" onClick={handleSaveEdit}>
                  Save
                </Button>
                <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-sm text-foreground whitespace-pre-wrap break-words">
              {comment.content}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Comment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this comment? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onDelete(comment.id);
                setIsDeleteDialogOpen(false);
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default function CommentSection({
  type,
  entityId,
  entity,
  comments,
  currentUserId,
  currentUserName,
  currentUserRole,
  onCommentsUpdate,
  className = '',
}: CommentSectionProps) {
  const { toast } = useToast();
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedComments, setExpandedComments] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Sort comments by creation date (newest first for recent activity, oldest first for conversation flow)
  const sortedComments = [...comments].sort((a, b) => {
    const aTime = convertTimestamps(a.createdAt) || new Date();
    const bTime = convertTimestamps(b.createdAt) || new Date();
    return aTime.getTime() - bTime.getTime();
  });

  // Check if user can comment
  const canComment = type === 'project' 
    ? CommentService.canCommentOnProject(entity as Project, currentUserId, currentUserRole)
    : CommentService.canCommentOnTask(entity as Task, entity as Project, currentUserId, currentUserRole);

  // Add computed permissions to comments
  const commentsWithPermissions = CommentService.addCommentPermissions(
    sortedComments,
    currentUserId,
    currentUserRole
  );

  const handleSubmitComment = async () => {
    if (!newComment.trim()) return;

    try {
      setIsSubmitting(true);
      
      if (type === 'project') {
        await CommentService.addProjectComment(
          entityId,
          newComment.trim(),
          currentUserId,
          currentUserName,
          currentUserRole
        );
      } else {
        await CommentService.addTaskComment(
          entityId,
          newComment.trim(),
          currentUserId,
          currentUserName,
          currentUserRole
        );
      }

      setNewComment('');
      onCommentsUpdate();
      
      toast({
        title: 'Comment added',
        description: 'Your comment has been posted successfully.',
      });
    } catch (error) {
      console.error('Error adding comment:', error);
      toast({
        title: 'Error',
        description: 'Failed to add comment. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditComment = async (commentId: string, newContent: string) => {
    try {
      if (type === 'project') {
        await CommentService.editProjectComment(entityId, commentId, newContent, currentUserId);
      } else {
        await CommentService.editTaskComment(entityId, commentId, newContent, currentUserId);
      }

      onCommentsUpdate();
      
      toast({
        title: 'Comment updated',
        description: 'Your comment has been updated successfully.',
      });
    } catch (error) {
      console.error('Error editing comment:', error);
      toast({
        title: 'Error',
        description: 'Failed to edit comment. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      if (type === 'project') {
        await CommentService.deleteProjectComment(entityId, commentId, currentUserId);
      } else {
        await CommentService.deleteTaskComment(entityId, commentId, currentUserId);
      }

      onCommentsUpdate();
      
      toast({
        title: 'Comment deleted',
        description: 'The comment has been deleted successfully.',
      });
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete comment. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSubmitComment();
    }
  };

  // Show limited comments on mobile, all on desktop
  const displayComments = expandedComments ? commentsWithPermissions : commentsWithPermissions.slice(0, 3);
  const hasMoreComments = commentsWithPermissions.length > 3;

  return (
    <Card className={`${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center space-x-2 text-base">
          <MessageSquare className="h-4 w-4" />
          <span>Comments ({comments.length})</span>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Comments List */}
        {commentsWithPermissions.length > 0 ? (
          <div className="space-y-4">
            <ScrollArea className="max-h-96">
              <div className="space-y-4 pr-4">
                {displayComments.map((comment, index) => (
                  <div key={comment.id}>
                    <CommentItem
                      comment={comment}
                      currentUserId={currentUserId}
                      currentUserRole={currentUserRole}
                      onEdit={handleEditComment}
                      onDelete={handleDeleteComment}
                      canEdit={comment.canEdit || false}
                      canDelete={comment.canDelete || false}
                    />
                    {index < displayComments.length - 1 && (
                      <Separator className="mt-4" />
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
            
            {/* Show More/Less Button */}
            {hasMoreComments && (
              <div className="text-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setExpandedComments(!expandedComments)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  {expandedComments 
                    ? `Show Less` 
                    : `Show ${commentsWithPermissions.length - 3} More Comments`
                  }
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No comments yet</p>
            <p className="text-xs">Be the first to share your thoughts</p>
          </div>
        )}

        {/* Add Comment Section */}
        {canComment && (
          <div className="border-t pt-4 space-y-3">
            <div className="flex space-x-3">
              <Avatar className="h-8 w-8 flex-shrink-0">
                <AvatarFallback className="text-xs">
                  {currentUserName?.charAt(0).toUpperCase() || currentUserId.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-2">
                <Textarea
                  ref={textareaRef}
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder={`Add a comment to this ${type}...`}
                  className="min-h-[80px] resize-none"
                  disabled={isSubmitting}
                />
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    Press Ctrl+Enter to post
                  </p>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setNewComment('')}
                      disabled={!newComment.trim() || isSubmitting}
                    >
                      Clear
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSubmitComment}
                      disabled={!newComment.trim() || isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                          Posting...
                        </>
                      ) : (
                        <>
                          <Send className="h-3 w-3 mr-2" />
                          Comment
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Access Denied Message */}
        {!canComment && (
          <div className="border-t pt-4">
            <div className="text-center py-4 text-muted-foreground">
              <User className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">You don't have permission to comment on this {type}</p>
              <p className="text-xs">Contact your administrator for access</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 