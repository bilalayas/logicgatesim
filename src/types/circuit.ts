export type GateType = 'AND' | 'OR' | 'NOT' | 'INPUT' | 'OUTPUT' | 'LED' | 'MODULE' | 'PINBAR';

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
  // Pin naming
  pinNames?: Record<string, string>; // e.g. "input-0" -> "A", "output-1" -> "Q"
  showPinNames?: boolean;
  // PinBar specific
  pinBarMode?: 'input' | 'output';
  pinBarValues?: boolean[]; // toggle state for input-mode PinBar
  // Rotation (0, 90, 180, 270)
  rotation?: number;
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
export const PINBAR_THICKNESS = 30;

export const GATE_CONFIGS: Record<string, { label: string; inputCount: number; outputCount: number }> = {
  AND: { label: 'AND', inputCount: 2, outputCount: 1 },
  OR: { label: 'OR', inputCount: 2, outputCount: 1 },
  NOT: { label: 'NOT', inputCount: 1, outputCount: 1 },
  INPUT: { label: 'INPUT', inputCount: 0, outputCount: 1 },
  OUTPUT: { label: 'OUTPUT', inputCount: 1, outputCount: 0 },
  LED: { label: 'LED', inputCount: 1, outputCount: 0 },
  PINBAR: { label: 'BAR', inputCount: 0, outputCount: 4 },
};

export function getNodeDimensions(node: CircuitNode): { width: number; height: number } {
  if (node.type === 'PINBAR') {
    const count = Math.max(node.inputCount, node.outputCount, 1);
    const barLength = count * 28 + 12;
    const rot = node.rotation || 0;
    if (rot === 90 || rot === 270) return { width: barLength, height: PINBAR_THICKNESS };
    return { width: PINBAR_THICKNESS, height: barLength };
  }
  if (node.type === 'MODULE' && (node.rotation === 90 || node.rotation === 270)) {
    const maxPins = Math.max(node.inputCount, node.outputCount, 1);
    const h = Math.max(60, maxPins * 30 + 10);
    return { width: h, height: NODE_WIDTH };
  }
  const maxPins = Math.max(node.inputCount, node.outputCount, 1);
  return { width: NODE_WIDTH, height: Math.max(60, maxPins * 30 + 10) };
}

export function getNodeHeight(node: CircuitNode): number {
  return getNodeDimensions(node).height;
}

export function getNodeWidth(node: CircuitNode): number {
  return getNodeDimensions(node).width;
}

export function getPinPosition(node: CircuitNode, pinType: 'input' | 'output', pinIndex: number): { x: number; y: number } {
  const { width, height } = getNodeDimensions(node);
  const count = pinType === 'input' ? node.inputCount : node.outputCount;
  const rot = node.rotation || 0;

  if (node.type === 'PINBAR') {
    // PinBar: pins along one edge based on rotation
    if (rot === 0) { // vertical, pins on right
      return { x: node.x + width, y: node.y + (pinIndex + 1) * height / (count + 1) };
    } else if (rot === 90) { // horizontal, pins on bottom
      return { x: node.x + (pinIndex + 1) * width / (count + 1), y: node.y + height };
    } else if (rot === 180) { // vertical, pins on left
      return { x: node.x, y: node.y + (pinIndex + 1) * height / (count + 1) };
    } else { // 270, horizontal, pins on top
      return { x: node.x + (pinIndex + 1) * width / (count + 1), y: node.y };
    }
  }

  if (node.type === 'MODULE' && rot !== 0) {
    if (rot === 90) { // inputs top, outputs bottom
      const c = count;
      return {
        x: node.x + (pinIndex + 1) * width / (c + 1),
        y: node.y + (pinType === 'input' ? 0 : height),
      };
    } else if (rot === 180) { // inputs right, outputs left
      return {
        x: node.x + (pinType === 'input' ? width : 0),
        y: node.y + (pinIndex + 1) * height / (count + 1),
      };
    } else if (rot === 270) { // inputs bottom, outputs top
      return {
        x: node.x + (pinIndex + 1) * width / (count + 1),
        y: node.y + (pinType === 'input' ? height : 0),
      };
    }
  }

  // Default: inputs left, outputs right
  return {
    x: node.x + (pinType === 'input' ? 0 : width),
    y: node.y + (pinIndex + 1) * height / (count + 1),
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
  PINBAR: { bg: 'hsl(220 30% 22%)', border: 'hsl(220 30% 38%)' },
};
