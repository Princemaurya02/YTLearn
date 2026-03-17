/**
 * useAnalytics — derives all analytics metrics from real stored session data.
 *
 * Data source: localStorage key 'ytlearn_sessions' (array of completed sessions).
 *
 * Session schema:
 * {
 *   id:          string,
 *   videoId:     string,
 *   videoTitle:  string,
 *   subject:     string,
 *   duration:    number,   – seconds
 *   focusScore:  number,   – 0–100
 *   tabSwitches: number,
 *   pauses:      number,
 *   timestamp:   string,   – ISO date of session END
 * }
 */

import { useMemo } from 'react';

const SESSION_KEY  = 'ytlearn_sessions';
const STREAK_KEY   = 'ytlearn_streak';

// Subject → chart colour mapping
export const SUBJECT_COLORS = {
    'JavaScript': '#f7df1e',
    'React':      '#00d4ff',
    'DSA':        '#ffb347',
    'Python':     '#00ff88',
    'Web Dev':    '#7c6eff',
    'Node.js':    '#68a063',
    'CSS':        '#ff6b9d',
    'TypeScript': '#3178c6',
    'General':    '#9898b8',
};

// ─── Storage helpers ──────────────────────────────────────────────────────────

export function readSessions() {
    try {
        const raw = localStorage.getItem(SESSION_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch { return []; }
}

export function writeSessions(sessions) {
    try {
        localStorage.setItem(SESSION_KEY, JSON.stringify(sessions));
    } catch (e) {
        console.warn('[YTLearn] Could not persist sessions:', e.message);
    }
}

export function persistSession(session) {
    const prev = readSessions();
    const next = [session, ...prev].slice(0, 500);
    writeSessions(next);
    // Update streak whenever a session is persisted
    updateStreak();
}

// ─── Streak helpers (calendar-day based) ─────────────────────────────────────

function dateKey(date) {
    return new Date(date).toISOString().split('T')[0];
}

function todayKey() {
    return dateKey(new Date());
}

function yesterdayKey() {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return dateKey(d);
}

function readStreakData() {
    try {
        return JSON.parse(localStorage.getItem(STREAK_KEY) || 'null') ?? {
            currentStreak: 0,
            longestStreak: 0,
            lastStudyDate: null,
        };
    } catch {
        return { currentStreak: 0, longestStreak: 0, lastStudyDate: null };
    }
}

function saveStreakData(data) {
    try {
        localStorage.setItem(STREAK_KEY, JSON.stringify(data));
    } catch {}
}

/**
 * Call this when user completes a study action (session > 5 min).
 * Implements the calendar-day streak rules:
 *   - Same day → no change
 *   - Yesterday → +1
 *   - Gap > 1 day → reset to 1
 */
export function updateStreak() {
    const streak = readStreakData();
    const today  = todayKey();
    const yesterday = yesterdayKey();

    if (streak.lastStudyDate === today) {
        // Already studied today — no change
        return streak;
    }

    let newStreak;
    if (streak.lastStudyDate === yesterday) {
        // Continued from yesterday
        newStreak = streak.currentStreak + 1;
    } else {
        // Missed a day (or first study) → reset
        newStreak = 1;
    }

    const updated = {
        currentStreak: newStreak,
        longestStreak: Math.max(streak.longestStreak, newStreak),
        lastStudyDate: today,
    };
    saveStreakData(updated);
    return updated;
}

export function getStreakData() {
    return readStreakData();
}

// ─── Date helpers ─────────────────────────────────────────────────────────────

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function startOfDay(date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
}

function isSameDay(a, b) {
    return startOfDay(a).getTime() === startOfDay(b).getTime();
}

function getLastNDays(n) {
    const days = [];
    for (let i = n - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        days.push(startOfDay(d));
    }
    return days;
}

// ─── Core computation ─────────────────────────────────────────────────────────

function computeAnalytics(sessions) {
    const now = new Date();

    // ── 1. Weekly data (last 7 days) ──────────────────────────────────────────
    const last7 = getLastNDays(7);
    const weeklyData = last7.map(day => {
        const daySessions = sessions.filter(s => isSameDay(new Date(s.timestamp), day));
        const totalSecs   = daySessions.reduce((acc, s) => acc + (s.duration || 0), 0);
        const totalHours  = Math.round((totalSecs / 3600) * 10) / 10;
        const avgFocus    = daySessions.length
            ? Math.round(daySessions.reduce((a, s) => a + (s.focusScore || 0), 0) / daySessions.length)
            : 0;
        return { day: DAY_LABELS[day.getDay()], hours: totalHours, focus: avgFocus };
    });

    // ── 2. Monthly data (last 4 weeks) ────────────────────────────────────────
    const monthlyData = [1, 2, 3, 4].map(w => {
        const weekEnd = new Date(now);
        weekEnd.setDate(now.getDate() - (4 - w) * 7);
        const weekStart = new Date(weekEnd);
        weekStart.setDate(weekEnd.getDate() - 6);
        const weekSessions = sessions.filter(s => {
            const t = new Date(s.timestamp);
            return t >= weekStart && t <= weekEnd;
        });
        const hours = Math.round(
            weekSessions.reduce((a, s) => a + (s.duration || 0), 0) / 3600 * 10
        ) / 10;
        return { week: `W${w}`, hours };
    });

    // ── 3. Subject breakdown ──────────────────────────────────────────────────
    const subjectMap = {};
    sessions.forEach(s => {
        const sub = s.subject || 'General';
        subjectMap[sub] = (subjectMap[sub] || 0) + (s.duration || 0);
    });
    const subjectData = Object.entries(subjectMap)
        .map(([name, secs]) => ({
            name,
            value: Math.round((secs / 3600) * 10) / 10,
            color: SUBJECT_COLORS[name] || '#9898b8',
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 8);

    // ── 4. Heatmap (last 90 days) — returns minutes for finer granularity ─────
    const heatmapData = getLastNDays(90).map(day => {
        const daySess = sessions.filter(s => isSameDay(new Date(s.timestamp), day));
        const totalSecs = daySess.reduce((a, s) => a + (s.duration || 0), 0);
        const minutes   = Math.round(totalSecs / 60);
        return { date: dateKey(day), minutes };
    });

    // ── 5. Summary metrics ────────────────────────────────────────────────────
    const totalSessions = sessions.length;

    const thisWeekSessions = sessions.filter(s =>
        last7.some(d => isSameDay(new Date(s.timestamp), d))
    );

    const lastWeekStart = new Date(now);
    lastWeekStart.setDate(now.getDate() - 14);
    const lastWeekEnd = new Date(now);
    lastWeekEnd.setDate(now.getDate() - 7);
    const lastWeekSessions = sessions.filter(s => {
        const t = new Date(s.timestamp);
        return t >= lastWeekStart && t <= lastWeekEnd;
    });

    const thisWeekHours = Math.round(
        thisWeekSessions.reduce((a, s) => a + (s.duration || 0), 0) / 3600 * 10
    ) / 10;
    const lastWeekHours = Math.round(
        lastWeekSessions.reduce((a, s) => a + (s.duration || 0), 0) / 3600 * 10
    ) / 10;
    const weekDelta = Math.round((thisWeekHours - lastWeekHours) * 10) / 10;

    const avgFocusAll = sessions.length
        ? Math.round(sessions.reduce((a, s) => a + (s.focusScore || 0), 0) / sessions.length)
        : 0;

    const thisWeekFocus = thisWeekSessions.length
        ? Math.round(thisWeekSessions.reduce((a, s) => a + (s.focusScore || 0), 0) / thisWeekSessions.length)
        : 0;

    // ── 6. Focus Intelligence metrics ─────────────────────────────────────────
    const avgTabSwitches = sessions.length
        ? Math.round(sessions.reduce((a, s) => a + (s.tabSwitches || 0), 0) / sessions.length)
        : 0;
    const avgPauses = sessions.length
        ? Math.round(sessions.reduce((a, s) => a + (s.pauses || 0), 0) / sessions.length)
        : 0;

    const sessionsDayRaw = thisWeekSessions.length / 7;
    const sessionsPerDay = Math.round(sessionsDayRaw * 10) / 10;

    const completedSessions = sessions.filter(s => (s.duration || 0) >= 300);
    const completionRate = sessions.length
        ? Math.round((completedSessions.length / sessions.length) * 100)
        : 0;

    // Longest focus session (in seconds → displayed as h/m)
    const longestSessionSecs = sessions.reduce((max, s) => Math.max(max, s.duration || 0), 0);

    // Distraction Rate = avg tab switches normalised (0–20 switches → 0–100%)
    // — a tab switch rate of 10+ = fully distracted
    const distractionRate = sessions.length
        ? Math.min(100, Math.round((avgTabSwitches / 10) * 100))
        : 0;

    // ── 7. Streak — read from persistent streak storage ───────────────────────
    const streakData = readStreakData();

    // Also compute from sessions as a fallback if streak key is empty
    let computedStreak = streakData.currentStreak;
    if (computedStreak === 0 && sessions.length > 0) {
        const studyDays = new Set(sessions.map(s => dateKey(new Date(s.timestamp))));
        let s = 0;
        const checkDay = new Date();
        while (studyDays.has(dateKey(checkDay))) {
            s++;
            checkDay.setDate(checkDay.getDate() - 1);
        }
        computedStreak = s;
    }
    const streak = computedStreak;
    const longestStreak = Math.max(streakData.longestStreak, streak);

    // ── 8. Predicted Exam Readiness ───────────────────────────────────────────
    // Formula (out of 100):
    //   Study Hours  × 0.30  (normalised against 20h/week target)
    //   Focus Score  × 0.20
    //   Roadmap prog × 0.30  (approximated as completion rate here — backend TODO)
    //   Quiz Accuracy× 0.20  (approximated as focus score — backend TODO)
    const hoursNorm        = Math.min(1, thisWeekHours / 20) * 100;
    const roadmapProgress  = completionRate; // proxy until real roadmap %
    const quizAccuracy     = avgFocusAll;    // proxy until real quiz data

    const examScore = sessions.length === 0 ? 0 : Math.round(
        hoursNorm      * 0.30 +
        avgFocusAll    * 0.20 +
        roadmapProgress* 0.30 +
        quizAccuracy   * 0.20
    );

    const subjectCoverage = Math.min(1, Object.keys(subjectMap).length / 5) * 100;
    const consistencyNorm = Math.min(1, streak / 14) * 100;

    // Legacy alias
    const predictedScore   = examScore;
    const predictionFactors = {
        focusScore:       avgFocusAll,
        hoursNorm:        Math.round(hoursNorm),
        subjectCoverage:  Math.round(subjectCoverage),
        consistency:      Math.round(consistencyNorm),
        roadmapProgress:  Math.round(roadmapProgress),
        quizAccuracy:     Math.round(quizAccuracy),
    };

    // Radar
    const radarData = [
        { subject: 'Focus',       A: avgFocusAll },
        { subject: 'Hours',       A: Math.round(hoursNorm) },
        { subject: 'Subjects',    A: Math.round(subjectCoverage) },
        { subject: 'Consistency', A: Math.round(consistencyNorm) },
        { subject: 'Completion',  A: completionRate },
    ];

    return {
        weeklyData,
        monthlyData,
        subjectData,
        heatmapData,
        radarData,

        // Summary
        thisWeekHours,
        lastWeekHours,
        weekDelta,
        totalSessions,
        thisWeekSessions: thisWeekSessions.length,
        avgFocusAll,
        thisWeekFocus,

        // Focus Intelligence
        avgTabSwitches,
        avgPauses,
        sessionsPerDay,
        completionRate,
        longestSessionSecs,
        distractionRate,

        // Streak
        streak,
        longestStreak,

        // Exam prediction
        predictedScore,
        examScore,
        predictionFactors,
        hasData: sessions.length > 0,
    };
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAnalytics(liveSessions = []) {
    return useMemo(() => {
        const stored = readSessions();
        const storedIds = new Set(stored.map(s => s.id));
        const merged = [
            ...stored,
            ...liveSessions.filter(s => s.id && !storedIds.has(s.id)),
        ];
        return computeAnalytics(merged);
    }, [liveSessions]);
}
