import React, { useEffect, useRef, useState } from 'react';
import './SplashScreen.css';

// ─── Loading messages ─────────────────────────────────────────────────────────
const MESSAGES = [
    'Syncing your learning progress…',
    'Loading your study cockpit…',
    'Preparing smart tools…',
    'Optimizing focus environment…',
    'Almost ready! 🚀',
];

// ─── Canvas particle system ───────────────────────────────────────────────────
function ParticleCanvas() {
    const canvasRef = useRef(null);
    const rafRef    = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        let W = canvas.width  = window.innerWidth;
        let H = canvas.height = window.innerHeight;

        const COLORS = ['#7c6eff','#00d4ff','#a78bfa','#5440e0','#c4b5fd','#00ff88'];

        const makeParticle = () => ({
            x:     Math.random() * W,
            y:     Math.random() * H,
            r:     Math.random() * 2.2 + 0.4,
            vx:    (Math.random() - 0.5) * 0.3,
            vy:    (Math.random() - 0.5) * 0.3,
            alpha: Math.random() * 0.5 + 0.05,
            da:    (Math.random() - 0.5) * 0.005,
            color: COLORS[Math.floor(Math.random() * COLORS.length)],
        });

        const particles = Array.from({ length: 110 }, makeParticle);

        const draw = () => {
            ctx.clearRect(0, 0, W, H);
            particles.forEach(p => {
                p.x += p.vx; p.y += p.vy;
                p.alpha = Math.max(0.02, Math.min(0.6, p.alpha + p.da));
                if (p.alpha >= 0.6 || p.alpha <= 0.02) p.da *= -1;
                if (p.x < -4) p.x = W + 4;
                if (p.x > W + 4) p.x = -4;
                if (p.y < -4) p.y = H + 4;
                if (p.y > H + 4) p.y = -4;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                ctx.fillStyle = p.color;
                ctx.globalAlpha = p.alpha;
                ctx.fill();
            });
            ctx.globalAlpha = 1;
            rafRef.current = requestAnimationFrame(draw);
        };

        draw();

        const onResize = () => { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; };
        window.addEventListener('resize', onResize);
        return () => { cancelAnimationFrame(rafRef.current); window.removeEventListener('resize', onResize); };
    }, []);

    return <canvas ref={canvasRef} className="splash-canvas" />;
}

// ─── Animated floating stat pills ─────────────────────────────────────────────
const STAT_PILLS = [
    { icon: '📚', label: '10K+ Videos',   x: '8%',  y: '22%', delay: '0s'    },
    { icon: '🔥', label: '5K+ Learners',  x: '78%', y: '18%', delay: '0.4s'  },
    { icon: '⭐', label: '4.9 Rating',    x: '82%', y: '72%', delay: '0.8s'  },
    { icon: '🏆', label: '50K+ XP Earned',x: '6%',  y: '74%', delay: '1.2s'  },
    { icon: '🎯', label: 'Goal Tracking', x: '40%', y: '8%',  delay: '0.2s'  },
];

// ─── Letter-by-letter animated word ───────────────────────────────────────────
function AnimatedWord({ text, className, delay = 0 }) {
    return (
        <span className={className} aria-label={text}>
            {text.split('').map((ch, i) => (
                <span
                    key={i}
                    className="splash-letter"
                    style={{ animationDelay: `${delay + i * 0.06}s` }}
                >
                    {ch}
                </span>
            ))}
        </span>
    );
}

