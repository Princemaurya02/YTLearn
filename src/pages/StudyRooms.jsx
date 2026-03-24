import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
    Users, Wifi, Plus, MessageCircle, Video, X, Link2,
    Crown, LogOut, Share2, Copy, Check, Search, Loader,
    Send, Radio, UserPlus, Hash, Monitor, MonitorOff,
    Mic, MicOff, Volume2, VolumeX, PhoneOff
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useStudyRooms } from '../hooks/useStudyRooms';
import { useWebRTC } from '../hooks/useWebRTC';
import { useNavigate } from 'react-router-dom';
import './StudyRooms.css';

const SUBJECTS = [
    'DSA', 'React', 'Python', 'JavaScript', 'Node.js',
    'Web Dev', 'Java', 'Machine Learning', 'C++', 'TypeScript',
    'NEET', 'JEE', 'General',
];

const AVATAR_COLORS = [
    '#7c6eff', '#00d4ff', '#ff6b9d', '#ffb347', '#00ff88',
    '#f472b6', '#a78bfa', '#34d399', '#60a5fa', '#fb923c',
];

function avatarColor(name = '') {
    const idx = name.charCodeAt(0) % AVATAR_COLORS.length;
    return AVATAR_COLORS[idx];
}

function timeAgo(ts) {
    const diff = Date.now() - ts;
    if (diff < 60000) return 'just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    return `${Math.floor(diff / 3600000)}h ago`;
}

/* ── Create Room Modal ───────────────────────────────────────── */
function CreateRoomModal({ userName, onClose, onCreated }) {
    const [name, setName] = useState('');
    const [subject, setSubject] = useState('DSA');
    const [maxMembers, setMax] = useState(8);
    const [creating, setCreating] = useState(false);

    function handleCreate(e) {
        e.preventDefault();
        if (!name.trim()) return;
        setCreating(true);
        setTimeout(() => {
            onCreated({ name, subject, maxMembers });
            onClose();
        }, 400);
    }

    return (
        <div className="sr-modal-overlay" onClick={onClose}>
            <div className="sr-modal" onClick={e => e.stopPropagation()}>
                <div className="sr-modal-header">
                    <h3>🎯 Create Study Room</h3>
                    <button className="sr-modal-close" onClick={onClose}><X size={18} /></button>
                </div>
                <form onSubmit={handleCreate} className="sr-modal-body">
                    <label>
                        Room Name
                        <input
                            autoFocus
                            placeholder="e.g. DSA Grind, React Masters…"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            maxLength={40}
                            required
                        />
                    </label>
                    <label>
                        Subject
                        <select value={subject} onChange={e => setSubject(e.target.value)}>
                            {SUBJECTS.map(s => <option key={s}>{s}</option>)}
                        </select>
                    </label>
                    <label>
                        Max Members
                        <div className="sr-max-row">
                            {[2, 4, 6, 8, 12].map(n => (
                                <button
                                    type="button"
                                    key={n}
                                    className={`sr-max-chip ${maxMembers === n ? 'active' : ''}`}
                                    onClick={() => setMax(n)}
                                >
                                    {n}
                                </button>
                            ))}
                        </div>
                    </label>
                    <button
                        className="btn btn-primary"
                        type="submit"
                        disabled={!name.trim() || creating}
                    >
                        {creating ? <><Loader size={14} className="spin" />Creating…</> : <><Plus size={14} />Create &amp; Join Room</>}
                    </button>
                </form>
            </div>
        </div>
    );
}

