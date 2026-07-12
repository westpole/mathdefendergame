export default function GameCanvas({ children }: { children: React.ReactNode }) {
  return (
    <article id="app-shell" style={{
      width: '700px',
      height: '700px',
      backgroundColor: '#000',
    }}>
      {children}
    </article>
  );
}
