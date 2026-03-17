import React, { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Search, BookOpen, Clock, ChevronRight, ChevronLeft, RotateCcw, X, Trash2, Filter } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useWatchHistory } from '../hooks/useWatchHistory';
import './Library.css';

const CATEGORIES = ['All', 'Web Dev', 'React', 'JavaScript', 'Python', 'DSA', 'Node.js', 'CSS'];

const ALL_VIDEOS = [
    { id: 'PkZNo7MFNFg', title: 'JavaScript Full Course — ES6+', channel: 'freeCodeCamp', duration: '3:26:42', thumb: 'https://i.ytimg.com/vi/PkZNo7MFNFg/hqdefault.jpg', subject: 'JavaScript', difficulty: 'Beginner', views: '14M' },
    { id: 'SqcY0GlETPk', title: 'React — Complete Guide 2024', channel: 'Academind', duration: '2:45:00', thumb: 'https://i.ytimg.com/vi/SqcY0GlETPk/hqdefault.jpg', subject: 'React', difficulty: 'Intermediate', views: '8M' },
    { id: '8hly31xKli0', title: 'DSA — Zero to Hero', channel: 'freeCodeCamp', duration: '4:22:10', thumb: 'https://i.ytimg.com/vi/8hly31xKli0/hqdefault.jpg', subject: 'DSA', difficulty: 'Advanced', views: '5M' },
    { id: '_uQrJ0TkZlc', title: 'Python for Beginners', channel: 'Programming with Mosh', duration: '6:14:07', thumb: 'https://i.ytimg.com/vi/_uQrJ0TkZlc/hqdefault.jpg', subject: 'Python', difficulty: 'Beginner', views: '22M' },
    { id: 'fBNz5xF-Kx4', title: 'Node.js Crash Course', channel: 'Traversy Media', duration: '1:30:00', thumb: 'https://i.ytimg.com/vi/fBNz5xF-Kx4/hqdefault.jpg', subject: 'Node.js', difficulty: 'Intermediate', views: '3M' },
    { id: 'rg7Fvvl3taU', title: 'CSS Grid — Complete Tutorial', channel: 'Kevin Powell', duration: '1:20:00', thumb: 'https://i.ytimg.com/vi/rg7Fvvl3taU/hqdefault.jpg', subject: 'CSS', difficulty: 'Beginner', views: '2M' },
    { id: 'yfoY53QXEnI', title: 'CSS Crash Course', channel: 'Traversy Media', duration: '1:25:21', thumb: 'https://i.ytimg.com/vi/yfoY53QXEnI/hqdefault.jpg', subject: 'CSS', difficulty: 'Beginner', views: '6M' },
    { id: 'w7ejDZ8SWv8', title: 'React Hooks Tutorial', channel: 'Codevolution', duration: '1:48:10', thumb: 'https://i.ytimg.com/vi/w7ejDZ8SWv8/hqdefault.jpg', subject: 'React', difficulty: 'Intermediate', views: '4M' },
    { id: 'RBSGKlAvoiM', title: 'Dynamic Programming — Masterclass', channel: 'freeCodeCamp', duration: '5:01:12', thumb: 'https://i.ytimg.com/vi/RBSGKlAvoiM/hqdefault.jpg', subject: 'DSA', difficulty: 'Advanced', views: '3M' },
    { id: 'qz0aGYrrlhU', title: 'HTML Full Course', channel: 'Traversy Media', duration: '1:10:09', thumb: 'https://i.ytimg.com/vi/qz0aGYrrlhU/hqdefault.jpg', subject: 'Web Dev', difficulty: 'Beginner', views: '10M' },
    { id: 'dhYoOOa2i2M', title: 'Git & GitHub Crash Course', channel: 'freeCodeCamp', duration: '1:40:00', thumb: 'https://i.ytimg.com/vi/dhYoOOa2i2M/hqdefault.jpg', subject: 'Web Dev', difficulty: 'Beginner', views: '8M' },
    { id: 'ZjAqacIC_3c', title: 'TypeScript Full Course', channel: 'Traversy Media', duration: '2:10:00', thumb: 'https://i.ytimg.com/vi/ZjAqacIC_3c/hqdefault.jpg', subject: 'JavaScript', difficulty: 'Intermediate', views: '3M' },
];

const DIFF_COLOR = { Beginner: 'green', Intermediate: 'amber', Advanced: 'red' };

// ── Helpers ────────────────────────────────────────────────────────────
/** Format seconds → m:ss  or  h:mm:ss */
function fmtTime(s) {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = Math.floor(s % 60);
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
    return `${m}:${String(sec).padStart(2, '0')}`;
}

/** Friendly relative time */
function relativeTime(iso) {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60_000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
}

