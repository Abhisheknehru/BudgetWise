import { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleOAuthProvider } from '@react-oauth/google';
import './index.css';
import App from './App.jsx';
import { GoogleAuthProvider } from './context/GoogleAuthContext.jsx';

const CLIENT_ID_KEY = 'bw_google_client_id';

// Priority: env var → user-saved localStorage value
const GOOGLE_CLIENT_ID =
  import.meta.env.VITE_GOOGLE_CLIENT_ID ||
  localStorage.getItem(CLIENT_ID_KEY) ||
  '';

// ── Setup screen shown when no Client ID is configured ───────────────────────

function ClientIdSetup() {
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const [showSteps, setShowSteps] = useState(false);

  const handleSave = () => {
    const trimmed = input.trim();
    if (!trimmed) {
      setError('Please paste your Google Client ID above.');
      return;
    }
    if (!trimmed.includes('.apps.googleusercontent.com')) {
      setError('That doesn\'t look like a valid Client ID. It should end with .apps.googleusercontent.com');
      return;
    }
    localStorage.setItem(CLIENT_ID_KEY, trimmed);
    window.location.reload();
  };

  const s = {
    page: {
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#0a0e1a', color: '#f1f5f9', padding: '24px 16px',
      fontFamily: "'Inter', -apple-system, sans-serif",
    },
    card: {
      background: '#1a1f35', border: '1px solid rgba(71,85,105,0.5)', borderRadius: 24,
      padding: '36px 28px', maxWidth: 460, width: '100%',
      boxShadow: '0 24px 64px rgba(0,0,0,0.4)',
    },
    label: { fontSize: 12, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.8px', textTransform: 'uppercase', display: 'block', marginBottom: 8 },
    input: {
      width: '100%', padding: '13px 14px', borderRadius: 10, boxSizing: 'border-box',
      border: error ? '1.5px solid #f87171' : '1.5px solid rgba(71,85,105,0.5)',
      background: '#242b45', color: '#f1f5f9', fontSize: 14,
      fontFamily: 'monospace', outline: 'none', marginBottom: 8,
    },
    btn: {
      width: '100%', padding: 14, borderRadius: 10, border: 'none', cursor: 'pointer',
      fontSize: 15, fontWeight: 600, fontFamily: "'Inter', sans-serif",
      background: 'linear-gradient(135deg, #818cf8, #6366f1)',
      color: '#fff', boxShadow: '0 4px 16px rgba(99,102,241,0.3)', marginBottom: 16,
    },
    toggleBtn: {
      background: 'none', border: 'none', color: '#818cf8', fontSize: 13,
      cursor: 'pointer', fontWeight: 600, padding: 0, marginBottom: 16, display: 'block',
    },
    stepBox: {
      background: 'rgba(99,102,241,0.07)', border: '1px solid rgba(99,102,241,0.15)',
      borderRadius: 12, padding: '16px 18px', marginBottom: 16,
    },
    li: { color: '#94a3b8', fontSize: 13, lineHeight: 1.9 },
    code: { background: '#0a0e1a', padding: '2px 6px', borderRadius: 5, fontFamily: 'monospace', fontSize: 12, color: '#818cf8' },
    error: {
      background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
      borderRadius: 8, padding: '10px 12px', fontSize: 13, color: '#f87171', marginBottom: 12,
    },
  };

  return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={{ fontSize: 52, textAlign: 'center', marginBottom: 14 }}>💰</div>
        <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 6, textAlign: 'center' }}>BudgetWise Setup</h2>
        <p style={{ color: '#94a3b8', fontSize: 14, lineHeight: 1.6, marginBottom: 24, textAlign: 'center' }}>
          Paste your Google OAuth Client ID to enable Google Sheets sync.
        </p>

        <label style={s.label}>Google OAuth Client ID</label>
        <input
          style={s.input}
          type="text"
          placeholder="xxxxxxxxxxxx.apps.googleusercontent.com"
          value={input}
          onChange={(e) => { setInput(e.target.value); setError(''); }}
          onKeyDown={(e) => e.key === 'Enter' && handleSave()}
          autoFocus
        />

        {error && <div style={s.error}>{error}</div>}

        <button style={s.btn} onClick={handleSave}>
          Connect &amp; Launch App
        </button>

        <button style={s.toggleBtn} onClick={() => setShowSteps((v) => !v)}>
          {showSteps ? '▲ Hide setup steps' : '▼ How to get a Client ID?'}
        </button>

        {showSteps && (
          <div style={s.stepBox}>
            <ol style={{ margin: 0, paddingLeft: 20 }}>
              {[
                <>Go to <strong style={{ color: '#f1f5f9' }}>console.cloud.google.com</strong> and create or select a project</>,
                <>APIs &amp; Services → Library → enable <strong style={{ color: '#f1f5f9' }}>Google Sheets API</strong> and <strong style={{ color: '#f1f5f9' }}>Google Drive API</strong></>,
                <>APIs &amp; Services → Credentials → <strong style={{ color: '#f1f5f9' }}>Create OAuth 2.0 Client ID</strong> → Web application</>,
                <>Add this page's URL (e.g. <code style={s.code}>{window.location.origin}</code>) under <strong style={{ color: '#f1f5f9' }}>Authorized JavaScript origins</strong></>,
                <>Copy the generated Client ID and paste it in the field above</>,
              ].map((step, i) => (
                <li key={i} style={s.li}>{step}</li>
              ))}
            </ol>
          </div>
        )}

        <p style={{ fontSize: 11.5, color: '#64748b', textAlign: 'center', margin: 0, lineHeight: 1.5 }}>
          Your Client ID is stored only in this browser. It is never sent anywhere except to Google.
        </p>
      </div>
    </div>
  );
}

// ── Root render ───────────────────────────────────────────────────────────────

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {GOOGLE_CLIENT_ID ? (
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        <GoogleAuthProvider>
          <App />
        </GoogleAuthProvider>
      </GoogleOAuthProvider>
    ) : (
      <ClientIdSetup />
    )}
  </StrictMode>
);
