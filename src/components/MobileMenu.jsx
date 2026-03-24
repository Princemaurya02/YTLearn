import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LayoutDashboard, PlaySquare, FileText, BarChart3,
    Trophy, Map, Users, Newspaper, User, X, Brain, Zap
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import './MobileMenu.css';

const NAV_ITEMS = [
    { path: '/',             icon: LayoutDashboard, label: 'Dashboard',    color: '#7c6eff' },
    { path: '/library',      icon: PlaySquare,      label: 'Library',      color: '#00d4ff' },
    { path: '/notes',        icon: FileText,        label: 'Smart Notes',  color: '#00ff88' },
    { path: '/analytics',    icon: BarChart3,       label: 'Analytics',    color: '#ffb347' },
    { path: '/achievements', icon: Trophy,          label: 'Achievements', color: '#ff6b9d' },
    { path: '/roadmaps',     icon: Map,             label: 'Roadmaps',     color: '#7c6eff' },
    { path: '/rooms',        icon: Users,           label: 'Study Rooms',  color: '#00d4ff' },
    { path: '/post',         icon: Newspaper,       label: 'Feed',         color: '#00ff88' },
    { path: '/profile',      icon: User,            label: 'Profile',      color: '#ffb347' },
];

/* Each nav item drops in one by one */
const itemVariants = {
    hidden:  { opacity: 0, y: -16, scale: 0.96 },
    visible: (i) => ({
        opacity: 1, y: 0, scale: 1,
        transition: { delay: i * 0.055, type: 'spring', stiffness: 380, damping: 26 },
    }),
    exit: (i) => ({
        opacity: 0, y: -10,
        transition: { delay: i * 0.025, duration: 0.18 },
    }),
};

const overlayVariants = {
    hidden:  { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.2 } },
    exit:    { opacity: 0, transition: { duration: 0.22 } },
};

const menuVariants = {
    hidden:  { opacity: 0, y: -12 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.22, ease: 'easeOut' } },
    exit:    { opacity: 0, y: -12, transition: { duration: 0.18 } },
};

export default function MobileMenu({ open, onClose }) {
    const { user } = useApp();
    const location = useLocation();

    return (
        <AnimatePresence>
            {open && (
                <>
                    {/* Backdrop with blur */}
                    <motion.div
                        className="mm-backdrop"
                        variants={overlayVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        onClick={onClose}
                    />

                    {/* Dropdown panel */}
                    <motion.div
                        className="mm-panel"
                        variants={menuVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                    >
                        {/* Header */}
                        <div className="mm-header">
                            <div className="mm-logo">
                                <Brain size={18} />
                                <span>YTLearn</span>
                            </div>
                            <div className="mm-user">
                                <span className="mm-avatar">{user?.name?.[0] || 'U'}</span>
                                <div className="mm-user-info">
                                    <span className="mm-user-name">{user?.name || 'User'}</span>
                                    <span className="mm-user-xp"><Zap size={9} /> {user?.xp || 0} XP</span>
                                </div>
                            </div>
                            <button className="mm-close" onClick={onClose} aria-label="Close menu">
                                <X size={18} />
                            </button>
                        </div>

                        {/* Divider */}
                        <div className="mm-divider" />

                        {/* Nav items — staggered drop from top */}
                        <nav className="mm-nav">
                            {NAV_ITEMS.map((item, i) => {
                                const isActive = item.path === '/'
                                    ? location.pathname === '/'
                                    : location.pathname.startsWith(item.path);
                                return (
                                    <motion.div
                                        key={item.path}
                                        custom={i}
                                        variants={itemVariants}
                                        initial="hidden"
                                        animate="visible"
                                        exit="exit"
                                    >
                                        <NavLink
                                            to={item.path}
                                            end={item.path === '/'}
                                            className={`mm-item ${isActive ? 'active' : ''}`}
                                            onClick={onClose}
                                            style={isActive ? { '--item-color': item.color } : {}}
                                        >
                                            <span
                                                className="mm-icon"
                                                style={isActive ? { color: item.color, background: `${item.color}18` } : {}}
                                            >
                                                <item.icon size={18} strokeWidth={isActive ? 2.2 : 1.8} />
                                            </span>
                                            <span className="mm-label">{item.label}</span>
                                            {isActive && <span className="mm-active-dot" style={{ background: item.color }} />}
                                        </NavLink>
                                    </motion.div>
                                );
                            })}
                        </nav>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
