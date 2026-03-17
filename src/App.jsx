import React, { useState, useCallback } from 'react';
import {
    BrowserRouter, Routes, Route, Navigate, useLocation
} from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { AppProvider }  from './context/AppContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar       from './components/Sidebar';
import Header        from './components/Header';
import SplashScreen  from './components/SplashScreen';

import AuthPage      from './pages/AuthPage';
import Dashboard     from './pages/Dashboard';
import Player        from './pages/Player';
import Library       from './pages/Library';
import Analytics     from './pages/Analytics';
import Notes         from './pages/Notes';
import StudyRooms    from './pages/StudyRooms';
import Achievements  from './pages/Achievements';
import Profile       from './pages/Profile';
import Roadmaps      from './pages/Roadmaps';
import Post          from './pages/Post';
import XPToast       from './components/XPToast';
import './App.css';

/* ── Splash session flag ─────────────────────────────────────────── */
const SPLASH_KEY = 'ytlearn_splash_shown';
const shouldShowSplash = () => { try { return !sessionStorage.getItem(SPLASH_KEY); } catch { return false; } };
const markSplashShown  = () => { try { sessionStorage.setItem(SPLASH_KEY, '1'); } catch {} };

/* ── Auth loading screen ─────────────────────────────────────────── */
function AuthLoading() {
    return (
        <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', height: '100vh', background: '#0B0B14', gap: 16,
        }}>
            <motion.div
                style={{
                    width: 38, height: 38, borderRadius: '50%',
                    border: '3px solid rgba(124,110,255,0.2)',
                    borderTopColor: '#7c6eff',
                }}
                animate={{ rotate: 360 }}
                transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
            />
            <motion.p
                style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13, margin: 0 }}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
            >
                Checking session…
            </motion.p>
        </div>
    );
}

/* ── Route-level page transition wrapper ─────────────────────────── */
function AnimatedPage({ children }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 16, filter: 'blur(4px)' }}
            animate={{ opacity: 1, y: 0,  filter: 'blur(0px)'  }}
            exit={{    opacity: 0, y: -10, filter: 'blur(3px)'  }}
            transition={{ duration: 0.38, ease: [0.25, 0.46, 0.45, 0.94] }}
            style={{ height: '100%' }}
        >
            {children}
        </motion.div>
    );
}

/* ── Protected page guard ────────────────────────────────────────── */
function PrivatePage({ children }) {
    const { isAuthenticated, loading } = useAuth();
    const location = useLocation();
    if (loading)          return <AuthLoading />;
    if (!isAuthenticated) return <Navigate to="/auth" state={{ from: location }} replace />;
    return children;
}

/* ── App shell with animated route switching ─────────────────────── */
function AppShell() {
    const location = useLocation();
    return (
        <div className="app-layout">
            <div className="bg-orbs" />
            <Sidebar />
            <div className="main-content">
                <Header />
                <div className="page-body">
                    <AnimatePresence mode="wait">
                        <Routes location={location} key={location.pathname}>
                            <Route path="/"                element={<PrivatePage><AnimatedPage><Dashboard    /></AnimatedPage></PrivatePage>} />
                            <Route path="/player/:videoId" element={<PrivatePage><AnimatedPage><Player       /></AnimatedPage></PrivatePage>} />
                            <Route path="/library"         element={<PrivatePage><AnimatedPage><Library      /></AnimatedPage></PrivatePage>} />
                            <Route path="/analytics"       element={<PrivatePage><AnimatedPage><Analytics    /></AnimatedPage></PrivatePage>} />
                            <Route path="/notes"           element={<PrivatePage><AnimatedPage><Notes        /></AnimatedPage></PrivatePage>} />
                            <Route path="/rooms"           element={<PrivatePage><AnimatedPage><StudyRooms   /></AnimatedPage></PrivatePage>} />
                            <Route path="/post"            element={<PrivatePage><AnimatedPage><Post         /></AnimatedPage></PrivatePage>} />
                            <Route path="/achievements"    element={<PrivatePage><AnimatedPage><Achievements /></AnimatedPage></PrivatePage>} />
                            <Route path="/profile"         element={<PrivatePage><AnimatedPage><Profile      /></AnimatedPage></PrivatePage>} />
                            <Route path="/roadmaps"        element={<PrivatePage><AnimatedPage><Roadmaps     /></AnimatedPage></PrivatePage>} />
                            <Route path="*"                element={<Navigate to="/" replace />} />
                        </Routes>
                    </AnimatePresence>
                </div>
            </div>
            <XPToast />
        </div>
    );
}

/* ── Root router ─────────────────────────────────────────────────── */
function RootRouter() {
    const { isAuthenticated, loading } = useAuth();
    const location = useLocation();
    if (loading) return <AuthLoading />;
    return (
        <AnimatePresence mode="wait">
            <Routes location={location} key={isAuthenticated ? 'app' : 'auth'}>
                <Route
                    path="/auth"
                    element={
                        isAuthenticated
                            ? <Navigate to={location.state?.from?.pathname || '/'} replace />
                            : <AnimatedPage><AuthPage /></AnimatedPage>
                    }
                />
                <Route path="/*" element={<AppShell />} />
            </Routes>
        </AnimatePresence>
    );
}

/* ── App root ─────────────────────────────────────────────────────── */
export default function App() {
    const [showSplash, setShowSplash] = useState(shouldShowSplash);

    const handleSplashDone = useCallback(() => {
        markSplashShown();
        setShowSplash(false);
    }, []);

    return (
        <BrowserRouter>
            <AuthProvider>
                <AppProvider>
                    {showSplash && <SplashScreen onDone={handleSplashDone} />}
                    <RootRouter />
                </AppProvider>
            </AuthProvider>
        </BrowserRouter>
    );
}
