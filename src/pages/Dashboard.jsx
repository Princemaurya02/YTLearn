import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Play, Clock, Flame, Target, Zap, TrendingUp, BookOpen,
    Users, Trophy, ArrowRight, ChevronRight, Plus,
    Bookmark, BookmarkX, Swords, CheckCircle
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useStudyRooms } from '../hooks/useStudyRooms';
import { useWatchHistory } from '../hooks/useWatchHistory';
import './Dashboard.css';

// ── Boss Battle weekly challenge definitions ─────────────────────────────────
const BOSS_DEFINITIONS = [
    {
        id: 'algorithm_week',
        name: 'Algorithm Week',
        emoji: '⚔️',
        desc: 'Master sorting & searching algorithms',
        task: 'Watch 5 DSA sessions this week',
        subject: 'DSA',
        targetSessions: 5,
        xp: 500,
        timeLeft: '3 days',
        color: 'amber',
    },
    {
        id: 'react_mastery',
        name: 'React Mastery',
        emoji: '⚡',
        desc: 'Level up your React fundamentals',
        task: 'Watch 3 React sessions + complete quiz',
        subject: 'React',
        targetSessions: 3,
        xp: 300,
        timeLeft: '5 days',
        color: 'cyan',
    },
    {
        id: 'python_grind',
        name: 'Python Grind',
        emoji: '🐍',
        desc: 'Build strong Python foundations',
        task: 'Watch 4 Python sessions this week',
        subject: 'Python',
        targetSessions: 4,
        xp: 400,
        timeLeft: '4 days',
        color: 'green',
    },
];

