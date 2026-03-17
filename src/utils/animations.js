/**
 * animations.js — Centralized Framer Motion variants + animation helpers
 *
 * Import what you need:
 *   import { fadeIn, slideUp, stagger, hoverLift } from '../utils/animations';
 */

// ─── Fade ────────────────────────────────────────────────────────────────────
export const fadeIn = {
    hidden:  { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.45, ease: 'easeOut' } },
    exit:    { opacity: 0, transition: { duration: 0.25, ease: 'easeIn'  } },
};

export const fadeInSlow = {
    hidden:  { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.8, ease: 'easeOut' } },
};

// ─── Slide ───────────────────────────────────────────────────────────────────
export const slideUp = {
    hidden:  { opacity: 0, y: 28 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.34, 1.3, 0.64, 1] } },
    exit:    { opacity: 0, y: -16, transition: { duration: 0.22, ease: 'easeIn' } },
};

export const slideDown = {
    hidden:  { opacity: 0, y: -24 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
    exit:    { opacity: 0, y: -16, transition: { duration: 0.22 } },
};

export const slideLeft = {
    hidden:  { opacity: 0, x: 40 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.45, ease: [0.34, 1.2, 0.64, 1] } },
    exit:    { opacity: 0, x: 40, transition: { duration: 0.22 } },
};

export const slideRight = {
    hidden:  { opacity: 0, x: -40 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.45, ease: [0.34, 1.2, 0.64, 1] } },
    exit:    { opacity: 0, x: -40, transition: { duration: 0.22 } },
};

// ─── Scale ───────────────────────────────────────────────────────────────────
export const scaleIn = {
    hidden:  { opacity: 0, scale: 0.88 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.4, ease: [0.34, 1.4, 0.64, 1] } },
    exit:    { opacity: 0, scale: 0.92, transition: { duration: 0.2 } },
};

export const scaleInSpring = {
    hidden:  { opacity: 0, scale: 0.8 },
    visible: { opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 350, damping: 22 } },
};

// ─── Stagger container ───────────────────────────────────────────────────────
export function stagger(delay = 0.08, delayStart = 0) {
    return {
        hidden:  {},
        visible: { transition: { staggerChildren: delay, delayChildren: delayStart } },
    };
}

// ─── Hover interactions (use on whileHover / whileTap props directly) ─────────
export const hoverLift = {
    y: -4,
    boxShadow: '0 12px 40px rgba(124,110,255,0.25)',
    transition: { duration: 0.22, ease: 'easeOut' },
};

export const hoverScale = { scale: 1.04, transition: { duration: 0.18, ease: 'easeOut' } };
export const tapScale   = { scale: 0.96 };
export const hoverGlow  = { boxShadow: '0 0 20px rgba(124,110,255,0.45)', transition: { duration: 0.2 } };

// ─── Page transition ─────────────────────────────────────────────────────────
export const pageTransition = {
    hidden:  { opacity: 0, y: 18, filter: 'blur(4px)' },
    visible: {
        opacity: 1, y: 0, filter: 'blur(0px)',
        transition: { duration: 0.42, ease: [0.25, 0.46, 0.45, 0.94] },
    },
    exit: {
        opacity: 0, y: -12, filter: 'blur(3px)',
        transition: { duration: 0.25, ease: 'easeIn' },
    },
};

// ─── Blur reveal ─────────────────────────────────────────────────────────────
export const blurReveal = {
    hidden:  { opacity: 0, filter: 'blur(12px)', scale: 1.04 },
    visible: {
        opacity: 1, filter: 'blur(0px)', scale: 1,
        transition: { duration: 0.6, ease: 'easeOut' },
    },
};

// ─── Flip card ───────────────────────────────────────────────────────────────
export const flipFront = {
    initial:  { rotateY: 0   },
    flipped:  { rotateY: 180 },
    transition: { duration: 0.55, ease: [0.4, 0, 0.2, 1] },
};

export const flipBack = {
    initial:  { rotateY: 180 },
    flipped:  { rotateY: 0   },
    transition: { duration: 0.55, ease: [0.4, 0, 0.2, 1] },
};

// ─── Notification / pulse ────────────────────────────────────────────────────
export const notifBounce = {
    hidden:  { opacity: 0, scale: 0.7, y: 20 },
    visible: {
        opacity: 1, scale: 1, y: 0,
        transition: { type: 'spring', stiffness: 400, damping: 18 },
    },
    exit: {
        opacity: 0, scale: 0.85, y: -10,
        transition: { duration: 0.2 },
    },
};

// ─── Accordion ───────────────────────────────────────────────────────────────
export const accordionContent = {
    hidden:  { height: 0, opacity: 0, overflow: 'hidden' },
    visible: { height: 'auto', opacity: 1, overflow: 'hidden', transition: { duration: 0.32, ease: 'easeOut' } },
    exit:    { height: 0, opacity: 0, overflow: 'hidden', transition: { duration: 0.25, ease: 'easeIn'  } },
};

// ─── Skeleton shimmer helper ──────────────────────────────────────────────────
export const shimmerTransition = {
    duration: 1.4,
    repeat: Infinity,
    ease: 'linear',
};

// ─── Typing cursor blink ──────────────────────────────────────────────────────
export const cursorBlink = {
    animate: { opacity: [1, 0] },
    transition: { duration: 0.55, repeat: Infinity, repeatType: 'reverse' },
};

// ─── XP / progress bar ───────────────────────────────────────────────────────
export function xpBarVariant(pct) {
    return {
        hidden:  { width: '0%' },
        visible: { width: `${pct}%`, transition: { duration: 1.1, ease: [0.34, 1.1, 0.64, 1], delay: 0.3 } },
    };
}

// ─── Floating (hero images / icons) ──────────────────────────────────────────
export const floatingY = {
    animate: {
        y: [0, -12, 0],
        transition: { duration: 3.5, repeat: Infinity, ease: 'easeInOut' },
    },
};

export const floatingRotate = {
    animate: {
        rotate: [0, 3, -3, 0],
        y:      [0, -8, 0],
        transition: { duration: 4, repeat: Infinity, ease: 'easeInOut' },
    },
};
