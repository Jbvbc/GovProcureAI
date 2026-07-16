import React, { createContext, useContext, useReducer, ReactNode } from 'react';

export type StepStatus = 'pending' | 'generating' | 'reviewing' | 'approved';

export interface ProcurementItem {
  id: string;
  description: string;
  quantity: number;
  unit: string;
}

export interface DemandData {
  object: string;
  justification: string;
  type: 'material' | 'service';
}

export interface UploadedDocument {
  id: string;
  name: string;
  type: string;
  size: number;
  data: string; // Base64 representation
}

export interface LegislationConfig {
  organizationName: string;
  customLawsData: string;
  uploadedDocuments?: UploadedDocument[];
  enableSearchGrounding?: boolean;
}

export interface ProcurementState {
  currentStep: number;
  items: ProcurementItem[];
  demand: DemandData;
  legislation: LegislationConfig;
  dfd: { content: string; status: StepStatus };
  etp: { content: string; status: StepStatus };
  priceResearch: { content: string; status: StepStatus };
  tr: { content: string; status: StepStatus };
  audit: { content: string; status: StepStatus };
  logs: { timestamp: Date; action: string; details?: string }[];
}

type Action =
  | { type: 'SET_DEMAND'; payload: DemandData }
  | { type: 'SET_ITEMS'; payload: ProcurementItem[] }
  | { type: 'SET_STEP'; payload: number }
  | { type: 'SET_LEGISLATION'; payload: LegislationConfig }
  | { type: 'UPDATE_DOCUMENT'; payload: { doc: 'dfd' | 'etp' | 'priceResearch' | 'tr' | 'audit'; content: string; status: StepStatus } }
  | { type: 'ADD_LOG'; payload: { action: string; details?: string } }
  | { type: 'RESET' };

const initialState: ProcurementState = {
  currentStep: 1,
  items: [],
  demand: { object: '', justification: '', type: 'material' },
  legislation: { organizationName: '', customLawsData: '' },
  dfd: { content: '', status: 'pending' },
  etp: { content: '', status: 'pending' },
  priceResearch: { content: '', status: 'pending' },
  tr: { content: '', status: 'pending' },
  audit: { content: '', status: 'pending' },
  logs: [],
};

function procurementReducer(state: ProcurementState, action: Action): ProcurementState {
  switch (action.type) {
    case 'SET_DEMAND':
      return { ...state, demand: action.payload };
    case 'SET_ITEMS':
      return { ...state, items: action.payload };
    case 'SET_STEP':
      return { ...state, currentStep: action.payload };
    case 'SET_LEGISLATION':
      return { ...state, legislation: action.payload };
    case 'UPDATE_DOCUMENT':
      return {
        ...state,
        [action.payload.doc]: { content: action.payload.content, status: action.payload.status },
      };
    case 'ADD_LOG':
      return {
        ...state,
        logs: [...state.logs, { timestamp: new Date(), action: action.payload.action, details: action.payload.details }],
      };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

const ProcurementContext = createContext<{
  state: ProcurementState;
  dispatch: React.Dispatch<Action>;
} | undefined>(undefined);

const STORAGE_KEY = 'procurement_state_v1';

const getInitialState = (): ProcurementState => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Convert string dates back to Date objects
      if (parsed.logs) {
        parsed.logs = parsed.logs.map((log: any) => ({
          ...log,
          timestamp: new Date(log.timestamp)
        }));
      }
      return parsed;
    }
  } catch (e) {
    console.error('Failed to load state from localStorage', e);
  }
  return initialState;
};

export function ProcurementProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(procurementReducer, getInitialState());

  React.useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error('Failed to save state to localStorage', e);
    }
  }, [state]);

  return (
    <ProcurementContext.Provider value={{ state, dispatch }}>
      {children}
    </ProcurementContext.Provider>
  );
}

export function useProcurement() {
  const context = useContext(ProcurementContext);
  if (context === undefined) {
    throw new Error('useProcurement must be used within a ProcurementProvider');
  }
  return context;
}
