import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Trophy,
  Users,
  Briefcase,
  Map,
  MessageSquare,
  User,
  Sparkles,
  ArrowRight,
} from 'lucide-react';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/rank', label: 'My Rank', icon: Trophy },
  { path: '/skills', label: 'Skills', icon: Users },
  { path: '/careers', label: 'Careers', icon: Briefcase },
  { path: '/roadmap', label: 'Roadmap', icon: Map },
  { path: '/coach', label: 'AI Coach', icon: MessageSquare },
  { path: '/profile', label: 'Profile', icon: User },
];

/**
 * Top brand logo for sidebar navigation.
 * @returns JSX Element
 */
function SidebarBrand() {
  return (
    <div className="sidebar-brand">
      <div className="brand-logo-wrapper">
        <img
          src="/logo-icon.png"
          alt="CareerAI Logo"
          className="brand-logo-img"
          style={{ width: 34, height: 34, objectFit: 'contain' }}
        />
      </div>
      <span className="brand-name">CareerAI</span>
    </div>
  );
}

/**
 * Bottom upgrade banner in sidebar.
 * @returns JSX Element
 */
function SidebarPromoCard() {
  return (
    <div className="sidebar-promo-card">
      <div className="promo-icon-badge">
        <Sparkles size={16} className="promo-sparkle-icon" />
      </div>
      <h4 className="promo-title">Build your future skills</h4>
      <p className="promo-desc">Smarter learning.<br />Bigger opportunities.</p>
      <NavLink to="/roadmap" className="promo-action-btn" aria-label="Go to roadmap">
        <ArrowRight size={15} />
      </NavLink>
    </div>
  );
}

/**
 * Main application navigation sidebar.
 * @returns JSX Element
 */
export default function Sidebar() {
  return (
    <aside className="app-sidebar">
      <SidebarBrand />
      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
          >
            <item.icon className="nav-item-icon" size={19} />
            <span className="nav-item-label">{item.label}</span>
          </NavLink>
        ))}
      </nav>
      <SidebarPromoCard />
    </aside>
  );
}
