// @refresh reset
import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { persistSession, readSessions, SUBJECT_COLORS } from '../hooks/useAnalytics';

const AppContext = createContext(null);

const INITIAL_USER = {
    name: 'Prince',
    avatar: null,
    level: 3,
    levelName: 'Rising Scholar',
    xp: 1240,
    xpToNext: 2000,
    streak: 7,
    longestStreak: 14,
    totalHours: 48.5,
    focusScore: 87,
    badges: ['first_blood', 'speed_learner', 'night_owl'],
    joinedDate: '2024-01-15',
    completedPlaylists: ['web-dev-basics'],
};

const INITIAL_ACHIEVEMENTS = [
    { id: 'first_blood', name: 'First Blood', emoji: '🎯', desc: 'Complete your first session', unlocked: true },
    { id: 'speed_learner', name: 'Speed Learner', emoji: '⚡', desc: 'Watch 1 hour at 2x speed', unlocked: true },
    { id: 'night_owl', name: 'Night Owl', emoji: '🌙', desc: 'Study after midnight', unlocked: true },
    { id: 'encyclopedia', name: 'Encyclopedia', emoji: '📚', desc: 'Cover 50 different topics', unlocked: false, progress: 23, total: 50 },
    { id: 'streak_7', name: 'Week Warrior', emoji: '🔥', desc: 'Maintain a 7-day streak', unlocked: true },
    { id: 'streak_30', name: 'Monthly Master', emoji: '💎', desc: 'Maintain a 30-day streak', unlocked: false, progress: 7, total: 30 },
    { id: 'boss_slayer', name: 'Boss Slayer', emoji: '⚔️', desc: 'Complete a weekly boss battle', unlocked: false },
    { id: 'social_butterfly', name: 'Social Butterfly', emoji: '👥', desc: 'Join 5 study rooms', unlocked: false, progress: 1, total: 5 },
];

const CURATED_PLAYLISTS = [
    {
        id: 'web-dev-basics',
        title: 'Web Development for Beginners',
        subject: 'Web Dev',
        thumbnail: 'https://i.ytimg.com/vi/qz0aGYrrlhU/hqdefault.jpg',
        totalVideos: 12,
        completedVideos: 8,
        totalHours: 6.5,
        difficulty: 'Beginner',
        instructor: 'Traversy Media',
        videos: [
            { id: 'qz0aGYrrlhU', title: 'HTML Crash Course', duration: '1:10:09', watched: true },
            { id: 'yfoY53QXEnI', title: 'CSS Crash Course', duration: '1:25:21', watched: true },
            { id: 'PkZNo7MFNFg', title: 'JavaScript Crash Course', duration: '3:26:42', watched: false },
        ]
    },
    {
        id: 'react-complete',
        title: 'Complete React Course 2024',
        subject: 'React',
        thumbnail: 'https://i.ytimg.com/vi/SqcY0GlETPk/hqdefault.jpg',
        totalVideos: 20,
        completedVideos: 5,
        totalHours: 12,
        difficulty: 'Intermediate',
        instructor: 'Academind',
        videos: [
            { id: 'SqcY0GlETPk', title: 'React Introduction', duration: '2:30:00', watched: true },
            { id: 'w7ejDZ8SWv8', title: 'React Hooks Tutorial', duration: '1:48:10', watched: false },
        ]
    },
    {
        id: 'dsa-masterclass',
        title: 'DSA Masterclass — Zero to Hero',
        subject: 'DSA',
        thumbnail: 'https://i.ytimg.com/vi/8hly31xKli0/hqdefault.jpg',
        totalVideos: 35,
        completedVideos: 0,
        totalHours: 24,
        difficulty: 'Advanced',
        instructor: 'freeCodeCamp',
        videos: [
            { id: '8hly31xKli0', title: 'Data Structures Full Course', duration: '4:22:10', watched: false },
            { id: 'RBSGKlAvoiM', title: 'Dynamic Programming', duration: '5:01:12', watched: false },
        ]
    },
    {
        id: 'python-beginners',
        title: 'Python for Everybody',
        subject: 'Python',
        thumbnail: 'https://i.ytimg.com/vi/_uQrJ0TkZlc/hqdefault.jpg',
        totalVideos: 15,
        completedVideos: 12,
        totalHours: 8,
        difficulty: 'Beginner',
        instructor: 'Corey Schafer',
        videos: [
            { id: '_uQrJ0TkZlc', title: 'Python Tutorial for Beginners', duration: '6:14:07', watched: true },
        ]
    },
];

