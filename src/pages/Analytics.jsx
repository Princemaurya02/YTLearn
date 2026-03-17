import React, { useState, useRef } from 'react';
import {
    BarChart3, TrendingUp, Clock, Target, Zap, Brain,
    Calendar, Flame, Trophy, Activity, Eye
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAnalytics } from '../hooks/useAnalytics';
import {
    AreaChart, Area, BarChart, Bar,
    XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, LineChart, Line,
    RadarChart, Radar, PolarGrid, PolarAngleAxis
} from 'recharts';
import './Analytics.css';

// ─── Shared chart style ───────────────────────────────────────────────────────
const tooltipStyle = {
    background: '#12121f',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 8,
    color: '#f0f0ff',
    fontSize: 12,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtMins(m) {
    if (m <= 0) return '0m';
    const h = Math.floor(m / 60);
    const min = m % 60;
    return h > 0 ? `${h}h ${min > 0 ? `${min}m` : ''}`.trim() : `${min}m`;
}

function fmtSecs(s) {
    return fmtMins(Math.round(s / 60));
}

function EmptyState({ message }) {
    return (
        <div className="analytics-empty">
            <span>📚</span>
            <p>{message}</p>
        </div>
    );
}

// ─── GitHub-style Heatmap ─────────────────────────────────────────────────────
function StudyHeatmap({ data }) {
    const [tooltip, setTooltip] = useState(null);
    const tooltipRef = useRef(null);

    function getIntensity(minutes) {
        if (minutes <= 0) return 0;
        if (minutes <= 30)  return 1;
        if (minutes <= 60)  return 2;
        return 3;
    }

    // Build week columns (13 weeks × 7 days = 91 days, we have 90)
    // Pad start so day-of-week aligns
    const firstDay = data[0] ? new Date(data[0].date) : new Date();
    const startPad = firstDay.getDay(); // 0=Sun … 6=Sat

    const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // Month label positions
    const monthLabels = [];
    data.forEach((d, i) => {
        const dt = new Date(d.date);
        if (dt.getDate() <= 7) {
            const col = Math.floor((startPad + i) / 7);
            const label = dt.toLocaleString('default', { month: 'short' });
            if (!monthLabels.length || monthLabels[monthLabels.length - 1].label !== label) {
                monthLabels.push({ col, label });
            }
        }
    });

    const totalCols = Math.ceil((startPad + data.length) / 7);

    return (
        <div className="heatmap-wrapper">
            {/* Month labels */}
            <div className="heatmap-months" style={{ gridTemplateColumns: `28px repeat(${totalCols}, 1fr)` }}>
                <div />
                {Array.from({ length: totalCols }, (_, ci) => {
                    const ml = monthLabels.find(m => m.col === ci);
                    return <div key={ci} className="heatmap-month-lbl">{ml ? ml.label : ''}</div>;
                })}
            </div>

            <div className="heatmap-inner">
                {/* Day-of-week labels */}
                <div className="heatmap-days">
                    {dayLabels.map((d, i) => (
                        <div key={d} className="heatmap-day-lbl">{i % 2 === 1 ? d : ''}</div>
                    ))}
                </div>

                {/* Grid */}
                <div
                    className="heatmap-grid-new"
                    style={{ gridTemplateColumns: `repeat(${totalCols}, 1fr)` }}
                >
                    {/* Leading empty cells */}
                    {Array.from({ length: startPad }, (_, i) => (
                        <div key={`pad-${i}`} className="heatmap-cell-new intensity-0 pad" />
                    ))}

                    {data.map((d, i) => {
                        const intensity = getIntensity(d.minutes);
                        const dt = new Date(d.date);
                        const label = dt.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
                        return (
                            <div
                                key={d.date}
                                className={`heatmap-cell-new intensity-${intensity}`}
                                onMouseEnter={e => {
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    setTooltip({ x: rect.left, y: rect.top, date: label, minutes: d.minutes });
                                }}
                                onMouseLeave={() => setTooltip(null)}
                            />
                        );
                    })}
                </div>
            </div>

            {/* Tooltip */}
            {tooltip && (
                <div
                    className="heatmap-tooltip"
                    style={{ left: tooltip.x, top: tooltip.y - 52 }}
                >
                    <div className="heatmap-tt-date">{tooltip.date}</div>
                    <div className="heatmap-tt-val">
                        {tooltip.minutes > 0 ? `⏱ ${fmtMins(tooltip.minutes)} studied` : 'No study'}
                    </div>
                </div>
            )}

            {/* Legend */}
            <div className="heatmap-legend-new">
                <span>Less</span>
                {[0, 1, 2, 3].map(i => (
                    <div key={i} className={`heatmap-cell-new intensity-${i}`} style={{ width: 12, height: 12, flexShrink: 0 }} />
                ))}
                <span>More</span>
            </div>
        </div>
    );
}

// ─── Exam Readiness Card ──────────────────────────────────────────────────────
function ExamReadinessCard({ score, factors, radarData, hasData }) {
    if (!hasData) return <EmptyState message="Exam readiness requires at least one completed study session." />;

    let tier, tierColor, tierClass;
    if      (score >= 90) { tier = 'Excellent';        tierColor = '#00ff88'; tierClass = 'tier-excellent'; }
    else if (score >= 75) { tier = 'Good';             tierColor = '#7c6eff'; tierClass = 'tier-good'; }
    else if (score >= 60) { tier = 'Moderate';         tierColor = '#ffb347'; tierClass = 'tier-moderate'; }
    else                  { tier = 'Needs Improvement';tierColor = '#ff4757'; tierClass = 'tier-low'; }

    const factorRows = [
        { label: 'Study Hours',      val: factors.hoursNorm,       weight: '30%', icon: '📚' },
        { label: 'Focus Score',      val: factors.focusScore,       weight: '20%', icon: '🎯' },
        { label: 'Roadmap Progress', val: factors.roadmapProgress,  weight: '30%', icon: '🗺️' },
        { label: 'Quiz Accuracy',    val: factors.quizAccuracy,     weight: '20%', icon: '✅' },
    ];

    // Circular arc (SVG)
    const r = 52, cx = 64, cy = 64;
    const circum = 2 * Math.PI * r;
    const dash   = (score / 100) * circum;

    return (
        <div className="exam-readiness-card">
            {/* Circular score */}
            <div className="exam-circle-wrap">
                <svg width="128" height="128" className="exam-svg">
                    <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="10" />
                    <circle
                        cx={cx} cy={cy} r={r} fill="none"
                        stroke={tierColor} strokeWidth="10"
                        strokeDasharray={`${dash} ${circum}`}
                        strokeLinecap="round"
                        transform={`rotate(-90 ${cx} ${cy})`}
                        style={{ filter: `drop-shadow(0 0 6px ${tierColor}66)`, transition: 'stroke-dasharray 1s ease' }}
                    />
                    <text x={cx} y={cy - 6} textAnchor="middle" fill={tierColor} fontSize="24" fontWeight="800">{score}</text>
                    <text x={cx} y={cy + 12} textAnchor="middle" fill="#9898b8" fontSize="10">/ 100</text>
                </svg>
                <div className={`exam-tier-badge ${tierClass}`}>{tier}</div>
            </div>

            <p className="exam-desc">Based on your recent study patterns and roadmap progress.</p>

            {/* Factor bars */}
            <div className="exam-factors">
                {factorRows.map(f => (
                    <div key={f.label} className="exam-factor">
                        <div className="exam-factor-hdr">
                            <span>{f.icon} {f.label}</span>
                            <span className="exam-factor-weight">{f.weight}</span>
                            <span className="exam-factor-val">{f.val}%</span>
                        </div>
                        <div className="progress-track">
                            <div
                                className="progress-fill"
                                style={{
                                    width: `${f.val}%`,
                                    background: f.val >= 75
                                        ? 'var(--grad-green)'
                                        : f.val >= 50
                                        ? 'var(--grad-violet)'
                                        : 'var(--grad-amber)',
                                    transition: 'width 0.8s ease',
                                }}
                            />
                        </div>
                    </div>
                ))}
            </div>

            {/* Radar */}
            <ResponsiveContainer width="100%" height={160}>
                <RadarChart data={radarData}>
                    <PolarGrid stroke="rgba(255,255,255,0.07)" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#9898b8', fontSize: 10 }} />
                    <Radar name="Score" dataKey="A" stroke="#7c6eff" fill="#7c6eff" fillOpacity={0.25} />
                    <Tooltip contentStyle={tooltipStyle} formatter={v => [`${v}%`]} />
                </RadarChart>
            </ResponsiveContainer>
        </div>
    );
}

// ─── Focus Intelligence Card ──────────────────────────────────────────────────
function FocusIntelligenceCard({ avgFocusAll, longestSessionSecs, distractionRate, hasData }) {
    const focusPct = hasData ? avgFocusAll : 0;
    const longestMin = hasData ? Math.round(longestSessionSecs / 60) : 0;
    const distract = hasData ? distractionRate : 0;

    // Circle helper
    function Arc({ value, max = 100, color, size = 80 }) {
        const r = size / 2 - 8;
        const cx = size / 2, cy = size / 2;
        const circum = 2 * Math.PI * r;
        const pct = Math.min(1, value / max);
        const dash = pct * circum;
        return (
            <svg width={size} height={size}>
                <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
                <circle
                    cx={cx} cy={cy} r={r} fill="none"
                    stroke={color} strokeWidth="8"
                    strokeDasharray={`${dash} ${circum}`}
                    strokeLinecap="round"
                    transform={`rotate(-90 ${cx} ${cy})`}
                    style={{ filter: `drop-shadow(0 0 4px ${color}55)` }}
                />
            </svg>
        );
    }

    const metrics = [
        {
            label:  'Focus Score',
            value:  `${focusPct}%`,
            color:  '#00ff88',
            arc:    <Arc value={focusPct} color="#00ff88" />,
            note:   focusPct >= 80 ? 'Excellent focus level 🏆' : focusPct >= 60 ? 'Good, keep it up!' : 'Try shorter, distraction-free sessions',
        },
        {
            label:  'Longest Session',
            value:  fmtSecs(longestSessionSecs),
            color:  '#7c6eff',
            arc:    <Arc value={longestMin} max={120} color="#7c6eff" />,
            note:   longestMin >= 60 ? 'Deep work level achieved 🌟' : longestMin >= 30 ? 'Building good endurance' : 'Try studying for 30+ minutes',
        },
        {
            label:  'Distraction Rate',
            value:  `${distract}%`,
            color:  distract <= 20 ? '#00d4ff' : distract <= 50 ? '#ffb347' : '#ff4757',
            arc:    <Arc value={distract} color={distract <= 20 ? '#00d4ff' : distract <= 50 ? '#ffb347' : '#ff4757'} />,
            note:   distract <= 20 ? 'Very low distraction 🎯' : distract <= 50 ? 'Moderate — reduce tab switching' : 'High — try full-screen study mode',
        },
    ];

    const insightMsg = !hasData
        ? 'Start a study session to see your focus intelligence.'
        : avgFocusAll >= 80
        ? '🧠 You maintain high focus during sessions longer than 30 minutes. Keep it up!'
        : avgFocusAll >= 60
        ? '📈 Your focus is building. Try using the Exam Focus Mode to go deeper.'
        : '💡 Shorter, frequent study sessions with no tab switching will significantly raise your focus score.';

    return (
        <div className="focus-intel-card">
            {/* Three mini arc metrics */}
            <div className="focus-metrics-row">
                {metrics.map(m => (
                    <div key={m.label} className="focus-metric">
                        <div className="focus-arc-wrap">
                            {m.arc}
                            <div className="focus-arc-value" style={{ color: m.color }}>{m.value}</div>
                        </div>
                        <div className="focus-metric-label">{m.label}</div>
                        <div className="focus-metric-note">{m.note}</div>
                    </div>
                ))}
            </div>

            {/* Insight bar */}
            <div className="focus-insight">
                <Eye size={14} style={{ flexShrink: 0, opacity: 0.7 }} />
                <span>{insightMsg}</span>
            </div>
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Analytics() {
    const { user, sessionHistory } = useApp();
    const [period, setPeriod] = useState('week');

    const {
        weeklyData,
        monthlyData,
        heatmapData,
        radarData,
        thisWeekHours,
        lastWeekHours,
        weekDelta,
        totalSessions,
        thisWeekSessions,
        avgFocusAll,
        thisWeekFocus,
        sessionsPerDay,
        completionRate,
        longestSessionSecs,
        distractionRate,
        streak,
        longestStreak,
        predictedScore,
        predictionFactors,
        hasData,
    } = useAnalytics(sessionHistory);

    const weekDeltaLabel = weekDelta >= 0
        ? `+${weekDelta}h vs last week`
        : `${weekDelta}h vs last week`;

    const focusTrend = thisWeekFocus >= avgFocusAll
        ? `↑ ${thisWeekFocus - avgFocusAll}% above average`
        : `↓ ${avgFocusAll - thisWeekFocus}% below average`;

    return (
        <div className="analytics-page">

            {/* ── Summary Cards ─────────────────────────────────────────────── */}
            <div className="analytics-summary">
                {[
                    {
                        icon: Clock,
                        label: 'This Week',
                        value: `${thisWeekHours}h`,
                        sub: hasData ? weekDeltaLabel : 'No sessions yet',
                        color: 'violet',
                    },
                    {
                        icon: Target,
                        label: 'Avg Focus',
                        value: hasData ? `${avgFocusAll}%` : '—',
                        sub: hasData ? focusTrend : 'Study to build focus data',
                        color: 'green',
                    },
                    {
                        icon: TrendingUp,
                        label: 'Total Sessions',
                        value: totalSessions,
                        sub: `${thisWeekSessions} this week`,
                        color: 'cyan',
                    },
                    {
                        icon: Flame,
                        label: 'Study Streak',
                        value: `${streak}🔥`,
                        sub: `Best: ${longestStreak} days — study daily!`,
                        color: 'amber',
                    },
                ].map((s, i) => (
                    <div key={i} className="analytics-stat-card">
                        <div className={`analytics-stat-icon color-${s.color}`}>
                            <s.icon size={20} />
                        </div>
                        <div className="analytics-stat-info">
                            <div className="analytics-stat-value">{s.value}</div>
                            <div className="analytics-stat-label">{s.label}</div>
                            <div className="analytics-stat-sub">{s.sub}</div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="analytics-grid">

                {/* ── Study Hours Chart ──────────────────────────────────────── */}
                <div className="analytics-card full">
                    <div className="analytics-card-header">
                        <h3><BarChart3 size={16} /> Study Hours</h3>
                        <div className="period-toggle">
                            {['week', 'month'].map(p => (
                                <button
                                    key={p}
                                    className={`period-btn ${period === p ? 'active' : ''}`}
                                    onClick={() => setPeriod(p)}
                                >
                                    {p === 'week' ? 'This Week' : 'This Month'}
                                </button>
                            ))}
                        </div>
                    </div>

                    {!hasData ? (
                        <EmptyState message="Your study hours will appear here after your first session." />
                    ) : (
                        <ResponsiveContainer width="100%" height={200}>
                            {period === 'week' ? (
                                <AreaChart data={weeklyData}>
                                    <defs>
                                        <linearGradient id="hoursGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%"  stopColor="#7c6eff" stopOpacity={0.35} />
                                            <stop offset="95%" stopColor="#7c6eff" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                                    <XAxis dataKey="day"   tick={{ fill: '#9898b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                                    <YAxis                 tick={{ fill: '#9898b8', fontSize: 11 }} axisLine={false} tickLine={false} unit="h" />
                                    <Tooltip contentStyle={tooltipStyle} formatter={v => [`${v}h`, 'Hours']} />
                                    <Area type="monotone" dataKey="hours" stroke="#7c6eff" fill="url(#hoursGrad)" strokeWidth={2} dot={{ fill: '#7c6eff', r: 4 }} />
                                </AreaChart>
                            ) : (
                                <BarChart data={monthlyData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                                    <XAxis dataKey="week"  tick={{ fill: '#9898b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                                    <YAxis                 tick={{ fill: '#9898b8', fontSize: 11 }} axisLine={false} tickLine={false} unit="h" />
                                    <Tooltip contentStyle={tooltipStyle} formatter={v => [`${v}h`, 'Hours']} />
                                    <Bar dataKey="hours" fill="#7c6eff" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            )}
                        </ResponsiveContainer>
                    )}
                </div>

                {/* ── Focus Score Trend ─────────────────────────────────────── */}
                <div className="analytics-card">
                    <div className="analytics-card-header">
                        <h3><Target size={16} /> Focus Score Trend</h3>
                    </div>

                    {!hasData ? (
                        <EmptyState message="Focus trend needs at least one session." />
                    ) : (
                        <ResponsiveContainer width="100%" height={160}>
                            <LineChart data={weeklyData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                                <XAxis dataKey="day"  tick={{ fill: '#9898b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                                <YAxis domain={[0, 100]} tick={{ fill: '#9898b8', fontSize: 11 }} axisLine={false} tickLine={false} unit="%" />
                                <Tooltip contentStyle={tooltipStyle} formatter={v => [`${v}%`, 'Focus']} />
                                <Line type="monotone" dataKey="focus" stroke="#00ff88" strokeWidth={2} dot={{ fill: '#00ff88', r: 4 }} connectNulls />
                            </LineChart>
                        </ResponsiveContainer>
                    )}
                </div>

                {/* ── Focus Intelligence ────────────────────────────────────── */}
                <div className="analytics-card">
                    <div className="analytics-card-header">
                        <h3><Brain size={16} /> Focus Intelligence</h3>
                        {hasData && <span className="analytics-data-badge">Live Data</span>}
                    </div>
                    <FocusIntelligenceCard
                        avgFocusAll={avgFocusAll}
                        longestSessionSecs={longestSessionSecs}
                        distractionRate={distractionRate}
                        hasData={hasData}
                    />
                </div>

                {/* ── Study Heatmap ─────────────────────────────────────────── */}
                <div className="analytics-card full">
                    <div className="analytics-card-header">
                        <h3><Calendar size={16} /> Study Heatmap — Last 90 Days</h3>
                        {hasData && <span className="analytics-data-badge">Live Data</span>}
                    </div>
                    <StudyHeatmap data={heatmapData} />
                </div>

                {/* ── Predicted Exam Readiness ──────────────────────────────── */}
                <div className="analytics-card full">
                    <div className="analytics-card-header">
                        <h3><Trophy size={16} /> Predicted Exam Readiness</h3>
                    </div>
                    <ExamReadinessCard
                        score={predictedScore}
                        factors={predictionFactors}
                        radarData={radarData}
                        hasData={hasData}
                    />
                </div>

            </div>
        </div>
    );
}
