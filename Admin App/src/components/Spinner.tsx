import { Loader2 } from 'lucide-react';

interface SpinnerProps {
  size?: number;
  message?: string;
  fullscreen?: boolean;
}

const Spinner = ({ size = 32, message = "Loading...", fullscreen = false }: SpinnerProps) => {
  const content = (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', color: 'var(--text-secondary)' }}>
      <Loader2 size={size} className="spinner-icon" />
      {message && <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{message}</span>}
    </div>
  );

  if (fullscreen) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', width: '100%' }}>
        {content}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px', width: '100%' }}>
      {content}
    </div>
  );
};

export default Spinner;
