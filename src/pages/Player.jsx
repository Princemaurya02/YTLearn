import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
    BookmarkPlus, Target, Clock, FileText,
    StickyNote, ChevronRight, PenLine, Zap,
    Maximize2, Minimize2
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useWatchHistory } from '../hooks/useWatchHistory';
import { usePiP } from '../context/PiPContext';
import './Player.css';

// ─── Module-level YouTube IFrame API loader ───────────────────────────────────
let _ytApiPromise = null;
function loadYouTubeAPI() {
    if (_ytApiPromise) return _ytApiPromise;
    _ytApiPromise = new Promise((resolve) => {
        if (window.YT?.Player) { resolve(window.YT); return; }
        const prev = window.onYouTubeIframeAPIReady;
        window.onYouTubeIframeAPIReady = () => {
            if (typeof prev === 'function') prev();
            resolve(window.YT);
        };
        if (!document.getElementById('yt-iframe-api-script')) {
            const tag = document.createElement('script');
            tag.id = 'yt-iframe-api-script';
            tag.src = 'https://www.youtube.com/iframe_api';
            document.head.appendChild(tag);
        }
    });
    return _ytApiPromise;
}

// ─── Known video metadata ─────────────────────────────────────────────────────
const VIDEO_META = {
    'PkZNo7MFNFg': { title: 'JavaScript Full Course — ES6+',          channel: 'freeCodeCamp' },
    'SqcY0GlETPk': { title: 'React — Complete Guide 2024',            channel: 'Academind' },
    '8hly31xKli0': { title: 'DSA — Zero to Hero',                     channel: 'freeCodeCamp' },
    '_uQrJ0TkZlc': { title: 'Python for Beginners — Full Course',     channel: 'Programming with Mosh' },
    'fBNz5xF-Kx4': { title: 'Node.js Crash Course',                   channel: 'Traversy Media' },
    'rg7Fvvl3taU': { title: 'CSS Grid — Complete Tutorial',           channel: 'Kevin Powell' },
    'yfoY53QXEnI': { title: 'CSS Crash Course',                       channel: 'Traversy Media' },
    'w7ejDZ8SWv8': { title: 'React Hooks Tutorial',                   channel: 'Codevolution' },
    'RBSGKlAvoiM': { title: 'Dynamic Programming — Masterclass',      channel: 'freeCodeCamp' },
    'qz0aGYrrlhU': { title: 'HTML Full Course',                       channel: 'Traversy Media' },
    'dhYoOOa2i2M': { title: 'Git & GitHub Crash Course',              channel: 'freeCodeCamp' },
    'ZjAqacIC_3c': { title: 'TypeScript Full Course',                 channel: 'Traversy Media' },
};

function formatTime(s) {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
}

