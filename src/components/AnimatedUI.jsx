/**
 * Animated UI Components — drop-in replacements for plain elements.
 *
 * Usage:
 *   import { AnimatedCard, RippleButton, SkeletonCard, MagneticButton,
 *            PageWrapper, TypingText, NeonTitle, ScrollReveal } from './AnimatedUI';
 */

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring } from 'framer-motion';
import {
    fadeIn, slideUp, scaleIn, scaleInSpring,
    hoverLift, hoverScale, tapScale,
    pageTransition, notifBounce, stagger,
} from '../utils/animations';
import './AnimatedUI.css';

// ─────────────────────────────────────────────────────────────────────────────
// 1. PAGE WRAPPER — fade + slide + blur on every route change
// ─────────────────────────────────────────────────────────────────────────────
export function PageWrapper({ children, className = '' }) {
    return (
        <motion.div
            className={className}
            variants={pageTransition}
            initial="hidden"
            animate="visible"
            exit="exit"
        >
            {children}
        </motion.div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. ANIMATED CARD — hover lift + shadow glow + 3D tilt
// ─────────────────────────────────────────────────────────────────────────────
export function AnimatedCard({ children, className = '', tilt = false, glow = false, delay = 0, onClick }) {
    const ref       = useRef(null);
    const rotX      = useMotionValue(0);
    const rotY      = useMotionValue(0);
    const sRotX     = useSpring(rotX, { stiffness: 200, damping: 20 });
    const sRotY     = useSpring(rotY, { stiffness: 200, damping: 20 });

    const onMouseMove = useCallback(e => {
        if (!tilt || !ref.current) return;
        const { left, top, width, height } = ref.current.getBoundingClientRect();
        const xPct = ((e.clientX - left) / width  - 0.5) * 18;
        const yPct = ((e.clientY - top)  / height - 0.5) * 18;
        rotX.set(-yPct);
        rotY.set(xPct);
    }, [tilt, rotX, rotY]);

    const onMouseLeave = useCallback(() => { rotX.set(0); rotY.set(0); }, [rotX, rotY]);

    return (
        <motion.div
            ref={ref}
            className={`anim-card ${glow ? 'anim-card-glow' : ''} ${className}`}
            variants={slideUp}
            initial="hidden"
            animate="visible"
            whileHover={hoverLift}
            whileTap={tapScale}
            transition={{ delay }}
            style={tilt ? { rotateX: sRotX, rotateY: sRotY, transformPerspective: 800 } : {}}
            onMouseMove={onMouseMove}
            onMouseLeave={onMouseLeave}
            onClick={onClick}
        >
            {children}
        </motion.div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. RIPPLE BUTTON — click ripple + scale press + magnetic hover
// ─────────────────────────────────────────────────────────────────────────────
export function RippleButton({
    children, className = '', onClick, disabled = false,
    variant = 'primary', magnetic = false, type = 'button',
}) {
    const [ripples, setRipples] = useState([]);
    const btnRef  = useRef(null);
    const mouseX  = useMotionValue(0);
    const mouseY  = useMotionValue(0);
    const mX      = useSpring(mouseX, { stiffness: 300, damping: 25 });
    const mY      = useSpring(mouseY, { stiffness: 300, damping: 25 });

    const handleClick = e => {
        if (disabled) return;
        const rect = btnRef.current.getBoundingClientRect();
        const id   = Date.now();
        setRipples(r => [...r, { id, x: e.clientX - rect.left, y: e.clientY - rect.top }]);
        setTimeout(() => setRipples(r => r.filter(rp => rp.id !== id)), 600);
        onClick?.(e);
    };

    const handleMouseMove = e => {
        if (!magnetic || !btnRef.current) return;
        const rect  = btnRef.current.getBoundingClientRect();
        const mx    = (e.clientX - rect.left - rect.width  / 2) * 0.3;
        const my    = (e.clientY - rect.top  - rect.height / 2) * 0.3;
        mouseX.set(mx); mouseY.set(my);
    };
    const handleMouseLeave = () => { mouseX.set(0); mouseY.set(0); };

    return (
        <motion.button
            ref={btnRef}
            type={type}
            className={`ripple-btn ripple-btn-${variant} ${disabled ? 'ripple-btn-disabled' : ''} ${className}`}
            whileHover={!disabled ? hoverScale : {}}
            whileTap={!disabled ? tapScale : {}}
            style={magnetic ? { x: mX, y: mY } : {}}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onClick={handleClick}
            disabled={disabled}
        >
            {ripples.map(r => (
                <span key={r.id} className="ripple-circle" style={{ left: r.x, top: r.y }} />
            ))}
            {children}
        </motion.button>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. SKELETON LOADER — shimmer placeholders
// ─────────────────────────────────────────────────────────────────────────────
export function Skeleton({ width = '100%', height = 16, radius = 8, className = '' }) {
    return (
        <div className={`skeleton ${className}`} style={{ width, height, borderRadius: radius }} />
    );
}

export function SkeletonCard({ lines = 3 }) {
    return (
        <div className="skeleton-card">
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 14 }}>
                <Skeleton width={44} height={44} radius={50} />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <Skeleton width="60%" height={14} />
                    <Skeleton width="40%" height={11} />
                </div>
            </div>
            {Array.from({ length: lines }, (_, i) => (
                <Skeleton key={i} width={i === lines - 1 ? '70%' : '100%'} height={12} className="skeleton-line" />
            ))}
        </div>
    );
}

export function SkeletonGrid({ count = 4, cols = 2 }) {
    return (
        <div className="skeleton-grid" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
            {Array.from({ length: count }, (_, i) => <SkeletonCard key={i} />)}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. SCROLL REVEAL — animate when element enters viewport
// ─────────────────────────────────────────────────────────────────────────────
export function ScrollReveal({ children, className = '', variant = 'slideUp', delay = 0 }) {
    const VARIANTS = { fadeIn, slideUp, scaleIn };
    return (
        <motion.div
            className={className}
            variants={VARIANTS[variant] || slideUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            transition={{ delay }}
        >
            {children}
        </motion.div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. STAGGER LIST — children animate in sequence
// ─────────────────────────────────────────────────────────────────────────────
export function StaggerList({ children, className = '', delayStart = 0, childDelay = 0.07 }) {
    return (
        <motion.div
            className={className}
            variants={stagger(childDelay, delayStart)}
            initial="hidden"
            animate="visible"
        >
            {React.Children.map(children, (child, i) =>
                child ? (
                    <motion.div key={i} variants={slideUp}>
                        {child}
                    </motion.div>
                ) : null
            )}
        </motion.div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. TYPING TEXT — typewriter effect
// ─────────────────────────────────────────────────────────────────────────────
export function TypingText({ text, speed = 45, className = '', onDone }) {
    const [displayed, setDisplayed] = useState('');
    const [done,      setDone]      = useState(false);

    useEffect(() => {
        setDisplayed('');
        setDone(false);
        let i = 0;
        const interval = setInterval(() => {
            if (i < text.length) {
                setDisplayed(text.slice(0, ++i));
            } else {
                clearInterval(interval);
                setDone(true);
                onDone?.();
            }
        }, speed);
        return () => clearInterval(interval);
    }, [text, speed, onDone]);

    return (
        <span className={`typing-text ${className}`}>
            {displayed}
            {!done && <span className="typing-cursor">|</span>}
        </span>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// 8. NEON TITLE — glow + gradient text
// ─────────────────────────────────────────────────────────────────────────────
export function NeonTitle({ children, className = '', as: Tag = 'h2', color = 'violet' }) {
    return (
        <motion.div
            variants={scaleInSpring}
            initial="hidden"
            animate="visible"
        >
            <Tag className={`neon-title neon-${color} ${className}`}>
                {children}
            </Tag>
        </motion.div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// 9. ANIMATED NOTIFICATION TOAST
// ─────────────────────────────────────────────────────────────────────────────
export function AnimatedToast({ show, children, className = '' }) {
    return (
        <AnimatePresence>
            {show && (
                <motion.div
                    className={`anim-toast ${className}`}
                    variants={notifBounce}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                >
                    {children}
                </motion.div>
            )}
        </AnimatePresence>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// 10. ANIMATED MODAL
// ─────────────────────────────────────────────────────────────────────────────
export function AnimatedModal({ show, onClose, children, className = '' }) {
    return (
        <AnimatePresence>
            {show && (
                <>
                    <motion.div
                        className="anim-modal-bg"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        onClick={onClose}
                    />
                    <motion.div
                        className={`anim-modal ${className}`}
                        variants={scaleIn}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                    >
                        {children}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// 11. ANIMATED PROGRESS BAR (XP / loading)
// ─────────────────────────────────────────────────────────────────────────────
export function AnimatedProgressBar({ pct = 0, color = 'var(--grad-violet)', height = 8, delay = 0.3 }) {
    return (
        <div className="anim-progress-track" style={{ height }}>
            <motion.div
                className="anim-progress-fill"
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 1.1, ease: [0.34, 1.1, 0.64, 1], delay }}
                style={{ background: color, height: '100%', borderRadius: 99 }}
            />
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// 12. PULSE DOT — live / notification indicators
// ─────────────────────────────────────────────────────────────────────────────
export function PulseDot({ color = '#00ff88', size = 8 }) {
    return (
        <span className="pulse-dot-wrap" style={{ width: size, height: size }}>
            <motion.span
                className="pulse-dot-ring"
                style={{ borderColor: color }}
                animate={{ scale: [1, 2.2], opacity: [0.7, 0] }}
                transition={{ duration: 1.4, repeat: Infinity, ease: 'easeOut' }}
            />
            <span className="pulse-dot-core" style={{ background: color, width: size, height: size }} />
        </span>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// 13. INFINITE MARQUEE — scrolling banner
// ─────────────────────────────────────────────────────────────────────────────
export function Marquee({ children, speed = 30, className = '' }) {
    return (
        <div className={`marquee-outer ${className}`}>
            <motion.div
                className="marquee-inner"
                animate={{ x: ['0%', '-50%'] }}
                transition={{ duration: speed, repeat: Infinity, ease: 'linear' }}
            >
                {children}{children}
            </motion.div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// 14. ACCORDION — expand/collapse
// ─────────────────────────────────────────────────────────────────────────────
export function Accordion({ title, children, defaultOpen = false, icon }) {
    const [open, setOpen] = useState(defaultOpen);
    return (
        <div className="accordion-wrap">
            <motion.button
                className="accordion-trigger"
                onClick={() => setOpen(o => !o)}
                whileHover={{ backgroundColor: 'rgba(124,110,255,0.06)' }}
            >
                <span className="accordion-icon">{icon}</span>
                <span className="accordion-title">{title}</span>
                <motion.span
                    className="accordion-chevron"
                    animate={{ rotate: open ? 180 : 0 }}
                    transition={{ duration: 0.25 }}
                >
                    ▾
                </motion.span>
            </motion.button>
            <AnimatePresence initial={false}>
                {open && (
                    <motion.div
                        key="content"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                        style={{ overflow: 'hidden' }}
                    >
                        <div className="accordion-content">
                            {children}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// 15. FLIP CARD — front/back (flashcards)
// ─────────────────────────────────────────────────────────────────────────────
export function FlipCard({ front, back, className = '' }) {
    const [flipped, setFlipped] = useState(false);
    return (
        <div
            className={`flip-card-scene ${className}`}
            onClick={() => setFlipped(f => !f)}
        >
            <motion.div
                className="flip-card-body"
                animate={{ rotateY: flipped ? 180 : 0 }}
                transition={{ duration: 0.55, ease: [0.4, 0, 0.2, 1] }}
                style={{ transformStyle: 'preserve-3d' }}
            >
                <div className="flip-card-face flip-card-front">{front}</div>
                <div className="flip-card-face flip-card-back">{back}</div>
            </motion.div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// 16. GRADIENT BACKGROUND — morphing animated gradient
// ─────────────────────────────────────────────────────────────────────────────
export function AnimatedGradientBg({ className = '', children }) {
    return (
        <div className={`anim-gradient-bg ${className}`}>
            {children}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// 17. BLUR REVEAL IMAGE
// ─────────────────────────────────────────────────────────────────────────────
export function BlurRevealImage({ src, alt, className = '' }) {
    const [loaded, setLoaded] = useState(false);
    return (
        <motion.img
            src={src}
            alt={alt}
            className={className}
            onLoad={() => setLoaded(true)}
            animate={loaded
                ? { opacity: 1, filter: 'blur(0px)', scale: 1 }
                : { opacity: 0, filter: 'blur(12px)', scale: 1.04 }
            }
            transition={{ duration: 0.55, ease: 'easeOut' }}
        />
    );
}


// ─────────────────────────────────────────────────────────────────────────────
// 19. SVG PATH DRAW — animated logo/icon stroke
// ─────────────────────────────────────────────────────────────────────────────
export function SVGPathDraw({ d, stroke = '#7c6eff', strokeWidth = 2, duration = 1.5, className = '' }) {
    return (
        <svg className={className} viewBox="0 0 100 100" fill="none">
            <motion.path
                d={d}
                stroke={stroke}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration, ease: 'easeInOut' }}
            />
        </svg>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// 20. LIQUID BUTTON — hero CTA with gradient morphing border
// ─────────────────────────────────────────────────────────────────────────────
export function LiquidButton({ children, onClick, className = '' }) {
    return (
        <motion.button
            className={`liquid-btn ${className}`}
            whileHover={{ scale: 1.05, boxShadow: '0 0 40px rgba(124,110,255,0.6)' }}
            whileTap={{ scale: 0.97 }}
            onClick={onClick}
        >
            <span className="liquid-btn-text">{children}</span>
            <span className="liquid-btn-glow" />
        </motion.button>
    );
}
