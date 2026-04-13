import React, { createContext, useContext, useState, useCallback } from 'react';

const USER_KEY = 'ytlearn_user';
const BASE_URL  = import.meta.env.VITE_API_URL || '';
const API       = `${BASE_URL}/api/auth`;

// ─── Fetch with retry for Render cold starts ──────────────────────────────────
async function fetchWithTimeout(url, options, ms = 90_000, retries = 2) {
    for (let attempt = 0; attempt <= retries; attempt++) {
        const ctrl  = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), ms);
        try {
            const res = await fetch(url, { ...options, signal: ctrl.signal });
            clearTimeout(timer);
            return res;
        } catch (err) {
            clearTimeout(timer);
            if (err.name !== 'AbortError') {
                throw new Error('Cannot reach the server. Check your internet connection.');
            }
            // On timeout, retry if attempts remain
            if (attempt < retries) {
                // Wait 5s before retrying
                await new Promise(r => setTimeout(r, 5000));
                continue;
            }
            throw new Error('Server is taking too long to respond. Please wait a moment and try again.');
        }
    }
}

// ─── Safe JSON parser ─────────────────────────────────────────────────────────
async function safeJson(res) {
    const text = await res.text();
    if (!text?.trim()) throw new Error('Server returned an empty response. It may still be starting up — try again in 30 seconds.');
    try { return JSON.parse(text); }
    catch { throw new Error('Server returned an invalid response. Please try again.'); }
}

// ─── localStorage helpers ─────────────────────────────────────────────────────
const saveUser   = u  => { try { localStorage.setItem(USER_KEY, JSON.stringify(u)); } catch {} };
const loadUser   = () => { try { return JSON.parse(localStorage.getItem(USER_KEY) || 'null'); } catch { return null; } };
const removeUser = () => { try { localStorage.removeItem(USER_KEY); } catch {} };

// ─── Context ──────────────────────────────────────────────────────────────────
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user,    setUser]    = useState(loadUser);
    const [loading]             = useState(false);

    // ── Send OTP ──────────────────────────────────────────────────────────────
    const sendOtp = useCallback(async (email) => {
        const res  = await fetchWithTimeout(`${API}/send-otp`, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ email }),
        });
        const data = await safeJson(res);
        if (!res.ok) throw new Error(data.message || 'Failed to send OTP.');
        return data;
    }, []);

    // ── Verify OTP ────────────────────────────────────────────────────────────
    const verifyOtp = useCallback(async (email, otp) => {
        const res  = await fetchWithTimeout(`${API}/verify-otp`, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ email, otp }),
        });
        const data = await safeJson(res);
        if (!res.ok) throw new Error(data.message || 'OTP verification failed.');
        saveUser(data.user);
        setUser(data.user);
        return data;
    }, []);

    // ── Sign Out ──────────────────────────────────────────────────────────────
    const signOut = useCallback(() => { removeUser(); setUser(null); }, []);

    return (
        <AuthContext.Provider value={{ user, loading, isAuthenticated: !!user, sendOtp, verifyOtp, signOut }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
    return ctx;
}
