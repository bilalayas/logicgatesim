import React, { useCallback, useRef } from 'react';
import { CircuitNode, getNodeHeight, NODE_WIDTH, snapToGrid, GATE_STYLES } from '@/types/circuit';
import { X } from 'lucide-react';

interface GateNodeProps {
  node: CircuitNode;
  outputs: boolean[];
  inputValues: boolean[];
  zoom: number;
  onPinClick: (nodeId: string, pinIndex: number, pinType: 'input' | 'output') => void;
  onMove: (id: string, x: number, y: number) => void;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

export function GateNode({ node, outputs, inputValues, zoom, onPinClick, onMove, onToggle, onDelete }: GateNodeProps) {
  const height = getNodeHeight(node);
  const style = GATE_STYLES[node.type] || GATE_STYLES.AND;
  const dragRef = useRef<{ startX: number; startY: number; nodeX: number; nodeY: number; moved: boolean } | null>(null);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.stopPropagation();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    dragRef.current = { startX: e.clientX, startY: e.clientY, nodeX: node.x, nodeY: node.y, moved: false };
  }, [node.x, node.y]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragRef.current) return;
    const dx = (e.clientX - dragRef.current.startX) / zoom;
    const dy = (e.clientY - dragRef.current.startY) / zoom;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) dragRef.current.moved = true;
    if (dragRef.current.moved) {
      onMove(node.id, snapToGrid(dragRef.current.nodeX + dx), snapToGrid(dragRef.current.nodeY + dy));
    }
  }, [zoom, node.id, onMove]);

  const handlePointerUp = useCallback(() => {
    if (dragRef.current && !dragRef.current.moved && node.type === 'INPUT') {
      onToggle(node.id);
    }
    dragRef.current = null;
  }, [node.id, node.type, onToggle]);

  const renderPins = (type: 'input' | 'output') => {
    const count = type === 'input' ? node.inputCount : node.outputCount;
    return Array.from({ length: count }, (_, i) => {
      const py = (i + 1) * height / (count + 1);
      const px = type === 'input' ? -7 : NODE_WIDTH - 7;
      const isHigh = type === 'output' ? (outputs[i] ?? false) : (inputValues[i] ?? false);
      return (
        <div
          key={`${type}-${i}`}
          className="absolute rounded-full cursor-crosshair"
          style={{
            width: 14, height: 14, left: px, top: py - 7,
            backgroundColor: isHigh ? 'hsl(152 80% 55%)' : 'hsl(228 10% 35%)',
            border: `2px solid ${isHigh ? 'hsl(152 80% 70%)' : 'hsl(228 10% 50%)'}`,
            zIndex: 10,
          }}
          onPointerDown={(e) => { e.stopPropagation(); onPinClick(node.id, i, type); }}
        />
      );
    });
  };

  const displayValue = node.type === 'INPUT'
    ? (node.inputValue ? '1' : '0')
    : node.type === 'OUTPUT'
    ? ((inputValues[0] ?? false) ? '1' : '0')
    : null;

  const isLedOn = node.type === 'LED' && (inputValues[0] ?? false);
  const ledColor = node.ledColor || '#3b82f6';

  return (
    <div
      className="absolute select-none cursor-grab active:cursor-grabbing group"
      style={{ left: node.x, top: node.y, width: NODE_WIDTH, height }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      <div
        className="w-full h-full rounded-lg flex flex-col items-center justify-center relative"
        style={{ backgroundColor: style.bg, border: `2px solid ${style.border}` }}
      >
        <span className="text-xs font-bold tracking-wide" style={{ color: 'hsl(210 15% 88%)' }}>
          {node.label}
        </span>
        {displayValue !== null && (
          <span className="text-lg font-mono font-bold" style={{ color: node.type === 'INPUT' ? 'hsl(45 90% 65%)' : 'hsl(185 80% 65%)' }}>
            {displayValue}
          </span>
        )}
        {node.type === 'LED' && (
          <div
            className="rounded-full mt-1"
            style={{
              width: 18, height: 18,
              backgroundColor: isLedOn ? ledColor : 'hsl(228 10% 25%)',
              boxShadow: isLedOn ? `0 0 12px ${ledColor}, 0 0 4px ${ledColor}` : 'none',
              transition: 'background-color 0.05s, box-shadow 0.05s',
            }}
          />
        )}
      </div>
      {renderPins('input')}
      {renderPins('output')}
      <button
        className="absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100"
        style={{ backgroundColor: 'hsl(0 70% 50%)', color: 'white', zIndex: 20, transition: 'opacity 0.15s' }}
        onPointerDown={(e) => { e.stopPropagation(); onDelete(node.id); }}
      >
        <X size={12} />
      </button>
    </div>
  );
}
