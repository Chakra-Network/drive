import {
  createContext,
  Dispatch,
  ReactNode,
  SetStateAction,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

interface GlobalState {
  totalFiles?: number;
  searchInput?: string;
  isGridView?: boolean;
  // Add more fields here as needed - make them optional
}

type GlobalStateContextType = {
  state: GlobalState;
  setState: Dispatch<SetStateAction<GlobalState>>;
};

const GlobalStateContext = createContext<GlobalStateContextType | undefined>(undefined);

interface GlobalStateProviderProps {
  children: ReactNode;
}

// Utility for safe localStorage operations
const safeLocalStorage = {
  getItem: (key: string): string | null => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(key);
    }
    return null;
  },
  setItem: (key: string, value: string): void => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(key, value);
    }
  },
  removeItem: (key: string): void => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(key);
    }
  },
};

export function GlobalStateProvider({ children }: GlobalStateProviderProps): JSX.Element {
  const [state, setState] = useState<GlobalState>({});

  // Load initial state from localStorage
  useEffect(() => {
    const storedIsGridView = safeLocalStorage.getItem('isGridView');
    if (storedIsGridView !== null) {
      setState(prevState => ({
        ...prevState,
        isGridView: JSON.parse(storedIsGridView),
      }));
    }
  }, []);

  // Save state to localStorage on app exit
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (state.isGridView !== undefined) {
        safeLocalStorage.setItem('isGridView', JSON.stringify(state.isGridView));
      } else {
        safeLocalStorage.removeItem('isGridView');
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [state.isGridView]);

  const contextValue = useMemo(() => ({ state, setState }), [state]);

  return <GlobalStateContext.Provider value={contextValue}>{children}</GlobalStateContext.Provider>;
}

export const useGlobalState = () => {
  const context = useContext(GlobalStateContext);
  if (context === undefined) {
    throw new Error('useGlobalState must be used within a GlobalStateProvider');
  }

  const { state, setState } = context;

  const setTotalFiles = useCallback(
    (value: number | undefined) => {
      setState(prevState => ({ ...prevState, totalFiles: value }));
    },
    [setState]
  );

  const getTotalFiles = () => state.totalFiles;

  const setSearchInput = useCallback(
    (value: string | undefined) => {
      setState(prevState => ({ ...prevState, searchInput: value }));
    },
    [setState]
  );

  const setIsGridView = useCallback(
    (value: boolean | undefined) => {
      setState(prevState => ({ ...prevState, isGridView: value }));
    },
    [setState]
  );

  const getIsGridView = () => state.isGridView;

  const getSearchInput = () => state.searchInput;

  return {
    setTotalFiles,
    getTotalFiles,
    setSearchInput,
    getSearchInput,
    getIsGridView,
    setIsGridView,
  };
};
