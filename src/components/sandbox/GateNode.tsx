import React, { useCallback, useRef, useState } from 'react';
import { CircuitNode, getNodeHeight, NODE_WIDTH, snapToGrid, GATE_STYLES, LedShape } from '@/types/circuit';
import { X, Settings } from 'lucide-react';

interface GateNodeProps {
  node: CircuitNode;
  outputs: boolean[];
  inputValues: boolean[];
  zoom: number;
  isConnecting?: boolean;
  onPinClick: (nodeId: string, pinIndex: number, pinType: 'input' | 'output') => void;
  onMove: (id: string, x: number, y: number) => void;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdateNode: (id: string, updates: Partial<CircuitNode>) => void;
}

const LED_COLORS = ['#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#a855f7', '#ec4899', '#06b6d4', '#ffffff'];
const LED_SHAPES: { value: LedShape; label: string }[] = [
  { value: 'circle', label: '●' },
  { value: 'square', label: '■' },
  { value: 'triangle', label: '▲' },
  { value: 'segment', label: '━' },
];

export function GateNode({ node, outputs, inputValues, zoom, isConnecting, onPinClick, onMove, onToggle, onDelete, onUpdateNode }: GateNodeProps) {
  const height = getNodeHeight(node);
  const style = GATE_STYLES[node.type] || GATE_STYLES.AND;
  const dragRef = useRef<{ startX: number; startY: number; nodeX: number; nodeY: number; moved: boolean } | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  const pinSize = isConnecting ? 20 : 14;
  const pinOffset = pinSize / 2;

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
      const px = type === 'input' ? -pinOffset : NODE_WIDTH - pinOffset;
      const isHigh = type === 'output' ? (outputs[i] ?? false) : (inputValues[i] ?? false);
      return (
        <div
          key={`${type}-${i}`}
          className="absolute rounded-full cursor-crosshair"
          style={{
            width: pinSize, height: pinSize, left: px, top: py - pinOffset,
            backgroundColor: isHigh ? 'hsl(152 80% 55%)' : 'hsl(228 10% 35%)',
            border: `2px solid ${isHigh ? 'hsl(152 80% 70%)' : 'hsl(228 10% 50%)'}`,
            zIndex: 10,
            transition: 'width 0.15s, height 0.15s',
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
  const ledShape = node.ledShape || 'circle';
  const ledSize = node.ledSize || 18;
  const ledRotation = node.ledRotation || 0;

  const renderLedShape = () => {
    const baseStyle: React.CSSProperties = {
      width: ledSize,
      height: ledShape === 'segment' ? Math.max(4, ledSize / 4) : ledSize,
      backgroundColor: isLedOn ? ledColor : 'hsl(228 10% 25%)',
      boxShadow: isLedOn ? `0 0 12px ${ledColor}, 0 0 4px ${ledColor}` : 'none',
      transition: 'background-color 0.05s, box-shadow 0.05s',
      transform: `rotate(${ledRotation}deg)`,
    };

    switch (ledShape) {
      case 'circle':
        return <div className="mt-1" style={{ ...baseStyle, borderRadius: '50%' }} />;
      case 'square':
        return <div className="mt-1" style={{ ...baseStyle, borderRadius: 2 }} />;
      case 'triangle':
        return (
          <div className="mt-1" style={{
            width: 0, height: 0,
            borderLeft: `${ledSize / 2}px solid transparent`,
            borderRight: `${ledSize / 2}px solid transparent`,
            borderBottom: `${ledSize}px solid ${isLedOn ? ledColor : 'hsl(228 10% 25%)'}`,
            filter: isLedOn ? `drop-shadow(0 0 6px ${ledColor})` : 'none',
            transform: `rotate(${ledRotation}deg)`,
            transition: 'filter 0.05s',
          }} />
        );
      case 'segment':
        return <div className="mt-1" style={{ ...baseStyle, borderRadius: 2 }} />;
      default:
        return <div className="mt-1" style={{ ...baseStyle, borderRadius: '50%' }} />;
    }
  };

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
        {node.type === 'LED' && renderLedShape()}
      </div>
      {renderPins('input')}
      {renderPins('output')}

      {/* Delete button */}
      <button
        className="absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100"
        style={{ backgroundColor: 'hsl(0 70% 50%)', color: 'white', zIndex: 20, transition: 'opacity 0.15s' }}
        onPointerDown={(e) => { e.stopPropagation(); onDelete(node.id); }}
      >
        <X size={12} />
      </button>

      {/* LED Settings button */}
      {node.type === 'LED' && (
        <button
          className="absolute -top-2 -left-2 w-5 h-5 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100"
          style={{ backgroundColor: 'hsl(228 30% 35%)', color: 'white', zIndex: 20, transition: 'opacity 0.15s' }}
          onPointerDown={(e) => { e.stopPropagation(); setShowSettings(!showSettings); }}
        >
          <Settings size={10} />
        </button>
      )}

      {/* LED Settings Panel */}
      {showSettings && node.type === 'LED' && (
        <div
          className="absolute rounded-lg p-3 space-y-3"
          style={{
            top: height + 8,
            left: -20,
            width: 200,
            backgroundColor: 'hsl(228 18% 14%)',
            border: '1px solid hsl(228 15% 24%)',
            zIndex: 50,
          }}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <div>
            <label className="text-[10px] uppercase tracking-wider font-semibold block mb-1" style={{ color: 'hsl(215 10% 50%)' }}>Color</label>
            <div className="flex gap-1 flex-wrap">
              {LED_COLORS.map(color => (
                <button
                  key={color}
                  className="w-6 h-6 rounded-full border-2"
                  style={{
                    backgroundColor: color,
                    borderColor: ledColor === color ? 'white' : 'transparent',
                  }}
                  onClick={() => onUpdateNode(node.id, { ledColor: color })}
                />
              ))}
            </div>
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-wider font-semibold block mb-1" style={{ color: 'hsl(215 10% 50%)' }}>Shape</label>
            <div className="flex gap-1">
              {LED_SHAPES.map(s => (
                <button
                  key={s.value}
                  className="w-8 h-8 rounded flex items-center justify-center text-sm"
                  style={{
                    backgroundColor: ledShape === s.value ? 'hsl(228 15% 25%)' : 'transparent',
                    color: 'hsl(210 15% 80%)',
                    border: ledShape === s.value ? '1px solid hsl(228 15% 35%)' : '1px solid transparent',
                  }}
                  onClick={() => onUpdateNode(node.id, { ledShape: s.value })}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-wider font-semibold block mb-1" style={{ color: 'hsl(215 10% 50%)' }}>
              Size: {ledSize}px
            </label>
            <input
              type="range" min={8} max={40} value={ledSize}
              className="w-full h-1 rounded-lg appearance-none cursor-pointer"
              style={{ accentColor: 'hsl(152 60% 45%)' }}
              onChange={(e) => onUpdateNode(node.id, { ledSize: Number(e.target.value) })}
            />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-wider font-semibold block mb-1" style={{ color: 'hsl(215 10% 50%)' }}>
              Rotation: {ledRotation}°
            </label>
            <input
              type="range" min={0} max={360} step={15} value={ledRotation}
              className="w-full h-1 rounded-lg appearance-none cursor-pointer"
              style={{ accentColor: 'hsl(152 60% 45%)' }}
              onChange={(e) => onUpdateNode(node.id, { ledRotation: Number(e.target.value) })}
            />
          </div>
        </div>
      )}
    </div>
  );
}
