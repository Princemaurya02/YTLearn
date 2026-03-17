import React, { useState, useCallback } from 'react';
import {
    FileText, Search, Trash2, Clock, ExternalLink,
    StickyNote, Plus, X, BookOpen, FileUp
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import PDFReader from '../components/PDFReader';
import './Notes.css';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatTimestamp(s) {
    if (!s) return null;
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
}

const TAG_COLORS = {
    JavaScript: '#f7df1e', React: '#00d4ff', DSA: '#ffb347',
    Python: '#00ff88', 'Web Dev': '#7c6eff', 'Node.js': '#68a063',
    CSS: '#ff6b9d', TypeScript: '#3178c6', Personal: '#9898b8', General: '#9898b8',
};

function tagColor(tag) { return TAG_COLORS[tag] || '#7c6eff'; }

// ─── Quick Note sub-section ───────────────────────────────────────────────────
function QuickNoteSection({ addNote }) {
    const [text, setText] = useState('');
    const [tags, setTags] = useState('');
    const [justSaved, setJustSaved] = useState(false);

    const handleSave = useCallback(() => {
        if (!text.trim()) return;
        const tagsArr = tags.split(',').map(t => t.trim()).filter(Boolean);
        addNote({ text: text.trim(), videoId: 'manual', videoTitle: 'Manual Note', timestamp: 0, tags: tagsArr.length ? tagsArr : ['Personal'] });
        setText(''); setTags('');
        setJustSaved(true);
        setTimeout(() => setJustSaved(false), 2000);
    }, [text, tags, addNote]);

    return (
        <div className="notes-add-card">
            <div className="notes-add-header">
                <StickyNote size={18} />
                <h3>Quick Note</h3>
            </div>
            <textarea
                className="notes-quick-input"
                placeholder="Write a note… Ctrl+Enter to save"
                value={text}
                onChange={e => setText(e.target.value)}
                onKeyDown={e => e.ctrlKey && e.key === 'Enter' && handleSave()}
                rows={4}
            />
            <input
                className="notes-tags-input"
                placeholder="Tags (comma-separated): JavaScript, React, DSA …"
                value={tags}
                onChange={e => setTags(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSave()}
            />
            <div className="notes-add-footer">
                <span className="notes-tip">💡 Notes taken in Player are auto-linked to video timestamps</span>
                <button
                    className={`btn btn-sm ${justSaved ? 'btn-cyan' : 'btn-primary'}`}
                    onClick={handleSave}
                    disabled={!text.trim()}
                >
                    {justSaved ? <><FileText size={14} /> Saved!</> : <><Plus size={14} /> Save Note</>}
                </button>
            </div>
        </div>
    );
}

// ─── My Notes sub-section ─────────────────────────────────────────────────────
function MyNotesSection({ notes, deleteNote }) {
    const navigate = useNavigate();
    const [search, setSearch] = useState('');
    const [activeTag, setActiveTag] = useState('All');
    const [confirmId, setConfirmId] = useState(null);

    const allTags = ['All', ...new Set(notes.flatMap(n => n.tags || []))];

    const filtered = notes.filter(n => {
        const q = search.toLowerCase();
        const matchSearch =
            n.text?.toLowerCase().includes(q) ||
            n.videoTitle?.toLowerCase().includes(q) ||
            (n.tags || []).some(t => t.toLowerCase().includes(q));
        const matchTag = activeTag === 'All' || (n.tags || []).includes(activeTag);
        return matchSearch && matchTag;
    });

    const handleDelete = useCallback((id) => {
        if (confirmId === id) { deleteNote(id); setConfirmId(null); }
        else {
            setConfirmId(id);
            setTimeout(() => setConfirmId(prev => prev === id ? null : prev), 3000);
        }
    }, [confirmId, deleteNote]);

    return (
        <>
            {/* Search */}
            <div className="notes-filters">
                <div className="notes-search">
                    <Search size={15} />
                    <input placeholder="Search notes by content, title or tag…" value={search} onChange={e => setSearch(e.target.value)} />
                    {search && <button className="notes-clear-btn" onClick={() => setSearch('')}><X size={13} /></button>}
                </div>
                <div className="notes-tags">
                    {allTags.map(tag => (
                        <button
                            key={tag}
                            className={`tag-chip ${activeTag === tag ? 'active' : ''}`}
                            onClick={() => setActiveTag(tag)}
                            style={activeTag === tag && tag !== 'All' ? { borderColor: tagColor(tag), color: tagColor(tag) } : undefined}
                        >
                            {tag}
                        </button>
                    ))}
                </div>
            </div>

            {/* Count bar */}
            <div className="notes-count">
                <BookOpen size={14} />
                <span>
                    {filtered.length === 0 ? 'No notes' : `${filtered.length} note${filtered.length !== 1 ? 's' : ''}`}
                    {search || activeTag !== 'All' ? ' matching filter' : ' total'}
                </span>
                {(search || activeTag !== 'All') && (
                    <button className="notes-reset-link" onClick={() => { setSearch(''); setActiveTag('All'); }}>Clear filters</button>
                )}
            </div>

            {/* Grid */}
            {filtered.length > 0 ? (
                <div className="notes-grid">
                    {filtered.map(note => (
                        <div key={note.id} className="note-card">
                            <div className="note-card-header">
                                <div className="note-card-timestamp">
                                    <Clock size={12} />
                                    <span>{note.videoId && note.videoId !== 'manual' ? formatTimestamp(note.timestamp) : 'Manual'}</span>
                                </div>
                                <div className="note-card-actions">
                                    {note.videoId && note.videoId !== 'manual' && (
                                        <button className="note-action-btn" title="Open in Player"
                                            onClick={() => navigate(`/player/${note.videoId}`, { state: { resumeAt: note.timestamp } })}>
                                            <ExternalLink size={13} />
                                        </button>
                                    )}
                                    <button
                                        className={`note-action-btn delete ${confirmId === note.id ? 'confirming' : ''}`}
                                        title={confirmId === note.id ? 'Click again to confirm' : 'Delete note'}
                                        onClick={() => handleDelete(note.id)}
                                    >
                                        <Trash2 size={13} />
                                        {confirmId === note.id && <span className="delete-confirm-label">Confirm?</span>}
                                    </button>
                                </div>
                            </div>
                            <p className="note-card-text">{note.text}</p>
                            {note.videoTitle && note.videoTitle !== 'Manual Note' && (
                                <div className="note-card-source">📺 {note.videoTitle}</div>
                            )}
                            <div className="note-card-footer">
                                <div className="note-card-tags">
                                    {(note.tags || []).map(tag => (
                                        <span
                                            key={tag}
                                            className="badge"
                                            style={{ fontSize: 10, background: tagColor(tag) + '22', color: tagColor(tag), border: `1px solid ${tagColor(tag)}44`, borderRadius: 4, padding: '2px 6px', cursor: 'pointer' }}
                                            onClick={() => setActiveTag(tag)}
                                        >
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                                <span className="note-card-date">{note.createdAt}</span>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="notes-empty">
                    <StickyNote size={52} style={{ color: 'var(--text-muted)', opacity: 0.4 }} />
                    {notes.length === 0 ? (
                        <>
                            <h3>No notes yet</h3>
                            <p>Write your first note in Quick Notes, or take notes while watching a video in the Player — they'll appear here automatically.</p>
                        </>
                    ) : (
                        <>
                            <h3>No notes match your filter</h3>
                            <p>Try a different search term or tag.</p>
                            <button className="btn btn-secondary btn-sm" onClick={() => { setSearch(''); setActiveTag('All'); }}>Clear filters</button>
                        </>
                    )}
                </div>
            )}
        </>
    );
}

// ─── Main exported component ──────────────────────────────────────────────────
export default function Notes() {
    const { notes, addNote, deleteNote } = useApp();
    const [tab, setTab] = useState('quick'); // 'quick' | 'notes' | 'pdf'

    const TABS = [
        { id: 'quick', icon: StickyNote, label: 'Quick Notes' },
        { id: 'notes', icon: BookOpen, label: 'My Notes', badge: notes.length > 0 ? notes.length : null },
        { id: 'pdf', icon: FileUp, label: 'Read Notes' },
    ];

    return (
        <div className="notes-page">
            {/* Tab bar */}
            <div className="notes-tab-bar">
                {TABS.map(t => (
                    <button
                        key={t.id}
                        className={`notes-tab-btn ${tab === t.id ? 'active' : ''}`}
                        onClick={() => setTab(t.id)}
                    >
                        <t.icon size={15} />
                        {t.label}
                        {t.badge != null && <span className="notes-tab-badge">{t.badge}</span>}
                    </button>
                ))}
            </div>

            {/* Tab content */}
            {tab === 'quick' && <QuickNoteSection addNote={addNote} />}
            {tab === 'notes' && <MyNotesSection notes={notes} deleteNote={deleteNote} />}
            {tab === 'pdf'   && <PDFReader />}
        </div>
    );
}