// ─── Main splash screen ───────────────────────────────────────────────────────
export default function SplashScreen({ onDone }) {
    // phases: 0=enter 1=orbs+pills 2=title 3=progress 4=exit 5=done
    const [phase,      setPhase]     = useState(0);
    const [progress,   setProgress]  = useState(0);
    const [msgIdx,     setMsgIdx]    = useState(0);
    const [msgVisible, setMsgVisible]= useState(true);
    const [pillsIn,    setPillsIn]   = useState(false);

    // ── Phase sequencer ───────────────────────────────────────────────────────
    useEffect(() => {
        const t1 = setTimeout(() => { setPhase(1); setPillsIn(true); }, 600);
        const t2 = setTimeout(() => setPhase(2), 1300);
        const t3 = setTimeout(() => setPhase(3), 2000);
        const t4 = setTimeout(() => setPhase(4), 4200);
        const t5 = setTimeout(() => onDone(),    4700);
        return () => [t1,t2,t3,t4,t5].forEach(clearTimeout);
    }, [onDone]);

    // ── Progress bar ──────────────────────────────────────────────────────────
    useEffect(() => {
        if (phase < 3) return;
        let start = null;
        const DURATION = 3500;
        const tick = ts => {
            if (!start) start = ts;
            const elapsed = ts - start;
            setProgress(Math.min(100, (elapsed / DURATION) * 100));
            if (elapsed < DURATION) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
    }, [phase]);

    // ── Message rotation ──────────────────────────────────────────────────────
    useEffect(() => {
        if (phase < 3) return;
        const cycle = setInterval(() => {
            setMsgVisible(false);
            setTimeout(() => { setMsgIdx(i => (i + 1) % MESSAGES.length); setMsgVisible(true); }, 250);
        }, 900);
        return () => clearInterval(cycle);
    }, [phase]);

    return (
        <div className={`splash-root ${phase >= 4 ? 'splash-exit' : ''}`}>
            <ParticleCanvas />

            {/* Background orbs */}
            <div className="splash-orb splash-orb-1" />
            <div className="splash-orb splash-orb-2" />
            <div className="splash-orb splash-orb-3" />
            <div className="splash-orb splash-orb-4" />

            {/* Floating stat pills */}
            {STAT_PILLS.map((p, i) => (
                <div
                    key={i}
                    className={`splash-pill ${pillsIn ? 'pill-visible' : ''}`}
                    style={{ left: p.x, top: p.y, animationDelay: p.delay }}
                >
                    <span className="pill-icon">{p.icon}</span>
                    <span className="pill-label">{p.label}</span>
                </div>
            ))}

            {/* ── Center stage ─────────────────────────────────────────── */}
            <div className="splash-center">

                {/* Logo icon with rings */}
                <div className={`splash-logo-wrap ${phase >= 4 ? 'logo-final-glow' : ''}`}>
                    {/* Rotating rings */}
                    <div className="splash-ring-1" />
                    <div className="splash-ring-2" />
                    <div className="splash-ring-3" />

                    {/* Logo */}
                    <div className="splash-logo-icon">
                        <svg width="64" height="64" viewBox="0 0 52 52" fill="none">
                            <circle cx="26" cy="26" r="26" fill="url(#splashGrad)" />
                            <polygon points="21,16 21,36 38,26" fill="white" opacity="0.95" />
                            <defs>
                                <radialGradient id="splashGrad" cx="35%" cy="30%">
                                    <stop offset="0%"   stopColor="#c4b5fd"/>
                                    <stop offset="55%"  stopColor="#7c6eff"/>
                                    <stop offset="100%" stopColor="#4020d0"/>
                                </radialGradient>
                            </defs>
                        </svg>
                    </div>
                </div>

                {/* Title — letter-by-letter animation */}
                <div className={`splash-title-block ${phase >= 2 ? 'title-enter' : ''}`}>
                    <h1 className="splash-title">
                        <AnimatedWord text="YT"     className="splash-title-yt"    delay={0}    />
                        <AnimatedWord text="Learn"  className="splash-title-learn" delay={0.15} />
                    </h1>
                    <p className="splash-subtitle">
                        <span className="splash-subtitle-inner">
                            Your Personal Study Cockpit
                        </span>
                    </p>
                    <div className="splash-tagline">
                        <span>📈 Learn</span>
                        <span className="splash-dot">·</span>
                        <span>🏆 Level Up</span>
                        <span className="splash-dot">·</span>
                        <span>🚀 Achieve</span>
                    </div>
                </div>

                {/* Progress */}
                <div className={`splash-progress-wrap ${phase >= 3 ? 'progress-enter' : ''}`}>
                    <div className="splash-progress-track">
                        <div className="splash-progress-fill" style={{ width: `${progress}%` }}>
                            <div className="splash-progress-shine" />
                        </div>
                    </div>
                    <div className="splash-progress-footer">
                        <p className={`splash-msg ${msgVisible ? 'msg-visible' : 'msg-hidden'}`}>
                            {MESSAGES[msgIdx]}
                        </p>
                        <span className="splash-pct">{Math.round(progress)}%</span>
                    </div>
                </div>

            </div>

            {/* Version badge */}
            <div className="splash-version">v2.1 · YTLearn</div>
        </div>
    );
}
