import type { CSSProperties, ReactNode } from 'react';

interface GameCanvasProps {
  children: ReactNode;
  width?: number;
  height?: number;
}

export default function GameCanvas({ children, width = 700, height = 700 }: GameCanvasProps) {
  const shellStyle: CSSProperties & Record<'--app-viewport-height' | '--app-viewport-width', string> = {
    width: `${width}px`,
    height: `${height}px`,
    backgroundColor: '#1e2326',
    '--app-viewport-height': `${height}px`,
    '--app-viewport-width': `${width}px`,
  };

  return (
    <article id="app-shell" style={shellStyle}>
      {children}
    </article>
  );
}
