import { Link, useLocation } from 'react-router-dom';
import { UploadCloud, LayoutDashboard, History, MessageSquareQuote } from 'lucide-react';

export default function Sidebar() {
  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <div className="sidebar">
      <div className="sidebar-logo">
        {/* Simple visual logo if icon fails */}
        <div style={{
          width: '32px', height: '32px', borderRadius: '8px', 
          background: 'linear-gradient(135deg, var(--primary-amber), var(--soft-yellow))'
        }}></div>
        <h2 className="gradient-text">FairLens</h2>
      </div>

      <div className="nav-links">
        <Link to="/" className={`nav-item ${currentPath === '/' ? 'active' : ''}`}>
          <UploadCloud size={20} />
          <span>Upload</span>
        </Link>
        <Link to="/dashboard" className={`nav-item ${currentPath === '/dashboard' ? 'active' : ''}`}>
          <LayoutDashboard size={20} />
          <span>Dashboard</span>
        </Link>
        <Link to="/history" className={`nav-item ${currentPath === '/history' ? 'active' : ''}`}>
          <History size={20} />
          <span>History</span>
        </Link>
        <Link to="/chat" className={`nav-item ${currentPath === '/chat' ? 'active' : ''}`}>
          <MessageSquareQuote size={20} />
          <span>AI Explainer</span>
        </Link>
      </div>
    </div>
  );
}
