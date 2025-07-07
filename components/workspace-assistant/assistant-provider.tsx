'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface WorkspaceAssistantContextType {
  isEnabled: boolean;
  setIsEnabled: (enabled: boolean) => void;
  isVisible: boolean;
  setIsVisible: (visible: boolean) => void;
}

const WorkspaceAssistantContext = createContext<WorkspaceAssistantContextType | undefined>(undefined);

export function useWorkspaceAssistant() {
  const context = useContext(WorkspaceAssistantContext);
  if (!context) {
    throw new Error('useWorkspaceAssistant must be used within a WorkspaceAssistantProvider');
  }
  return context;
}

interface WorkspaceAssistantProviderProps {
  children: ReactNode;
}

export function WorkspaceAssistantProvider({ children }: WorkspaceAssistantProviderProps) {
  const [isEnabled, setIsEnabled] = useState(true);
  const [isVisible, setIsVisible] = useState(true);

  return (
    <WorkspaceAssistantContext.Provider
      value={{
        isEnabled,
        setIsEnabled,
        isVisible,
        setIsVisible,
      }}
    >
      {children}
    </WorkspaceAssistantContext.Provider>
  );
}
