import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, ArrowRight, RefreshCw, CheckCircle, Zap, BookOpen, Brain, Target, TrendingUp, Code2 } from 'lucide-react';
import './AuthPage.css';

// ─── Floating background icons ────────────────────────────────────────────────
const FLOATS = [
    { icon: '📚', x: 8,  y: 15, size: 28, dur: 7  },
    { icon: '⚡', x: 18, y: 55, size: 22, dur: 9  },
    { icon: '🎯', x: 6,  y: 78, size: 26, dur: 6  },
    { icon: '🧠', x: 82, y: 20, size: 24, dur: 8  },
    { icon: '📈', x: 75, y: 62, size: 20, dur: 11 },
    { icon: '💡', x: 88, y: 85, size: 22, dur: 7  },
    { icon: '</>', x: 12, y: 40, size: 16, dur: 10 },
    { icon: '🚀', x: 90, y: 42, size: 20, dur: 9  },
];

// ─── OTP digit input ──────────────────────────────────────────────────────────
function OtpInput({ value, onChange, disabled }) {
    const refs  = Array.from({ length: 6 }, () => useRef(null));
    const digits = value.split('').concat(Array(6).fill('')).slice(0, 6);

    const handleKey = (i, e) => {
        if (e.key === 'Backspace') {
            const next = digits.slice(); next[i] = '';
            onChange(next.join(''));
            if (i > 0) refs[i - 1].current?.focus();
            return;
        }
        if (!/^\d$/.test(e.key)) return;
        const next = digits.slice(); next[i] = e.key;
        onChange(next.join(''));
        if (i < 5) refs[i + 1].current?.focus();
    };

    const handlePaste = e => {
        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        onChange(pasted.padEnd(6, '').slice(0, 6));
        refs[Math.min(pasted.length, 5)].current?.focus();
        e.preventDefault();
    };

    return (
        <div className="otp-digit-row">
            {digits.map((d, i) => (
                <input
                    key={i}
                    ref={refs[i]}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={d}
                    onChange={() => {}}
                    onKeyDown={e => handleKey(i, e)}
                    onPaste={handlePaste}
                    disabled={disabled}
                    className={`otp-digit-box ${d ? 'filled' : ''}`}
                    autoFocus={i === 0}
                />
            ))}
        </div>
    );
}

