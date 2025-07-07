import React, { createContext, useContext, useRef, useCallback } from 'react';

// Linked List Node for navigation history
interface HistoryNode {
  path: string;
  title: string;
  timestamp: number;
  previous: HistoryNode | null;
  next: HistoryNode | null;
}

// Navigation History Manager using Linked List
class NavigationHistoryManager {
  private currentNode: HistoryNode | null = null;
  private maxHistorySize: number = 50; // Limit history size to prevent memory issues

  constructor() {
    // Initialize with current page
    this.initialize();
  }

    private initialize() {
    try {
      const currentPath = window.location.pathname + window.location.search + window.location.hash;
      const currentTitle = document.title || 'Untitled';
      
      this.currentNode = {
        path: currentPath,
        title: currentTitle,
        timestamp: Date.now(),
        previous: null,
        next: null
      };
    } catch (error) {
      // Silently handle initialization errors
    }
  }

  // Add new page to history
  push(path: string, title: string = document.title) {
    const newNode: HistoryNode = {
      path,
      title,
      timestamp: Date.now(),
      previous: this.currentNode,
      next: null
    };

    if (this.currentNode) {
      // Clear any forward history when pushing new path
      this.currentNode.next = newNode;
    }

    this.currentNode = newNode;
    this.trimHistory();
  }

  // Go back in history
  goBack(): { path: string; title: string } | null {
    if (!this.currentNode?.previous) {
      return null;
    }

    this.currentNode = this.currentNode.previous;
    return {
      path: this.currentNode.path,
      title: this.currentNode.title
    };
  }

  // Go forward in history (if available)
  goForward(): { path: string; title: string } | null {
    if (!this.currentNode?.next) {
      return null;
    }

    this.currentNode = this.currentNode.next;
    return {
      path: this.currentNode.path,
      title: this.currentNode.title
    };
  }

  // Check if we can go back
  canGoBack(): boolean {
    return this.currentNode?.previous !== null;
  }

  // Check if we can go forward
  canGoForward(): boolean {
    return this.currentNode?.next !== null;
  }

  // Get current path
  getCurrentPath(): string {
    return this.currentNode?.path || '/';
  }

  // Get history as array (for debugging)
  getHistory(): Array<{ path: string; title: string; timestamp: number; isCurrent: boolean }> {
    const history: Array<{ path: string; title: string; timestamp: number; isCurrent: boolean }> = [];
    
    // Find the start of the linked list
    let node = this.currentNode;
    while (node?.previous) {
      node = node.previous;
    }

    // Traverse the entire list
    while (node) {
      history.push({
        path: node.path,
        title: node.title,
        timestamp: node.timestamp,
        isCurrent: node === this.currentNode
      });
      node = node.next;
    }

    return history;
  }

  // Get history count for debugging
  getHistoryCount(): number {
    return this.getHistory().length;
  }

  // Trim history to prevent unlimited growth
  private trimHistory() {
    // TODO: Implement history trimming if needed
    // For now, we'll allow unlimited history to avoid TypeScript issues
  }

  // Clear all history
  clear() {
    this.currentNode = null;
    this.initialize();
  }
}

// Context for navigation history
interface NavigationHistoryContextType {
  historyManager: NavigationHistoryManager;
  navigateWithHistory: (path: string, options?: { replace?: boolean }) => void;
  canGoBack: () => boolean;
  canGoForward: () => boolean;
  goBack: () => { path: string; title: string } | null;
  goForward: () => { path: string; title: string } | null;
  getCurrentPath: () => string;
  getHistory: () => Array<{ path: string; title: string; timestamp: number; isCurrent: boolean }>;
  historyChanged: number; // Trigger for re-renders
}

const NavigationHistoryContext = createContext<NavigationHistoryContextType | null>(null);

// Provider component
interface NavigationHistoryProviderProps {
  children: React.ReactNode;
}

export const NavigationHistoryProvider: React.FC<NavigationHistoryProviderProps> = ({ children }) => {
  const historyManagerRef = useRef<NavigationHistoryManager | null>(null);
  const [historyChanged, setHistoryChanged] = React.useState(0);

  // Initialize history manager
  if (!historyManagerRef.current) {
    historyManagerRef.current = new NavigationHistoryManager();
  }

  const historyManager = historyManagerRef.current;

  // Listen for navigation tracking events
  React.useEffect(() => {
    const handleTrackNavigation = (event: CustomEvent) => {
      const { path, title } = event.detail;
      historyManager.push(path, title);
      // Trigger re-render of components using this context
      setHistoryChanged(prev => prev + 1);
    };

    window.addEventListener('trackNavigation', handleTrackNavigation as EventListener);
    
    return () => {
      window.removeEventListener('trackNavigation', handleTrackNavigation as EventListener);
    };
  }, [historyManager]);

  const navigateWithHistory = useCallback((path: string, options: { replace?: boolean } = {}) => {
    if (!options.replace) {
      historyManager.push(path);
    }
  }, [historyManager]);

  const canGoBack = useCallback(() => historyManager.canGoBack(), [historyManager]);
  const canGoForward = useCallback(() => historyManager.canGoForward(), [historyManager]);
  const getCurrentPath = useCallback(() => historyManager.getCurrentPath(), [historyManager]);
  const getHistory = useCallback(() => historyManager.getHistory(), [historyManager]);

  const goBack = useCallback(() => {
    const result = historyManager.goBack();
    return result;
  }, [historyManager]);

  const goForward = useCallback(() => {
    const result = historyManager.goForward();
    return result;
  }, [historyManager]);

  const contextValue: NavigationHistoryContextType = {
    historyManager,
    navigateWithHistory,
    canGoBack,
    canGoForward,
    goBack,
    goForward,
    getCurrentPath,
    getHistory,
    historyChanged
  };

  return (
    <NavigationHistoryContext.Provider value={contextValue}>
      {children}
    </NavigationHistoryContext.Provider>
  );
};

// Hook to use navigation history
export const useNavigationHistory = (): NavigationHistoryContextType => {
  const context = useContext(NavigationHistoryContext);
  if (!context) {
    throw new Error('useNavigationHistory must be used within a NavigationHistoryProvider');
  }
  return context;
};

 