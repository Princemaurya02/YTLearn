import React, { useLayoutEffect, useRef, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LayoutDashboard, PlaySquare, FileText, Trophy, User,
} from 'lucide-react';
import './BottomNav.css';

const BOTTOM_ITEMS = [
    { path: '/',             icon: LayoutDashboard, label: 'Home'     },
    { path: '/library',      icon: PlaySquare,      label: 'Library'  },
    { path: '/notes',        icon: FileText,        label: 'Notes'    },
    { path: '/achievements', icon: Trophy,          label: 'Earn'     },
    { path: '/profile',      icon: User,            label: 'Profile'  },
];

export default function BottomNav() {
    const location = useLocation();
    const navRef   = useRef(null);
    const [pill, setPill] = useState({ x: 0, w: 0 });

    // Calculate the floating pill position under the active item
    useLayoutEffect(() => {
        if (!navRef.current) return;
        const activeEl = navRef.current.querySelector('.bn-item.active');
        if (activeEl) {
            const navRect  = navRef.current.getBoundingClientRect();
            const itemRect = activeEl.getBoundingClientRect();
            setPill({
                x: itemRect.left - navRect.left + (itemRect.width - 48) / 2,
                w: 48,
            });
        }
    }, [location.pathname]);

    // Hide on player page (full-screen video)
    if (location.pathname.startsWith('/player/')) return null;

    return (
        <nav className="bottom-nav" ref={navRef} role="navigation" aria-label="Mobile navigation">
            {/* Floating active indicator pill */}
            <motion.div
                className="bn-pill"
                animate={{ x: pill.x, width: pill.w }}
                transition={{ type: 'spring', stiffness: 420, damping: 34 }}
            />

            {BOTTOM_ITEMS.map(({ path, icon: Icon, label }) => {
                const isActive = path === '/'
                    ? location.pathname === '/'
                    : location.pathname.startsWith(path);

                return (
                    <NavLink
                        key={path}
                        to={path}
                        end={path === '/'}
                        className={`bn-item ${isActive ? 'active' : ''}`}
                        aria-label={label}
                    >
                        <motion.div
                            className="bn-icon-wrap"
                            animate={isActive
                                ? { scale: 1.18, y: -3 }
                                : { scale: 1,    y: 0  }
                            }
                            whileTap={{ scale: 0.82 }}
                            transition={{ type: 'spring', stiffness: 500, damping: 28 }}
                        >
                            <Icon size={21} strokeWidth={isActive ? 2.2 : 1.7} />
                        </motion.div>
                        <AnimatePresence>
                            {isActive && (
                                <motion.span
                                    className="bn-label"
                                    initial={{ opacity: 0, y: 4 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{   opacity: 0, y: 4 }}
                                    transition={{ duration: 0.18 }}
                                >
                                    {label}
                                </motion.span>
                            )}
                        </AnimatePresence>
                    </NavLink>
                );
            })}
        </nav>
    );
}
