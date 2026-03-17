import React, { useEffect, useRef, useState } from 'react';
import './SplashScreen.css';

// ─── Loading messages ─────────────────────────────────────────────────────────
const MESSAGES = [
    'Analyzing learning progress…',
    'Preparing your study cockpit…',
    'Loading smart learning tools…',
    'Optimizing focus environment…',
    'Almost ready…',
];

// ─── Floating icons (reduced opacity, more ambient) ───────────────────────────
const ICONS = [
    { emoji: '🚀', x: 10,  y: 15,  size: 24, speed: 9  },
    { emoji: '🎯', x: 85,  y: 12,  size: 20, speed: 11 },
    { emoji: '⭐', x: 88,  y: 75,  size: 18, speed: 8  },
    { emoji: '⚡', x: 7,   y: 78,  size: 20, speed: 10 },
    { emoji: '📚', x: 48,  y: 6,   size: 18, speed: 13 },
    { emoji: '📈', x: 16,  y: 48,  size: 16, speed: 9  },
    { emoji: '💡', x: 80,  y: 46,  size: 18, speed: 12 },
    { emoji: '🧠', x: 60,  y: 90,  size: 16, speed: 10 },
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

        const makeParticle = () => ({
            x:     Math.random() * W,
            y:     Math.random() * H,
            r:     Math.random() * 1.6 + 0.3,
            vx:    (Math.random() - 0.5) * 0.25,
            vy:    (Math.random() - 0.5) * 0.25,
            alpha: Math.random() * 0.5 + 0.05,
            da:    (Math.random() - 0.5) * 0.004,
            color: ['#7c6eff','#00d4ff','#a78bfa','#5440e0'][Math.floor(Math.random() * 4)],
        });

        const particles = Array.from({ length: 90 }, makeParticle);

        const draw = () => {
            ctx.clearRect(0, 0, W, H);
            particles.forEach(p => {
                p.x += p.vx; p.y += p.vy;
                p.alpha = Math.max(0.03, Math.min(0.55, p.alpha + p.da));
                if (p.alpha >= 0.55 || p.alpha <= 0.03) p.da *= -1;
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

        const onResize = () => {
            W = canvas.width  = window.innerWidth;
            H = canvas.height = window.innerHeight;
        };
        window.addEventListener('resize', onResize);
        return () => {
            cancelAnimationFrame(rafRef.current);
            window.removeEventListener('resize', onResize);
        };
    }, []);

    return <canvas ref={canvasRef} className="splash-canvas" />;
}

// ─── Neural / circular node network (with slow rotation) ─────────────────────
function NeuralNet() {
    const nodes = [
        { id: 0, cx: 50, cy: 50 },
        { id: 1, cx: 28, cy: 34 }, { id: 2, cx: 72, cy: 34 },
        { id: 3, cx: 22, cy: 60 }, { id: 4, cx: 78, cy: 60 },
        { id: 5, cx: 42, cy: 20 }, { id: 6, cx: 58, cy: 20 },
        { id: 7, cx: 38, cy: 78 }, { id: 8, cx: 62, cy: 78 },
        { id: 9, cx: 15, cy: 45 }, { id: 10, cx: 85, cy: 45 },
    ];
    const edges = [
        [0,1],[0,2],[0,3],[0,4],[1,5],[2,6],[1,3],[2,4],
        [3,7],[4,8],[0,5],[0,6],[5,6],[7,8],[9,1],[10,2],
        [9,3],[10,4],[0,9],[0,10],
    ];

    return (
        /* slow rotation wrapper */
        <div className="nn-rotate-wrap">
            <svg className="splash-neural" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
                <defs>
                    <filter id="glow-nn" x="-30%" y="-30%" width="160%" height="160%">
                        <feGaussianBlur stdDeviation="0.9" result="blur"/>
                        <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
                    </filter>
                    <filter id="glow-node" x="-80%" y="-80%" width="260%" height="260%">
                        <feGaussianBlur stdDeviation="1.5" result="blur"/>
                        <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
                    </filter>
                </defs>

                {/* Animated edges */}
                {edges.map(([a, b], i) => {
                    const na = nodes[a], nb = nodes[b];
                    return (
                        <line
                            key={i}
                            x1={na.cx} y1={na.cy} x2={nb.cx} y2={nb.cy}
                            stroke="#7c6eff" strokeWidth="0.22"
                            strokeOpacity="0.35"
                            filter="url(#glow-nn)"
                            className="nn-edge"
                            style={{ animationDelay: `${i * 0.07}s` }}
                        />
                    );
                })}

                {/* Glowing nodes */}
                {nodes.map((n, i) => (
                    <circle
                        key={n.id}
                        cx={n.cx} cy={n.cy}
                        r={i === 0 ? 2.4 : 1.1}
                        fill={i === 0 ? '#c4b5fd' : '#7c6eff'}
                        filter={i === 0 ? 'url(#glow-node)' : 'url(#glow-nn)'}
                        className={`nn-node ${i === 0 ? 'nn-node-center' : ''}`}
                        style={{ animationDelay: `${i * 0.1}s` }}
                    />
                ))}
            </svg>
        </div>
    );
}

// ─── Rotating gradient rings ──────────────────────────────────────────────────
function GlowRing({ visible, finalGlow }) {
    return (
        <div className={`splash-ring-wrap ${visible ? 'splash-ring-visible' : ''} ${finalGlow ? 'ring-final-glow' : ''}`}>
            <div className="splash-ring splash-ring-1" />
            <div className="splash-ring splash-ring-2" />
            <div className="splash-ring splash-ring-pulse" />
        </div>
    );
}

// ─── Main splash screen ───────────────────────────────────────────────────────
export default function SplashScreen({ onDone }) {
    // phases: 0=enter 1=ring+net 2=title 3=progress+messages 4=exit-glow 5=done
    const [phase,      setPhase]     = useState(0);
    const [progress,   setProgress]  = useState(0);
    const [msgIdx,     setMsgIdx]    = useState(0);
    const [msgVisible, setMsgVisible]= useState(true);

    // ── Phase sequencer ───────────────────────────────────────────────────────
    useEffect(() => {
        const t1 = setTimeout(() => setPhase(1), 800);    // ring + net fade in
        const t2 = setTimeout(() => setPhase(2), 1600);   // title slides up
        const t3 = setTimeout(() => setPhase(3), 2400);   // progress bar appears
        const t4 = setTimeout(() => setPhase(4), 4600);   // logo final glow burst
        const t5 = setTimeout(() => onDone(),    5100);   // hand off to app
        return () => [t1,t2,t3,t4,t5].forEach(clearTimeout);
    }, [onDone]);

    // ── Progress bar — fills 0→100 over 4 seconds ────────────────────────────
    useEffect(() => {
        if (phase < 3) return;
        let start = null;
        const DURATION = 4000;
        const tick = ts => {
            if (!start) start = ts;
            const elapsed = ts - start;
            setProgress(Math.min(100, (elapsed / DURATION) * 100));
            if (elapsed < DURATION) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
    }, [phase]);

    // ── Message rotation — fade out/in every 1 second ────────────────────────
    useEffect(() => {
        if (phase < 3) return;
        const cycle = setInterval(() => {
            setMsgVisible(false);
            setTimeout(() => {
                setMsgIdx(i => (i + 1) % MESSAGES.length);
                setMsgVisible(true);
            }, 280);
        }, 1000);
        return () => clearInterval(cycle);
    }, [phase]);

    const isExiting   = phase === 4;
    const showFinalGlow = phase >= 4;

    return (
        <div className={`splash-root ${isExiting ? 'splash-exit' : ''}`}>

            {/* Particles */}
            <ParticleCanvas />

            {/* Background orbs */}
            <div className="splash-orb splash-orb-1" />
            <div className="splash-orb splash-orb-2" />
            <div className="splash-orb splash-orb-3" />

            {/* Floating icons — ambient, low opacity */}
            {ICONS.map((ic, i) => (
                <div
                    key={i}
                    className="splash-float-icon"
                    style={{
                        left:            `${ic.x}%`,
                        top:             `${ic.y}%`,
                        fontSize:         ic.size,
                        animationDuration:`${ic.speed}s`,
                        animationDelay:  `${i * 0.5}s`,
                    }}
                >
                    {ic.emoji}
                </div>
            ))}

            {/* ── Center stage ─────────────────────────────────────────────── */}
            <div className="splash-center">

                {/* Neural network — appears at phase 1 */}
                <div className={`splash-neural-wrap ${phase >= 1 ? 'nn-visible' : ''}`}>
                    <NeuralNet />
                </div>

                {/* Glow rings — appear at phase 1 */}
                <GlowRing visible={phase >= 1} finalGlow={showFinalGlow} />

                {/* Logo — enters immediately, scale 0.9 → 1 over 600ms */}
                <div className={`splash-logo-wrap logo-enter ${showFinalGlow ? 'logo-final-glow' : ''}`}>
                    <div className="splash-logo-inner">
                        <div className="splash-logo-icon">
                            <svg width="60" height="60" viewBox="0 0 52 52" fill="none">
                                <circle cx="26" cy="26" r="26" fill="url(#splashLogoGrad)" />
                                <polygon points="21,16 21,36 38,26" fill="white" opacity="0.95" />
                                <defs>
                                    <radialGradient id="splashLogoGrad" cx="35%" cy="30%">
                                        <stop offset="0%"   stopColor="#c4b5fd"/>
                                        <stop offset="60%"  stopColor="#7c6eff"/>
                                        <stop offset="100%" stopColor="#5440e0"/>
                                    </radialGradient>
                                </defs>
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Title — slides up at phase 2 */}
                <div className={`splash-title-block ${phase >= 2 ? 'title-enter' : ''}`}>
                    <h1 className="splash-title">
                        <span className="splash-title-yt">YT</span>
                        <span className="splash-title-learn">Learn</span>
                    </h1>
                    <p className="splash-subtitle">Study Cockpit</p>
                </div>

                {/* Progress — appears at phase 3 */}
                <div className={`splash-progress-wrap ${phase >= 3 ? 'progress-enter' : ''}`}>
                    <div className="splash-progress-track">
                        <div
                            className="splash-progress-fill"
                            style={{ width: `${progress}%` }}
                        >
                            <div className="splash-progress-shine" />
                        </div>
                    </div>
                    <p className={`splash-msg ${msgVisible ? 'msg-visible' : 'msg-hidden'}`}>
                        {MESSAGES[msgIdx]}
                    </p>
                </div>

            </div>

            {/* Version badge */}
            <div className="splash-version">v2.0 · YTLearn Study Cockpit</div>

        </div>
    );
}
