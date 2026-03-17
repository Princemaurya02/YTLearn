import React, { useState, useMemo } from 'react';
import {
    Trophy, Lock, Zap, CheckCircle, ChevronDown, ChevronUp,
    Flame, Clock, Target, BookOpen, Star, Filter, TrendingUp,
    StickyNote, Users, Brain, Award
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import './Achievements.css';

const TABS = ['All', 'In Progress', 'Completed'];

const CATEGORY_META = {
    Streak: { icon: Flame, color: '#ff9a3c' },
    'Study Time': { icon: Clock, color: '#00d4ff' },
    Milestone: { icon: Trophy, color: '#ffb347' },
    Focus: { icon: Target, color: '#00ff88' },
    Notes: { icon: StickyNote, color: '#a78bfa' },
    Learning: { icon: BookOpen, color: '#7c6eff' },
    Social: { icon: Users, color: '#ff6b9d' },
    Habit: { icon: Star, color: '#fde68a' },
    Challenge: { icon: Brain, color: '#f472b6' },
};

const CATEGORIES = ['All', ...Object.keys(CATEGORY_META)];

const RARITY_COLORS = {
    Common: { bg: 'rgba(152,152,184,0.12)', border: '#9898b860', label: '#9898b8' },
    Rare: { bg: 'rgba(124,110,255,0.12)', border: '#7c6eff60', label: '#7c6eff' },
    Epic: { bg: 'rgba(0,212,255,0.10)', border: '#00d4ff55', label: '#00d4ff' },
    Legendary: { bg: 'rgba(255,179,71,0.12)', border: '#ffb34766', label: '#ffb347' },
};

function getRarity(xp) {
    if (xp >= 1000) return 'Legendary';
    if (xp >= 400) return 'Epic';
    if (xp >= 150) return 'Rare';
    return 'Common';
}

function ProgressBar({ value, total, color = '#7c6eff' }) {
    const pct = total > 0 ? Math.min(100, (value / total) * 100) : 0;
    return (
        <div className="ach-prog-track">
            <div
                className="ach-prog-fill"
                style={{ width: `${pct}%`, background: color }}
            />
        </div>
    );
}

function AchievementCard({ ach, expanded, onToggle }) {
    const rarity = getRarity(ach.xp);
    const colors = RARITY_COLORS[rarity];
    const catMeta = CATEGORY_META[ach.category] || { icon: Award, color: '#9898b8' };
    const CatIcon = catMeta.icon;
    const pct = ach.total > 0 ? Math.min(100, Math.round((ach.progress / ach.total) * 100)) : 0;

    return (
        <div
            className={`ach-card2 ${ach.unlocked ? 'unlocked' : 'locked'} ${expanded ? 'expanded' : ''}`}
            style={{
                background: ach.unlocked ? colors.bg : undefined,
                borderColor: ach.unlocked ? colors.border : undefined,
            }}
        >
            {/* ── Main row ─────────────────────────────────────── */}
            <div className="ach-card2-main">

                {/* Emoji badge */}
                <div className="ach-badge" style={{ background: ach.unlocked ? catMeta.color + '22' : undefined }}>
                    <span className="ach-badge-emoji">{ach.unlocked ? ach.emoji : '🔒'}</span>
                    {ach.unlocked && <div className="ach-badge-glow" style={{ background: catMeta.color }} />}
                </div>

                {/* Info */}
                <div className="ach-body">
                    <div className="ach-top-row">
                        <span className="ach-name2">{ach.name}</span>
                        <div className="ach-chips">
                            <span className="ach-rarity-chip" style={{ color: colors.label, background: colors.bg, borderColor: colors.border }}>
                                {rarity}
                            </span>
                            <span className="ach-cat-chip" style={{ color: catMeta.color }}>
                                <CatIcon size={10} /> {ach.category}
                            </span>
                        </div>
                    </div>
                    <div className="ach-desc2">{ach.desc}</div>

                    {/* Progress bar (only for in-progress) */}
                    {!ach.unlocked && ach.total > 1 && (
                        <div className="ach-prog-row">
                            <ProgressBar value={ach.progress} total={ach.total} color={catMeta.color} />
                            <span className="ach-prog-label">
                                {ach.progress} / {ach.total}
                                &nbsp;·&nbsp;{pct}%
                            </span>
                        </div>
                    )}

                    {/* Unlocked stamp */}
                    {ach.unlocked && (
                        <div className="ach-unlocked-stamp">
                            <CheckCircle size={13} style={{ color: '#00ff88' }} />
                            <span>Completed{ach.unlockedAt ? ` · ${ach.unlockedAt}` : ''}</span>
                        </div>
                    )}
                </div>

                {/* Right: XP + expand */}
                <div className="ach-card2-right">
                    <div className={`ach-xp-tag ${ach.unlocked ? 'earned' : ''}`}>
                        <Zap size={11} />
                        {ach.unlocked ? '+' : ''}{ach.xp} XP
                    </div>
                    <button
                        className="ach-expand-btn"
                        onClick={onToggle}
                        title={expanded ? 'Hide details' : 'Learn more'}
                    >
                        {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        <span>{expanded ? 'Less' : 'Learn More'}</span>
                    </button>
                </div>
            </div>

            {/* ── Expanded "Learn More" panel ─────────────────── */}
            {expanded && (
                <div className="ach-detail-panel">
                    <div className="ach-detail-how">
                        <span className="ach-detail-label">How to unlock</span>
                        <p>{ach.how}</p>
                    </div>
                    {!ach.unlocked && (
                        <div className="ach-detail-progress">
                            <span className="ach-detail-label">Your progress</span>
                            {ach.total === 1 ? (
                                <p>Not yet unlocked.</p>
                            ) : (
                                <>
                                    <ProgressBar value={ach.progress} total={ach.total} color={catMeta.color} />
                                    <p className="ach-detail-nums">
                                        <strong style={{ color: catMeta.color }}>{ach.progress}</strong>
                                        &nbsp;/&nbsp;{ach.total} completed &nbsp;·&nbsp; {pct}% done
                                    </p>
                                </>
                            )}
                        </div>
                    )}
                    {ach.unlocked && (
                        <div className="ach-detail-done">
                            <CheckCircle size={16} style={{ color: '#00ff88' }} />
                            <span>Achievement unlocked! You earned <strong>+{ach.xp} XP</strong>.</span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default function Achievements() {
    const { user, computedAchievements = [] } = useApp();

    const [tab, setTab] = useState('All');
    const [category, setCategory] = useState('All');
    const [expandedId, setExpandedId] = useState(null);

    const unlockedList = computedAchievements.filter(a => a.unlocked);
    const inProgress = computedAchievements.filter(a => !a.unlocked && a.progress > 0);
    const total = computedAchievements.length;
    const totalXP = unlockedList.reduce((acc, a) => acc + a.xp, 0);

    // Apply tab + category filter
    const displayed = useMemo(() => {
        return computedAchievements.filter(a => {
            const tabOk =
                tab === 'All' ? true :
                    tab === 'In Progress' ? (!a.unlocked && a.progress > 0) :
                        tab === 'Completed' ? a.unlocked :
                            true;
            const catOk = category === 'All' || a.category === category;
            return tabOk && catOk;
        });
    }, [computedAchievements, tab, category]);

    function toggleExpanded(id) {
        setExpandedId(prev => prev === id ? null : id);
    }

    return (
        <div className="achievements-page2">

            {/* ── Header Stats ─────────────────────────────────────────── */}
            <div className="ach-hero">
                <div className="ach-hero-stat">
                    <Trophy size={28} style={{ color: '#ffb347' }} />
                    <div>
                        <div className="ach-hero-val">{unlockedList.length}<span>/{total}</span></div>
                        <div className="ach-hero-label">Achievements</div>
                    </div>
                </div>

                <div className="ach-hero-bar-wrap">
                    <div className="ach-hero-bar-label">
                        <span>Overall Progress</span>
                        <span>{Math.round((unlockedList.length / Math.max(1, total)) * 100)}%</span>
                    </div>
                    <div className="ach-hero-bar-track">
                        <div
                            className="ach-hero-bar-fill"
                            style={{ width: `${(unlockedList.length / Math.max(1, total)) * 100}%` }}
                        />
                    </div>
                    <div className="ach-hero-sub">
                        {inProgress.length} in progress · {total - unlockedList.length - inProgress.length} locked
                    </div>
                </div>

                <div className="ach-hero-stat">
                    <Zap size={28} style={{ color: '#7c6eff' }} />
                    <div>
                        <div className="ach-hero-val">{totalXP.toLocaleString()}</div>
                        <div className="ach-hero-label">XP from Badges</div>
                    </div>
                </div>

                <div className="ach-hero-stat">
                    <TrendingUp size={28} style={{ color: '#00d4ff' }} />
                    <div>
                        <div className="ach-hero-val">{user.xp.toLocaleString()}</div>
                        <div className="ach-hero-label">Total XP</div>
                    </div>
                </div>
            </div>

            {/* ── Tab Bar ──────────────────────────────────────────────── */}
            <div className="ach-tabs">
                {TABS.map(t => (
                    <button
                        key={t}
                        className={`ach-tab ${tab === t ? 'active' : ''}`}
                        onClick={() => { setTab(t); setExpandedId(null); }}
                    >
                        {t === 'Completed' && <CheckCircle size={13} />}
                        {t === 'In Progress' && <TrendingUp size={13} />}
                        {t === 'All' && <Trophy size={13} />}
                        {t}
                        <span className="ach-tab-count">
                            {t === 'All' ? total :
                                t === 'In Progress' ? inProgress.length :
                                    unlockedList.length}
                        </span>
                    </button>
                ))}
            </div>

            {/* ── Category Filter ───────────────────────────────────────── */}
            <div className="ach-cats">
                {CATEGORIES.map(cat => {
                    const meta = CATEGORY_META[cat];
                    return (
                        <button
                            key={cat}
                            className={`ach-cat-btn ${category === cat ? 'active' : ''}`}
                            onClick={() => setCategory(cat)}
                            style={category === cat && meta ? { borderColor: meta.color, color: meta.color } : undefined}
                        >
                            {meta && React.createElement(meta.icon, { size: 12 })}
                            {cat}
                        </button>
                    );
                })}
            </div>

            {/* ── Results count ─────────────────────────────────────────── */}
            <div className="ach-results-count">
                Showing {displayed.length} achievement{displayed.length !== 1 ? 's' : ''}
            </div>

            {/* ── Achievement List ──────────────────────────────────────── */}
            {displayed.length > 0 ? (
                <div className="ach-list">
                    {displayed.map(ach => (
                        <AchievementCard
                            key={ach.id}
                            ach={ach}
                            expanded={expandedId === ach.id}
                            onToggle={() => toggleExpanded(ach.id)}
                        />
                    ))}
                </div>
            ) : (
                <div className="ach-empty">
                    <Trophy size={48} style={{ opacity: 0.25 }} />
                    <h3>No achievements here yet</h3>
                    <p>Start studying to unlock achievements and earn XP!</p>
                </div>
            )}
        </div>
    );
}
