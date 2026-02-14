export type GateType = 'AND' | 'OR' | 'NOT' | 'INPUT' | 'OUTPUT' | 'LED' | 'MODULE' | 'PINSLOT';

export type LedShape = 'circle' | 'square' | 'triangle' | 'segment';

export interface CircuitNode {
  id: string;
  type: GateType;
  x: number;
  y: number;
  label: string;
  inputCount: number;
  outputCount: number;
  inputValue?: boolean;
  ledColor?: string;
  ledShape?: LedShape;
  ledSize?: number;
  ledRotation?: number;
  moduleId?: string;
  pinSlotRotation?: number;
}

export interface Connection {
  id: string;
  fromNodeId: string;
  fromPinIndex: number;
  toNodeId: string;
  toPinIndex: number;
}

export interface ModuleDefinition {
  id: string;
  name: string;
  nodes: CircuitNode[];
  connections: Connection[];
  inputNodeIds: string[];
  outputNodeIds: string[];
  inputCount: number;
  outputCount: number;
}

export const GRID_SIZE = 20;
export const NODE_WIDTH = 120;
export const PINSLOT_WIDTH = 40;

export const GATE_CONFIGS: Record<string, { label: string; inputCount: number; outputCount: number }> = {
  AND: { label: 'AND', inputCount: 2, outputCount: 1 },
  OR: { label: 'OR', inputCount: 2, outputCount: 1 },
  NOT: { label: 'NOT', inputCount: 1, outputCount: 1 },
  INPUT: { label: 'INPUT', inputCount: 0, outputCount: 1 },
  OUTPUT: { label: 'OUTPUT', inputCount: 1, outputCount: 0 },
  LED: { label: 'LED', inputCount: 1, outputCount: 0 },
  PINSLOT: { label: 'BUS', inputCount: 4, outputCount: 4 },
};

export function getNodeHeight(node: CircuitNode): number {
  const maxPins = Math.max(node.inputCount, node.outputCount, 1);
  return Math.max(60, maxPins * 30 + 10);
}

export function getNodeWidth(node: CircuitNode): number {
  if (node.type === 'PINSLOT') return PINSLOT_WIDTH;
  return NODE_WIDTH;
}

export function getPinPosition(node: CircuitNode, pinType: 'input' | 'output', pinIndex: number): { x: number; y: number } {
  const h = getNodeHeight(node);
  const w = getNodeWidth(node);
  const count = pinType === 'input' ? node.inputCount : node.outputCount;
  return {
    x: node.x + (pinType === 'input' ? 0 : w),
    y: node.y + (pinIndex + 1) * h / (count + 1),
  };
}

export function snapToGrid(value: number): number {
  return Math.round(value / GRID_SIZE) * GRID_SIZE;
}

export const GATE_STYLES: Record<string, { bg: string; border: string }> = {
  AND: { bg: 'hsl(210 50% 30%)', border: 'hsl(210 50% 48%)' },
  OR: { bg: 'hsl(152 40% 25%)', border: 'hsl(152 40% 42%)' },
  NOT: { bg: 'hsl(280 30% 32%)', border: 'hsl(280 35% 50%)' },
  INPUT: { bg: 'hsl(45 70% 20%)', border: 'hsl(45 80% 50%)' },
  OUTPUT: { bg: 'hsl(185 55% 18%)', border: 'hsl(185 70% 45%)' },
  LED: { bg: 'transparent', border: 'transparent' },
  MODULE: { bg: 'hsl(45 35% 20%)', border: 'hsl(45 40% 42%)' },
  PINSLOT: { bg: 'hsl(228 20% 18%)', border: 'hsl(228 15% 30%)' },
};