/* ── Invite Code Modal ───────────────────────────────────────── */
function InviteModal({ inviteCode, roomName, onClose }) {
    const [copied, setCopied] = useState(false);
    const shareUrl = `${window.location.origin}${window.location.pathname}?room=${inviteCode}`;

    function copy(text) {
        navigator.clipboard?.writeText(text).catch(() => { });
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }

    return (
        <div className="sr-modal-overlay" onClick={onClose}>
            <div className="sr-modal" onClick={e => e.stopPropagation()}>
                <div className="sr-modal-header">
                    <h3>Invite Friends</h3>
                    <button className="sr-modal-close" onClick={onClose}><X size={18} /></button>
                </div>
                <div className="sr-modal-body">
                    <p className="sr-invite-room-name">Room: <strong>{roomName}</strong></p>
                    <label>
                        Invite Code
                        <div className="sr-code-row">
                            <span className="sr-code-box"><Hash size={14} /> {inviteCode}</span>
                            <button className="btn btn-secondary btn-sm" onClick={() => copy(inviteCode)}>
                                {copied ? <Check size={13} /> : <Copy size={13} />}
                                {copied ? 'Copied!' : 'Copy'}
                            </button>
                        </div>
                    </label>
                    <label>
                        Shareable Link
                        <div className="sr-code-row">
                            <span className="sr-link-box">{shareUrl}</span>
                            <button className="btn btn-secondary btn-sm" onClick={() => copy(shareUrl)}>
                                {copied ? <Check size={13} /> : <Link2 size={13} />}
                            </button>
                        </div>
                    </label>
                    <div className="sr-invite-tip">
                        💡 Share this code or link — friends can paste it in the "Join by Code" box to enter your room instantly.
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ── Join by Code Modal ──────────────────────────────────────── */
function JoinCodeModal({ onJoin, onClose }) {
    const [code, setCode] = useState('');
    const [error, setError] = useState('');
    const [joining, setJoining] = useState(false);

    async function handle(e) {
        e.preventDefault();
        setJoining(true);
        setError('');
        try {
            const result = await onJoin(code);
            if (result === null || result === undefined) {
                setError('No room found with that code. Check and try again.');
            } else {
                onClose();
            }
        } catch {
            setError('Something went wrong. Please try again.');
        } finally {
            setJoining(false);
        }
    }

    return (
        <div className="sr-modal-overlay" onClick={onClose}>
            <div className="sr-modal" onClick={e => e.stopPropagation()}>
                <div className="sr-modal-header">
                    <h3><Hash size={16} /> Join by Code</h3>
                    <button className="sr-modal-close" onClick={onClose}><X size={18} /></button>
                </div>
                <form onSubmit={handle} className="sr-modal-body">
                    <label>
                        6-Character Code
                        <input
                            autoFocus
                            placeholder="e.g. AB12CD"
                            value={code}
                            onChange={e => { setCode(e.target.value.toUpperCase()); setError(''); }}
                            maxLength={6}
                            style={{ letterSpacing: '0.25em', fontWeight: 700, fontSize: 18 }}
                            required
                        />
                    </label>
                    {error && <div className="sr-error">{error}</div>}
                    <button className="btn btn-primary" type="submit" disabled={code.length !== 6 || joining}>
                        {joining ? <><Loader size={13} className="spin" /> Joining…</> : <><UserPlus size={14} /> Join Room</>}
                    </button>
                </form>
            </div>
        </div>
    );
}

/* ── Screen Share Panel ──────────────────────────────────────── */
function LocalScreenVideo({ stream }) {
    const ref = useRef(null);
    useEffect(() => {
        if (ref.current) ref.current.srcObject = stream || null;
    }, [stream]);
    return (
        <video
            ref={ref}
            className="sr-screen-video"
            autoPlay
            muted          /* muted = no local echo */
            playsInline
        />
    );
}

/** Renders one <video> per remote stream so React's key system keeps refs stable */
function RemoteStreamVideo({ stream }) {
    const ref = useRef(null);
    useEffect(() => {
        if (ref.current) ref.current.srcObject = stream;
    }, [stream]);
    return <video ref={ref} className="sr-screen-video" autoPlay playsInline />;
}

/** Plays remote audio (mic) — hidden element */
function RemoteAudio({ stream }) {
    const ref = useRef(null);
    useEffect(() => {
        if (ref.current) ref.current.srcObject = stream;
    }, [stream]);
    return <audio ref={ref} autoPlay style={{ display: 'none' }} />;
}

function ScreenSharePanel({ amHost, sharing, shareActive, screenStream, remoteStreams, onStart }) {
    const remoteEntries = Object.entries(remoteStreams);

    // Host is sharing — show local preview
    if (amHost && sharing && screenStream) {
        return (
            <div className="sr-screen-wrap">
                <div className="sr-screen-label">
                    <span className="sr-screen-live-dot" />
                    <span>You are sharing your screen</span>
                </div>
                <LocalScreenVideo stream={screenStream} />
                {/* Render audio-only elements for mic from members */}
                {remoteEntries.map(([id, st]) => <RemoteAudio key={id} stream={st} />)}
            </div>
        );
    }

    // Member view — host is sharing
    if (!amHost && shareActive && remoteEntries.length > 0) {
        const [firstId, firstStream] = remoteEntries[0];
        return (
            <div className="sr-screen-wrap">
                <div className="sr-screen-label">
                    <span className="sr-screen-live-dot" />
                    <span>Host is sharing their screen</span>
                </div>
                <RemoteStreamVideo key={firstId} stream={firstStream} />
                {/* Play audio from all peers (mic) */}
                {remoteEntries.slice(1).map(([id, st]) => <RemoteAudio key={id} stream={st} />)}
            </div>
        );
    }

    // Member: host hasn't started sharing yet
    if (!amHost && shareActive && remoteEntries.length === 0) {
        return (
            <div className="sr-screen-placeholder">
                <div className="sr-screen-icon-wrap">
                    <Monitor size={52} strokeWidth={1.2} />
                </div>
                <p className="sr-screen-title">Connecting…</p>
                <p className="sr-screen-desc">Receiving the host's screen. This takes a moment.</p>
            </div>
        );
    }

    // No share active — placeholder
    return (
        <div className="sr-screen-placeholder">
            <div className="sr-screen-icon-wrap">
                <Monitor size={52} strokeWidth={1.2} />
            </div>
            {amHost ? (
                <>
                    <p className="sr-screen-title">Start Screen Share</p>
                    <p className="sr-screen-desc">Share your screen so members can follow along in real time — show code, diagrams, or slides.</p>
                    <button className="btn btn-primary sr-share-start-btn" onClick={onStart}>
                        <Monitor size={15} /> Start Screen Share
                    </button>
                </>
            ) : (
                <>
                    <p className="sr-screen-title">Waiting for host</p>
                    <p className="sr-screen-desc">Host can start screen sharing to teach or explain concepts in real time.</p>
                </>
            )}
        </div>
    );
}

/* ── Media Controls Bar ─────────────────────────────────────── */
function MediaControlsBar({ amHost, sharing, micOn, shareActive, onStartShare, onStopShare, onToggleMic }) {
    return (
        <div className="sr-media-controls">
            {/* Mic Toggle */}
            <button
                className={`sr-ctrl-btn ${micOn ? 'sr-ctrl-active-green' : ''}`}
                onClick={onToggleMic}
                title={micOn ? 'Mute Mic' : 'Unmute Mic'}
            >
                {micOn ? <Mic size={16} /> : <MicOff size={16} />}
                <span>{micOn ? 'Mic ON' : 'Mic OFF'}</span>
            </button>

            {/* Screen share controls — host only */}
            {amHost && (
                sharing ? (
                    <button
                        className="sr-ctrl-btn sr-ctrl-danger"
                        onClick={onStopShare}
                        title="Stop sharing"
                    >
                        <MonitorOff size={16} />
                        <span>Stop Share</span>
                    </button>
                ) : (
                    <button
                        className="sr-ctrl-btn sr-ctrl-active-violet"
                        onClick={onStartShare}
                        title="Start screen share"
                    >
                        <Monitor size={16} />
                        <span>Share Screen</span>
                    </button>
                )
            )}

            {/* Member: show share status */}
            {!amHost && shareActive && (
                <div className="sr-ctrl-badge-info">
                    <span className="sr-screen-live-dot" style={{ width: 7, height: 7, flexShrink: 0 }} />
                    <span>Host is sharing</span>
                </div>
            )}
        </div>
    );
}

/* ── Active Room View ────────────────────────────────────────── */
function ActiveRoomView({ room, amHost, MY_ID, onLeave, onClose, onSendMessage }) {
    const navigate = useNavigate();
    const [msg, setMsg] = useState('');
    const [reaction, setReaction] = useState(null);
    const [showInvite, setShowInvite] = useState(false);
    const chatEndRef = useRef(null);

    // WebRTC: screen share + mic
    const {
        screenStream, micOn, sharing, remoteStreams, micStatuses, shareActive,
        startScreenShare, stopScreenShare, toggleMic,
    } = useWebRTC({ roomId: room.id, myId: MY_ID, amHost, members: room.members });

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [room.messages]);

    function sendReaction(emoji) {
        setReaction(emoji);
        setTimeout(() => setReaction(null), 2200);
    }

    function handleSend(e) {
        e.preventDefault();
        if (!msg.trim()) return;
        onSendMessage(room.id, msg);
        setMsg('');
    }

    return (
        <div className="sr-active">
            {/* ── Top bar ───────────────────────────────── */}
            <div className="sr-active-header">
                <div className="sr-active-info">
                    <div className="live-badge">LIVE</div>
                    <h2>{room.name}</h2>
                    <span className="badge badge-violet">{room.subject}</span>
                    <span className="sr-active-members"><Users size={13} /> {room.members.length}/{room.maxMembers}</span>
                    {shareActive && (
                        <span className="sr-sharing-indicator">
                            <span className="sr-screen-live-dot" style={{ width: 7, height: 7 }} />
                            Screen Sharing
                        </span>
                    )}
                </div>
                <div className="sr-active-actions">
                    <button className="btn btn-secondary btn-sm" onClick={() => setShowInvite(true)}>
                        <Share2 size={13} /> Invite
                    </button>
                    {amHost ? (
                        <button className="btn btn-danger btn-sm" onClick={() => onClose(room.id)}>
                            <X size={13} /> Close Room
                        </button>
                    ) : (
                        <button className="btn btn-secondary btn-sm" onClick={() => onLeave(room.id)}>
                            <LogOut size={13} /> Leave
                        </button>
                    )}
                </div>
            </div>

            {/* ── Body ──────────────────────────────────── */}
            <div className="sr-active-body">
                {/* Main screen area */}
                <div className="sr-video-area">
                    <ScreenSharePanel
                        amHost={amHost}
                        sharing={sharing}
                        shareActive={shareActive}
                        screenStream={screenStream}
                        remoteStreams={remoteStreams}
                        onStart={startScreenShare}
                    />

                    {/* Media controls bar */}
                    <MediaControlsBar
                        amHost={amHost}
                        sharing={sharing}
                        micOn={micOn}
                        shareActive={shareActive}
                        onStartShare={startScreenShare}
                        onStopShare={stopScreenShare}
                        onToggleMic={toggleMic}
                    />

                    {/* Reactions bar */}
                    <div className="sr-reactions">
                        {['💡', '❓', '🔥', '😮', '👏', '✅', '🤯'].map(e => (
                            <button key={e} className="reaction-btn" onClick={() => sendReaction(e)}>{e}</button>
                        ))}
                    </div>

                    {reaction && (
                        <div className="reaction-popup animate-fade-in">{reaction}</div>
                    )}
                </div>

                {/* Sidebar */}
                <div className="sr-sidebar">
                    {/* Members */}
                    <div className="sr-members-panel">
                        <div className="sr-panel-header">
                            <Users size={13} /> Members ({room.members.length})
                        </div>
                        <div className="sr-members-list">
                            {room.members.map(m => {
                                const isMicOn = m.id === MY_ID ? micOn : (micStatuses[m.id] ?? false);
                                return (
                                    <div key={m.id} className={`sr-member ${m.id === MY_ID ? 'me' : ''}`}>
                                        <div className="sr-member-avatar" style={{ background: avatarColor(m.name) }}>
                                            {m.name[0].toUpperCase()}
                                        </div>
                                        <div className="sr-member-info">
                                            <div className="sr-member-name">
                                                {m.name}
                                                {m.id === MY_ID && <span className="sr-you-tag">You</span>}
                                            </div>
                                            <div className="sr-member-status">
                                                {m.isHost ? '🎤 Host' : '📖 Studying'}
                                            </div>
                                        </div>
                                        {/* Mic status indicator */}
                                        <div
                                            className={`sr-mic-indicator ${isMicOn ? 'on' : 'off'}`}
                                            title={isMicOn ? 'Mic On' : 'Mic Off'}
                                        >
                                            {isMicOn ? <Mic size={11} /> : <MicOff size={11} />}
                                        </div>
                                        {m.isHost && <span className="host-badge"><Crown size={10} /> HOST</span>}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Chat */}
                    <div className="sr-chat-panel">
                        <div className="sr-panel-header">
                            <MessageCircle size={13} /> Room Chat
                        </div>
                        <div className="sr-chat-messages">
                            {room.messages.map(m => (
                                <div key={m.id} className={`sr-msg ${m.author === 'System' ? 'sr-msg-system' : ''}`}>
                                    {m.author !== 'System' && (
                                        <span className="sr-msg-author" style={{ color: avatarColor(m.author) }}>
                                            {m.author}:
                                        </span>
                                    )}
                                    <span className="sr-msg-text">{m.text}</span>
                                    <span className="sr-msg-time">{timeAgo(m.ts)}</span>
                                </div>
                            ))}
                            <div ref={chatEndRef} />
                        </div>
                        <form className="sr-chat-input" onSubmit={handleSend}>
                            <input
                                placeholder="Type a message…"
                                value={msg}
                                onChange={e => setMsg(e.target.value)}
                                maxLength={300}
                            />
                            <button className="btn btn-primary btn-sm sr-send-btn" type="submit" disabled={!msg.trim()}>
                                <Send size={13} />
                            </button>
                        </form>
                    </div>
                </div>
            </div>

            {showInvite && (
                <InviteModal
                    inviteCode={room.inviteCode}
                    roomName={room.name}
                    onClose={() => setShowInvite(false)}
                />
            )}
        </div>
    );
}

/* ── Room Card ───────────────────────────────────────────────── */
function RoomCard({ room, onJoin, MY_ID }) {
    const isFull = room.members.length >= room.maxMembers;
    const isLive = room.status === 'live';
    const imMember = room.members.some(m => m.id === MY_ID);
    const pct = (room.members.length / room.maxMembers) * 100;

    return (
        <div className={`room-card ${isLive ? 'live' : 'waiting'} ${isFull ? 'full' : ''}`}>
            <div className="room-card-header">
                <div className="room-card-info">
                    <h3>{room.name}</h3>
                    <div className="room-card-host">Hosted by {room.host}</div>
                </div>
                {isLive
                    ? <div className="live-badge">LIVE</div>
                    : <div className="waiting-badge">WAITING</div>
                }
            </div>

            <div className="room-card-body">
                <span className="badge badge-violet">{room.subject}</span>
                <div className="room-capacity">
                    <Users size={13} />
                    <span>{room.members.length}/{room.maxMembers} members</span>
                    <div className="capacity-bar">
                        <div className="capacity-fill" style={{ width: `${pct}%`, background: isFull ? '#ff4444' : undefined }} />
                    </div>
                </div>
            </div>

            {/* Member avatars */}
            <div className="member-dots">
                {room.members.slice(0, 6).map(m => (
                    <div key={m.id} className="member-dot" style={{ background: avatarColor(m.name) }} title={m.name}>
                        {m.name[0].toUpperCase()}
                    </div>
                ))}
                {room.members.length > 6 && (
                    <div className="member-dot more">+{room.members.length - 6}</div>
                )}
                {!isFull && <div className="member-dot empty">+</div>}
            </div>

            {/* Code */}
            <div className="room-code-row">
                <Hash size={11} /> <span>{room.inviteCode}</span>
                <span className="room-created">{timeAgo(room.createdAt)}</span>
            </div>

            <button
                className={`btn ${imMember ? 'btn-cyan' : isLive ? 'btn-primary' : 'btn-secondary'} room-join-btn`}
                onClick={() => onJoin(room.id)}
                disabled={isFull && !imMember}
            >
                {imMember ? (
                    <><Radio size={13} />Rejoin</>
                ) : isFull ? (
                    <><Users size={13} />Full</>
                ) : isLive ? (
                    <><Wifi size={13} />Join Live</>
                ) : (
                    <><Users size={13} />Join Room</>
                )}
            </button>
        </div>
    );
}

/* ── Main Page ───────────────────────────────────────────────── */
export default function StudyRooms() {
    const { user } = useApp();
    const {
        rooms, activeRoom, amHost, MY_ID,
        createRoom, joinRoom, leaveRoom, closeRoom, sendMessage, joinByCode,
    } = useStudyRooms(user?.name || 'You');

    const [showCreate, setShowCreate] = useState(false);
    const [showCode, setShowCode] = useState(false);
    const [search, setSearch] = useState('');
    const [subjFilter, setSubjFilter] = useState('All');

    // Check URL for invite code on mount
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const code = params.get('room');
        if (code) {
            joinByCode(code).catch(() => {});
            // Clean URL without reload
            window.history.replaceState({}, '', window.location.pathname);
        }
    // eslint-disable-next-line
    }, []);

    // Active room view
    if (activeRoom) {
        return (
            <ActiveRoomView
                room={activeRoom}
                amHost={amHost}
                MY_ID={MY_ID}
                onLeave={leaveRoom}
                onClose={closeRoom}
                onSendMessage={sendMessage}
            />
        );
    }

    const liveRooms = rooms.filter(r => r.status === 'live').length;
    const allSubjects = ['All', ...new Set(rooms.map(r => r.subject))];

    const displayed = rooms.filter(r => {
        const q = search.toLowerCase();
        const srch = r.name.toLowerCase().includes(q) || r.subject.toLowerCase().includes(q) || r.host.toLowerCase().includes(q);
        const sub = subjFilter === 'All' || r.subject === subjFilter;
        return srch && sub;
    });

    return (
        <div className="study-rooms-page">
            {/* ── Header ──────────────────────────────────── */}
            <div className="rooms-page-header">
                <div>
                    <h2>Live Study Rooms</h2>
                    <p>Study together in real-time. Screen sharing, voice chat, live reactions.</p>
                </div>
                <div className="rooms-header-actions">
                    <button className="btn btn-secondary" onClick={() => setShowCode(true)}>
                        <Hash size={15} /> Join by Code
                    </button>
                    <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
                        <Plus size={15} /> Create Room
                    </button>
                </div>
            </div>

            {/* ── Live indicator + search ──────────────────── */}
            <div className="rooms-toolbar">
                <div className="rooms-section-label">
                    <div className="live-dot-label" />
                    <span>{liveRooms} live · {rooms.length} total rooms</span>
                </div>
                <div className="rooms-search">
                    <Search size={13} />
                    <input
                        placeholder="Search rooms…"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {/* Subject filter */}
            {allSubjects.length > 2 && (
                <div className="rooms-subj-filter">
                    {allSubjects.map(s => (
                        <button
                            key={s}
                            className={`sr-subj-chip ${subjFilter === s ? 'active' : ''}`}
                            onClick={() => setSubjFilter(s)}
                        >
                            {s}
                        </button>
                    ))}
                </div>
            )}

            {/* ── Grid ────────────────────────────────────── */}
            <div className="rooms-grid">
                {displayed.map(room => (
                    <RoomCard
                        key={room.id}
                        room={room}
                        onJoin={joinRoom}
                        MY_ID={MY_ID}
                    />
                ))}

                {/* Create card */}
                <div className="room-card create-card" onClick={() => setShowCreate(true)}>
                    <Plus size={32} style={{ color: 'var(--text-muted)', opacity: 0.5 }} />
                    <h3>Create Your Room</h3>
                    <p>Invite friends and study together in real-time</p>
                    <button className="btn btn-secondary">Create Room</button>
                </div>
            </div>

            {/* Empty state */}
            {displayed.length === 0 && rooms.length > 0 && (
                <div className="sr-empty">
                    <Search size={40} style={{ opacity: 0.2 }} />
                    <h3>No rooms match your search</h3>
                    <p>Try a different name or subject filter.</p>
                </div>
            )}

            {rooms.length === 0 && (
                <div className="sr-empty">
                    <Radio size={48} style={{ opacity: 0.15 }} />
                    <h3>No live rooms yet</h3>
                    <p>Be the first to create one and invite your friends!</p>
                    <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
                        <Plus size={14} /> Create First Room
                    </button>
                </div>
            )}

            {/* ── Features panel ──────────────────────────── */}
            <div className="rooms-features">
                <h3>Why Study in Rooms?</h3>
                <div className="features-grid">
                    {[
                        { emoji: '🖥️', title: 'Screen Sharing', desc: 'Host shares their screen — show code, slides, or diagrams live to all members.' },
                        { emoji: '🎤', title: 'Voice Communication', desc: 'Talk with your study group using built-in mic. Toggle on/off anytime.' },
                        { emoji: '💬', title: 'Live Room Chat', desc: 'Discuss concepts, ask questions, and help each other in real time.' },
                        { emoji: '🔗', title: 'Instant Invite Links', desc: 'Share a code or link — friends join your room in one click.' },
                    ].map((f, i) => (
                        <div key={i} className="feature-item">
                            <span className="feature-emoji">{f.emoji}</span>
                            <div>
                                <div className="feature-title">{f.title}</div>
                                <div className="feature-desc">{f.desc}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Modals ──────────────────────────────────── */}
            {showCreate && (
                <CreateRoomModal
                    userName={user?.name || 'You'}
                    onClose={() => setShowCreate(false)}
                    onCreated={createRoom}
                />
            )}
            {showCode && (
                <JoinCodeModal
                    onJoin={joinByCode}
                    onClose={() => setShowCode(false)}
                />
            )}
        </div>
    );
}