// ── Time formatting helpers ──────────────────────────────────────────────────
function formatBarTime(hours) {
    const totalMins = Math.round(hours * 60);
    if (totalMins === 0) return '—';
    if (totalMins < 60) return `${totalMins}m`;
    const h = Math.floor(totalMins / 60);
    const m = totalMins % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function formatTotalWeekTime(hours) {
    const totalMins = Math.round(hours * 60);
    if (totalMins === 0) return '0m';
    const h = Math.floor(totalMins / 60);
    const m = totalMins % 60;
    if (h === 0) return `${m}m`;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function formatTimestamp(secs) {
    const m = Math.floor(secs / 60);
    const s = Math.round(secs) % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
}

// ── Component ────────────────────────────────────────────────────────────────
export default function Dashboard() {
    const {
        user, analytics, liveStats, computedAchievements,
        sessionHistory, bookmarks, removeBookmark, addXP,
    } = useApp();

    const { continueWatching } = useWatchHistory();
    const { rooms, joinRoom } = useStudyRooms(user.name);
    const navigate = useNavigate();

    const [urlInput, setUrlInput] = useState('');
    const [enrolledChallenges, setEnrolledChallenges] = useState(() => {
        try { return JSON.parse(localStorage.getItem('ytlearn_challenges') || '[]'); }
        catch { return []; }
    });

    // ── Derived data ─────────────────────────────────────────────────────────
    const weeklyHours = analytics?.weeklyHours ?? [0, 0, 0, 0, 0, 0, 0];
    const weeklyMax = Math.max(0.01, ...weeklyHours);
    const totalWeeklyHours = weeklyHours.reduce((a, b) => a + b, 0);

    const streak = liveStats?.streak ?? 0;
    const totalHours = liveStats?.totalHours ?? 0;
    const focusScore = liveStats?.focusScore ?? 0;

    // Real live rooms from useStudyRooms hook
    const liveRooms = rooms.filter(r => r.members?.length > 0).slice(0, 3);

    // Boss battle progress — count sessions per subject this week
    const getBossProgress = (boss) => {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        const done = sessionHistory.filter(
            s => s.subject === boss.subject && new Date(s.timestamp) >= weekAgo
        ).length;
        return {
            done,
            total: boss.targetSessions,
            pct: Math.min(100, Math.round((done / boss.targetSessions) * 100)),
        };
    };

    // Achievements preview: 2 unlocked + 4 nearest-to-complete in-progress
    const achievementPreview = useMemo(() => {
        if (!computedAchievements?.length) return [];
        const unlocked = computedAchievements.filter(a => a.unlocked).slice(0, 2);
        const inProgress = computedAchievements
            .filter(a => !a.unlocked && a.progress > 0)
            .sort((a, b) => (b.progress / b.total) - (a.progress / a.total))
            .slice(0, 4);
        return [...unlocked, ...inProgress].slice(0, 6);
    }, [computedAchievements]);

    // Most recent in-progress video for Continue Learning
    const lastWatched = continueWatching[0] ?? null;

    // ── Handlers ─────────────────────────────────────────────────────────────
    function handleWatch(id) { navigate(`/player/${id}`); }

    function handleUrlSubmit(e) {
        e.preventDefault();
        const url = urlInput.trim();
        const patterns = [
            /youtu\.be\/([a-zA-Z0-9_-]{11})/,
            /[?&]v=([a-zA-Z0-9_-]{11})/,
            /embed\/([a-zA-Z0-9_-]{11})/,
            /shorts\/([a-zA-Z0-9_-]{11})/,
            /live\/([a-zA-Z0-9_-]{11})/,
        ];
        let videoId = null;
        for (const p of patterns) { const m = url.match(p); if (m) { videoId = m[1]; break; } }
        if (!videoId && /^[a-zA-Z0-9_-]{11}$/.test(url)) videoId = url;
        if (videoId) { setUrlInput(''); navigate(`/player/${videoId}`); }
    }

    function enrollChallenge(id) {
        setEnrolledChallenges(prev => {
            const next = [...new Set([...prev, id])];
            localStorage.setItem('ytlearn_challenges', JSON.stringify(next));
            return next;
        });
        addXP(10, 'Challenge started!');
    }

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <div className="dashboard">

            {/* ───────────────── HERO ───────────────── */}
            <div className="dashboard-hero">
                <div className="hero-content">
                    <div className="hero-greeting">
                        <span className="hero-emoji">👋</span>
                        <div>
                            <h2 className="hero-name">Hey, {user.name}!</h2>
                            <p className="hero-sub">
                                Ready to level up today?
                                {streak > 0 && <> You're on a <strong>{streak}-day streak</strong> 🔥</>}
                            </p>
                        </div>
                    </div>
                    <form className="hero-url-form" onSubmit={handleUrlSubmit}>
                        <Play size={16} className="url-icon" />
                        <input
                            className="url-input"
                            placeholder="Paste YouTube URL and start learning instantly..."
                            value={urlInput}
                            onChange={e => setUrlInput(e.target.value)}
                        />
                        <button type="submit" className="btn btn-primary">
                            <Zap size={14} /> Watch Now
                        </button>
                    </form>
                </div>

                <div className="hero-stats">
                    <div className="hero-stat">
                        <div className="hero-stat-icon" style={{ background: 'rgba(124,110,255,0.15)', color: 'var(--violet)' }}>
                            <Flame size={20} />
                        </div>
                        <div>
                            <div className="hero-stat-value">{streak} Days</div>
                            <div className="hero-stat-label">Streak</div>
                        </div>
                    </div>
                    <div className="hero-stat">
                        <div className="hero-stat-icon" style={{ background: 'rgba(0,212,255,0.1)', color: 'var(--cyan)' }}>
                            <Clock size={20} />
                        </div>
                        <div>
                            <div className="hero-stat-value">{totalHours}h</div>
                            <div className="hero-stat-label">Total Study</div>
                        </div>
                    </div>
                    <div className="hero-stat">
                        <div className="hero-stat-icon" style={{ background: 'rgba(0,255,136,0.1)', color: 'var(--green)' }}>
                            <Target size={20} />
                        </div>
                        <div>
                            <div className="hero-stat-value">{focusScore > 0 ? `${focusScore}%` : '—'}</div>
                            <div className="hero-stat-label">Focus Score</div>
                        </div>
                    </div>
                    <div className="hero-stat">
                        <div className="hero-stat-icon" style={{ background: 'rgba(255,179,71,0.1)', color: 'var(--amber)' }}>
                            <Zap size={20} />
                        </div>
                        <div>
                            <div className="hero-stat-value">{user.xp.toLocaleString()}</div>
                            <div className="hero-stat-label">Total XP</div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="dashboard-grid">

                {/* ─── #4 CONTINUE LEARNING — real watch-history data ─── */}
                {lastWatched && (
                    <div className="dash-section full-width">
                        <div className="section-header">
                            <h3><BookOpen size={18} /> Continue Learning</h3>
                        </div>
                        <div
                            className="continue-card"
                            onClick={() =>
                                navigate(`/player/${lastWatched.videoId}`, {
                                    state: { resumeAt: lastWatched.currentTime },
                                })
                            }
                        >
                            <div className="continue-thumb">
                                <img src={lastWatched.thumbnail} alt={lastWatched.title} />
                                <div className="continue-play-btn"><Play size={24} /></div>
                                <span className="continue-resume-badge">
                                    {formatTimestamp(lastWatched.currentTime)}
                                </span>
                            </div>
                            <div className="continue-info">
                                {lastWatched.channel && <span className="badge badge-cyan">{lastWatched.channel}</span>}
                                <h4>{lastWatched.title}</h4>
                                <div className="continue-progress">
                                    <div className="progress-track">
                                        <div className="progress-fill" style={{ width: `${lastWatched.percentage}%` }} />
                                    </div>
                                    <span>{Math.round(lastWatched.percentage)}% watched</span>
                                </div>
                            </div>
                            <button className="btn btn-primary continue-btn">
                                Resume <ArrowRight size={14} />
                            </button>
                        </div>
                    </div>
                )}

                {/* ─── #1 MY BOOKMARKS — replaces "Featured for You" ─── */}
                <div className="dash-section full-width">
                    <div className="section-header">
                        <h3><Bookmark size={18} /> My Bookmarks</h3>
                        <span className="badge badge-violet">{bookmarks.length} saved</span>
                    </div>

                    {bookmarks.length === 0 ? (
                        <div className="empty-state">
                            <Bookmark size={40} />
                            <p>No bookmarks yet</p>
                            <small>Click the Bookmark button while watching any video to save it here.</small>
                        </div>
                    ) : (
                        <div className="bookmark-grid">
                            {bookmarks.slice(0, 6).map(bm => (
                                <div key={bm.id} className="bookmark-card">
                                    <div className="bookmark-thumb" onClick={() => handleWatch(bm.videoId)}>
                                        <img src={bm.thumbnail} alt={bm.title} />
                                        <div className="bookmark-overlay"><Play size={20} /></div>
                                        {bm.duration && <span className="bookmark-duration">{bm.duration}</span>}
                                    </div>
                                    <div className="bookmark-info">
                                        <h4
                                            className="bookmark-title"
                                            onClick={() => handleWatch(bm.videoId)}
                                            title={bm.title}
                                        >
                                            {bm.title}
                                        </h4>
                                        <p className="bookmark-channel">{bm.channel}</p>
                                        <div className="bookmark-actions">
                                            <button
                                                className="btn btn-primary btn-sm"
                                                onClick={() => handleWatch(bm.videoId)}
                                            >
                                                <Play size={12} /> Watch
                                            </button>
                                            <button
                                                className="btn btn-ghost btn-sm bookmark-remove"
                                                onClick={() => removeBookmark(bm.videoId)}
                                                title="Remove bookmark"
                                            >
                                                <BookmarkX size={14} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* ─── #5 BOSS BATTLES — real challenge progress ─── */}
                <div className="dash-section">
                    <div className="section-header">
                        <h3><Swords size={18} /> Boss Battles</h3>
                        <span className="badge badge-amber">Weekly</span>
                    </div>
                    <div className="boss-list">
                        {BOSS_DEFINITIONS.map(boss => {
                            const { done, total, pct } = getBossProgress(boss);
                            const enrolled = enrolledChallenges.includes(boss.id);
                            const completed = pct >= 100;
                            return (
                                <div
                                    key={boss.id}
                                    className={`boss-card ${completed ? 'completed' : ''} ${enrolled && !completed ? 'enrolled' : ''}`}
                                >
                                    <div className="boss-emoji">{boss.emoji}</div>
                                    <div className="boss-info">
                                        <div className="boss-name">{boss.name}</div>
                                        <div className="boss-desc">{boss.task}</div>
                                        <div className="boss-meta">
                                            <span className="badge badge-amber">+{boss.xp} XP</span>
                                            <span className="boss-time">⏰ {boss.timeLeft}</span>
                                            {completed && <span className="badge badge-green">✅ Complete</span>}
                                        </div>
                                        <div className="boss-progress-row">
                                            <div className="progress-track">
                                                <div
                                                    className={`progress-fill ${boss.color}`}
                                                    style={{ width: `${pct}%` }}
                                                />
                                            </div>
                                            <span className="boss-progress-text">
                                                {done}/{total} sessions
                                            </span>
                                        </div>
                                    </div>
                                    <button
                                        className={`btn btn-sm ${completed ? 'btn-secondary' : enrolled ? 'btn-secondary' : 'btn-primary'}`}
                                        onClick={() => !completed && !enrolled && enrollChallenge(boss.id)}
                                        disabled={completed}
                                    >
                                        {completed ? '✅ Done' : enrolled ? '⚡ Active' : 'Start Challenge'}
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* ─── #6 LIVE STUDY ROOMS — real data from useStudyRooms ─── */}
                <div className="dash-section">
                    <div className="section-header">
                        <h3><Users size={18} /> Live Study Rooms</h3>
                        <button className="btn btn-ghost btn-sm" onClick={() => navigate('/rooms')}>
                            All Rooms <ChevronRight size={14} />
                        </button>
                    </div>

                    {liveRooms.length === 0 ? (
                        <div className="empty-state small">
                            <Users size={32} />
                            <p>No live study rooms available.</p>
                            <button className="btn btn-primary btn-sm" onClick={() => navigate('/rooms')}>
                                <Plus size={14} /> Create Study Room
                            </button>
                        </div>
                    ) : (
                        <div className="rooms-list">
                            {liveRooms.map(room => (
                                <div key={room.id} className="room-item">
                                    <div className="room-info">
                                        <div className="room-name">{room.name}</div>
                                        <div className="room-meta">
                                            <span className="badge badge-violet">{room.subject}</span>
                                            <span className="room-members">
                                                👥 {room.members?.length}/{room.maxMembers}
                                            </span>
                                        </div>
                                    </div>
                                    <span className="live-badge">LIVE</span>
                                    <button
                                        className="btn btn-secondary btn-sm"
                                        onClick={() => navigate('/rooms')}
                                    >
                                        Join
                                    </button>
                                </div>
                            ))}
                            <button
                                className="btn btn-ghost btn-sm rooms-create-btn"
                                onClick={() => navigate('/rooms')}
                            >
                                <Plus size={14} /> Create Study Room
                            </button>
                        </div>
                    )}
                </div>

                {/* ─── #7 WEEKLY STUDY GRAPH — improved time formatting ─── */}
                <div className="dash-section">
                    <div className="section-header">
                        <h3><TrendingUp size={18} /> This Week</h3>
                    </div>
                    <div className="weekly-bars">
                        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => {
                            const h = weeklyHours[i] ?? 0;
                            const pct = (h / weeklyMax) * 100;
                            const label = formatBarTime(h);
                            const isToday = new Date().getDay() === (i + 1) % 7;
                            return (
                                <div key={day} className={`weekly-bar-item ${isToday ? 'today' : ''}`}>
                                    <div className="weekly-bar-value-top">
                                        {label !== '—' ? label : ''}
                                    </div>
                                    <div className="weekly-bar-track">
                                        <div
                                            className={`weekly-bar-fill ${isToday ? 'today' : ''}`}
                                            style={{ height: `${Math.max(pct, h > 0 ? 4 : 0)}%` }}
                                            title={label}
                                        />
                                    </div>
                                    <div className="weekly-bar-label">{day}</div>
                                </div>
                            );
                        })}
                    </div>
                    <div className="weekly-total">
                        Total Study Time This Week:{' '}
                        <strong>{formatTotalWeekTime(totalWeeklyHours)}</strong>
                    </div>
                </div>

                {/* ─── #8 ACHIEVEMENTS PREVIEW — title + progress bars ─── */}
                <div className="dash-section">
                    <div className="section-header">
                        <h3><Trophy size={18} /> Achievements</h3>
                        <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => navigate('/achievements')}
                        >
                            View All <ChevronRight size={14} />
                        </button>
                    </div>

                    {achievementPreview.length === 0 ? (
                        <div className="empty-state small">
                            <Trophy size={32} />
                            <p>Start studying to earn achievements!</p>
                        </div>
                    ) : (
                        <div className="achievement-preview-list">
                            {achievementPreview.map(a => {
                                const pct = a.total > 1
                                    ? Math.round((a.progress / a.total) * 100)
                                    : a.unlocked ? 100 : 0;
                                return (
                                    <div
                                        key={a.id}
                                        className={`achievement-preview-item ${a.unlocked ? 'unlocked' : ''}`}
                                    >
                                        <div className="ach-emoji">
                                            {a.unlocked ? a.emoji : '🔒'}
                                        </div>
                                        <div className="ach-info">
                                            <div className="ach-name">{a.name}</div>
                                            <div className="ach-desc">{a.desc}</div>
                                            {a.unlocked ? (
                                                <div className="ach-unlocked-tag">
                                                    <CheckCircle size={11} /> Unlocked
                                                </div>
                                            ) : a.total > 1 ? (
                                                <div className="ach-progress-row">
                                                    <div className="progress-track slim">
                                                        <div
                                                            className="progress-fill"
                                                            style={{ width: `${pct}%` }}
                                                        />
                                                    </div>
                                                    <span className="ach-progress-label">
                                                        {a.progress}/{a.total}
                                                    </span>
                                                </div>
                                            ) : null}
                                        </div>
                                        <div className="ach-pct">
                                            {pct}%
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}