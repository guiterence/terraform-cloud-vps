import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { signOut, getCurrentUser } from '../../services/auth';
import './Sidebar.css';

interface SidebarProps {
  currentPath?: string;
}

export default function Sidebar({ currentPath }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const activePath = currentPath || location.pathname;
  const [collapsed, setCollapsed] = useState(false);

  const menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/customer-360', label: 'Customer 360', icon: '🧠' },
    { path: '/attributes', label: 'Attributes', icon: '📋' },
    { path: '/target-groups', label: 'Target Groups', icon: '🎯' },
    { path: '/campaign-builder', label: 'Campaign Builder', icon: '🚀' },
    { path: '/ai-insights', label: 'AI Insights', icon: '🤖' },
    { path: '/settings', label: 'Settings', icon: '⚙️' },
  ];

  return (
    <div className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-logo">
        <span className="logo-icon">◆</span>
        {!collapsed && <span className="logo-text">NEXORA</span>}
      </div>
      
      <nav className="sidebar-menu">
        {menuItems.map((item) => {
          const isActive = activePath === item.path || activePath.startsWith(item.path + '/');
          return (
            <a
              key={item.path}
              href={item.path}
              onClick={(e) => {
                e.preventDefault();
                navigate(item.path);
              }}
              className={`menu-item ${isActive ? 'active' : ''}`}
              title={collapsed ? item.label : undefined}
            >
              <span className="menu-icon">{item.icon}</span>
              {!collapsed && <span className="menu-label">{item.label}</span>}
            </a>
          );
        })}
      </nav>
      
      <div className="sidebar-footer">
        <div className="sidebar-user">
          {!collapsed && (
            <div className="sidebar-user-info">
              <span className="sidebar-user-icon">👤</span>
              <span className="sidebar-user-name">
                {getCurrentUser()?.name || getCurrentUser()?.email?.split('@')[0] || 'Usuário'}
              </span>
            </div>
          )}
        </div>
        <button
          type="button"
          className="sidebar-logout"
          onClick={(e) => {
            e.preventDefault();
            signOut();
            window.location.href = '/login';
          }}
          title="Sair"
        >
          🚪
          {!collapsed && <span>Sair</span>}
        </button>
        <button
          type="button"
          className="sidebar-toggle"
          onClick={() => setCollapsed((prev) => !prev)}
        >
          {collapsed ? '⮞' : '⮜'}
        </button>
      </div>
    </div>
  );
}

