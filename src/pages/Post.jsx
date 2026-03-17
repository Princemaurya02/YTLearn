import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    Heart, Share2, Trash2, Plus, X, Image, Video,
    Globe, BookOpen, Send, MessageCircle, Copy, CheckCheck,
    ChevronDown, ChevronUp, Zap
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { pushNotification } from '../hooks/useNotifications';
import './Post.css';


// ─── Storage keys ────────────────────────────────────────────────────────────
const POSTS_KEY    = 'ytlearn_posts';
const LIKES_KEY    = 'ytlearn_liked_posts';
const COMMENTS_KEY = 'ytlearn_comments';

// ─── Seeded demo posts ────────────────────────────────────────────────────────
const SEED_POSTS = [
    { id: 's1', userId: 'rahul',  username: 'Rahul Sharma', userAvatar: 'R', avatarColor: '#7c6eff', caption: '🚀 Just completed the entire React Hooks deep-dive! useCallback and useMemo finally clicked for me. The key insight: these are performance tools, NOT correctness tools. Refactoring my project now!', mediaUrl: null, mediaType: null, likesCount: 34, subject: 'React',     createdAt: new Date(Date.now() - 18   * 60_000).toISOString() },
    { id: 's2', userId: 'priya',  username: 'Priya Verma',  userAvatar: 'P', avatarColor: '#00d4ff', caption: '✅ Day 22 of #100DaysOfCode — Solved Binary Search and its variations today. Interval problems are a game-changer once you understand the template. LeetCode streak: 22 days 🔥', mediaUrl: null, mediaType: null, likesCount: 52, subject: 'DSA',       createdAt: new Date(Date.now() - 45   * 60_000).toISOString() },
    { id: 's3', userId: 'arjun',  username: 'Arjun Singh',  userAvatar: 'A', avatarColor: '#00ff88', caption: 'Python generators are mind-blowing 🤯 Using yield instead of return changes everything about how you write memory-efficient code. Finished the freeCodeCamp Python course today!', mediaUrl: null, mediaType: null, likesCount: 28, subject: 'Python',    createdAt: new Date(Date.now() - 90   * 60_000).toISOString() },
    { id: 's4', userId: 'ananya', username: 'Ananya Patel', userAvatar: 'A', avatarColor: '#ff6b9d', caption: '💡 CSS Grid vs Flexbox breakdown I made after 3 hours of study today:\n\n→ Flexbox = 1D layouts (row OR column)\n→ Grid = 2D layouts (rows AND columns)\n→ Use both together for powerful layouts!\n\nFinally building pixel-perfect UIs 🎯', mediaUrl: null, mediaType: null, likesCount: 61, subject: 'CSS',       createdAt: new Date(Date.now() - 180  * 60_000).toISOString() },
    { id: 's5', userId: 'rahul',  username: 'Rahul Sharma', userAvatar: 'R', avatarColor: '#7c6eff', caption: 'Node.js + Express REST API from scratch in 2 hours 💪 Covered: routing, middleware, error handling, and async/await patterns. Building a full-stack project this weekend!', mediaUrl: null, mediaType: null, likesCount: 19, subject: 'Node.js',   createdAt: new Date(Date.now() - 360  * 60_000).toISOString() },
    { id: 's6', userId: 'priya',  username: 'Priya Verma',  userAvatar: 'P', avatarColor: '#00d4ff', caption: 'Studying at midnight hits different 🌙\n\n4 hours of Dynamic Programming today:\n• Memoization vs Tabulation\n• Fibonacci variants\n• Knapsack problem\n\n"The pain you feel today is the strength you feel tomorrow" 💪', mediaUrl: null, mediaType: null, likesCount: 43, subject: 'DSA',       createdAt: new Date(Date.now() - 720  * 60_000).toISOString() },
];

const SUBJECTS = ['General', 'JavaScript', 'React', 'DSA', 'Python', 'CSS', 'Node.js', 'TypeScript', 'Web Dev'];
const SUBJECT_COLORS = { JavaScript: '#f7df1e', React: '#00d4ff', DSA: '#ffb347', Python: '#00ff88', 'Web Dev': '#7c6eff', 'Node.js': '#68a063', CSS: '#ff6b9d', TypeScript: '#3178c6', General: '#9898b8' };
const PAGE_SIZE = 8;

