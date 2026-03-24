import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
    LayoutDashboard, PlaySquare, BookOpen, BarChart3,
    FileText, Users, Trophy, User, Map, Zap, Brain, Star, Newspaper
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import './Sidebar.css';

const NAV_ITEMS = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard', section: 'main' },
    { path: '/library', icon: PlaySquare, label: 'Library', section: 'main' },
    { path: '/notes', icon: FileText, label: 'Smart Notes', section: 'main' },
    { path: '/analytics', icon: BarChart3, label: 'Analytics', section: 'learn' },
    { path: '/achievements', icon: Trophy, label: 'Achievements', section: 'learn' },
    { path: '/roadmaps', icon: Map, label: 'Roadmaps', section: 'learn' },
    { path: '/rooms', icon: Users, label: 'Study Rooms', section: 'social' },
    { path: '/post', icon: Newspaper, label: 'Post', section: 'social' },
    { path: '/profile', icon: User, label: 'Profile', section: 'social' },
];

const SECTIONS = {
    main: 'Core',
    learn: 'Learning',
    social: 'Social',
};

export default function Sidebar({ onClose }) {
    const { user } = useApp();
    const location = useLocation();
    const xpPercent = (user.xp / user.xpToNext) * 100;

    const grouped = Object.entries(SECTIONS).map(([key, label]) => ({
        key, label,
        items: NAV_ITEMS.filter(i => i.section === key),
    }));

    return (
        <aside className="sidebar">
            {/* Logo */}
            <div className="sidebar-logo">
                <div className="logo-icon">
                    <Brain size={20} />
                </div>
                <div className="logo-text">
                    <span className="logo-name">YTLearn</span>
                    <span className="logo-tagline">Study Cockpit</span>
                </div>
            </div>

            {/* User XP Card */}
            <div className="sidebar-user">
                <div className="user-avatar">
                    <span>{user.name[0]}</span>
                    <div className="user-level-badge">{user.level}</div>
                </div>
                <div className="user-info">
                    <div className="user-name">{user.name}</div>
                    <div className="user-level-name">{user.levelName}</div>
                </div>
                <div className="user-streak">
                    <span>🔥</span>
                    <span>{user.streak}</span>
                </div>
            </div>

            {/* XP Bar */}
            <div className="xp-bar-container">
                <div className="xp-bar-labels">
                    <span className="xp-label"><Zap size={10} /> XP</span>
                    <span className="xp-value">{user.xp.toLocaleString()} / {user.xpToNext.toLocaleString()}</span>
                </div>
                <div className="xp-bar-track">
                    <div className="xp-bar-fill" style={{ width: `${xpPercent}%` }} />
                </div>
            </div>

            {/* Navigation */}
            <nav className="sidebar-nav">
                {grouped.map(({ key, label, items }) => (
                    <div key={key} className="nav-section">
                        <div className="nav-section-label">{label}</div>
                        {items.map(item => (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                end={item.path === '/'}
                                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                                onClick={onClose}
                            >
                                <item.icon size={18} />
                                <span>{item.label}</span>
                                {item.path === '/rooms' && <span className="nav-live-dot" />}
                            </NavLink>
                        ))}
                    </div>
                ))}
            </nav>

            {/* Focus Stats */}
            <div className="sidebar-stats">
                <div className="stat-item">
                    <Star size={14} />
                    <span>{user.totalHours}h studied</span>
                </div>
                <div className="stat-item">
                    <Zap size={14} />
                    <span>{user.focusScore}% focus</span>
                </div>
            </div>
        </aside>
    );
}
