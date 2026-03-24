import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
    Clock, Target, Zap, Flame, Star, Award, TrendingUp, BookOpen,
    Calendar, Edit3, X, UserPlus, UserCheck, Newspaper,
    Camera, Download, Mail, FileText, Trophy, CheckCircle2
} from 'lucide-react';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts';
import { readSessions, getStreakData } from '../hooks/useAnalytics';
import { useRealLeaderboard } from '../hooks/useRealLeaderboard';
import './Profile.css';

// ─── Storage keys ─────────────────────────────────────────────────────────────
const FOLLOWING_KEY = 'ytlearn_following';
const POSTS_KEY     = 'ytlearn_posts';
const LIKES_KEY     = 'ytlearn_liked_posts';
const PROFILE_KEY   = 'ytlearn_user_profile';
const COMMENTS_KEY  = 'ytlearn_comments';
const LB_KEY        = 'ytlearn_leaderboard';

// ─── Storage helpers ──────────────────────────────────────────────────────────
const rp  = () => { try { return JSON.parse(localStorage.getItem(POSTS_KEY)    || '[]'); } catch { return []; } };
const rl  = () => { try { return new Set(JSON.parse(localStorage.getItem(LIKES_KEY) || '[]')); } catch { return new Set(); } };
const rc  = () => { try { return JSON.parse(localStorage.getItem(COMMENTS_KEY) || '{}'); } catch { return {}; } };
const rf  = () => { try { return new Set(JSON.parse(localStorage.getItem(FOLLOWING_KEY) || '[]')); } catch { return new Set(); } };
const sf  = s  => { try { localStorage.setItem(FOLLOWING_KEY, JSON.stringify([...s])); } catch {} };
const gp  = () => { try { return JSON.parse(localStorage.getItem(PROFILE_KEY) || 'null') ?? {}; } catch { return {}; } };
const sp  = p  => { try { localStorage.setItem(PROFILE_KEY, JSON.stringify(p)); } catch {} };

function rt(iso) {
    const d = Math.floor((Date.now() - new Date(iso)) / 1000);
    if (d < 60) return `${d}s ago`; if (d < 3600) return `${Math.floor(d/60)}m ago`;
    if (d < 86400) return `${Math.floor(d/3600)}h ago`; return `${Math.floor(d/86400)}d ago`;
}

const BADGES = ['👑','🥈','🥉','⭐','🎖️','🎗️'];


function computeRealStreak() {
    const streakData = getStreakData();
    if (streakData.currentStreak > 0) return streakData.currentStreak;
    const sessions = readSessions();
    if (!sessions.length) return 0;
    const dayMap = {};
    sessions.forEach(s => { const d = new Date(s.timestamp).toISOString().split('T')[0]; dayMap[d] = (dayMap[d]||0) + (s.duration||0); });
    const qualified = new Set(Object.entries(dayMap).filter(([,v]) => v >= 300).map(([k]) => k));
    if (!qualified.size) return 0;
    let streak = 0;
    const today = new Date(); today.setHours(0,0,0,0);
    let cur = new Date(today);
    const chk = d => qualified.has(d.toISOString().split('T')[0]);
    if (!chk(cur)) cur.setDate(cur.getDate() - 1);
    while (chk(cur)) { streak++; cur.setDate(cur.getDate() - 1); }
    return streak;
}

