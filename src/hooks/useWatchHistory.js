/**
 * useWatchHistory — localStorage-backed watch progress tracker
 *
 * Schema (stored under key 'ytlearn_watch_history'):
 * [
 *   {
 *     videoId:     string,   – YouTube video ID
 *     title:       string,   – Video title
 *     channel:     string,   – Channel name
 *     thumbnail:   string,   – mqdefault.jpg URL
 *     currentTime: number,   – Last saved position in seconds
 *     duration:    number,   – Total duration in seconds
 *     percentage:  number,   – 0–100 watch percentage
 *     completed:   boolean,  – true when percentage >= 95
 *     lastWatched: string,   – ISO timestamp of last save
 *   },
 *   ...
 * ]
 */

import { useState, useCallback } from 'react';

const STORAGE_KEY = 'ytlearn_watch_history';
const MAX_HISTORY = 45;
const COMPLETED_PCT = 95; // mark completed at 95%
const MIN_SAVE_SECONDS = 5;  // only save if watched > 5s

// ─── Helpers ────────────────────────────────────────────────────────────────

function readStorage() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

function writeStorage(data) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
        console.warn('[YTLearn] Could not persist watch history:', e.message);
    }
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useWatchHistory() {
    // Initialize directly from localStorage so it survives page reload
    const [history, setHistory] = useState(readStorage);

    /**
     * Upserts a progress entry for `videoId`.
     * Safe to call frequently (every 10s while playing); uses functional
     * setState so it never closes over stale state.
     */
    const saveProgress = useCallback(({
        videoId,
        title = 'Unknown Video',
        channel = '',
        thumbnail,
        currentTime,
        duration,
    }) => {
        if (!videoId || !duration || duration <= 0) return;
        if (currentTime < MIN_SAVE_SECONDS) return;

        const percentage = Math.min(100, (currentTime / duration) * 100);
        const entry = {
            videoId,
            title,
            channel,
            thumbnail: thumbnail || `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`,
            currentTime: Math.floor(currentTime),
            duration: Math.floor(duration),
            percentage: Math.round(percentage * 10) / 10,
            completed: percentage >= COMPLETED_PCT,
            lastWatched: new Date().toISOString(),
        };

        setHistory(prev => {
            const filtered = prev.filter(h => h.videoId !== videoId);
            const next = [entry, ...filtered].slice(0, MAX_HISTORY);
            writeStorage(next);
            return next;
        });
    }, []);

    /** Remove a single entry (e.g. user dismisses it from library) */
    const removeEntry = useCallback((videoId) => {
        setHistory(prev => {
            const next = prev.filter(h => h.videoId !== videoId);
            writeStorage(next);
            return next;
        });
    }, []);

    /** Wipe entire watch history */
    const clearHistory = useCallback(() => {
        setHistory([]);
        writeStorage([]);
    }, []);

    /**
     * Point-in-time read from localStorage (bypasses React state).
     * Useful inside cleanup effects where state may be stale.
     */
    const getProgress = useCallback((videoId) => {
        return readStorage().find(h => h.videoId === videoId) || null;
    }, []);

    // ── Derived views ──────────────────────────────────────────────────────

    /** Videos in progress — shown in "Continue Watching" */
    const continueWatching = history
        .filter(h => !h.completed && h.currentTime > MIN_SAVE_SECONDS)
        .sort((a, b) => new Date(b.lastWatched) - new Date(a.lastWatched));


    /** Fully-watched videos */
    const completedVideos = history
        .filter(h => h.completed)
        .sort((a, b) => new Date(b.lastWatched) - new Date(a.lastWatched));

    return {
        history,
        continueWatching,
        completedVideos,
        saveProgress,
        removeEntry,
        clearHistory,
        getProgress,
    };
}
