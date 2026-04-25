import { Bell, User } from 'lucide-react';

export default function Navbar() {
  return (
    <header className="topbar">
      <div>
        <h3 style={{ margin: 0, fontWeight: 500, color: 'var(--text-secondary)' }}>
          Fairness Dashboard
        </h3>
      </div>
      <div className="topbar-right">
        <button style={{ background: 'transparent', padding: '0.5rem', color: 'var(--text-secondary)' }}>
          <Bell size={20} />
        </button>
        <div style={{ 
          width: '36px', height: '36px', borderRadius: '50%', 
          backgroundColor: 'var(--bg-elevated)', display: 'flex', 
          alignItems: 'center', justifyContent: 'center' 
        }}>
          <User size={18} color="var(--primary-amber)" />
        </div>
      </div>
    </header>
  );
}
