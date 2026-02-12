import React, { createContext, useContext, useReducer, useMemo, useEffect } from 'react';
import { CircuitNode, Connection, ModuleDefinition, GateType } from '@/types/circuit';
import { evaluateCircuit } from '@/engine/evaluate';

interface CircuitState {
  nodes: CircuitNode[];
  connections: Connection[];
  modules: ModuleDefinition[];
  selectedTool: GateType | null;
  selectedModuleId: string | null;
  panOffset: { x: number; y: number };
  zoom: number;
}

type Action =
  | { type: 'ADD_NODE'; node: CircuitNode }
  | { type: 'MOVE_NODE'; id: string; x: number; y: number }
  | { type: 'REMOVE_NODE'; id: string }
  | { type: 'ADD_CONNECTION'; connection: Connection }
  | { type: 'REMOVE_CONNECTION'; id: string }
  | { type: 'TOGGLE_INPUT'; id: string }
  | { type: 'SET_TOOL'; tool: GateType | null; moduleId?: string | null }
  | { type: 'SET_PAN'; offset: { x: number; y: number } }
  | { type: 'SET_ZOOM'; zoom: number }
  | { type: 'CREATE_MODULE'; module: ModuleDefinition }
  | { type: 'DELETE_MODULE'; id: string }
  | { type: 'LOAD_MODULES'; modules: ModuleDefinition[] }
  | { type: 'CLEAR_CANVAS' };

function reducer(state: CircuitState, action: Action): CircuitState {
  switch (action.type) {
    case 'ADD_NODE':
      return { ...state, nodes: [...state.nodes, action.node] };
    case 'MOVE_NODE':
      return { ...state, nodes: state.nodes.map(n => n.id === action.id ? { ...n, x: action.x, y: action.y } : n) };
    case 'REMOVE_NODE':
      return {
        ...state,
        nodes: state.nodes.filter(n => n.id !== action.id),
        connections: state.connections.filter(c => c.fromNodeId !== action.id && c.toNodeId !== action.id),
      };
    case 'ADD_CONNECTION': {
      const exists = state.connections.find(
        c => c.toNodeId === action.connection.toNodeId && c.toPinIndex === action.connection.toPinIndex
      );
      if (exists) return state;
      return { ...state, connections: [...state.connections, action.connection] };
    }
    case 'REMOVE_CONNECTION':
      return { ...state, connections: state.connections.filter(c => c.id !== action.id) };
    case 'TOGGLE_INPUT':
      return { ...state, nodes: state.nodes.map(n => n.id === action.id ? { ...n, inputValue: !n.inputValue } : n) };
    case 'SET_TOOL':
      return { ...state, selectedTool: action.tool, selectedModuleId: action.moduleId ?? null };
    case 'SET_PAN':
      return { ...state, panOffset: action.offset };
    case 'SET_ZOOM':
      return { ...state, zoom: Math.max(0.25, Math.min(2, action.zoom)) };
    case 'CREATE_MODULE':
      return { ...state, modules: [...state.modules, action.module] };
    case 'DELETE_MODULE':
      return { ...state, modules: state.modules.filter(m => m.id !== action.id) };
    case 'LOAD_MODULES':
      return { ...state, modules: action.modules };
    case 'CLEAR_CANVAS':
      return { ...state, nodes: [], connections: [] };
    default:
      return state;
  }
}

interface CircuitContextType {
  state: CircuitState;
  dispatch: React.Dispatch<Action>;
  nodeOutputs: Record<string, boolean[]>;
}

const CircuitContext = createContext<CircuitContextType | null>(null);

export function CircuitProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, {
    nodes: [],
    connections: [],
    modules: [],
    selectedTool: null,
    selectedModuleId: null,
    panOffset: { x: 0, y: 0 },
    zoom: 1,
  });

  const nodeOutputs = useMemo(
    () => evaluateCircuit(state.nodes, state.connections, state.modules),
    [state.nodes, state.connections, state.modules]
  );

  useEffect(() => {
    const saved = localStorage.getItem('logic-sandbox-modules');
    if (saved) {
      try { dispatch({ type: 'LOAD_MODULES', modules: JSON.parse(saved) }); } catch {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('logic-sandbox-modules', JSON.stringify(state.modules));
  }, [state.modules]);

  return (
    <CircuitContext.Provider value={{ state, dispatch, nodeOutputs }}>
      {children}
    </CircuitContext.Provider>
  );
}

export function useCircuit() {
  const ctx = useContext(CircuitContext);
  if (!ctx) throw new Error('useCircuit must be used within CircuitProvider');
  return ctx;
}