// ─── Notes Panel (slide-in drawer) ───────────────────────────────────────────
function NotesDrawer({ open, onClose, sessionTime, videoId, addNote, addXP }) {
    const [noteText, setNoteText]   = useState('');
    const [saved,    setSaved]      = useState([]);
    const [justSaved, setJustSaved] = useState(false);
    const textRef = useRef(null);

    // Load notes saved for this video from localStorage
    useEffect(() => {
        try {
            const all = JSON.parse(localStorage.getItem('ytlearn_notes') || '[]');
            setSaved(all.filter(n => n.videoId === videoId));
        } catch {}
    }, [videoId]);

    // Focus textarea when drawer opens
    useEffect(() => {
        if (open) setTimeout(() => textRef.current?.focus(), 200);
    }, [open]);

    function handleSave() {
        if (!noteText.trim()) return;
        const note = {
            id: `note_${Date.now()}`,
            videoId,
            text: noteText.trim(),
            timestamp: sessionTime,
            videoTitle: VIDEO_META[videoId]?.title || 'Video',
            createdAt: new Date().toISOString(),
        };
        addNote(note);
        setSaved(prev => [note, ...prev]);
        setNoteText('');
        addXP(15, 'Note saved');
        setJustSaved(true);
        setTimeout(() => setJustSaved(false), 1800);
    }

    function handleKeyDown(e) {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') handleSave();
    }

    return (
        <div className={`notes-drawer ${open ? 'open' : ''}`}>
            {/* Drawer header */}
            <div className="nd-header">
                <div className="nd-header-left">
                    <StickyNote size={16} style={{ color: 'var(--violet)' }} />
                    <span>Notes</span>
                    {saved.length > 0 && (
                        <span className="nd-count">{saved.length}</span>
                    )}
                </div>
                <button className="nd-close" onClick={onClose} title="Hide notes (video expands)">
                    <ChevronRight size={18} />
                </button>
            </div>

            {/* Timestamp + input */}
            <div className="nd-input-section">
                <div className="nd-timestamp">
                    <Clock size={12} />
                    <span>At {formatTime(sessionTime)}</span>
                    <span className="nd-hint">Ctrl+Enter to save</span>
                </div>
                <textarea
                    ref={textRef}
                    className="nd-textarea"
                    placeholder="Write your note here... it'll be saved with the video timestamp 📌"
                    value={noteText}
                    onChange={e => setNoteText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    rows={4}
                />
                <button
                    className={`nd-save-btn ${justSaved ? 'saved' : ''}`}
                    onClick={handleSave}
                    disabled={!noteText.trim()}
                >
                    {justSaved
                        ? <><Zap size={14} /> Saved! +15 XP</>
                        : <><FileText size={14} /> Save Note</>
                    }
                </button>
            </div>

            {/* Saved notes list */}
            <div className="nd-list">
                {saved.length === 0 ? (
                    <div className="nd-empty">
                        <PenLine size={28} />
                        <p>No notes yet for this video.<br />Start writing above!</p>
                    </div>
                ) : saved.map(note => (
                    <div key={note.id || note.timestamp} className="nd-item">
                        <div className="nd-item-ts">
                            ⏱ {formatTime(note.timestamp)}
                        </div>
                        <p className="nd-item-text">{note.text}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─── Main Player ──────────────────────────────────────────────────────────────
export default function Player() {
    const { videoId }  = useParams();
    const location     = useLocation();
    const { addNote, addBookmark, startSession, endSession, addXP } = useApp();
    const { saveProgress } = useWatchHistory();

    const resumeAt = location.state?.resumeAt || 0;

    const [notesOpen,    setNotesOpen]    = useState(false);
    const [isPlaying,    setIsPlaying]    = useState(false);
    const [focusMode,    setFocusMode]    = useState(false);
    const [sessionTime,  setSessionTime]  = useState(0);
    const [bookmarkSaved,setBookmarkSaved]= useState(false);

    const playerContainerRef  = useRef(null);
    const videoContainerRef   = useRef(null); // for fullscreen
    const ytPlayerRef         = useRef(null);
    const timerRef            = useRef(null);
    const progressIntervalRef = useRef(null);
    const sessionTimeRef      = useRef(0);
    const saveProgressRef     = useRef(saveProgress);
    useEffect(() => { saveProgressRef.current = saveProgress; }, [saveProgress]);

    const { pip, startPiP, stopPiP } = usePiP();
    const [isFullscreen, setIsFullscreen] = useState(false);

    // ── Session timer ──────────────────────────────────────────────────────
    useEffect(() => {
        const meta = VIDEO_META[videoId] || {};
        startSession({ id: videoId, title: meta.title || 'Video' }, null);
        sessionTimeRef.current = 0;
        timerRef.current = setInterval(() => {
            setSessionTime(t => {
                sessionTimeRef.current = t + 1;
                return t + 1;
            });
        }, 1000);

        return () => {
            clearInterval(timerRef.current);
            endSession(sessionTimeRef.current);

            // ── Trigger PiP if video was playing when leaving ──
            const meta2 = VIDEO_META[videoId] || {};
            try {
                const state = ytPlayerRef.current?.getPlayerState?.();
                const ct    = ytPlayerRef.current?.getCurrentTime?.() || 0;
                if (state === 1 /* PLAYING */) {
                    startPiP({
                        videoId,
                        title:     meta2.title   || `Video – ${videoId}`,
                        channel:   meta2.channel || '',
                        startTime: Math.floor(ct),
                    });
                }
            } catch {}
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [videoId]);

    // ── Fullscreen + orientation lock ─────────────────────────────────────
    const handleFullscreen = useCallback(async () => {
        const container = videoContainerRef.current;
        if (!container) return;
        try {
            if (!document.fullscreenElement) {
                await container.requestFullscreen();
                // Lock landscape on mobile
                try { await screen.orientation?.lock?.('landscape'); } catch {}
            } else {
                await document.exitFullscreen();
            }
        } catch (e) { console.warn('Fullscreen:', e); }
    }, []);

    useEffect(() => {
        const onChange = () => {
            const fs = !!document.fullscreenElement;
            setIsFullscreen(fs);
            if (!fs) { try { screen.orientation?.unlock?.(); } catch {} }
        };
        document.addEventListener('fullscreenchange', onChange);
        document.addEventListener('webkitfullscreenchange', onChange);
        return () => {
            document.removeEventListener('fullscreenchange', onChange);
            document.removeEventListener('webkitfullscreenchange', onChange);
        };
    }, []);

    // ── YouTube IFrame API ─────────────────────────────────────────────────
    useEffect(() => {
        const meta   = VIDEO_META[videoId] || {};
        const origin = window.location.origin || 'http://localhost:5173';
        let mounted  = true;

        function flushProgress(player) {
            try {
                const ct  = player.getCurrentTime?.();
                const dur = player.getDuration?.();
                if (typeof ct === 'number' && typeof dur === 'number' && dur > 0) {
                    saveProgressRef.current({
                        videoId,
                        title:       meta.title   || `Video – ${videoId}`,
                        channel:     meta.channel || '',
                        thumbnail:   `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`,
                        currentTime: ct,
                        duration:    dur,
                    });
                }
            } catch {}
        }

        function initYTPlayer() {
            if (!mounted || !playerContainerRef.current) return;
            const player = new window.YT.Player(playerContainerRef.current, {
                videoId,
                width:  '100%',
                height: '100%',
                playerVars: {
                    autoplay: 0, rel: 0, modestbranding: 1,
                    iv_load_policy: 3, fs: 1, cc_load_policy: 0,
                    enablejsapi: 1, origin, widget_referrer: origin, playsinline: 1,
                },
                events: {
                    onReady: (evt) => {
                        ytPlayerRef.current = evt.target;
                        if (resumeAt > 5) evt.target.seekTo(resumeAt, true);
                    },
                    onStateChange: (evt) => {
                        const YTS = window.YT.PlayerState;
                        if (evt.data === YTS.PLAYING) {
                            setIsPlaying(true);
                            clearInterval(progressIntervalRef.current);
                            progressIntervalRef.current = setInterval(() => {
                                if (ytPlayerRef.current) flushProgress(ytPlayerRef.current);
                            }, 10_000);
                        } else {
                            setIsPlaying(false);
                            clearInterval(progressIntervalRef.current);
                            if (evt.data === YTS.PAUSED || evt.data === YTS.ENDED) {
                                if (ytPlayerRef.current) flushProgress(ytPlayerRef.current);
                            }
                        }
                    },
                },
            });
            ytPlayerRef.current = player;
        }

        loadYouTubeAPI().then(() => { if (mounted) initYTPlayer(); });

        return () => {
            mounted = false;
            clearInterval(progressIntervalRef.current);
            if (ytPlayerRef.current) {
                flushProgress(ytPlayerRef.current);
                try { ytPlayerRef.current.destroy(); } catch {}
                ytPlayerRef.current = null;
            }
        };
    }, [videoId]);

    // Stop PiP when entering the player page (we’re now watching in full)
    useEffect(() => { stopPiP(); }, [videoId]);

    function saveBookmark() {
        const meta = VIDEO_META[videoId] || {};
        addBookmark({
            videoId,
            title:     meta.title    || `Video – ${videoId}`,
            thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
            channel:   meta.channel  || '',
            duration:  '',
            timestamp: sessionTime,
        });
        setBookmarkSaved(true);
        setTimeout(() => setBookmarkSaved(false), 2000);
        addXP(5, 'Bookmark saved');
    }

    const meta = VIDEO_META[videoId] || {};

    return (
        <div className={`player-page ${focusMode ? 'focus-mode' : ''} ${notesOpen ? 'notes-open' : ''}`}>

            {/* ── Video area ── */}
            <div className="player-main">
                <div className="player-video-wrapper">
                    {/* Big video container */}
                    <div
                        ref={videoContainerRef}
                        className={`video-container ${focusMode ? 'theater' : ''}`}
                    >
                        <div
                            ref={playerContainerRef}
                            className="video-iframe"
                            id={`yt-player-${videoId}`}
                        />
                    </div>

                    {/* Controls bar */}
                    <div className="player-controls-bar">
                        <div className="player-meta">
                            <div className="session-timer">
                                <Clock size={13} />
                                <span>Session: {formatTime(sessionTime)}</span>
                            </div>
                            <div className="focus-score-live">
                                <div className="focus-dot-live" />
                                <span>Focus: {Math.max(70, 94 - Math.floor(Math.random() * 10))}%</span>
                            </div>
                        </div>

                        <div className="player-actions">
                            <button
                                className={`btn ${bookmarkSaved ? 'btn-cyan' : 'btn-secondary'} btn-sm`}
                                onClick={saveBookmark}
                                id="bookmark-btn"
                            >
                                <BookmarkPlus size={14} />
                                {bookmarkSaved ? 'Saved!' : 'Bookmark'}
                            </button>
                            <button
                                className={`btn ${focusMode ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                                onClick={() => setFocusMode(f => !f)}
                                id="focus-mode-btn"
                            >
                                <Target size={14} />
                                {focusMode ? 'Exit Focus' : 'Focus Mode'}
                            </button>

                            {/* Fullscreen button */}
                            <button
                                className={`btn btn-sm ${isFullscreen ? 'btn-cyan fs-btn-active' : 'btn-secondary'}`}
                                onClick={handleFullscreen}
                                id="fullscreen-btn"
                                title={isFullscreen ? 'Exit fullscreen (auto-exits landscape)' : 'Fullscreen + auto-rotate landscape'}
                            >
                                {isFullscreen
                                    ? <><Minimize2 size={14} /> Exit FS</>
                                    : <><Maximize2 size={14} /> Fullscreen</>
                                }
                            </button>

                            {/* Notes toggle button */}
                            <button
                                className={`btn btn-sm notes-toggle-btn ${notesOpen ? 'btn-primary' : 'btn-secondary'}`}
                                onClick={() => setNotesOpen(o => !o)}
                                id="notes-toggle-btn"
                                title={notesOpen ? 'Hide notes panel' : 'Open notes panel'}
                            >
                                {notesOpen
                                    ? <><ChevronRight size={14} /> Hide Notes</>
                                    : <><StickyNote  size={14} /> Notes</>
                                }
                            </button>
                        </div>
                    </div>
                </div>

                {/* Video meta card */}
                <div className="video-meta-card">
                    <h2 className="video-meta-title">
                        {meta.title || 'Currently Watching'}
                    </h2>
                    <p className="video-meta-sub">
                        {meta.channel ? `${meta.channel} · ` : ''}
                        Video ID: {videoId} · Zero ads · No recommendations
                    </p>
                    <div className="video-meta-tags">
                        <span className="badge badge-green">✅ Ad-Free</span>
                        <span className="badge badge-cyan">🎯 Distraction-Free</span>
                        <span className="badge badge-amber">📊 Analytics Tracking</span>
                    </div>
                </div>
            </div>

            {/* ── Notes Drawer (slides in from right) ── */}
            <NotesDrawer
                open={notesOpen}
                onClose={() => setNotesOpen(false)}
                sessionTime={sessionTime}
                videoId={videoId}
                addNote={addNote}
                addXP={addXP}
            />
        </div>
    );
}