// ─── Helpers ─────────────────────────────────────────────────────────────────
const readPosts     = () => { try { return JSON.parse(localStorage.getItem(POSTS_KEY)    || 'null') ?? []; } catch { return []; } };
const writePosts    = d => { try { localStorage.setItem(POSTS_KEY, JSON.stringify(d)); }    catch {} };
const readLiked     = () => { try { return new Set(JSON.parse(localStorage.getItem(LIKES_KEY) || '[]')); } catch { return new Set(); } };
const writeLiked    = s => { try { localStorage.setItem(LIKES_KEY, JSON.stringify([...s])); } catch {} };
const readComments  = () => { try { return JSON.parse(localStorage.getItem(COMMENTS_KEY) || 'null') ?? {}; } catch { return {}; } };
const writeComments = d => { try { localStorage.setItem(COMMENTS_KEY, JSON.stringify(d)); }  catch {} };

function relTime(iso) {
    const d = Math.floor((Date.now() - new Date(iso)) / 1000);
    if (d < 60)    return `${d}s ago`;
    if (d < 3600)  return `${Math.floor(d / 60)}m ago`;
    if (d < 86400) return `${Math.floor(d / 3600)}h ago`;
    return `${Math.floor(d / 86400)}d ago`;
}

async function compressImage(file, maxKB = 300) {
    return new Promise(res => {
        const reader = new FileReader();
        reader.onload = e => {
            const img = new window.Image();
            img.onload = () => {
                const c = document.createElement('canvas');
                let w = img.width, h = img.height;
                const max = 900;
                if (w > max) { h = Math.round((h * max) / w); w = max; }
                if (h > max) { w = Math.round((w * max) / h); h = max; }
                c.width = w; c.height = h;
                c.getContext('2d').drawImage(img, 0, 0, w, h);
                res(c.toDataURL('image/jpeg', 0.78));
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });
}

// ─── Share Modal ──────────────────────────────────────────────────────────────
function ShareModal({ post, onClose }) {
    const [msg, setMsg]       = useState('Check out this learning progress on YTLearn!');
    const [copied, setCopied] = useState(false);

    const link    = `https://ytlearn.app/post/${post.id}`;
    const encoded = encodeURIComponent(`${msg}\n${post.caption.slice(0, 80)}…\n${link}`);

    function copyLink() {
        navigator.clipboard?.writeText(`${msg} ${link}`).catch(() => {});
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
    }

    const options = [
        { label: 'WhatsApp',  color: '#25d366', emoji: '📱', url: `https://wa.me/?text=${encoded}` },
        { label: 'Telegram',  color: '#0088cc', emoji: '✈️', url: `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(msg)}` },
        { label: 'Twitter/X', color: '#1da1f2', emoji: '🐦', url: `https://twitter.com/intent/tweet?text=${encoded}` },
    ];

    return (
        <div className="post-modal-bg" onClick={onClose}>
            <div className="post-modal share-modal" onClick={e => e.stopPropagation()}>
                <div className="post-modal-hdr">
                    <h3><Share2 size={15} /> Share This Post</h3>
                    <button onClick={onClose}><X size={17} /></button>
                </div>
                <div className="post-modal-body">
                    {/* Post preview */}
                    <div className="share-preview">
                        <div className="post-avatar xs" style={{ background: post.avatarColor ?? '#7c6eff' }}>{post.userAvatar}</div>
                        <p className="share-caption">"{post.caption.slice(0, 90)}{post.caption.length > 90 ? '…' : ''}"</p>
                    </div>

                    {/* Custom message */}
                    <div className="share-msg-wrap">
                        <label>Add a message</label>
                        <textarea className="share-msg-input" value={msg} onChange={e => setMsg(e.target.value)} rows={2} />
                    </div>

                    {/* Share buttons */}
                    <div className="share-options">
                        {options.map(o => (
                            <a key={o.label} href={o.url} target="_blank" rel="noreferrer" className="share-opt-btn" style={{ '--sc': o.color }}>
                                <span className="share-opt-emoji">{o.emoji}</span>
                                {o.label}
                            </a>
                        ))}
                        <button className="share-opt-btn copy-btn" onClick={copyLink}>
                            {copied ? <CheckCheck size={16} /> : <Copy size={16} />}
                            {copied ? 'Copied!' : 'Copy Link'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Comments Section ─────────────────────────────────────────────────────────
function CommentsSection({ postId, postOwnerId, currentUser, commentsMap, onCommentsChange }) {
    const [text, setText]       = useState('');
    const [expanded, setExpanded] = useState(false);
    const postComments = (commentsMap[postId] || []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    function submit(e) {
        e.preventDefault();
        if (!text.trim()) return;
        const c = { id: `c${Date.now()}`, postId, userId: 'prince', username: currentUser.name, text: text.trim(), createdAt: new Date().toISOString() };
        const next = { ...commentsMap, [postId]: [c, ...(commentsMap[postId] || [])] };
        onCommentsChange(next);
        setText('');
        // Notify post owner if it's not their own post
        if (postOwnerId !== 'prince') {
            pushNotification({ type: 'comment', from: currentUser.name, fromColor: '#7c6eff', message: `${currentUser.name} commented on your post.` });
        }
    }

    function deleteComment(id) {
        const next = { ...commentsMap, [postId]: (commentsMap[postId] || []).filter(c => c.id !== id) };
        onCommentsChange(next);
    }

    return (
        <div className="comments-section">
            {/* Toggle */}
            {postComments.length > 0 && (
                <button className="comments-toggle" onClick={() => setExpanded(e => !e)}>
                    <MessageCircle size={13} />
                    {postComments.length} comment{postComments.length !== 1 ? 's' : ''}
                    {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                </button>
            )}

            {/* Comment list */}
            {expanded && postComments.map(c => (
                <div key={c.id} className="comment-item">
                    <div className="comment-avatar">{c.username[0]}</div>
                    <div className="comment-body">
                        <div className="comment-hdr">
                            <span className="comment-user">{c.username}</span>
                            <span className="comment-time">{relTime(c.createdAt)}</span>
                            {c.userId === 'prince' && (
                                <button className="comment-del" onClick={() => deleteComment(c.id)}><X size={11} /></button>
                            )}
                        </div>
                        <p className="comment-text">{c.text}</p>
                    </div>
                </div>
            ))}

            {/* Add comment */}
            <form className="comment-form" onSubmit={submit}>
                <div className="comment-avatar me">{currentUser.name[0]}</div>
                <input
                    className="comment-input"
                    placeholder="Write a comment…"
                    value={text}
                    onChange={e => setText(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && submit(e)}
                />
                <button type="submit" className="comment-send" disabled={!text.trim()}>
                    <Send size={14} />
                </button>
            </form>
        </div>
    );
}

// ─── Post Card ────────────────────────────────────────────────────────────────
function PostCard({ post, currentUser, likedSet, commentsMap, onLike, onDelete, onCommentsChange }) {
    const [showShare, setShowShare] = useState(false);
    const isOwn  = post.userId === 'prince';
    const liked  = likedSet.has(post.id);
    const commentCount = (commentsMap[post.id] || []).length;

    return (
        <article className="post-card">
            {showShare && <ShareModal post={post} onClose={() => setShowShare(false)} />}

            {/* Header */}
            <div className="post-card-hdr">
                <div className="post-avatar" style={{ background: post.avatarColor ?? '#7c6eff' }}>{post.userAvatar}</div>
                <div className="post-user-info">
                    <span className="post-username">{post.username}</span>
                    {post.subject && (
                        <span className="post-subject-chip" style={{ color: SUBJECT_COLORS[post.subject] ?? '#9898b8', borderColor: (SUBJECT_COLORS[post.subject] ?? '#9898b8') + '33' }}>
                            {post.subject}
                        </span>
                    )}
                    <span className="post-time">{relTime(post.createdAt)}</span>
                </div>
                {isOwn && (
                    <button className="post-delete-btn" onClick={() => onDelete(post.id)} title="Delete"><Trash2 size={14} /></button>
                )}
            </div>

            {/* Media */}
            {post.mediaUrl && post.mediaType === 'image' && (
                <div className="post-media"><img src={post.mediaUrl} alt="post" loading="lazy" /></div>
            )}
            {post.mediaUrl && post.mediaType === 'video' && (
                <div className="post-media"><video src={post.mediaUrl} controls preload="metadata" /></div>
            )}

            {/* Caption */}
            <div className="post-caption">
                <span className="post-caption-user">{post.username}</span> {post.caption}
            </div>

            {/* Actions */}
            <div className="post-actions">
                <button className={`post-action-btn ${liked ? 'liked' : ''}`} onClick={() => onLike(post.id)}>
                    <Heart size={16} fill={liked ? 'currentColor' : 'none'} />
                    <span>{post.likesCount + (liked ? 1 : 0)}</span>
                </button>
                <button className="post-action-btn" onClick={() => setShowShare(true)}>
                    <Share2 size={15} /> <span>Share</span>
                </button>
                <div className="post-action-spacer" />
                {commentCount > 0 && (
                    <span className="post-comment-count">
                        <MessageCircle size={13} /> {commentCount}
                    </span>
                )}
            </div>

            {/* Comments */}
            <CommentsSection
                postId={post.id}
                postOwnerId={post.userId}
                currentUser={currentUser}
                commentsMap={commentsMap}
                onCommentsChange={onCommentsChange}
            />
        </article>
    );
}

// ─── Create Post Modal ────────────────────────────────────────────────────────
function CreatePostModal({ user, onClose, onPublish }) {
    const [caption, setCaption]     = useState('');
    const [subject, setSubject]     = useState('General');
    const [mediaFile, setMediaFile] = useState(null);
    const [preview, setPreview]     = useState(null);
    const [mediaType, setMediaType] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [err, setErr]             = useState('');
    const fileRef = useRef();

    const handleFile = async e => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 20 * 1024 * 1024) { setErr('File too large (max 20MB)'); return; }
        setErr('');
        if (file.type.startsWith('image/')) {
            setMediaType('image');
            const c = await compressImage(file);
            setPreview(c); setMediaFile(c);
        } else if (file.type.startsWith('video/')) {
            setMediaType('video');
            const url = URL.createObjectURL(file);
            setPreview(url); setMediaFile(url);
        }
    };

    const publish = async () => {
        if (!caption.trim() && !mediaFile) { setErr('Write something or add media.'); return; }
        setUploading(true);
        await new Promise(r => setTimeout(r, 400));
        const post = {
            id: `post_${Date.now()}`,
            userId: 'prince', username: user.name,
            userAvatar: user.name[0].toUpperCase(), avatarColor: '#7c6eff',
            caption: caption.trim(), mediaUrl: mediaFile, mediaType, subject,
            likesCount: 0, createdAt: new Date().toISOString(),
        };
        onPublish(post);
        // Simulate followers being notified
        setTimeout(() => {
            pushNotification({ type: 'post', from: 'System', fromColor: '#7c6eff', message: `Your post was shared with your followers!` });
        }, 2000);
        setUploading(false);
        onClose();
    };

    return (
        <div className="post-modal-bg" onClick={onClose}>
            <div className="post-modal" onClick={e => e.stopPropagation()}>
                <div className="post-modal-hdr">
                    <h3><Globe size={15} /> Create Learning Post</h3>
                    <button onClick={onClose}><X size={17} /></button>
                </div>
                <div className="post-modal-body">
                    <div className="post-modal-user">
                        <div className="post-avatar sm" style={{ background: '#7c6eff' }}>{user.name[0]}</div>
                        <div>
                            <div className="post-username">{user.name}</div>
                            <select className="post-subject-select" value={subject} onChange={e => setSubject(e.target.value)}>
                                {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                    </div>
                    <textarea className="post-caption-input" placeholder={`What did you study today, ${user.name}?`} value={caption} onChange={e => setCaption(e.target.value)} rows={4} maxLength={500} />
                    <div className="post-char">{caption.length}/500</div>
                    {preview && (
                        <div className="post-preview-wrap">
                            {mediaType === 'image' ? <img src={preview} alt="preview" /> : <video src={preview} controls />}
                            <button className="post-preview-rm" onClick={() => { setMediaFile(null); setPreview(null); setMediaType(null); }}><X size={14} /></button>
                        </div>
                    )}
                    {err && <p className="post-err">{err}</p>}
                    <div className="post-modal-footer">
                        <div className="post-media-btns">
                            <button className="post-media-btn" onClick={() => { fileRef.current.accept = 'image/*'; fileRef.current.click(); }}><Image size={15} /> Photo</button>
                            <button className="post-media-btn" onClick={() => { fileRef.current.accept = 'video/*'; fileRef.current.click(); }}><Video size={15} /> Video</button>
                            <input ref={fileRef} type="file" style={{ display: 'none' }} onChange={handleFile} />
                        </div>
                        <button className="btn btn-primary btn-sm" onClick={publish} disabled={uploading || (!caption.trim() && !mediaFile)}>
                            {uploading ? 'Posting…' : <><Send size={13} /> Post</>}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Main Post Page ───────────────────────────────────────────────────────────
export default function Post() {
    const { user } = useApp();

    useEffect(() => {
        if (!localStorage.getItem('ytlearn_posts_seeded')) {
            writePosts(SEED_POSTS);
            localStorage.setItem('ytlearn_posts_seeded', '1');
        }
    }, []);

    const [allPosts, setAllPosts]   = useState(() => { const s = readPosts(); return s.length ? s : SEED_POSTS; });
    const [likedSet, setLikedSet]   = useState(readLiked);
    const [commentsMap, setComMap]  = useState(readComments);
    const [showCreate, setShow]     = useState(false);
    const [visible, setVisible]     = useState(PAGE_SIZE);
    const [filter, setFilter]       = useState('All');

    useEffect(() => { writePosts(allPosts); }, [allPosts]);

    const handleCommentsChange = useCallback(next => {
        setComMap(next); writeComments(next);
    }, []);

    const handleLike = useCallback(id => {
        setLikedSet(prev => {
            const next = new Set(prev);
            if (next.has(id)) { next.delete(id); }
            else {
                next.add(id);
                // Notify post owner if not own post
                const post = readPosts().find(p => p.id === id);
                if (post && post.userId !== 'prince') {
                    pushNotification({ type: 'like', from: user.name, fromColor: '#7c6eff', message: `${user.name} liked ${post.username}'s post.` });
                }
            }
            writeLiked(next);
            return next;
        });
    }, [user.name]);

    const handleDelete = useCallback(id => setAllPosts(p => p.filter(x => x.id !== id)), []);
    const handlePublish = useCallback(p => setAllPosts(prev => [p, ...prev]), []);

    const feed    = allPosts.filter(p => filter === 'All' || p.subject === filter).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const shown   = feed.slice(0, visible);
    const hasMore = visible < feed.length;

    const myPosts = allPosts.filter(p => p.userId === 'prince');
    const myLikes = myPosts.reduce((s, p) => s + p.likesCount, 0);

    return (
        <div className="post-page">
            {showCreate && <CreatePostModal user={user} onClose={() => setShow(false)} onPublish={handlePublish} />}

            {/* Feed column */}
            <div className="post-feed-col">
                <div className="post-feed-hdr">
                    <div className="post-feed-title">
                        <Globe size={18} style={{ color: 'var(--violet)' }} />
                        <h2>Learning Feed</h2>
                        <span className="badge badge-violet">{feed.length}</span>
                    </div>
                    <button className="btn btn-primary btn-sm" onClick={() => setShow(true)}><Plus size={14} /> Share Progress</button>
                </div>

                <div className="post-filter-chips">
                    {['All', ...SUBJECTS.filter(s => s !== 'General')].map(s => (
                        <button key={s} className={`post-chip ${filter === s ? 'active' : ''}`} onClick={() => { setFilter(s); setVisible(PAGE_SIZE); }}>{s}</button>
                    ))}
                </div>

                <div className="post-quick-bar" onClick={() => setShow(true)}>
                    <div className="post-avatar sm" style={{ background: '#7c6eff' }}>{user.name[0]}</div>
                    <div className="post-quick-placeholder">What did you study today, {user.name}?</div>
                    <div className="post-quick-icons"><Image size={14} /><Video size={14} /></div>
                </div>

                {shown.length === 0 ? (
                    <div className="post-empty"><BookOpen size={48} style={{ opacity: 0.2 }} /><h3>No posts in this subject</h3><p>Be the first to share!</p></div>
                ) : shown.map(p => (
                    <PostCard key={p.id} post={p} currentUser={user} likedSet={likedSet} commentsMap={commentsMap} onLike={handleLike} onDelete={handleDelete} onCommentsChange={handleCommentsChange} />
                ))}

                {hasMore && <button className="post-load-more" onClick={() => setVisible(n => n + PAGE_SIZE)}>Load more posts</button>}
            </div>

            {/* Stats sidebar */}
            <div className="post-stats-col">
                <div className="post-stats-card">
                    <h4><Zap size={14} style={{ color: 'var(--violet)' }} /> My Activity</h4>
                    <div className="post-stat-row"><span>Posts shared</span><strong>{myPosts.length}</strong></div>
                    <div className="post-stat-row"><span>Total likes</span><strong>{myLikes}</strong></div>
                    <div className="post-stat-row"><span>Posts liked</span><strong>{likedSet.size}</strong></div>
                    <div className="post-stat-row"><span>Comments</span><strong>{Object.values(commentsMap).flatMap(a => a).filter(c => c.userId === 'prince').length}</strong></div>
                </div>
                <div className="post-stats-card">
                    <h4>🔥 Top Learners</h4>
                    {[{ name: 'Rahul Sharma', posts: 2, a: 'R', c: '#7c6eff' }, { name: 'Priya Verma', posts: 2, a: 'P', c: '#00d4ff' }, { name: 'Arjun Singh', posts: 1, a: 'A', c: '#00ff88' }]
                        .map((l, i) => (
                            <div key={i} className="top-learner-row">
                                <div className="post-avatar xs" style={{ background: l.c }}>{l.a}</div>
                                <span className="tl-name">{l.name}</span>
                                <span className="tl-posts">{l.posts} posts</span>
                            </div>
                        ))}
                </div>
                <div className="post-stats-card tip-card">
                    <h4>💡 Tips</h4>
                    <ul>
                        <li>Share what you learned today</li>
                        <li>Tag the right subject</li>
                        <li>Celebrate small wins too!</li>
                        <li>Engage with others' posts</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