const STUDY_ROOMS = [
    { id: 'room-1', name: 'DSA Grind', members: 4, maxMembers: 8, subject: 'DSA', status: 'live', host: 'Arjun' },
    { id: 'room-2', name: 'React Masters', members: 2, maxMembers: 6, subject: 'React', status: 'live', host: 'Priya' },
    { id: 'room-3', name: 'Python & Chill', members: 6, maxMembers: 8, subject: 'Python', status: 'live', host: 'Rahul' },
    { id: 'room-4', name: 'Web Dev Sprint', members: 1, maxMembers: 4, subject: 'Web Dev', status: 'waiting', host: 'You' },
];

// Maps known video IDs → subject (used to tag sessions correctly)
const VIDEO_SUBJECTS = {
    'PkZNo7MFNFg': 'JavaScript',
    'SqcY0GlETPk': 'React',
    '8hly31xKli0': 'DSA',
    '_uQrJ0TkZlc': 'Python',
    'fBNz5xF-Kx4': 'Node.js',
    'rg7Fvvl3taU': 'CSS',
    'yfoY53QXEnI': 'CSS',
    'w7ejDZ8SWv8': 'React',
    'RBSGKlAvoiM': 'DSA',
    'qz0aGYrrlhU': 'Web Dev',
    'dhYoOOa2i2M': 'Web Dev',
    'ZjAqacIC_3c': 'TypeScript',
};

const ROADMAPS = [
    { id: 'frontend', title: 'Frontend Developer', emoji: '🎨', steps: 8, completed: 4, time: '3 months' },
    { id: 'backend', title: 'Backend Developer', emoji: '⚙️', steps: 10, completed: 0, time: '4 months' },
    { id: 'dsa', title: 'DSA & CP', emoji: '🧩', steps: 12, completed: 2, time: '6 months' },
    { id: 'ml', title: 'Machine Learning', emoji: '🤖', steps: 15, completed: 0, time: '8 months' },
];

