import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, Bell, Command, X, Play, Check, Trash2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useNotifications } from '../hooks/useNotifications';
import './Header.css';

const PAGE_TITLES = {
    '/': 'Dashboard', '/library': 'Video Library', '/notes': 'Smart Notes',
    '/analytics': 'Analytics', '/achievements': 'Achievements',
    '/roadmaps': 'Learning Roadmaps', '/rooms': 'Study Rooms',
    '/profile': 'Profile', '/post': 'Learning Feed',
};

const SEARCH_SUGGESTIONS = [
    { type: 'video', title: 'JavaScript Crash Course',    channel: 'Traversy Media',    id: 'PkZNo7MFNFg' },
    { type: 'video', title: 'React Tutorial for Beginners', channel: 'Codevolution',    id: 'SqcY0GlETPk' },
    { type: 'video', title: 'Python Full Course',          channel: 'freeCodeCamp',     id: '_uQrJ0TkZlc' },
    { type: 'video', title: 'CSS Grid Tutorial',           channel: 'Kevin Powell',     id: 'rg7Fvvl3taU' },
    { type: 'video', title: 'Node.js Crash Course',        channel: 'Traversy Media',   id: 'fBNz5xF-Kx4' },
    { type: 'video', title: 'Data Structures & Algorithms', channel: 'freeCodeCamp',    id: '8hly31xKli0' },
];

function relTime(iso) {
    const d = Math.floor((Date.now() - new Date(iso)) / 1000);
    if (d < 60)    return `${d}s ago`;
    if (d < 3600)  return `${Math.floor(d / 60)}m ago`;
    if (d < 86400) return `${Math.floor(d / 3600)}h ago`;
    return `${Math.floor(d / 86400)}d ago`;
}

export default function Header() {
    const { liveStats } = useApp();
    const { notifs, unreadCount, markRead, markAllRead, clearAll, TYPE_ICON } = useNotifications();
    const focusScore = liveStats?.focusScore ?? 0;
    const navigate   = useNavigate();
    const location   = useLocation();

    const [searchQuery, setSearchQuery] = useState('');
    const [showSearch, setShowSearch]   = useState(false);
    const [showNotifs, setShowNotifs]   = useState(false);
    const searchRef = useRef(null);
    const notifsRef = useRef(null);

    const pageTitle = PAGE_TITLES[location.pathname] || 'YTLearn';
    const filtered  = SEARCH_SUGGESTIONS.filter(s =>
        s.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    useEffect(() => {
        function handleClick(e) {
            if (searchRef.current && !searchRef.current.contains(e.target)) setShowSearch(false);
            if (notifsRef.current && !notifsRef.current.contains(e.target)) setShowNotifs(false);
        }
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    function handleSearch(e) {
        e.preventDefault();
        if (searchQuery.trim()) {
            const ytId = searchQuery.match(/(?:v=|youtu\.be\/)([^&\s]{11})/)?.[1];
            if (ytId) navigate(`/player/${ytId}`);
        }
    }

    function playVideo(id) { navigate(`/player/${id}`); setShowSearch(false); setSearchQuery(''); }

    return (
        <header className="page-header">
            <h1 className="header-title">{pageTitle}</h1>

            {/* Search */}
            <div className="header-search" ref={searchRef}>
                <form className="search-form" onSubmit={handleSearch}>
                    <Search size={16} className="search-icon" />
                    <input
                        className="search-input"
                        placeholder="Search videos or paste YouTube URL..."
                        value={searchQuery}
                        onChange={e => { setSearchQuery(e.target.value); setShowSearch(true); }}
                        onFocus={() => setShowSearch(true)}
                    />
                    {searchQuery && (
                        <button type="button" className="search-clear" onClick={() => setSearchQuery('')}>
                            <X size={14} />
                        </button>
                    )}
                    <span className="search-shortcut"><Command size={11} /> K</span>
                </form>
                {showSearch && searchQuery && (
                    <div className="search-dropdown animate-scale-in">
                        <div className="search-hint">Press Enter to open YouTube URL · Click to watch</div>
                        {filtered.map(item => (
                            <button key={item.id} className="search-item" onClick={() => playVideo(item.id)}>
                                <div className="search-item-icon"><Play size={14} /></div>
                                <div className="search-item-info">
                                    <span className="search-item-title">{item.title}</span>
                                    <span className="search-item-sub">{item.channel}</span>
                                </div>
                                <span className="badge badge-violet">Watch</span>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <div className="header-actions">
                {/* Notifications */}
                <div className="notif-wrapper" ref={notifsRef}>
                    <button
                        id="notif-btn"
                        className={`header-icon-btn ${unreadCount > 0 ? 'has-notif' : ''}`}
                        onClick={() => { setShowNotifs(v => !v); }}
                    >
                        <Bell size={18} />
                        {unreadCount > 0 && (
                            <span className="notif-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
                        )}
                    </button>

                    {showNotifs && (
                        <div className="notif-dropdown animate-scale-in">
                            <div className="notif-header">
                                <span>Notifications {unreadCount > 0 && <span className="badge badge-violet">{unreadCount} new</span>}</span>
                                <div className="notif-header-actions">
                                    {unreadCount > 0 && (
                                        <button className="notif-hdr-btn" onClick={markAllRead} title="Mark all read">
                                            <Check size={13} /> All read
                                        </button>
                                    )}
                                    {notifs.length > 0 && (
                                        <button className="notif-hdr-btn danger" onClick={clearAll} title="Clear all">
                                            <Trash2 size={13} />
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="notif-list">
                                {notifs.length === 0 ? (
                                    <div className="notif-empty">
                                        <Bell size={28} style={{ opacity: 0.2 }} />
                                        <p>No notifications yet</p>
                                    </div>
                                ) : notifs.slice(0, 8).map(n => (
                                    <div
                                        key={n.id}
                                        className={`notif-item ${!n.read ? 'unread' : ''}`}
                                        onClick={() => markRead(n.id)}
                                    >
                                        <div className="notif-avatar" style={{ background: n.fromColor ?? '#7c6eff' }}>
                                            {(n.from?.[0] ?? '?').toUpperCase()}
                                        </div>
                                        <div className="notif-content">
                                            <p>{TYPE_ICON[n.type] ?? '🔔'} {n.message}</p>
                                            <span>{relTime(n.createdAt)}</span>
                                        </div>
                                        {!n.read && <div className="notif-dot" />}
                                    </div>
                                ))}
                            </div>

                            {notifs.length > 8 && (
                                <div className="notif-footer">+{notifs.length - 8} more notifications</div>
                            )}
                        </div>
                    )}
                </div>

                {/* Focus Score */}
                <div className="focus-indicator">
                    <div className="focus-dot" />
                    <span>Focus: {focusScore > 0 ? `${focusScore}%` : '—'}</span>
                </div>
            </div>
        </header>
    );
}