// ─── Certificate PDF Generator (browser print) ───────────────────────────────
function downloadCertificate(name, courseName, date, certId) {
    const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8"/>
<title>Certificate – ${courseName}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Inter:wght@400;600&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { background: #fff; display: flex; align-items: center; justify-content: center; min-height: 100vh; font-family: 'Inter', sans-serif; print-color-adjust: exact; -webkit-print-color-adjust: exact; }
  .cert { width: 800px; min-height: 560px; border: 12px solid #7c6eff; border-radius: 16px; padding: 56px 64px; display: flex; flex-direction: column; align-items: center; text-align: center; gap: 20px; position: relative; background: linear-gradient(160deg, #fafaff 0%, #f0efff 100%); box-shadow: 0 0 0 4px #c4b9ff inset; }
  .cert-logo { font-size: 32px; font-weight: 800; color: #7c6eff; letter-spacing: -1px; font-family: 'Inter', sans-serif; }
  .cert-logo span { color: #5440e0; }
  .cert-divider { width: 80px; height: 3px; background: linear-gradient(90deg,#7c6eff,#a78bfa); border-radius: 2px; }
  .cert-heading { font-size: 11px; font-weight: 600; letter-spacing: 4px; text-transform: uppercase; color: #6c6c9a; }
  .cert-title { font-family: 'Playfair Display', serif; font-size: 34px; color: #1a1a2e; line-height: 1.2; }
  .cert-to { font-size: 13px; color: #6c6c9a; letter-spacing: 1px; }
  .cert-name { font-family: 'Playfair Display', serif; font-size: 48px; color: #5440e0; border-bottom: 2px solid #a78bfa; padding-bottom: 6px; }
  .cert-course-label { font-size: 13px; color: #6c6c9a; }
  .cert-course { font-size: 22px; font-weight: 700; color: #1a1a2e; }
  .cert-platform { font-size: 13px; color: #7c6eff; font-weight: 600; }
  .cert-desc { font-size: 12px; color: #8888aa; line-height: 1.6; max-width: 540px; }
  .cert-footer { display: flex; justify-content: space-between; width: 100%; margin-top: 16px; }
  .cert-footer-col { display: flex; flex-direction: column; align-items: center; gap: 4px; }
  .cert-footer-label { font-size: 10px; color: #aaa; letter-spacing: 1px; text-transform: uppercase; }
  .cert-footer-val { font-size: 13px; font-weight: 700; color: #1a1a2e; }
  .cert-seal { font-size: 42px; }
  @media print { body { margin: 0; } .cert { box-shadow: none; } }
</style>
</head>
<body>
<div class="cert">
  <div class="cert-logo">YT<span>Learn</span></div>
  <div class="cert-divider"></div>
  <div class="cert-heading">Certificate of Completion</div>
  <div class="cert-title">This certificate is proudly presented to</div>
  <div class="cert-to"></div>
  <div class="cert-name">${name}</div>
  <div class="cert-course-label">For successfully completing the course</div>
  <div class="cert-course">${courseName}</div>
  <div class="cert-platform">on YTLearn Study Cockpit</div>
  <div class="cert-desc">This certificate verifies that the learner has completed all required learning modules and demonstrated commitment to continuous learning.</div>
  <div class="cert-seal">🎓</div>
  <div class="cert-footer">
    <div class="cert-footer-col"><div class="cert-footer-label">Completion Date</div><div class="cert-footer-val">${date}</div></div>
    <div class="cert-footer-col"><div class="cert-footer-val" style="font-size:20px">✦ YTLearn ✦</div></div>
    <div class="cert-footer-col"><div class="cert-footer-label">Certificate ID</div><div class="cert-footer-val">${certId}</div></div>
  </div>
</div>
</body>
</html>`;

    const win = window.open('', '_blank');
    win.document.write(html);
    win.document.close();
    win.onload = () => { win.focus(); win.print(); };
}

// ─── Study Report PDF Generator (browser print) ──────────────────────────────
function downloadStudyReport({ name, level, xp, streak, totalHours, focusScore, sessions, rank }) {
    const today = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
    const filename = `YTLearn-StudyReport-${name.replace(/\s+/g,'')}`;
    const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8"/>
<title>${filename}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');
  * { margin:0;padding:0;box-sizing:border-box; }
  body { font-family:'Inter',sans-serif; background:#fff; color:#1a1a2e; padding:48px; font-size:14px; print-color-adjust:exact; -webkit-print-color-adjust:exact; }
  .header { display:flex; justify-content:space-between; align-items:center; border-bottom:3px solid #7c6eff; padding-bottom:20px; margin-bottom:32px; }
  .logo { font-size:24px; font-weight:800; color:#7c6eff; }
  .logo span { color:#5440e0; }
  .report-title { font-size:20px; font-weight:800; color:#1a1a2e; margin-bottom:4px; }
  .report-sub { font-size:12px; color:#888; }
  .section-title { font-size:14px; font-weight:700; color:#7c6eff; text-transform:uppercase; letter-spacing:1px; border-left:3px solid #7c6eff; padding-left:10px; margin:24px 0 14px; }
  .stats-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:16px; margin-bottom:8px; }
  .stat-box { background:#f5f4ff; border:1px solid #e0deff; border-radius:10px; padding:16px; text-align:center; }
  .stat-val { font-size:28px; font-weight:800; color:#5440e0; }
  .stat-lbl { font-size:11px; color:#888; font-weight:600; text-transform:uppercase; letter-spacing:0.5px; margin-top:4px; }
  .info-table { width:100%; border-collapse:collapse; }
  .info-table tr { border-bottom:1px solid #f0efff; }
  .info-table td { padding:10px 12px; font-size:13px; }
  .info-table td:first-child { color:#888; font-weight:600; width:40%; }
  .info-table td:last-child { color:#1a1a2e; font-weight:700; }
  .insight-box { background:#f5f4ff; border-left:4px solid #7c6eff; padding:14px 16px; border-radius:0 8px 8px 0; font-size:13px; color:#3b3b6e; line-height:1.6; margin-top:8px; }
  .footer { margin-top:40px; padding-top:16px; border-top:1px solid #e0deff; display:flex; justify-content:space-between; font-size:11px; color:#aaa; }
  @media print { body { padding:24px; } }
</style>
</head>
<body>
<div class="header">
  <div class="logo">YT<span>Learn</span></div>
  <div style="text-align:right">
    <div class="report-title">Student Study Performance Report</div>
    <div class="report-sub">Generated on ${today}</div>
  </div>
</div>

<div class="section-title">Student Profile</div>
<table class="info-table">
  <tr><td>Student Name</td><td>${name}</td></tr>
  <tr><td>Level</td><td>${level}</td></tr>
  <tr><td>Total XP</td><td>${xp.toLocaleString()} XP</td></tr>
  <tr><td>Current Streak</td><td>🔥 ${streak} Days</td></tr>
  <tr><td>Leaderboard Rank</td><td>#${rank}</td></tr>
</table>

<div class="section-title">Learning Summary</div>
<div class="stats-grid">
  <div class="stat-box"><div class="stat-val">${totalHours}h</div><div class="stat-lbl">Study Hours</div></div>
  <div class="stat-box"><div class="stat-val">${sessions}</div><div class="stat-lbl">Sessions Completed</div></div>
  <div class="stat-box"><div class="stat-val">${focusScore > 0 ? focusScore + '%' : '—'}</div><div class="stat-lbl">Focus Score</div></div>
</div>

<div class="section-title">Performance Insights</div>
<div class="insight-box">
  ${focusScore >= 80
    ? `⭐ Excellent focus score of ${focusScore}% indicates strong concentration during study sessions. Keep this momentum going!`
    : focusScore >= 60
    ? `📈 Good focus score of ${focusScore}%. Try minimising tab switches and studying in 30–45 minute focused blocks to improve further.`
    : `💪 Your study journey is just beginning! Consistent sessions of 30+ minutes with minimal distractions will significantly raise your focus score.`}
  ${streak >= 7 ? ` Your ${streak}-day streak shows excellent daily discipline!` : ''}
</div>

<div class="footer">
  <span>Generated by YTLearn Study Cockpit</span>
  <span>student@ytlearn.app</span>
</div>
</body>
</html>`;

    const win = window.open('', '_blank');
    win.document.write(html);
    win.document.close();
    win.onload = () => { win.focus(); win.print(); };
}

// ─── Follow Modal ─────────────────────────────────────────────────────────────
function FollowModal({ type, following, onToggle, onClose }) {
    const list = type === 'following' ? DEMO_USERS.filter(u => following.has(u.id)) : DEMO_USERS;
    return (
        <div className="profile-modal-bg" onClick={onClose}>
            <div className="profile-modal" onClick={e => e.stopPropagation()}>
                <div className="profile-modal-hdr">
                    <h3>{type === 'following' ? 'Following' : 'Followers'}</h3>
                    <button onClick={onClose}><X size={17}/></button>
                </div>
                <div className="profile-modal-body">
                    {list.length === 0 ? (
                        <p style={{color:'var(--text-muted)',fontSize:13,textAlign:'center',padding:'24px 0'}}>
                            {type === 'following' ? 'Not following anyone yet.' : 'No followers yet.'}
                        </p>
                    ) : list.map(u => (
                        <div key={u.id} className="follow-row">
                            <div className="post-avatar sm" style={{background:u.color}}>{u.avatar}</div>
                            <div className="follow-info">
                                <div className="follow-name">{u.name}</div>
                                <div className="follow-bio">{u.bio}</div>
                            </div>
                            <button className={`follow-btn ${following.has(u.id)?'following':''}`} onClick={() => onToggle(u.id)}>
                                {following.has(u.id) ? <><UserCheck size={13}/> Following</> : <><UserPlus size={13}/> Follow</>}
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

// ─── Edit Profile Modal (with photo upload) ──────────────────────────────────
function EditProfileModal({ profile, onSave, onClose }) {
    const [name,     setName]     = useState(profile.displayName || 'Prince');
    const [bio,      setBio]      = useState(profile.bio || '');
    const [color,    setColor]    = useState(profile.avatarColor || '#7c6eff');
    const [photoUrl, setPhotoUrl] = useState(profile.avatarUrl || '');
    const [photoErr, setPhotoErr] = useState('');
    const fileRef = useRef(null);

    const COLS = ['#7c6eff','#00d4ff','#00ff88','#ffb347','#ff6b9d','#f43f5e','#3178c6','#68a063'];

    const handlePhotoChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setPhotoErr('');
        const allowed = ['image/jpeg','image/png','image/jpg','image/webp'];
        if (!allowed.includes(file.type)) { setPhotoErr('Only JPG, PNG or JPEG allowed.'); return; }
        if (file.size > 5 * 1024 * 1024) { setPhotoErr('Photo must be under 5 MB.'); return; }
        const reader = new FileReader();
        reader.onload = ev => setPhotoUrl(ev.target.result);
        reader.readAsDataURL(file);
    };

    return (
        <div className="profile-modal-bg" onClick={onClose}>
            <div className="profile-modal" style={{width:480}} onClick={e => e.stopPropagation()}>
                <div className="profile-modal-hdr">
                    <h3><Edit3 size={15}/> Edit Profile</h3>
                    <button onClick={onClose}><X size={17}/></button>
                </div>
                <div className="profile-modal-body" style={{padding:'20px',display:'flex',flexDirection:'column',gap:16}}>
                    {/* Photo + avatar section */}
                    <div className="edit-avatar-section">
                        <div className="edit-avatar-photo-wrap" onClick={() => fileRef.current?.click()}>
                            {photoUrl
                                ? <img src={photoUrl} alt="avatar" className="edit-avatar-photo" />
                                : <div className="edit-avatar" style={{background:color}}>{name[0]?.toUpperCase()}</div>
                            }
                            <div className="edit-avatar-overlay"><Camera size={18}/><span>Change Photo</span></div>
                        </div>
                        <div className="edit-colors">
                            <p>Avatar color (used when no photo)</p>
                            <div className="color-picker">
                                {COLS.map(c => <button key={c} className={`color-dot ${color===c?'active':''}`} style={{background:c}} onClick={()=>setColor(c)} />)}
                            </div>
                            <label className="dp-upload-btn" onClick={() => fileRef.current?.click()}>
                                <Camera size={13}/> Upload Photo
                            </label>
                            {photoUrl && (
                                <button className="dp-remove-btn" onClick={() => setPhotoUrl('')}>Remove photo</button>
                            )}
                        </div>
                    </div>
                    <input ref={fileRef} type="file" accept=".jpg,.jpeg,.png,.webp" style={{display:'none'}} onChange={handlePhotoChange} />
                    {photoErr && <p style={{color:'var(--red)',fontSize:12}}>{photoErr}</p>}

                    <div className="edit-field"><label>Display Name</label><input value={name} onChange={e=>setName(e.target.value)} maxLength={30} /></div>
                    <div className="edit-field"><label>Bio</label><textarea value={bio} onChange={e=>setBio(e.target.value)} maxLength={150} rows={3} /></div>
                    <button className="btn btn-primary" style={{width:'100%'}} onClick={()=>{onSave({displayName:name,bio,avatarColor:color,avatarUrl:photoUrl});onClose();}}>
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── My Posts Modal ───────────────────────────────────────────────────────────
function MyPostsModal({ onClose }) {
    const posts = rp().filter(p=>p.userId==='prince').sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));
    const coms  = rc();
    return (
        <div className="profile-modal-bg" onClick={onClose}>
            <div className="profile-modal" onClick={e=>e.stopPropagation()}>
                <div className="profile-modal-hdr"><h3>📝 My Posts ({posts.length})</h3><button onClick={onClose}><X size={17}/></button></div>
                <div className="profile-modal-body">
                    {posts.length===0 ? <p style={{padding:'24px',color:'var(--text-muted)',fontSize:13,textAlign:'center'}}>No posts yet!</p>
                    : posts.map(p => (
                        <div key={p.id} className="ep-row">
                            {p.mediaUrl && p.mediaType==='image' && <img src={p.mediaUrl} alt="" className="ep-thumb"/>}
                            <div className="ep-info">
                                <p className="ep-caption">{p.caption.slice(0,90)}{p.caption.length>90?'…':''}</p>
                                <div className="ep-meta"><span>❤️ {p.likesCount}</span><span>💬 {(coms[p.id]||[]).length}</span><span>{rt(p.createdAt)}</span></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

// ─── Liked Posts Modal ────────────────────────────────────────────────────────
function LikedPostsModal({ onClose }) {
    const [filter, setFilter] = React.useState('All');
    const liked = rl();
    const posts = rp().filter(p=>liked.has(p.id)).sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));
    const shown = filter==='All' ? posts : posts.filter(p=>p.mediaType===(filter==='Images'?'image':'video'));
    return (
        <div className="profile-modal-bg" onClick={onClose}>
            <div className="profile-modal" onClick={e=>e.stopPropagation()}>
                <div className="profile-modal-hdr"><h3>❤️ Posts Liked ({liked.size})</h3><button onClick={onClose}><X size={17}/></button></div>
                <div className="ep-filter-row">
                    {['All','Images','Videos'].map(f=><button key={f} className={`ep-filter ${filter===f?'active':''}`} onClick={()=>setFilter(f)}>{f}</button>)}
                </div>
                <div className="profile-modal-body">
                    {shown.length===0 ? <p style={{padding:'24px',color:'var(--text-muted)',fontSize:13,textAlign:'center'}}>Nothing here.</p>
                    : shown.map(p=>(
                        <div key={p.id} className="ep-row">
                            <div className="ep-avatar" style={{background:p.avatarColor??'#7c6eff'}}>{p.userAvatar}</div>
                            <div className="ep-info">
                                <div className="ep-uname">{p.username}</div>
                                <p className="ep-caption">{p.caption.slice(0,80)}{p.caption.length>80?'…':''}</p>
                                <div className="ep-meta"><span>❤️ {p.likesCount}</span><span>{rt(p.createdAt)}</span></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

// ─── My Comments Modal ────────────────────────────────────────────────────────
function MyCommentsModal({ onClose }) {
    const allC  = rc();
    const posts = rp();
    const mine  = Object.entries(allC).flatMap(([pid,arr])=>
        arr.filter(c=>c.userId==='prince').map(c=>({...c,post:posts.find(p=>p.id===pid)}))
    ).sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));
    return (
        <div className="profile-modal-bg" onClick={onClose}>
            <div className="profile-modal" onClick={e=>e.stopPropagation()}>
                <div className="profile-modal-hdr"><h3>💬 My Comments ({mine.length})</h3><button onClick={onClose}><X size={17}/></button></div>
                <div className="profile-modal-body">
                    {mine.length===0 ? <p style={{padding:'24px',color:'var(--text-muted)',fontSize:13,textAlign:'center'}}>No comments yet.</p>
                    : mine.map(c=>(
                        <div key={c.id} className="ep-row">
                            <div className="ep-avatar" style={{background:c.post?.avatarColor??'#7c6eff'}}>{c.post?.userAvatar??'?'}</div>
                            <div className="ep-info">
                                <div className="ep-uname" style={{color:'var(--text-muted)',fontSize:11}}>On {c.post?.username??'Unknown'}'s post</div>
                                <p className="ep-caption" style={{fontStyle:'italic'}}>"{c.text}"</p>
                                <div className="ep-meta"><span>{rt(c.createdAt)}</span></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

// ─── Certificate courses — derived from real playlist progress ────────────────
// Each entry maps a playlist ID to a display title and focus target (hours)
const CERT_COURSES = [
    { playlistId: 'web-dev-basics', title: 'Web Development Fundamentals' },
    { playlistId: 'dsa-masterclass', title: 'Data Structures & Algorithms'  },
    { playlistId: 'react-complete',  title: 'React & Modern Frontend'        },
    { playlistId: 'python-beginners',title: 'Python for Everybody'           },
];

function CertificatesSection({ userName }) {
    const { playlists } = useApp();
    const today = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

    return (
        <div style={{display:'flex',flexDirection:'column',gap:12}}>
            {CERT_COURSES.map(({ playlistId, title }) => {
                const pl = playlists.find(p => p.id === playlistId);
                if (!pl) return null;

                const watched   = pl.completedVideos ?? 0;
                const total     = pl.totalVideos     ?? 1;
                const pct       = Math.round((watched / total) * 100);
                const completed = watched >= total;
                const certId    = `YTL-${new Date().getFullYear()}-${String(
                    Math.abs(playlistId.split('').reduce((a,ch) => a + ch.charCodeAt(0), 0))
                ).slice(0,5)}`;

                return (
                    <div key={playlistId} className={`cert-item-new ${completed ? 'cert-unlocked' : ''}`}>
                        <div className="cert-icon-new">{completed ? '🎓' : '📚'}</div>
                        <div className="cert-info">
                            <div className="cert-title">{title}</div>
                            <div className="cert-sub">
                                {watched}/{total} videos • {pl.totalHours}h
                            </div>
                            <div className="cert-progress-bar">
                                <div
                                    className="cert-progress-fill"
                                    style={{
                                        width: `${pct}%`,
                                        background: completed ? 'var(--grad-green)' : 'var(--grad-violet)',
                                    }}
                                />
                            </div>
                        </div>
                        {completed ? (
                            <button
                                className="btn btn-amber btn-sm cert-dl-btn"
                                title="Download Certificate"
                                onClick={() => downloadCertificate(userName, title, today, certId)}
                            >
                                <Download size={13}/> Certificate
                            </button>
                        ) : (
                            <div className="cert-locked-badge">
                                {total - watched} left
                            </div>
                        )}
                    </div>
                );
            })}
            <p className="cert-hint">
                <CheckCircle2 size={12} style={{color:'var(--green)'}}/>
                Complete all videos in a course to unlock your certificate.
            </p>
        </div>
    );
}


// ─── Parent Report Section ────────────────────────────────────────────────────
function ParentReportSection({ name, thisWeekHours, focusScore, thisWeekSessions, streak, totalHours }) {
    const [email,    setEmail]    = useState('');
    const [emailSent,setEmailSent]= useState(false);

    const sendEmail = () => {
        if (!email.trim() || !email.includes('@')) return;
        const subject = encodeURIComponent('YTLearn Weekly Progress Report');
        const body    = encodeURIComponent(
`YTLearn Weekly Progress Report

Student: ${name}
Report Date: ${new Date().toLocaleDateString('en-IN', {day:'numeric',month:'long',year:'numeric'})}

--- Weekly Summary ---
Study Time This Week : ${thisWeekHours} hours
Focus Score          : ${focusScore > 0 ? focusScore + '%' : 'N/A'}
Sessions Completed   : ${thisWeekSessions}
Current Streak       : ${streak} Days
Total Study Hours    : ${totalHours} hours

This report was automatically generated by YTLearn Study Cockpit.
Visit: https://ytlearn.app`
        );
        window.open(`mailto:${email}?subject=${subject}&body=${body}`, '_blank');
        setEmailSent(true);
        setTimeout(() => setEmailSent(false), 3000);
    };

    return (
        <div style={{display:'flex',flexDirection:'column',gap:14}}>
            <p className="parent-desc">Share your progress with parents or teachers automatically every week.</p>
            <div className="parent-stats">
                <div className="parent-stat"><div className="parent-stat-value">{thisWeekHours}h</div><div className="parent-stat-label">This week</div></div>
                <div className="parent-stat"><div className="parent-stat-value">{focusScore>0?`${focusScore}%`:'—'}</div><div className="parent-stat-label">Focus avg</div></div>
                <div className="parent-stat"><div className="parent-stat-value">{thisWeekSessions}</div><div className="parent-stat-label">Sessions</div></div>
            </div>
            {/* Email input */}
            <div className="parent-email-row">
                <Mail size={15} style={{color:'var(--text-muted)',flexShrink:0}}/>
                <input
                    className="parent-email-input"
                    type="email"
                    placeholder="Enter parent/teacher email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && sendEmail()}
                />
            </div>
            <div className="parent-actions">
                <button className="btn btn-primary btn-sm" onClick={sendEmail} title="Opens your mail app with prefilled report">
                    {emailSent ? '✅ Opened mail app!' : <><Mail size={13}/> Email Report</>}
                </button>
            </div>
            <p className="parent-email-note">Opens your email client with the prefilled progress report. Enter a recipient email first.</p>
        </div>
    );
}

// ─── useLeaderboard removed — now using useRealLeaderboard hook ───────────────


// ══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════════════════════
export default function Profile() {
    const { user, liveStats, computedAchievements } = useApp();
    const subjectBreakdown = liveStats?.subjectBreakdown ?? [];
    const radarData        = liveStats?.radarData ?? [];
    const calendarMap      = liveStats?.calendarMap ?? {};
    const totalHours       = liveStats?.totalHours ?? 0;
    const focusScore       = liveStats?.focusScore ?? 0;
    const thisWeekHours    = liveStats?.thisWeekHours ?? 0;
    const thisWeekSessions = liveStats?.thisWeekSessions ?? 0;
    const unlockedBadges   = (computedAchievements ?? []).filter(a => a.unlocked).length;

    const realStreak    = useMemo(() => computeRealStreak(), []);
    const displayStreak = realStreak || liveStats?.streak || 0;

    const [following,     setFollowState]   = useState(rf);
    const [profileData,   setProfileData]   = useState(gp);
    const [showFollowers, setShowFollowers] = useState(false);
    const [showFollowing, setShowFollowing] = useState(false);
    const [showEdit,      setShowEdit]      = useState(false);
    const [showMyPosts,   setShowMyPosts]   = useState(false);
    const [showLiked,     setShowLiked]     = useState(false);
    const [showComments,  setShowComments]  = useState(false);

    const displayName  = profileData.displayName || user.name;
    const bio          = profileData.bio || 'Passionate learner | YTLearn student';
    const avatarColor  = profileData.avatarColor || '#7c6eff';
    const avatarUrl    = profileData.avatarUrl || '';
    const followingCnt = following.size;
    const xpPct        = Math.min(100, (user.xp / user.xpToNext) * 100);

    const postEngagement = useMemo(() => {
        const myPosts    = rp().filter(p=>p.userId==='prince');
        const liked      = rl();
        const allC       = rc();
        const myComments = Object.values(allC).flatMap(a=>a).filter(c=>c.userId==='prince').length;
        return { total: myPosts.length, likes: myPosts.reduce((s,p)=>s+p.likesCount,0), likedPosts: liked.size, comments: myComments };
    }, []);

    // Real global leaderboard — fetches from MongoDB
    const { entries: leaderboard, loading: lbLoading, myRank } = useRealLeaderboard({
        email:      user.email,
        name:       displayName,
        xp:         user.xp,
        totalHours,
        avatarColor,
        streak:     displayStreak,
    });

    const toggleFollow = useCallback(uid => {
        setFollowState(prev => { const next=new Set(prev); next.has(uid)?next.delete(uid):next.add(uid); sf(next); return next; });
    }, []);

    const totalSessions = readSessions().length;

    return (
        <div className="profile-page">
            {showFollowers && <FollowModal type="followers" following={following} onToggle={toggleFollow} onClose={()=>setShowFollowers(false)} />}
            {showFollowing && <FollowModal type="following" following={following} onToggle={toggleFollow} onClose={()=>setShowFollowing(false)} />}
            {showEdit      && <EditProfileModal profile={profileData} onSave={d=>{setProfileData(d);sp(d);}} onClose={()=>setShowEdit(false)} />}
            {showMyPosts   && <MyPostsModal    onClose={()=>setShowMyPosts(false)} />}
            {showLiked     && <LikedPostsModal onClose={()=>setShowLiked(false)} />}
            {showComments  && <MyCommentsModal onClose={()=>setShowComments(false)} />}

            <div className="profile-grid">

                {/* ── Hero card ──────────────────────────────────────────── */}
                <div className="profile-hero-card">
                    <div className="profile-avatar-wrap">
                        {avatarUrl
                            ? <img src={avatarUrl} alt="avatar" className="profile-avatar profile-avatar-photo" />
                            : <div className="profile-avatar" style={{background:avatarColor}}><span>{displayName[0]}</span></div>
                        }
                        <div className="profile-level-ring" />
                        <button className="edit-avatar-btn" onClick={()=>setShowEdit(true)} title="Edit profile"><Camera size={13}/></button>
                    </div>
                    <h2 className="profile-name">{displayName}</h2>
                    <div className="profile-level-tag">Lv.{user.level} — {user.levelName}</div>
                    <div className="profile-bio">{bio}</div>
                    <div className="profile-streak-badge"><Flame size={16} style={{color:'var(--amber)'}}/>{displayStreak} Day Streak</div>

                    <div className="profile-social-counts">
                        <button className="social-count-btn" onClick={()=>setShowFollowers(true)}>
                            <strong>3</strong><span>Followers</span>
                        </button>
                        <div className="social-count-sep" />
                        <button className="social-count-btn" onClick={()=>setShowFollowing(true)}>
                            <strong>{followingCnt}</strong><span>Following</span>
                        </button>
                        <div className="social-count-sep" />
                        <div className="social-count-btn" style={{cursor:'default'}}>
                            <strong>#{myRank}</strong><span>Rank</span>
                        </div>
                    </div>

                    <div className="profile-xp-section">
                        <div className="profile-xp-labels">
                            <span><Zap size={12}/> {user.xp.toLocaleString()} XP</span>
                            <span>{user.xpToNext.toLocaleString()} to next level</span>
                        </div>
                        <div className="profile-xp-bar"><div className="profile-xp-fill" style={{width:`${xpPct}%`}} /></div>
                    </div>

                    <div className="profile-core-stats">
                        {[
                            {icon:Flame,  label:'Streak',      value:`${displayStreak}d`,              color:'var(--amber)'},
                            {icon:Clock,  label:'Total Study',  value:`${totalHours}h`,                 color:'var(--cyan)'},
                            {icon:Target, label:'Focus Score',  value:focusScore>0?`${focusScore}%`:'—',color:'var(--green)'},
                            {icon:Award,  label:'Badges',       value:unlockedBadges,                   color:'var(--violet)'},
                        ].map((s,i)=>(
                            <div key={i} className="profile-core-stat">
                                <s.icon size={18} style={{color:s.color}}/>
                                <div className="profile-core-value" style={{color:s.color}}>{s.value}</div>
                                <div className="profile-core-label">{s.label}</div>
                            </div>
                        ))}
                    </div>

                    <div className="profile-hero-actions">
                        <button className="btn btn-primary btn-sm" onClick={()=>setShowEdit(true)}><Edit3 size={14}/> Edit Profile</button>
                        <button className="btn btn-secondary btn-sm" onClick={()=>downloadStudyReport({
                            name: displayName, level: user.levelName, xp: user.xp,
                            streak: displayStreak, totalHours, focusScore,
                            sessions: totalSessions, rank: myRank,
                        })}>
                            <Download size={14}/> Download PDF
                        </button>
                    </div>
                </div>

                {/* ── Skill Radar ────────────────────────────────────────── */}
                <div className="profile-card">
                    <h3><TrendingUp size={16}/> Skill Radar</h3>
                    <ResponsiveContainer width="100%" height={200}>
                        <RadarChart data={radarData.length>0?radarData:[
                            {subject:'Consistency',A:0},{subject:'Focus',A:0},{subject:'Speed',A:0},
                            {subject:'Retention',A:0},{subject:'Breadth',A:0},{subject:'Depth',A:0},
                        ]}>
                            <PolarGrid stroke="rgba(255,255,255,0.07)"/>
                            <PolarAngleAxis dataKey="subject" tick={{fill:'#9898b8',fontSize:11}}/>
                            <Radar name="Skills" dataKey="A" stroke="#7c6eff" fill="#7c6eff" fillOpacity={0.2} strokeWidth={2}/>
                        </RadarChart>
                    </ResponsiveContainer>
                </div>

                {/* ── Certificates ───────────────────────────────────────── */}
                <div className="profile-card certificate-card">
                    <h3><Award size={16}/> Achievements &amp; Certificates</h3>
                    <CertificatesSection userName={displayName} />
                </div>

                {/* ── Post Engagement ────────────────────────────────────── */}
                <div className="profile-card">
                    <h3><Newspaper size={16}/> Post Engagement</h3>
                    <div className="engagement-stats">
                        <button className="engagement-stat clickable" onClick={()=>setShowMyPosts(true)}>
                            <div className="engagement-val">{postEngagement.total}</div>
                            <div className="engagement-lbl">Posts Shared</div>
                        </button>
                        <div className="engagement-sep"/>
                        <button className="engagement-stat clickable" onClick={()=>setShowLiked(true)}>
                            <div className="engagement-val">{postEngagement.likedPosts}</div>
                            <div className="engagement-lbl">Posts Liked</div>
                        </button>
                        <div className="engagement-sep"/>
                        <button className="engagement-stat clickable" onClick={()=>setShowComments(true)}>
                            <div className="engagement-val">{postEngagement.comments}</div>
                            <div className="engagement-lbl">Comments</div>
                        </button>
                    </div>
                    <p className="engagement-tip">Click any stat for details. Share your learning in the <strong>Post</strong> feed!</p>
                </div>

                {/* ── Real Global Leaderboard ─────────────────────────── */}
                <div className="profile-card">
                    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:8}}>
                        <h3><Trophy size={16}/> Global Leaderboard</h3>
                        <span className="lb-live-dot" title="Updates every 30s">● Live</span>
                    </div>

                    {lbLoading ? (
                        <div style={{display:'flex',flexDirection:'column',gap:8}}>
                            {[1,2,3,4].map(i => (
                                <div key={i} className="skeleton" style={{height:52,borderRadius:12}} />
                            ))}
                        </div>
                    ) : leaderboard.length === 0 ? (
                        <p style={{fontSize:13,color:'var(--text-muted)',padding:'20px 0',textAlign:'center'}}>
                            No users yet — be the first to earn XP! 🚀
                        </p>
                    ) : (
                        <div className="leaderboard">
                            {leaderboard.map(e => (
                                <div key={e.id} className={`leader-row ${e.isMe ? 'me' : ''}`}>
                                    <div className="leader-rank">{e.badge || `#${e.rank}`}</div>
                                    <div className="leader-avatar" style={{background: e.avatarColor || '#7c6eff'}}>
                                        {(e.name?.[0] || '?').toUpperCase()}
                                    </div>
                                    <div className="leader-info">
                                        <span className="leader-name">
                                            {e.name}{e.isMe && <span className="leader-you"> (You)</span>}
                                        </span>
                                        <span className="leader-level">Lv.{e.level} · {e.levelName}</span>
                                    </div>
                                    <div className="leader-stats">
                                        <span className="leader-hours">{e.totalHours}h</span>
                                        <span className="badge badge-violet">{e.xp.toLocaleString()} XP</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* ── Subject Mastery ────────────────────────────────────── */}
                <div className="profile-card full">
                    <h3><BookOpen size={16}/> Subject Mastery Progress</h3>
                    <div className="mastery-grid">
                        {subjectBreakdown.length===0 ? (
                            <p style={{fontSize:13,color:'var(--text-muted)',padding:'12px 0'}}>Study some videos to see mastery progress here!</p>
                        ) : subjectBreakdown.map((s,i)=>{
                            const mastery = Math.min(95, 40+(s.hours/24)*55);
                            return (
                                <div key={i} className="mastery-item">
                                    <div className="mastery-header">
                                        <span className="mastery-subject">{s.subject}</span>
                                        <span className="mastery-pct" style={{color:s.color}}>{Math.round(mastery)}%</span>
                                    </div>
                                    <div className="mastery-bar"><div className="mastery-fill" style={{width:`${mastery}%`,background:s.color}}/></div>
                                    <div className="mastery-meta">{s.hours}h studied</div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* ── Study Calendar ─────────────────────────────────────── */}
                <div className="profile-card">
                    <h3><Calendar size={16}/> Study Calendar</h3>
                    <div className="mini-calendar">
                        {['M','T','W','T','F','S','S'].map((d,i)=><div key={i} className="cal-day-header">{d}</div>)}
                        {Array.from({length:28},(_,i)=>{
                            const d=new Date(); d.setDate(d.getDate()-(27-i));
                            const key=d.toISOString().split('T')[0];
                            const hours=Math.round((calendarMap[key]||0)*10)/10;
                            const studied=hours>0;
                            return (
                                <div key={i} className={`cal-day ${studied?'studied':''}`} title={studied?`${hours}h`:'No study'}>
                                    <span>{d.getDate()}</span>
                                    {studied&&<div className="cal-dot"/>}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* ── Parent/Teacher Report ──────────────────────────────── */}
                <div className="profile-card parent-card">
                    <h3>👨‍👩‍👧 Parent/Teacher Report</h3>
                    <ParentReportSection
                        name={displayName}
                        thisWeekHours={thisWeekHours}
                        focusScore={focusScore}
                        thisWeekSessions={thisWeekSessions}
                        streak={displayStreak}
                        totalHours={totalHours}
                    />
                </div>

            </div>
        </div>
    );
}