export function AppProvider({ children }) {
    const [user, setUser] = useState(INITIAL_USER);
    const [achievements, setAchievements] = useState(INITIAL_ACHIEVEMENTS);
    const [playlists] = useState(CURATED_PLAYLISTS);
    const [studyRooms] = useState(STUDY_ROOMS);
    const [roadmaps] = useState(ROADMAPS);
    const [currentSession, setCurrentSession] = useState(null);

    // ── One-time migration: clear old demo/seed notes (IDs s1-s5) ────────────
    // Runs synchronously before state init so stale demo data is never shown.
    (() => {
        try {
            const raw = localStorage.getItem('ytlearn_notes');
            if (!raw) return;
            const parsed = JSON.parse(raw);
            const SEED_IDS = new Set(['s1', 's2', 's3', 's4', 's5']);
            const hasSeed = parsed.some(n => SEED_IDS.has(n.id));
            if (hasSeed) {
                const cleaned = parsed.filter(n => !SEED_IDS.has(n.id));
                localStorage.setItem('ytlearn_notes', JSON.stringify(cleaned));
            }
        } catch { /* ignore */ }
    })();

    // ── Notes: load from localStorage; start empty on first visit ────────────
    const [notes, setNotes] = useState(() => {
        try {
            const raw = localStorage.getItem('ytlearn_notes');
            if (raw) return JSON.parse(raw);
        } catch { /* ignore parse errors */ }
        // Fresh install — start with zero notes (no demo data)
        return [];
    });
    const [bookmarks, setBookmarks] = useState(() => {
        try {
            const raw = localStorage.getItem('ytlearn_bookmarks');
            return raw ? JSON.parse(raw) : [];
        } catch { return []; }
    });
    const [watchHistory, setWatchHistory] = useState([]);
    // Completed sessions — seeded from localStorage so they survive reload
    const [sessionHistory, setSessionHistory] = useState(() => readSessions());
    const [notifications, setNotifications] = useState([
        { id: 1, text: 'You have a 7-day streak! 🔥 Keep going!', time: '2m ago', unread: true },
        { id: 2, text: 'New study room: DSA Grind is live', time: '15m ago', unread: true },
        { id: 3, text: 'Weekly report ready — 14 hours studied', time: '1h ago', unread: false },
    ]);

    // Drop legacy random analytics state — all analytics now computed from sessionHistory
    const [xpGained, setXpGained] = useState(null);

    const addNote = useCallback((note) => {
        const newNote = {
            id: `note_${Date.now()}`,
            text: note.text || '',
            videoId: note.videoId || 'manual',
            videoTitle: note.videoTitle || 'Manual Note',
            timestamp: note.timestamp || 0,
            tags: note.tags || ['Personal'],
            createdAt: new Date().toLocaleDateString('en-CA'), // YYYY-MM-DD
        };
        setNotes(prev => {
            const next = [newNote, ...prev];
            try { localStorage.setItem('ytlearn_notes', JSON.stringify(next)); } catch { /* ignore */ }
            return next;
        });
    }, []);

    const deleteNote = useCallback((id) => {
        setNotes(prev => {
            const next = prev.filter(n => n.id !== id);
            try { localStorage.setItem('ytlearn_notes', JSON.stringify(next)); } catch { /* ignore */ }
            return next;
        });
    }, []);

    const addBookmark = useCallback(({ videoId, title, thumbnail, duration, channel, timestamp }) => {
        setBookmarks(prev => {
            if (prev.some(b => b.videoId === videoId)) return prev; // no duplicates
            const entry = {
                id: `bm_${Date.now()}`,
                videoId,
                title: title || `Video – ${videoId}`,
                thumbnail: thumbnail || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
                duration: duration || '',
                channel: channel || '',
                timestamp: timestamp || 0,
                createdAt: new Date().toISOString(),
            };
            const next = [entry, ...prev].slice(0, 50);
            try { localStorage.setItem('ytlearn_bookmarks', JSON.stringify(next)); } catch { /* ignore */ }
            return next;
        });
    }, []);

    const removeBookmark = useCallback((videoId) => {
        setBookmarks(prev => {
            const next = prev.filter(b => b.videoId !== videoId);
            try { localStorage.setItem('ytlearn_bookmarks', JSON.stringify(next)); } catch { /* ignore */ }
            return next;
        });
    }, []);

    const addXP = useCallback((amount, reason = '') => {
        setUser(prev => {
            const newXp = prev.xp + amount;
            const levelUp = newXp >= prev.xpToNext;
            return {
                ...prev,
                xp: levelUp ? newXp - prev.xpToNext : newXp,
                xpToNext: levelUp ? prev.xpToNext * 1.5 : prev.xpToNext,
                level: levelUp ? prev.level + 1 : prev.level,
            };
        });
        setXpGained({ amount, reason });
        setTimeout(() => setXpGained(null), 3000);
    }, []);

    const startSession = useCallback((video, playlist) => {
        setCurrentSession({
            videoId: video.id,
            videoTitle: video.title,
            playlistId: playlist?.id,
            playlistTitle: playlist?.title,
            startTime: Date.now(),
            tabSwitches: 0,
            pauses: 0,
        });
    }, []);

    const endSession = useCallback((duration) => {
        if (currentSession) {
            const subject = VIDEO_SUBJECTS[currentSession.videoId] || 'General';
            const focusScore = Math.max(50, 100
                - (currentSession.tabSwitches || 0) * 5
                - (currentSession.pauses || 0) * 2);

            const sessionData = {
                id: `sess_${Date.now()}`,
                videoId: currentSession.videoId,
                videoTitle: currentSession.videoTitle || 'Unknown Video',
                subject,
                duration: Math.max(0, duration),
                focusScore,
                tabSwitches: currentSession.tabSwitches || 0,
                pauses: currentSession.pauses || 0,
                startTime: currentSession.startTime,
                endTime: Date.now(),
                timestamp: new Date().toISOString(),
            };

            // Persist to localStorage so analytics survive reload
            persistSession(sessionData);

            // Update in-memory history (seeded from localStorage, so no duplicates)
            setSessionHistory(prev => [sessionData, ...prev]);
            setWatchHistory(prev => [sessionData, ...prev]);

            // Award XP: 10 XP per minute studied
            const xpEarned = Math.max(5, Math.floor(duration / 60) * 10);
            addXP(xpEarned, 'Session completed');
            setCurrentSession(null);
        }
    }, [currentSession, addXP]);

    const markNotificationRead = useCallback((id) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, unread: false } : n));
    }, []);

    // ─── Single source of truth: all stats derived from real session data ───────
    const liveStats = useMemo(() => {
        const now = new Date();
        const sessions = sessionHistory;

        // ── Helper: start-of-day timestamp ──────────────────────────────────
        function dayKey(date) {
            return new Date(date).toISOString().split('T')[0];
        }
        function startOfDay(d) {
            const x = new Date(d); x.setHours(0, 0, 0, 0); return x;
        }
        function isSameDay(a, b) {
            return startOfDay(a).getTime() === startOfDay(b).getTime();
        }

        // ── Weekly hours array [Mon … Sun] (last 7 days) ─────────────────────
        const weeklyHours = Array.from({ length: 7 }, (_, idx) => {
            const d = new Date(now);
            d.setDate(now.getDate() - (6 - idx));
            d.setHours(0, 0, 0, 0);
            const next = new Date(d); next.setDate(d.getDate() + 1);
            const secs = sessions
                .filter(s => { const t = new Date(s.timestamp); return t >= d && t < next; })
                .reduce((a, s) => a + (s.duration || 0), 0);
            return Math.round((secs / 3600) * 10) / 10;
        });

        // ── Total study time (all-time hours) ────────────────────────────────
        const totalSeconds = sessions.reduce((a, s) => a + (s.duration || 0), 0);
        const totalHours = Math.round((totalSeconds / 3600) * 10) / 10;

        // ── This-week hours ──────────────────────────────────────────────────
        const thisWeekHours = weeklyHours.reduce((a, b) => a + b, 0);
        const thisWeekHoursRounded = Math.round(thisWeekHours * 10) / 10;

        // ── Average focus score ──────────────────────────────────────────────
        const focusScore = sessions.length
            ? Math.round(sessions.reduce((a, s) => a + (s.focusScore || 0), 0) / sessions.length)
            : 0;

        // ── Streak (consecutive days up to today) ────────────────────────────
        const studyDays = new Set(sessions.map(s => dayKey(new Date(s.timestamp))));
        let streak = 0;
        const checkDay = new Date(now);
        while (studyDays.has(dayKey(checkDay))) {
            streak++;
            checkDay.setDate(checkDay.getDate() - 1);
        }

        // ── Subject breakdown ────────────────────────────────────────────────
        const subjectMap = {};
        sessions.forEach(s => {
            const sub = s.subject || 'General';
            subjectMap[sub] = (subjectMap[sub] || 0) + (s.duration || 0);
        });
        const subjectBreakdown = Object.entries(subjectMap)
            .map(([subject, secs]) => ({
                subject,
                hours: Math.round((secs / 3600) * 10) / 10,
                color: SUBJECT_COLORS[subject] || '#9898b8',
            }))
            .sort((a, b) => b.hours - a.hours);

        // ── Radar chart data (6 skill dimensions) ────────────────────────────
        // Each dimension is derived from real numbers, capped at 100
        const consistencyScore = Math.min(100, streak * 14);
        const focusRadar = focusScore;
        const speedScore = sessions.length
            ? Math.min(100, Math.round(
                sessions.filter(s => (s.duration || 0) < 1800 && (s.duration || 0) > 300).length
                / Math.max(1, sessions.length) * 200))
            : 0;
        const retentionScore = Math.min(100, Math.round(
            (sessions.filter(s => (s.pauses || 0) <= 2).length / Math.max(1, sessions.length)) * 100));
        const breadthScore = Math.min(100, Math.round(
            (Object.keys(subjectMap).length / 8) * 100));
        const depthScore = subjectBreakdown.length > 0
            ? Math.min(100, Math.round(
                (subjectBreakdown[0].hours / Math.max(1, totalHours)) * 150))
            : 0;

        const radarData = [
            { subject: 'Consistency', A: consistencyScore },
            { subject: 'Focus', A: focusRadar },
            { subject: 'Speed', A: speedScore },
            { subject: 'Retention', A: retentionScore },
            { subject: 'Breadth', A: breadthScore },
            { subject: 'Depth', A: depthScore },
        ];

        // ── Study calendar: last 28 days ─────────────────────────────────────
        const calendarMap = {}; // 'YYYY-MM-DD' → hours
        sessions.forEach(s => {
            const k = dayKey(new Date(s.timestamp));
            calendarMap[k] = (calendarMap[k] || 0) + (s.duration || 0) / 3600;
        });

        // ── Total sessions ───────────────────────────────────────────────────
        const totalSessions = sessions.length;

        // ── This-week sessions count ─────────────────────────────────────────
        const thisWeekSessions = sessions.filter(s => {
            const t = new Date(s.timestamp);
            const weekAgo = new Date(now); weekAgo.setDate(now.getDate() - 7);
            return t >= weekAgo;
        }).length;

        // ── Backward-compatible analytics shape (used by Dashboard weekly bars)
        const analytics = { weeklyHours, subjectBreakdown };

        return {
            streak,
            totalHours,
            thisWeekHours: thisWeekHoursRounded,
            focusScore,
            totalSessions,
            thisWeekSessions,
            subjectBreakdown,
            radarData,
            calendarMap,
            analytics,
        };
    }, [sessionHistory]);

    // ── Computed achievements: real progress from live data ───────────────────
    // Defined OUTSIDE liveStats so it can also read `notes` (which is separate state)
    const computedAchievements = useMemo(() => {
        const s = liveStats;
        const now = new Date();

        // Helper: did user ever study after midnight?
        const nightOwl = sessionHistory.some(sess => {
            const h = new Date(sess.timestamp).getHours();
            return h >= 0 && h < 4;
        });
        // Helper: did user study before 6 AM?
        const earlyBird = sessionHistory.some(sess => {
            const h = new Date(sess.timestamp).getHours();
            return h >= 4 && h < 6;
        });
        // Weekend warrior: studied both Sat AND Sun in any single week
        const weekendMap = {};
        sessionHistory.forEach(sess => {
            const d = new Date(sess.timestamp);
            const wd = d.getDay(); // 0=Sun, 6=Sat
            if (wd === 0 || wd === 6) {
                // week key = ISO week start (Monday)
                const monday = new Date(d);
                monday.setDate(d.getDate() - ((d.getDay() + 6) % 7));
                const wk = monday.toISOString().split('T')[0];
                weekendMap[wk] = weekendMap[wk] || new Set();
                weekendMap[wk].add(wd);
            }
        });
        const weekendWarrior = Object.values(weekendMap).some(s => s.has(0) && s.has(6));

        // Marathon: single session >= 3 h
        const marathon = sessionHistory.some(sess => (sess.duration || 0) >= 10800);

        // High-focus sessions
        const highFocusSessions80 = sessionHistory.filter(s => (s.focusScore || 0) >= 80).length;
        const highFocusSessions85 = sessionHistory.filter(s => (s.focusScore || 0) >= 85).length;
        const highFocusSessions90 = sessionHistory.filter(s => (s.focusScore || 0) >= 90).length;
        const highFocusSessions95 = sessionHistory.filter(s => (s.focusScore || 0) >= 95).length;

        const notesCount = notes.length;

        // All 35 achievement definitions with REAL progress
        const defs = [
            // ── STREAK ──────────────────────────────────────────────────────
            {
                id: 'streak_3', name: '3-Day Streak', emoji: '🌱', category: 'Streak', xp: 30,
                desc: 'Study 3 days in a row',
                how: 'Study at least one video session on 3 consecutive days.',
                progress: Math.min(s.streak, 3), total: 3,
                unlocked: s.streak >= 3,
            },
            {
                id: 'streak_7', name: 'Week Warrior', emoji: '🔥', category: 'Streak', xp: 150,
                desc: 'Maintain a 7-day study streak',
                how: 'Study every day for 7 days in a row without missing a single day.',
                progress: Math.min(s.streak, 7), total: 7,
                unlocked: s.streak >= 7,
            },
            {
                id: 'streak_14', name: '14-Day Consistency', emoji: '💪', category: 'Streak', xp: 300,
                desc: 'Maintain a 14-day study streak',
                how: 'Study every day for 2 weeks straight.',
                progress: Math.min(s.streak, 14), total: 14,
                unlocked: s.streak >= 14,
            },
            {
                id: 'streak_30', name: 'Monthly Master', emoji: '💎', category: 'Streak', xp: 500,
                desc: 'Maintain a 30-day study streak',
                how: 'Study every single day for an entire month.',
                progress: Math.min(s.streak, 30), total: 30,
                unlocked: s.streak >= 30,
            },
            {
                id: 'streak_60', name: '60-Day Legend', emoji: '👑', category: 'Streak', xp: 1200,
                desc: 'Maintain a 60-day study streak',
                how: 'Study every day for 60 consecutive days. Legendary discipline!',
                progress: Math.min(s.streak, 60), total: 60,
                unlocked: s.streak >= 60,
            },

            // ── STUDY TIME ───────────────────────────────────────────────────
            {
                id: 'first_blood', name: 'First Blood', emoji: '🎯', category: 'Milestone', xp: 50,
                desc: 'Complete your first study session',
                how: 'Open any video in the Player and watch it for at least 30 seconds.',
                progress: Math.min(s.totalSessions, 1), total: 1,
                unlocked: s.totalSessions >= 1,
            },
            {
                id: 'hours_5', name: '5-Hour Scholar', emoji: '📖', category: 'Study Time', xp: 75,
                desc: 'Study for a total of 5 hours',
                how: 'Accumulate 5 hours of total study time across all sessions.',
                progress: Math.min(s.totalHours, 5), total: 5,
                unlocked: s.totalHours >= 5,
            },
            {
                id: 'hours_10', name: '10-Hour Achiever', emoji: '⏱️', category: 'Study Time', xp: 150,
                desc: 'Study for a total of 10 hours',
                how: 'Accumulate 10 hours of total study time.',
                progress: Math.min(s.totalHours, 10), total: 10,
                unlocked: s.totalHours >= 10,
            },
            {
                id: 'hours_25', name: '25-Hour Grinder', emoji: '🔧', category: 'Study Time', xp: 300,
                desc: 'Study for a total of 25 hours',
                how: 'Accumulate 25 hours of total study time. You are grinding!',
                progress: Math.min(s.totalHours, 25), total: 25,
                unlocked: s.totalHours >= 25,
            },
            {
                id: 'hours_50', name: '50-Hour Expert', emoji: '🏆', category: 'Study Time', xp: 600,
                desc: 'Study for a total of 50 hours',
                how: 'Accumulate 50 hours of total study time. Almost a full work-week!',
                progress: Math.min(s.totalHours, 50), total: 50,
                unlocked: s.totalHours >= 50,
            },
            {
                id: 'hours_100', name: '100-Hour Master', emoji: '💯', category: 'Study Time', xp: 1000,
                desc: 'Study for a total of 100 hours',
                how: 'Accumulate 100 hours of total study time. A true master!',
                progress: Math.min(s.totalHours, 100), total: 100,
                unlocked: s.totalHours >= 100,
            },
            {
                id: 'hours_200', name: '200-Hour Legend', emoji: '🌟', category: 'Study Time', xp: 2000,
                desc: 'Study for a total of 200 hours',
                how: 'Accumulate 200 hours of total study time. An absolute legend!',
                progress: Math.min(s.totalHours, 200), total: 200,
                unlocked: s.totalHours >= 200,
            },

            // ── SESSIONS ─────────────────────────────────────────────────────
            {
                id: 'sessions_10', name: '10 Sessions', emoji: '🎬', category: 'Milestone', xp: 100,
                desc: 'Complete 10 study sessions',
                how: 'Finish 10 separate video study sessions in the Player.',
                progress: Math.min(s.totalSessions, 10), total: 10,
                unlocked: s.totalSessions >= 10,
            },
            {
                id: 'sessions_50', name: '50 Sessions', emoji: '🎥', category: 'Milestone', xp: 400,
                desc: 'Complete 50 study sessions',
                how: 'Finish 50 separate video study sessions.',
                progress: Math.min(s.totalSessions, 50), total: 50,
                unlocked: s.totalSessions >= 50,
            },
            {
                id: 'sessions_100', name: 'Centurion', emoji: '⚔️', category: 'Milestone', xp: 1000,
                desc: 'Complete 100 study sessions',
                how: 'Finish 100 separate video study sessions. A true centurion!',
                progress: Math.min(s.totalSessions, 100), total: 100,
                unlocked: s.totalSessions >= 100,
            },

            // ── FOCUS ────────────────────────────────────────────────────────
            {
                id: 'focus_80', name: 'Focused Learner', emoji: '🎯', category: 'Focus', xp: 100,
                desc: 'Achieve 80%+ focus in 5 sessions',
                how: 'Complete 5 sessions with a focus score of 80% or higher (stay on-tab, fewer pauses).',
                progress: Math.min(highFocusSessions80, 5), total: 5,
                unlocked: highFocusSessions80 >= 5,
            },
            {
                id: 'focus_85', name: 'Sharp Mind', emoji: '🧠', category: 'Focus', xp: 200,
                desc: 'Achieve 85%+ focus in 5 sessions',
                how: 'Complete 5 sessions with a focus score of 85% or higher.',
                progress: Math.min(highFocusSessions85, 5), total: 5,
                unlocked: highFocusSessions85 >= 5,
            },
            {
                id: 'focus_90', name: 'Laser Focus', emoji: '🔬', category: 'Focus', xp: 350,
                desc: 'Achieve 90%+ focus in 10 sessions',
                how: 'Complete 10 sessions with a focus score of 90%+. Zero distractions!',
                progress: Math.min(highFocusSessions90, 10), total: 10,
                unlocked: highFocusSessions90 >= 10,
            },
            {
                id: 'focus_95', name: 'Focus Master', emoji: '🌀', category: 'Focus', xp: 750,
                desc: 'Achieve 95%+ focus in 10 sessions',
                how: 'Complete 10 sessions with a focus score of 95%+. Absolute zen!',
                progress: Math.min(highFocusSessions95, 10), total: 10,
                unlocked: highFocusSessions95 >= 10,
            },

            // ── NOTES ────────────────────────────────────────────────────────
            {
                id: 'note_1', name: 'First Note', emoji: '📝', category: 'Notes', xp: 25,
                desc: 'Create your first note',
                how: 'Write and save a note from the Smart Notes page or while watching a video.',
                progress: Math.min(notesCount, 1), total: 1,
                unlocked: notesCount >= 1,
            },
            {
                id: 'note_10', name: 'Note Taker', emoji: '📒', category: 'Notes', xp: 100,
                desc: 'Create 10 notes',
                how: 'Save 10 notes total — from the Player or the Smart Notes page.',
                progress: Math.min(notesCount, 10), total: 10,
                unlocked: notesCount >= 10,
            },
            {
                id: 'note_50', name: 'Note Master', emoji: '📚', category: 'Notes', xp: 400,
                desc: 'Create 50 notes',
                how: 'Save 50 notes. By now, you must have an incredible study resource!',
                progress: Math.min(notesCount, 50), total: 50,
                unlocked: notesCount >= 50,
            },

            // ── SUBJECT BREADTH ───────────────────────────────────────────────
            {
                id: 'multi_subject_3', name: 'Explorer', emoji: '🗺️', category: 'Learning', xp: 100,
                desc: 'Study 3 different subjects',
                how: 'Watch videos from at least 3 different subjects (JavaScript, React, DSA, Python, etc.).',
                progress: Math.min(Object.keys((() => {
                    const m = {};
                    sessionHistory.forEach(s => { m[s.subject || 'General'] = true; });
                    return m;
                })()), 3), total: 3,
                unlocked: new Set(sessionHistory.map(s => s.subject || 'General')).size >= 3,
            },
            {
                id: 'multi_subject_5', name: 'Encyclopedia', emoji: '📖', category: 'Learning', xp: 300,
                desc: 'Study 5 different subjects',
                how: 'Watch videos from at least 5 different subjects.',
                progress: Math.min(new Set(sessionHistory.map(s => s.subject || 'General')).size, 5), total: 5,
                unlocked: new Set(sessionHistory.map(s => s.subject || 'General')).size >= 5,
            },

            // ── SOCIAL ───────────────────────────────────────────────────────
            {
                id: 'social_1', name: 'Room Joiner', emoji: '🚪', category: 'Social', xp: 50,
                desc: 'Join your first Study Room',
                how: 'Click Join on any Study Room from the Study Rooms page.',
                progress: 0, total: 1, unlocked: false,
            },
            {
                id: 'social_3', name: 'Team Player', emoji: '🤝', category: 'Social', xp: 150,
                desc: 'Study with 3 different people',
                how: 'Join study rooms and collaborate with at least 3 different users.',
                progress: 0, total: 3, unlocked: false,
            },
            {
                id: 'social_10', name: 'Social Butterfly', emoji: '👥', category: 'Social', xp: 350,
                desc: 'Join 10 study sessions',
                how: 'Participate in 10 study room sessions.',
                progress: 0, total: 10, unlocked: false,
            },

            // ── HABIT / SPECIAL ───────────────────────────────────────────────
            {
                id: 'night_owl', name: 'Night Owl', emoji: '🌙', category: 'Habit', xp: 75,
                desc: 'Study after midnight (12 AM – 4 AM)',
                how: 'Open the Player and watch a video between 12:00 AM and 4:00 AM.',
                progress: nightOwl ? 1 : 0, total: 1,
                unlocked: nightOwl,
            },
            {
                id: 'early_bird', name: 'Early Bird', emoji: '🌅', category: 'Habit', xp: 75,
                desc: 'Study before 6 AM',
                how: 'Open the Player and watch a video between 4:00 AM and 6:00 AM.',
                progress: earlyBird ? 1 : 0, total: 1,
                unlocked: earlyBird,
            },
            {
                id: 'weekend_warrior', name: 'Weekend Warrior', emoji: '⚡', category: 'Habit', xp: 120,
                desc: 'Study on both Saturday and Sunday in the same week',
                how: 'Have at least one study session on both Saturday and Sunday of the same week.',
                progress: weekendWarrior ? 1 : 0, total: 1,
                unlocked: weekendWarrior,
            },
            {
                id: 'marathon', name: 'Marathon Session', emoji: '🏃', category: 'Habit', xp: 250,
                desc: 'Study for 3 hours in a single session',
                how: 'Keep a single Player session going for at least 3 continuous hours.',
                progress: marathon ? 1 : 0, total: 1,
                unlocked: marathon,
            },

            // ── CHALLENGE ─────────────────────────────────────────────────────
            {
                id: 'boss_slayer', name: 'Boss Slayer', emoji: '🗡️', category: 'Challenge', xp: 500,
                desc: 'Complete a weekly boss battle challenge',
                how: 'Finish all videos in a Boss Battle from the Dashboard within the time limit.',
                progress: 0, total: 1, unlocked: false,
            },
            {
                id: 'perfect_week', name: 'Perfect Week', emoji: '✨', category: 'Challenge', xp: 400,
                desc: 'Study every day for a full week with 80%+ focus',
                how: 'Have a 7-day streak AND maintain an average focus score of 80%+ this week.',
                progress: s.streak >= 7 && s.focusScore >= 80 ? 1 : 0, total: 1,
                unlocked: s.streak >= 7 && s.focusScore >= 80,
            },
            {
                id: 'graduate', name: 'Graduate', emoji: '🎓', category: 'Challenge', xp: 500,
                desc: 'Complete a full playlist',
                how: 'Finish all videos in any playlist from the Video Library.',
                progress: 0, total: 1, unlocked: false,
            },
        ];

        // Attach fake unlock dates for demo unlocked items (real ones track via sessionHistory)
        return defs.map(ach => ({
            ...ach,
            unlockedAt: ach.unlocked
                ? sessionHistory.length > 0
                    ? sessionHistory[sessionHistory.length - 1]?.timestamp
                        ? new Date(sessionHistory[sessionHistory.length - 1].timestamp)
                            .toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                        : 'Recently'
                    : 'Recently'
                : null,
        }));
    }, [liveStats, sessionHistory, notes]);

    return (
        <AppContext.Provider value={{
            user, setUser,
            achievements,
            computedAchievements,
            playlists,
            studyRooms,
            roadmaps,
            currentSession,
            notes, addNote, deleteNote,
            bookmarks, addBookmark, removeBookmark,
            watchHistory,
            sessionHistory,
            liveStats,           // ← single source of truth (streak, hours, focus, xp, etc.)
            analytics: liveStats.analytics,  // ← backward-compat alias
            notifications, markNotificationRead,
            xpGained,
            addXP,
            startSession, endSession,
        }}>
            {children}
        </AppContext.Provider>
    );
}

// (generateHeatmap removed — calendar data now comes from liveStats.calendarMap)

export function useApp() {
    const ctx = useContext(AppContext);
    if (!ctx) throw new Error('useApp must be inside AppProvider');
    return ctx;
}
