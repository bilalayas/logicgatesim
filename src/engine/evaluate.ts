import { CircuitNode, Connection, ModuleDefinition } from '@/types/circuit';

export function evaluateCircuit(
  nodes: CircuitNode[],
  connections: Connection[],
  modules: ModuleDefinition[]
): Record<string, boolean[]> {
  const outputs: Record<string, boolean[]> = {};

  // Build adjacency
  const outEdges: Record<string, Set<string>> = {};
  const inEdges: Record<string, Set<string>> = {};
  for (const node of nodes) {
    outEdges[node.id] = new Set();
    inEdges[node.id] = new Set();
  }
  for (const conn of connections) {
    if (outEdges[conn.fromNodeId] && inEdges[conn.toNodeId]) {
      outEdges[conn.fromNodeId].add(conn.toNodeId);
      inEdges[conn.toNodeId].add(conn.fromNodeId);
    }
  }

  // Kahn's topological sort
  const inDegree: Record<string, number> = {};
  for (const node of nodes) inDegree[node.id] = inEdges[node.id]?.size || 0;

  const queue: string[] = [];
  for (const node of nodes) {
    if (inDegree[node.id] === 0) queue.push(node.id);
  }

  const sorted: string[] = [];
  while (queue.length > 0) {
    const id = queue.shift()!;
    sorted.push(id);
    for (const next of outEdges[id] || []) {
      inDegree[next]--;
      if (inDegree[next] === 0) queue.push(next);
    }
  }

  // Evaluate
  for (const nodeId of sorted) {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) continue;

    const inputValues: boolean[] = [];
    for (let i = 0; i < node.inputCount; i++) {
      const conn = connections.find(c => c.toNodeId === nodeId && c.toPinIndex === i);
      if (conn) {
        inputValues.push((outputs[conn.fromNodeId] || [])[conn.fromPinIndex] ?? false);
      } else {
        inputValues.push(false);
      }
    }

    switch (node.type) {
      case 'INPUT':
        outputs[nodeId] = [node.inputValue ?? false];
        break;
      case 'AND':
        outputs[nodeId] = [inputValues.length >= 2 && inputValues[0] && inputValues[1]];
        break;
      case 'OR':
        outputs[nodeId] = [inputValues.length >= 2 && (inputValues[0] || inputValues[1])];
        break;
      case 'NOT':
        outputs[nodeId] = [!inputValues[0]];
        break;
      case 'OUTPUT':
      case 'LED':
        outputs[nodeId] = [inputValues[0] ?? false];
        break;
      case 'MODULE': {
        const moduleDef = modules.find(m => m.id === node.moduleId);
        if (moduleDef) {
          const internalNodes = moduleDef.nodes.map(n => {
            if (n.type === 'INPUT') {
              const idx = moduleDef.inputNodeIds.indexOf(n.id);
              if (idx >= 0 && idx < inputValues.length) {
                return { ...n, inputValue: inputValues[idx] };
              }
            }
            return { ...n };
          });
          const internalOutputs = evaluateCircuit(internalNodes, moduleDef.connections, modules);
          const result: boolean[] = [];
          for (const outId of moduleDef.outputNodeIds) {
            // OUTPUT nodes have 1 input, their value is that input
            result.push((internalOutputs[outId] || [])[0] ?? false);
          }
          outputs[nodeId] = result;
        } else {
          outputs[nodeId] = Array(node.outputCount).fill(false);
        }
        break;
      }
      default:
        outputs[nodeId] = [false];
    }
  }

  return outputs;
}

export function wouldCreateCycle(
  connections: Connection[],
  fromNodeId: string,
  toNodeId: string
): boolean {
  if (fromNodeId === toNodeId) return true;
  const adj: Record<string, string[]> = {};
  for (const conn of connections) {
    if (!adj[conn.fromNodeId]) adj[conn.fromNodeId] = [];
    adj[conn.fromNodeId].push(conn.toNodeId);
  }
  // BFS from toNodeId: can we reach fromNodeId?
  const visited = new Set<string>();
  const queue = [toNodeId];
  while (queue.length > 0) {
    const current = queue.shift()!;
    if (current === fromNodeId) return true;
    if (visited.has(current)) continue;
    visited.add(current);
    for (const next of adj[current] || []) {
      queue.push(next);
    }
  }
  return false;
}
