import { Bell, CircleDot, Rocket, User } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const pageMeta = {
  '/': {
    eyebrow: 'Overview',
    title: 'FairLens command center',
  },
  '/upload': {
    eyebrow: 'New audit',
    title: 'Upload dataset',
  },
  '/dashboard': {
    eyebrow: 'Analysis',
    title: 'Fairness results',
  },
  '/history': {
    eyebrow: 'Records',
    title: 'Scan history',
  },
  '/chat': {
    eyebrow: 'Assistant',
    title: 'AI explainer',
  },
};

export default function Navbar() {
  const location = useLocation();
  const meta = pageMeta[location.pathname] || pageMeta['/'];

  return (
    <header className="topbar">
      <div className="topbar-title">
        <span>{meta.eyebrow}</span>
        <h3>{meta.title}</h3>
      </div>
      <div className="topbar-right">
        <div className="workspace-pill">
          <CircleDot size={14} />
          Local workspace
        </div>
        <Link className="button topbar-action" to="/upload">
          <Rocket size={16} />
          Start uploading
        </Link>
        <button className="btn-ghost btn-icon" aria-label="Notifications">
          <Bell size={20} />
        </button>
        <div className="avatar" aria-label="User profile">
          <User size={18} />
        </div>
      </div>
    </header>
  );
}