// ── Continue Watching Rail ──────────────────────────────────────────────
function ContinueWatchingRail({ navigate }) {
    const { continueWatching, removeEntry, clearHistory } = useWatchHistory();
    const railRef = useRef(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(true);
    const [showClearConfirm, setShowClearConfirm] = useState(false);

    // Sync arrow button visibility based on scroll position
    const syncArrows = useCallback(() => {
        const el = railRef.current;
        if (!el) return;
        setCanScrollLeft(el.scrollLeft > 4);
        setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
    }, []);

    // Scroll by one card width (220 card + 14 gap = 234px, scroll 248 for feel)
    const scroll = useCallback((dir) => {
        const el = railRef.current;
        if (!el) return;
        el.scrollBy({ left: dir * 248, behavior: 'smooth' });
    }, []);

    if (continueWatching.length === 0) return null;

    const handleClearAll = () => {
        if (showClearConfirm) {
            clearHistory?.();
            setShowClearConfirm(false);
        } else {
            setShowClearConfirm(true);
            setTimeout(() => setShowClearConfirm(false), 3000);
        }
    };

    return (
        <div className="cw-section">
            {/* Header row */}
            <div className="cw-header">
                <div className="cw-title-row">
                    <RotateCcw size={16} className="cw-icon" />
                    <h3>Continue Watching</h3>
                    <span className="cw-count badge badge-violet">{continueWatching.length}</span>
                    <div className="cw-header-actions">
                        <button
                            className={`cw-clear-btn ${showClearConfirm ? 'confirm' : ''}`}
                            onClick={handleClearAll}
                            title={showClearConfirm ? 'Click again to confirm' : 'Clear watch history'}
                        >
                            <Trash2 size={12} />
                            {showClearConfirm ? 'Confirm?' : 'Clear all'}
                        </button>
                    </div>
                </div>
                <p className="cw-subtitle">
                    Pick up right where you left off &mdash; {continueWatching.length} video{continueWatching.length !== 1 ? 's' : ''} in history
                </p>
            </div>

            {/* Scroll wrapper: fade edges + arrow buttons */}
            <div className="cw-scroll-wrapper">
                {/* Left fade + arrow */}
                <div className={`cw-fade cw-fade-left ${canScrollLeft ? 'visible' : ''}`}>
                    <button className="cw-arrow-btn" onClick={() => scroll(-1)} aria-label="Scroll left">
                        <ChevronLeft size={18} />
                    </button>
                </div>

                {/* Scrollable rail */}
                <div
                    className="cw-rail"
                    ref={railRef}
                    onScroll={syncArrows}
                    onMouseEnter={syncArrows}
                    onTouchStart={syncArrows}
                >
                    {continueWatching.map(entry => (
                        <div key={entry.videoId} className="cw-card">
                            {/* Thumbnail */}
                            <div className="cw-thumb-wrap">
                                <img
                                    src={entry.thumbnail}
                                    alt={entry.title}
                                    className="cw-thumb"
                                    onError={e => { e.target.src = `https://i.ytimg.com/vi/${entry.videoId}/mqdefault.jpg`; }}
                                />
                                {/* Hover play overlay */}
                                <div className="cw-overlay">
                                    <button
                                        className="cw-play-btn"
                                        onClick={() => navigate(`/player/${entry.videoId}`, {
                                            state: { resumeAt: entry.currentTime, title: entry.title, channel: entry.channel },
                                        })}
                                        aria-label={`Resume ${entry.title}`}
                                    >
                                        <Play size={22} />
                                    </button>
                                </div>

                                {/* Timestamp badge */}
                                <span className="cw-time-badge">
                                    {fmtTime(entry.currentTime)} / {fmtTime(entry.duration)}
                                </span>

                                {/* Dismiss × button */}
                                <button
                                    className="cw-dismiss"
                                    onClick={e => { e.stopPropagation(); removeEntry(entry.videoId); }}
                                    aria-label="Remove from continue watching"
                                >
                                    <X size={11} />
                                </button>
                            </div>

                            {/* Progress bar */}
                            <div className="cw-progress-bar">
                                <div className="cw-progress-fill" style={{ width: `${entry.percentage}%` }} />
                            </div>

                            {/* Info */}
                            <div className="cw-info">
                                <p className="cw-video-title" title={entry.title}>{entry.title}</p>
                                <div className="cw-meta">
                                    <span className="cw-channel">{entry.channel}</span>
                                    <span className="cw-dot">·</span>
                                    <Clock size={11} />
                                    <span>{relativeTime(entry.lastWatched)}</span>
                                </div>
                                <div className="cw-pct">{Math.round(entry.percentage)}% watched</div>
                            </div>

                            {/* Resume CTA */}
                            <button
                                className="cw-resume-btn btn btn-primary btn-sm"
                                onClick={() => navigate(`/player/${entry.videoId}`, {
                                    state: { resumeAt: entry.currentTime, title: entry.title, channel: entry.channel },
                                })}
                            >
                                <Play size={12} /> Resume at {fmtTime(entry.currentTime)}
                            </button>
                        </div>
                    ))}

                    {/* End spacer so last card clears the right fade */}
                    <div className="cw-rail-end" aria-hidden="true" />
                </div>

                {/* Right fade + arrow */}
                <div className={`cw-fade cw-fade-right ${canScrollRight ? 'visible' : ''}`}>
                    <button className="cw-arrow-btn" onClick={() => scroll(1)} aria-label="Scroll right">
                        <ChevronRight size={18} />
                    </button>
                </div>
            </div>

            {/* Scroll hint — only when there are enough cards to overflow */}
            {continueWatching.length > 3 && (
                <p className="cw-scroll-hint">← → Swipe or use arrows to browse all {continueWatching.length} videos</p>
            )}
        </div>
    );
}


export default function Library() {
    const navigate = useNavigate();
    const { playlists } = useApp();
    const [category, setCategory] = useState('All');
    const [search, setSearch] = useState('');
    const [view, setView] = useState('videos');

    const filtered = ALL_VIDEOS.filter(v => {
        const matchCat = category === 'All' || v.subject === category;
        const matchSearch = v.title.toLowerCase().includes(search.toLowerCase()) || v.channel.toLowerCase().includes(search.toLowerCase());
        return matchCat && matchSearch;
    });

    return (
        <div className="library-page">
            {/* ★ Continue Watching — shown at top when history exists */}
            <ContinueWatchingRail navigate={navigate} />

            {/* Top Bar */}
            <div className="library-topbar">
                <div className="view-toggle">
                    <button className={`btn ${view === 'videos' ? 'btn-primary' : 'btn-secondary'} btn-sm`} onClick={() => setView('videos')}>
                        <Play size={14} /> Videos
                    </button>
                    <button className={`btn ${view === 'playlists' ? 'btn-primary' : 'btn-secondary'} btn-sm`} onClick={() => setView('playlists')}>
                        <BookOpen size={14} /> Playlists
                    </button>
                </div>
                <div className="library-search-wrap">
                    <Search size={15} />
                    <input placeholder="Search videos, channels..." value={search} onChange={e => setSearch(e.target.value)} />
                </div>
            </div>

            {/* Categories */}
            <div className="category-chips">
                {CATEGORIES.map(cat => (
                    <button
                        key={cat}
                        className={`category-chip ${category === cat ? 'active' : ''}`}
                        onClick={() => setCategory(cat)}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {view === 'videos' ? (
                <>
                    <div className="library-count">{filtered.length} videos</div>
                    <div className="library-grid">
                        {filtered.map(video => (
                            <div key={video.id} className="lib-video-card" onClick={() => navigate(`/player/${video.id}`)}>
                                <div className="lib-thumb-wrap">
                                    <img src={video.thumb} alt={video.title} />
                                    <div className="lib-overlay"><div className="lib-play-btn"><Play size={20} /></div></div>
                                    <span className="lib-duration">{video.duration}</span>
                                    <span className={`lib-diff badge badge-${DIFF_COLOR[video.difficulty]}`}>{video.difficulty}</span>
                                </div>
                                <div className="lib-info">
                                    <h4>{video.title}</h4>
                                    <p>{video.channel}</p>
                                    <div className="lib-meta">
                                        <span className={`badge badge-violet`}>{video.subject}</span>
                                        <span className="lib-views">👁 {video.views}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            ) : (
                <div className="playlists-grid">
                    {playlists.map(pl => {
                        const pct = (pl.completedVideos / pl.totalVideos) * 100;
                        return (
                            <div key={pl.id} className="playlist-card">
                                <div className="pl-thumb">
                                    <img src={pl.thumbnail} alt={pl.title} />
                                    <div className="pl-badge">{pl.totalVideos} videos</div>
                                </div>
                                <div className="pl-info">
                                    <div className="pl-subject-row">
                                        <span className="badge badge-violet">{pl.subject}</span>
                                        <span className={`badge badge-${DIFF_COLOR[pl.difficulty]}`}>{pl.difficulty}</span>
                                    </div>
                                    <h4>{pl.title}</h4>
                                    <p>by {pl.instructor} • {pl.totalHours}h total</p>
                                    <div className="pl-progress-row">
                                        <div className="progress-track" style={{ flex: 1 }}>
                                            <div className="progress-fill" style={{ width: `${pct}%` }} />
                                        </div>
                                        <span>{Math.round(pct)}%</span>
                                    </div>
                                    <button className="btn btn-primary" style={{ width: '100%', marginTop: 10 }}
                                        onClick={() => navigate(`/player/${pl.videos[0].id}`)}>
                                        {pct > 0 ? 'Continue' : 'Start'} <ChevronRight size={14} />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
