import { useState } from 'react';
import { useCircuit } from '@/context/CircuitContext';
import { GateType, ModuleDefinition } from '@/types/circuit';
import { Menu, Plus, Trash2, Zap, ToggleLeft, Lightbulb, Box, ChevronDown, ChevronRight } from 'lucide-react';

const GATE_ITEMS: { type: GateType; label: string; icon: React.ReactNode }[] = [
  { type: 'AND', label: 'AND Gate', icon: <Zap size={16} /> },
  { type: 'OR', label: 'OR Gate', icon: <Zap size={16} /> },
  { type: 'NOT', label: 'NOT Gate', icon: <Zap size={16} /> },
];

const IO_ITEMS: { type: GateType; label: string; icon: React.ReactNode }[] = [
  { type: 'INPUT', label: 'Input', icon: <ToggleLeft size={16} /> },
  { type: 'OUTPUT', label: 'Output', icon: <Box size={16} /> },
];

export function SideMenu() {
  const { state, dispatch } = useCircuit();
  const [open, setOpen] = useState(false);

  const selectTool = (tool: GateType, moduleId?: string) => {
    dispatch({ type: 'SET_TOOL', tool, moduleId: moduleId || null });
    setOpen(false);
  };

  const createModule = () => {
    const { nodes, connections } = state;
    const inputNodes = nodes.filter(n => n.type === 'INPUT');
    const outputNodes = nodes.filter(n => n.type === 'OUTPUT');

    if (inputNodes.length === 0 || outputNodes.length === 0) {
      alert('You need at least one INPUT and one OUTPUT node to create a module.');
      return;
    }

    const name = prompt('Module name:');
    if (!name?.trim()) return;

    const module: ModuleDefinition = {
      id: crypto.randomUUID(),
      name: name.trim(),
      nodes: nodes.map(n => ({ ...n })),
      connections: connections.map(c => ({ ...c })),
      inputNodeIds: inputNodes.map(n => n.id),
      outputNodeIds: outputNodes.map(n => n.id),
      inputCount: inputNodes.length,
      outputCount: outputNodes.length,
    };

    dispatch({ type: 'CREATE_MODULE', module });
    alert(`Module "${name}" created!`);
  };

  const deleteModule = (id: string, name: string) => {
    if (confirm(`Delete module "${name}"?`)) {
      dispatch({ type: 'DELETE_MODULE', id });
    }
  };

  const clearCanvas = () => {
    if (state.nodes.length === 0 || confirm('Clear all nodes and connections?')) {
      dispatch({ type: 'CLEAR_CANVAS' });
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="fixed top-4 left-4 z-50 w-12 h-12 rounded-lg flex items-center justify-center transition-colors"
        style={{
          backgroundColor: 'hsl(228 18% 12%)',
          border: '1px solid hsl(228 15% 22%)',
          color: 'hsl(210 15% 88%)',
        }}
      >
        <Menu size={22} />
      </button>

      <div
        className="fixed top-0 left-0 h-full z-40 overflow-y-auto transition-transform duration-200"
        style={{
          width: 260,
          backgroundColor: 'hsl(228 18% 10%)',
          borderRight: '1px solid hsl(228 15% 20%)',
          transform: open ? 'translateX(0)' : 'translateX(-100%)',
        }}
      >
        <div className="pt-20 px-4 pb-6 space-y-2">
          <CollapsibleSection title="Core Gates" defaultOpen>
            {GATE_ITEMS.map(item => (
              <ToolButton key={item.type} label={item.label} icon={item.icon} onClick={() => selectTool(item.type)} />
            ))}
          </CollapsibleSection>

          <CollapsibleSection title="I/O" defaultOpen>
            {IO_ITEMS.map(item => (
              <ToolButton key={item.type} label={item.label} icon={item.icon} onClick={() => selectTool(item.type)} />
            ))}
          </CollapsibleSection>

          <CollapsibleSection title="LED" defaultOpen>
            <ToolButton label="LED" icon={<Lightbulb size={16} />} onClick={() => selectTool('LED')} />
          </CollapsibleSection>

          <CollapsibleSection title="My Modules" defaultOpen>
            {state.modules.length === 0 && (
              <p className="text-xs" style={{ color: 'hsl(215 10% 45%)' }}>No modules yet</p>
            )}
            {state.modules.map(m => (
              <div key={m.id} className="flex items-center gap-1">
                <ToolButton
                  label={`${m.name} (${m.inputCount}→${m.outputCount})`}
                  icon={<Box size={16} />}
                  onClick={() => selectTool('MODULE', m.id)}
                  className="flex-1"
                />
                <button
                  className="p-1 rounded opacity-50 hover:opacity-100"
                  style={{ color: 'hsl(0 70% 55%)' }}
                  onClick={() => deleteModule(m.id, m.name)}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
            <button
              className="w-full mt-2 py-2 rounded-md text-xs font-medium flex items-center justify-center gap-1 transition-colors"
              style={{
                backgroundColor: 'hsl(152 60% 25%)',
                color: 'hsl(152 60% 90%)',
                border: '1px solid hsl(152 60% 35%)',
              }}
              onClick={createModule}
            >
              <Plus size={14} /> Create Module
            </button>
          </CollapsibleSection>

          <div className="pt-4 border-t" style={{ borderColor: 'hsl(228 15% 18%)' }}>
            <button
              className="w-full py-2 rounded-md text-xs font-medium transition-colors"
              style={{
                backgroundColor: 'hsl(0 50% 20%)',
                color: 'hsl(0 70% 70%)',
                border: '1px solid hsl(0 40% 30%)',
              }}
              onClick={clearCanvas}
            >
              Clear Canvas
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

function CollapsibleSection({ title, children, defaultOpen = true }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div>
      <button
        className="w-full flex items-center gap-1 py-2 text-[11px] uppercase tracking-wider font-semibold"
        style={{ color: 'hsl(215 10% 50%)' }}
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        {title}
      </button>
      {isOpen && <div className="space-y-1 pb-2">{children}</div>}
    </div>
  );
}

function ToolButton({ label, icon, onClick, className = '' }: { label: string; icon: React.ReactNode; onClick: () => void; className?: string }) {
  return (
    <button
      className={`w-full py-2 px-3 rounded-md text-sm text-left flex items-center gap-2 transition-colors ${className}`}
      style={{ color: 'hsl(210 15% 82%)' }}
      onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'hsl(228 15% 16%)')}
      onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
      onClick={onClick}
    >
      {icon} {label}
    </button>
  );
}
