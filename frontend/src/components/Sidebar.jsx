import { NavLink } from 'react-router-dom';
import {
  BadgeCheck,
  Compass,
  History,
  LayoutDashboard,
  MessageSquareQuote,
  ShieldCheck,
  UploadCloud,
} from 'lucide-react';

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="brand-mark" aria-hidden="true">
          <ShieldCheck size={21} />
        </div>
        <div className="brand-copy">
          <h2>FairLens</h2>
          <span>Responsible AI audits</span>
        </div>
      </div>

      <nav className="nav-links" aria-label="Primary navigation">
        <NavLink end to="/" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Compass size={20} />
          <span>Overview</span>
        </NavLink>
        <NavLink to="/upload" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <UploadCloud size={20} />
          <span>Upload Dataset</span>
        </NavLink>
        <NavLink to="/dashboard" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <LayoutDashboard size={20} />
          <span>Results</span>
        </NavLink>
        <NavLink to="/history" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <History size={20} />
          <span>History</span>
        </NavLink>
        <NavLink to="/chat" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <MessageSquareQuote size={20} />
          <span>AI Explainer</span>
        </NavLink>
      </nav>

      <div className="sidebar-footer">
        <strong>
          <BadgeCheck size={15} /> Audit workspace
        </strong>
        <span>CSV scans, fairness metrics, and explainability in one flow.</span>
      </div>
    </aside>
  );
}