// ─── Step 1 — Email Screen ────────────────────────────────────────────────────
function EmailStep({ onNext }) {
    const { sendOtp } = useAuth();
    const [email,   setEmail]   = useState('');
    const [error,   setError]   = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async e => {
        e.preventDefault();
        setError('');
        if (!email) return setError('Email is required.');
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setError('Invalid email format.');
        setLoading(true);
        try {
            await sendOtp(email);
            onNext(email);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-otp-step">
            <div className="auth-otp-icon-wrap">
                <Mail size={28} className="auth-otp-icon" />
            </div>
            <h2 className="auth-form-title">Login to YTLearn</h2>
            <p className="auth-form-sub">Enter your email to continue learning.</p>

            {error && <div className="auth-api-error">{error}</div>}
            {loading && (
                <p className="auth-wakeup-hint">
                    ⏳ Server may be waking up — please wait up to 30 seconds.
                </p>
            )}

            <form onSubmit={handleSubmit} className="auth-otp-form" noValidate>
                <div className={`auth-input-row ${error && !email ? 'has-error' : ''}`}>
                    <Mail size={16} className="auth-input-icon" />
                    <input
                        type="email"
                        placeholder="your@email.com"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        className="auth-input"
                        autoComplete="email"
                        autoFocus
                    />
                </div>

                <button type="submit" className="auth-btn-primary" disabled={loading}>
                    {loading
                        ? <><span className="auth-spinner"/><span>Sending OTP…</span></>
                        : <><span>Send OTP</span><ArrowRight size={16}/></>}
                </button>
            </form>
        </div>
    );
}

// ─── Step 2 — OTP Screen ──────────────────────────────────────────────────────
function OtpStep({ email, onBack }) {
    const { sendOtp, verifyOtp } = useAuth();
    const navigate = useNavigate();
    const [otp,      setOtp]      = useState('');
    const [error,    setError]    = useState('');
    const [loading,  setLoading]  = useState(false);
    const [success,  setSuccess]  = useState(false);
    const [resendSec, setResendSec] = useState(30);

    // Countdown for resend button
    useEffect(() => {
        if (resendSec <= 0) return;
        const t = setInterval(() => setResendSec(s => s - 1), 1000);
        return () => clearInterval(t);
    }, [resendSec]);

    const handleVerify = async e => {
        e?.preventDefault();
        setError('');
        if (otp.replace(/\D/g, '').length < 6) return setError('Enter the full 6-digit code.');
        setLoading(true);
        try {
            await verifyOtp(email, otp);
            setSuccess(true);
            setTimeout(() => navigate('/', { replace: true }), 1800);
        } catch (err) {
            setError(err.message);
            setOtp('');
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        setError(''); setOtp(''); setResendSec(30);
        try { await sendOtp(email); }
        catch (err) { setError(err.message); }
    };

    // Auto-verify when all 6 digits entered
    useEffect(() => {
        if (otp.replace(/\D/g, '').length === 6 && !loading && !success) {
            handleVerify();
        }
    }, [otp]);

    if (success) {
        return (
            <div className="auth-otp-step auth-success-step">
                <div className="auth-success-icon"><CheckCircle size={52} strokeWidth={1.5}/></div>
                <h2 className="auth-form-title" style={{color:'#00ff88'}}>Login Successful!</h2>
                <p className="auth-form-sub">Welcome back — redirecting to your dashboard…</p>
            </div>
        );
    }

    return (
        <div className="auth-otp-step">
            <div className="auth-otp-icon-wrap verify">
                <Zap size={28} className="auth-otp-icon" />
            </div>
            <h2 className="auth-form-title">Check your email</h2>
            <p className="auth-form-sub">
                Enter the 6-digit code sent to <strong style={{color:'#a78bfa'}}>{email}</strong>
            </p>

            {error && <div className="auth-api-error">{error}</div>}
            {loading && (
                <p className="auth-wakeup-hint">
                    ⏳ Verifying — please wait…
                </p>
            )}

            <form onSubmit={handleVerify} className="auth-otp-form" noValidate>
                <OtpInput value={otp} onChange={setOtp} disabled={loading || success} />

                <button type="submit" className="auth-btn-primary" disabled={loading || otp.length < 6}>
                    {loading
                        ? <><span className="auth-spinner"/><span>Verifying…</span></>
                        : <><span>Verify OTP</span><ArrowRight size={16}/></>}
                </button>
            </form>

            <div className="auth-otp-footer">
                <button className="auth-link" onClick={onBack} disabled={loading}>
                    ← Change email
                </button>
                <button
                    className="auth-link"
                    onClick={handleResend}
                    disabled={resendSec > 0 || loading}
                >
                    <RefreshCw size={12}/>{' '}
                    {resendSec > 0 ? `Resend in ${resendSec}s` : 'Resend OTP'}
                </button>
            </div>
        </div>
    );
}

// ─── Main Auth Page ───────────────────────────────────────────────────────────
export default function AuthPage() {
    const [step,  setStep]  = useState('email');   // 'email' | 'otp'
    const [email, setEmail] = useState('');

    const goToOtp  = useCallback(e => { setEmail(e); setStep('otp'); }, []);
    const goBack   = useCallback(()  => setStep('email'), []);

    return (
        <div className="auth-page">
            {FLOATS.map((f, i) => (
                <div
                    key={i}
                    className="auth-float"
                    style={{ left:`${f.x}%`, top:`${f.y}%`, fontSize:f.size, animationDuration:`${f.dur}s`, animationDelay:`${i*0.4}s` }}
                >
                    {f.icon}
                </div>
            ))}

            {/* Left branding panel */}
            <div className="auth-left">
                <div className="auth-left-inner">
                    <div className="auth-logo">
                        <div className="auth-logo-icon">
                            <svg width="36" height="36" viewBox="0 0 52 52" fill="none">
                                <circle cx="26" cy="26" r="26" fill="url(#authLogoGrad)"/>
                                <polygon points="21,16 21,36 38,26" fill="white" opacity="0.95"/>
                                <defs>
                                    <radialGradient id="authLogoGrad" cx="35%" cy="30%">
                                        <stop offset="0%" stopColor="#a78bfa"/>
                                        <stop offset="100%" stopColor="#5440e0"/>
                                    </radialGradient>
                                </defs>
                            </svg>
                        </div>
                        <span className="auth-logo-text">YT<span>Learn</span></span>
                    </div>

                    <div className="auth-left-content">
                        <h1 className="auth-headline">
                            Learn Smarter.<br/>
                            <span className="auth-headline-accent">Build Faster.</span>
                        </h1>
                        <p className="auth-tagline">
                            Your AI-powered study cockpit designed for focus, discipline, and measurable learning progress.
                        </p>

                        <div className="auth-features">
                            {[
                                { icon: BookOpen,   label: 'Smart Notes'   },
                                { icon: Brain,      label: 'AI Tutor'      },
                                { icon: Target,     label: 'Roadmaps'      },
                                { icon: TrendingUp, label: 'Analytics'     },
                                { icon: Zap,        label: 'Focus Engine'  },
                                { icon: Code2,      label: 'Study Rooms'   },
                            ].map((f, i) => (
                                <div key={i} className="auth-feature-pill" style={{ animationDelay:`${i*0.1}s` }}>
                                    <f.icon size={14}/>
                                    <span>{f.label}</span>
                                </div>
                            ))}
                        </div>

                        <div className="auth-stats">
                            {[
                                { val: '10K+', label: 'Learners'   },
                                { val: '500+', label: 'Courses'    },
                                { val: '98%',  label: 'Completion' },
                            ].map((s, i) => (
                                <div key={i} className="auth-stat">
                                    <div className="auth-stat-val">{s.val}</div>
                                    <div className="auth-stat-lbl">{s.label}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Right — Auth card */}
            <div className="auth-right">
                <div className="auth-card">
                    <div className="auth-otp-container">
                        {step === 'email'
                            ? <EmailStep onNext={goToOtp} />
                            : <OtpStep   email={email} onBack={goBack} />}
                    </div>
                </div>
            </div>
        </div>
    );
}
