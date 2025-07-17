// components/tasks/dialogs/ProjectSelectItem.tsx
import React from 'react';
import { SelectItem } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useProjectRole } from '@/lib/rbac-hooks';
import { Project } from '@/lib/types';

/**
 * Props for the ProjectSelectItem component.
 */
interface ProjectSelectItemProps {
  project: Project;
  userId: string | undefined;
  getRoleIcon: (role: string) => JSX.Element;
  getRoleColor: (role: string) => string;
}

/**
 * A memoized component to display a single project in a select list.
 * It safely uses the useProjectRole hook to fetch and display the user's role for that specific project.
 * This component is created to avoid violating the Rules of Hooks by calling a hook inside a loop.
 * @param {ProjectSelectItemProps} props - The props for the component.
 * @returns {JSX.Element} The rendered select item.
 */
const ProjectSelectItem = ({ project, userId, getRoleIcon, getRoleColor }: ProjectSelectItemProps) => {
  const roleInfo = useProjectRole(project, userId);

  return (
    <SelectItem key={project.id} value={project.id}>
      <div className="flex items-center justify-between w-full">
        <span>{project.name}</span>
        {/* Display the user's role if the role information is available */}
        {roleInfo && (
          <Badge className={`text-xs font-normal normal-case ${getRoleColor(roleInfo.role)}`}>
            {getRoleIcon(roleInfo.role)}
            <span className="ml-1 capitalize">{roleInfo.role}</span>
          </Badge>
        )}
      </div>
    </SelectItem>
  );
};

// Memoize the component to prevent unnecessary re-renders when the parent's state changes,
// especially since it's used inside a .map() loop.
export default React.memo(ProjectSelectItem);
