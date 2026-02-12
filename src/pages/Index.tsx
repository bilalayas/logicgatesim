import { CircuitProvider } from '@/context/CircuitContext';
import { Canvas } from '@/components/sandbox/Canvas';

const Index = () => (
  <CircuitProvider>
    <Canvas />
  </CircuitProvider>
);

export default Index;
