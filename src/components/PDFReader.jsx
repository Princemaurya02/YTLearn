import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    Upload, X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut,
    Bookmark, BookmarkCheck, FileText, Brain, Zap, Star,
    Maximize, Minimize, Search, StickyNote, Trash2,
    Highlighter, BookOpen, Clock, FileImage, FileSpreadsheet,
    Presentation, File,
} from 'lucide-react';
import './PDFReader.css';

// ─── Constants ────────────────────────────────────────────────────────────────
const MAX_MB   = 25;
const FILES_KEY = 'ytlearn_study_files';   // renamed from PDFS_KEY for clarity
const ANN_KEY  = 'ytlearn_pdf_ann';
const BM_KEY   = 'ytlearn_pdf_bm';
const ST_KEY   = 'ytlearn_pdf_study';
const COLORS   = { yellow: '#fef08a', blue: '#bfdbfe', green: '#bbf7d0', pink: '#fecdd3' };

// ─── Allowed MIME types ───────────────────────────────────────────────────────
const ALLOWED_TYPES = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'image/png',
    'image/jpeg',
    'image/jpg',
    'image/webp',
];

const ALLOWED_EXT = ['.pdf', '.doc', '.docx', '.ppt', '.pptx', '.png', '.jpg', '.jpeg', '.webp'];

// ─── File type helpers ────────────────────────────────────────────────────────
function detectFileKind(mime, name) {
    if (mime === 'application/pdf' || name?.toLowerCase().endsWith('.pdf')) return 'pdf';
    if (mime?.startsWith('image/') || /\.(png|jpe?g|webp|gif)$/i.test(name)) return 'image';
    if (
        mime === 'application/msword' ||
        mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        /\.(doc|docx)$/i.test(name)
    ) return 'word';
    if (
        mime === 'application/vnd.ms-powerpoint' ||
        mime === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' ||
        /\.(ppt|pptx)$/i.test(name)
    ) return 'ppt';
    return 'other';
}

function fileKindLabel(kind) {
    return { pdf: 'PDF', image: 'Image', word: 'Word', ppt: 'PowerPoint', other: 'File' }[kind] || 'File';
}

function fileKindColor(kind) {
    return { pdf: '#f43f5e', image: '#00d4ff', word: '#3178c6', ppt: '#ff6b47', other: '#9898b8' }[kind] || '#9898b8';
}

function FileKindIcon({ kind, size = 36 }) {
    const c = fileKindColor(kind);
    if (kind === 'pdf')   return <FileText size={size} style={{ color: c }} />;
    if (kind === 'image') return <FileImage size={size} style={{ color: c }} />;
    if (kind === 'word')  return <FileSpreadsheet size={size} style={{ color: c }} />;
    if (kind === 'ppt')   return <Presentation size={size} style={{ color: c }} />;
    return <File size={size} style={{ color: c }} />;
}

// ─── IndexedDB for raw file data ──────────────────────────────────────────────
const IDB = {
    _db: null,
    async open() {
        if (this._db) return this._db;
        return new Promise((res, rej) => {
            const r = indexedDB.open('ytlearn_filestore', 2);
            r.onupgradeneeded = e => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains('files')) db.createObjectStore('files');
            };
            r.onsuccess = e => { this._db = e.target.result; res(this._db); };
            r.onerror = rej;
        });
    },
    async save(id, data) {
        const db = await this.open();
        return new Promise((res, rej) => {
            const tx = db.transaction('files', 'readwrite');
            tx.objectStore('files').put(data, id);
            tx.oncomplete = res; tx.onerror = rej;
        });
    },
    async load(id) {
        const db = await this.open();
        return new Promise((res, rej) => {
            const tx = db.transaction('files', 'readonly');
            const r = tx.objectStore('files').get(id);
            r.onsuccess = () => res(r.result); r.onerror = rej;
        });
    },
    async del(id) {
        const db = await this.open();
        return new Promise((res, rej) => {
            const tx = db.transaction('files', 'readwrite');
            tx.objectStore('files').delete(id);
            tx.oncomplete = res; tx.onerror = rej;
        });
    },
};

// ─── localStorage helpers ─────────────────────────────────────────────────────
const LS = {
    get:    (k, fb = [])  => { try { return JSON.parse(localStorage.getItem(k) ?? null) ?? fb; } catch { return fb; } },
    set:    (k, v)        => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
    getMap: (k)           => { try { return JSON.parse(localStorage.getItem(k) ?? null) ?? {}; } catch { return {}; } },
    setMap: (k, v)        => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
};

// ─── pdf.js CDN loader ────────────────────────────────────────────────────────
let _pdfJsP = null;
function loadPdfJs() {
    if (_pdfJsP) return _pdfJsP;
    _pdfJsP = new Promise((res, rej) => {
        if (window.pdfjsLib) { res(window.pdfjsLib); return; }
        if (!document.getElementById('pdfjs-css')) {
            const l = document.createElement('link');
            l.id = 'pdfjs-css'; l.rel = 'stylesheet';
            l.href = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf_viewer.min.css';
            document.head.appendChild(l);
        }
        const s = document.createElement('script');
        s.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
        s.onload = () => {
            window.pdfjsLib.GlobalWorkerOptions.workerSrc =
                'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
            res(window.pdfjsLib);
        };
        s.onerror = rej;
        document.head.appendChild(s);
    });
    return _pdfJsP;
}

// ─── AI helpers ───────────────────────────────────────────────────────────────
const AI_TEMPLATES = [
    t => `**Simplified Explanation**\n\nThe selected text discusses:\n> "${t.slice(0, 80)}${t.length > 80 ? '…' : ''}"\n\n**What it means:** This concept refers to a foundational principle where each component contributes to a larger system. Think of it as a recipe — miss one ingredient and the result changes.\n\n**Key terms simplified:**\n• Break each technical word into its root meaning\n• Connect it to something familiar in daily life\n• Ask: "What problem does this solve?"`,
    t => `**Concept Breakdown**\n\n📌 **Core idea:** ${t.slice(0, 60)}…\n\n**Why it matters:**\nThis forms the backbone of understanding the topic. Without it, related concepts won't make sense.\n\n**Simple analogy:** Like learning addition before multiplication — this is a prerequisite.\n\n**Study tip:** Write this definition in your own words and create 2 examples.`,
    t => `**AI Analysis**\n\nYour selected text covers an important concept. Here's the breakdown:\n\n1. **Definition** — The literal meaning of what's described\n2. **Context** — Why this appears in this document\n3. **Application** — How you'd use this knowledge in practice\n\n💡 **Memory trick:** Associate the key term with a vivid mental image or a real-world example you already know well.`,
];

function aiExplain(text) {
    const h = text.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    return AI_TEMPLATES[h % AI_TEMPLATES.length](text);
}

function aiFlashcards(texts, title) {
    const sentences = texts.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 20).slice(0, 6);
    const cards = sentences.map((s, i) => {
        const mid = s.split(' ')[Math.floor(s.split(' ').length / 2)] || 'concept';
        return { id: i, q: `What does "${mid}" refer to in this context?`, a: s };
    });
    if (cards.length < 2) {
        cards.push(
            { id: 98, q: `What is the main topic of "${title}"?`, a: 'Review and summarize the main points in your own words.' },
            { id: 99, q: 'List 3 key concepts from this document.', a: 'Refer to your highlights and notes for the most important ideas.' },
        );
    }
    return cards.slice(0, 8);
}

function aiSummary(page, title) {
    return `**Page ${page} Summary — ${title}**\n\nThis page covers essential concepts that build on earlier material. Key points:\n\n• **Core definitions** — fundamental terms and their meanings\n• **Practical applications** — how the concepts are used\n• **Common patterns** — recurring structures worth memorising\n\n🎯 **Exam tip:** Re-read your highlights on this page and write a 3-sentence summary without looking. This tests real understanding.`;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtDate = iso => new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
const fmtSize = b  => b < 1048576 ? `${(b / 1024).toFixed(0)} KB` : `${(b / 1048576).toFixed(1)} MB`;

// ─────────────────────────────────────────────────────────────────────────────
// IMAGE VIEWER
// ─────────────────────────────────────────────────────────────────────────────
function ImageViewer({ meta, onClose }) {
    const [dataUrl, setDataUrl] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            const buf = await IDB.load(meta.id);
            if (!buf) { setLoading(false); return; }
            const blob = new Blob([buf], { type: meta.fileType || 'image/jpeg' });
            setDataUrl(URL.createObjectURL(blob));
            setLoading(false);
        })();
        return () => { if (dataUrl) URL.revokeObjectURL(dataUrl); };
    }, [meta.id]);

    return (
        <div className="pdf-reader-root">
            <div className="pdf-toolbar">
                <button className="pdf-back" onClick={onClose}><ChevronLeft size={16} /> Library</button>
                <span className="pdf-doc-title"><FileImage size={14} /> {meta.title}</span>
                <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-muted)' }}>{fmtSize(meta.fileSize)} • Image</span>
            </div>
            <div className="sm-image-viewer">
                {loading && <div className="sm-img-loading"><div className="loader" /><span>Loading image…</span></div>}
                {dataUrl && <img src={dataUrl} alt={meta.title} className="sm-image-full" />}
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// OFFICE PREVIEW (Word / PPT)
// ─────────────────────────────────────────────────────────────────────────────
function OfficePreview({ meta, onClose }) {
    const [dataUrl, setDataUrl] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            const buf = await IDB.load(meta.id);
            if (!buf) { setLoading(false); return; }
            const blob = new Blob([buf], { type: meta.fileType });
            setDataUrl(URL.createObjectURL(blob));
            setLoading(false);
        })();
        return () => { if (dataUrl) URL.revokeObjectURL(dataUrl); };
    }, [meta.id]);

    const isWord = meta.kind === 'word';
    const Icon   = isWord ? FileSpreadsheet : Presentation;
    const kindLbl = isWord ? 'Word Document' : 'PowerPoint';
    const color  = fileKindColor(meta.kind);

    const downloadFile = () => {
        if (!dataUrl) return;
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = meta.title + (isWord ? (meta.fileType?.includes('openxml') ? '.docx' : '.doc') : (meta.fileType?.includes('openxml') ? '.pptx' : '.ppt'));
        a.click();
    };

    return (
        <div className="pdf-reader-root">
            <div className="pdf-toolbar">
                <button className="pdf-back" onClick={onClose}><ChevronLeft size={16} /> Library</button>
                <span className="pdf-doc-title"><Icon size={14} style={{ color }} /> {meta.title}</span>
                <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-muted)' }}>{fmtSize(meta.fileSize)} • {kindLbl}</span>
            </div>
            <div className="sm-office-wrap">
                {loading && <div className="sm-img-loading"><div className="loader" /><span>Loading file…</span></div>}
                {!loading && (
                    <div className="sm-office-preview">
                        <div className="sm-office-icon-wrap">
                            <Icon size={72} style={{ color }} />
                        </div>
                        <h3 className="sm-office-title">{meta.title}</h3>
                        <p className="sm-office-sub">{kindLbl} • {fmtSize(meta.fileSize)} • Uploaded {fmtDate(meta.createdAt)}</p>
                        <div className="sm-office-info-box">
                            <p>📋 <strong>In-browser preview</strong> is not supported for {kindLbl} files. You can download and open this file locally with your device's Office application.</p>
                            <p>💡 <strong>Tip:</strong> Convert your {kindLbl} to PDF before uploading for the best in-app reading experience — including highlights, bookmarks, and AI study tools.</p>
                        </div>
                        {dataUrl && (
                            <button className="btn btn-primary" onClick={downloadFile}>
                                ⬇️ Download {kindLbl}
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
export default function PDFReader() {
    // ── Library state ─────────────────────────────────────────────────────────
    const [fileList,   setFileList]   = useState(() => {
        // Migrate old ytlearn_pdfs_meta entries
        const old = LS.get('ytlearn_pdfs_meta', []);
        const cur = LS.get(FILES_KEY, []);
        if (old.length && !cur.length) {
            const migrated = old.map(p => ({ ...p, kind: 'pdf', fileType: 'application/pdf', fileSize: p.size ?? 0 }));
            LS.set(FILES_KEY, migrated);
            return migrated;
        }
        return cur;
    });
    const [activeFile, setActiveFile] = useState(null);

    // ── PDF reader state ───────────────────────────────────────────────────────
    const [pdfDoc,    setPdfDoc]    = useState(null);
    const [page,      setPage]      = useState(1);
    const [total,     setTotal]     = useState(0);
    const [scale,     setScale]     = useState(1.2);
    const [loading,   setLoading]   = useState(false);
    const [rendering, setRendering] = useState(false);
    const [examMode,  setExamMode]  = useState(false);
    const [fullscreen,setFullscreen]= useState(false);
    const [panel,     setPanel]     = useState('highlights');
    const [annotations, setAnnotations] = useState([]);
    const [bookmarks,   setBookmarks]   = useState([]);
    const [selText,   setSelText]   = useState('');
    const [ctxPos,    setCtxPos]    = useState({ x: 0, y: 0 });
    const [showCtx,   setShowCtx]   = useState(false);
    const [hlColor,   setHlColor]   = useState('yellow');
    const [noteInput, setNoteInput] = useState('');
    const [showNoteModal, setShowNoteModal] = useState(false);
    const [aiText,    setAiText]    = useState('');
    const [aiLoading, setAiLoading] = useState(false);
    const [flashcards,setFlashcards]= useState([]);
    const [cardIdx,   setCardIdx]   = useState(0);
    const [cardFlipped, setCardFlipped] = useState(false);
    const [summary,   setSummary]   = useState('');
    const [searchQ,   setSearchQ]   = useState('');
    const [searchRes, setSearchRes] = useState([]);
    const [showSearch,setShowSearch]= useState(false);
    const [dragOver,  setDragOver]  = useState(false);
    const [uploadErr, setUploadErr] = useState('');

    const canvasRef  = useRef(null);
    const textRef    = useRef(null);
    const readerRef  = useRef(null);
    const renderRef  = useRef(null);
    const studyStart = useRef(null);

    useEffect(() => { loadPdfJs(); }, []);

    useEffect(() => {
        if (pdfDoc && page) renderPage(pdfDoc, page, scale);
    }, [pdfDoc, page, scale]);

    useEffect(() => {
        if (!activeFile) return;
        studyStart.current = Date.now();
        return () => {
            const secs = Math.floor((Date.now() - (studyStart.current || Date.now())) / 1000);
            if (secs > 10 && activeFile) {
                const map = LS.getMap(ST_KEY);
                map[activeFile.id] = (map[activeFile.id] || 0) + secs;
                LS.setMap(ST_KEY, map);
            }
        };
    }, [activeFile]);

    useEffect(() => {
        const h = () => setFullscreen(!!document.fullscreenElement);
        document.addEventListener('fullscreenchange', h);
        return () => document.removeEventListener('fullscreenchange', h);
    }, []);

    // ── PDF page render ────────────────────────────────────────────────────────
    const renderPage = useCallback(async (doc, pg, sc) => {
        if (!doc || !canvasRef.current) return;
        if (renderRef.current) { try { renderRef.current.cancel(); } catch {} }
        setRendering(true);
        try {
            const lib = await loadPdfJs();
            const p = await doc.getPage(pg);
            const vp = p.getViewport({ scale: sc });
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            canvas.width = vp.width; canvas.height = vp.height;
            const task = p.render({ canvasContext: ctx, viewport: vp });
            renderRef.current = task;
            await task.promise;
            if (textRef.current) {
                textRef.current.innerHTML = '';
                textRef.current.style.width = `${vp.width}px`;
                textRef.current.style.height = `${vp.height}px`;
                const tc = await p.getTextContent();
                if (lib.renderTextLayer) {
                    lib.renderTextLayer({ textContent: tc, container: textRef.current, viewport: vp, textDivs: [] });
                }
            }
        } catch (e) {
            if (e?.name !== 'RenderingCancelledException') console.warn('Render error:', e);
        } finally { setRendering(false); }
    }, []);

    // ── Open file ──────────────────────────────────────────────────────────────
    const openFile = useCallback(async (meta) => {
        setActiveFile(meta);
        setPage(1); setAiText(''); setSummary(''); setFlashcards([]);
        if (meta.kind !== 'pdf') return; // Image/Office handled by sub-components
        setLoading(true);
        const annMap = LS.getMap(ANN_KEY);
        setAnnotations(annMap[meta.id] || []);
        const bmMap = LS.getMap(BM_KEY);
        setBookmarks(bmMap[meta.id] || []);
        try {
            const lib = await loadPdfJs();
            const buf = await IDB.load(meta.id);
            const doc = await lib.getDocument({ data: buf }).promise;
            setPdfDoc(doc); setTotal(doc.numPages);
        } catch (e) { console.error('Open PDF error:', e); }
        finally { setLoading(false); }
    }, []);

    const closeFile = useCallback(() => {
        pdfDoc?.destroy();
        setPdfDoc(null); setActiveFile(null);
        setPage(1); setTotal(0); setAnnotations([]); setBookmarks([]);
        setExamMode(false); setShowSearch(false); setSearchRes([]);
        setFlashcards([]); setAiText(''); setSummary(''); setShowCtx(false);
    }, [pdfDoc]);

    // ── Upload ─────────────────────────────────────────────────────────────────
    const handleUpload = useCallback(async (file) => {
        setUploadErr('');
        if (!file) return;

        // Determine kind (by MIME or extension fallback)
        const mime = file.type || '';
        const kind = detectFileKind(mime, file.name);

        // Validate type
        const extOk = ALLOWED_EXT.some(e => file.name.toLowerCase().endsWith(e));
        const mimeOk = ALLOWED_TYPES.includes(mime);
        if (!mimeOk && !extOk) {
            setUploadErr('Unsupported file format. Please upload PDF, Word, PowerPoint, or Image files.');
            return;
        }

        // Size check
        if (file.size > MAX_MB * 1024 * 1024) {
            setUploadErr(`File too large. Maximum size is ${MAX_MB} MB.`);
            return;
        }

        setLoading(true);
        try {
            const buf = await file.arrayBuffer();
            let pages = 1;

            // For PDFs, count pages
            if (kind === 'pdf') {
                try {
                    const lib = await loadPdfJs();
                    const doc = await lib.getDocument({ data: buf.slice(0) }).promise;
                    pages = doc.numPages;
                    doc.destroy();
                } catch {}
            }

            const cleanName = file.name.replace(/\.[^.]+$/, '');
            const meta = {
                id:        `sm_${Date.now()}`,
                title:     cleanName,
                fileType:  mime || `application/${kind}`,
                fileSize:  file.size,
                kind,
                pages,
                createdAt: new Date().toISOString(),
            };

            await IDB.save(meta.id, buf);
            const updated = [meta, ...LS.get(FILES_KEY, [])];
            LS.set(FILES_KEY, updated);
            setFileList(updated);
        } catch (e) {
            setUploadErr('Failed to process file. Please try a different file.');
            console.error(e);
        } finally { setLoading(false); }
    }, []);

    const deleteFile = useCallback(async (id, e) => {
        e.stopPropagation();
        await IDB.del(id);
        const updated = fileList.filter(f => f.id !== id);
        LS.set(FILES_KEY, updated);
        setFileList(updated);
    }, [fileList]);

    // ── Navigation ─────────────────────────────────────────────────────────────
    const goTo = useCallback(n => setPage(Math.max(1, Math.min(total, n))), [total]);

    // ── Bookmark ───────────────────────────────────────────────────────────────
    const toggleBM = useCallback(() => {
        const next = bookmarks.includes(page)
            ? bookmarks.filter(b => b !== page)
            : [...bookmarks, page].sort((a, b) => a - b);
        setBookmarks(next);
        const bmap = LS.getMap(BM_KEY); bmap[activeFile.id] = next; LS.setMap(BM_KEY, bmap);
    }, [bookmarks, page, activeFile]);

    // ── Text selection ─────────────────────────────────────────────────────────
    const handleMouseUp = useCallback(() => {
        const sel = window.getSelection();
        const txt = sel?.toString().trim();
        if (txt && txt.length > 3) {
            const r = sel.getRangeAt(0).getBoundingClientRect();
            setSelText(txt);
            setCtxPos({ x: r.left + r.width / 2, y: r.top - 4 });
            setShowCtx(true);
        } else { setShowCtx(false); setSelText(''); }
    }, []);

    // ── Highlight ──────────────────────────────────────────────────────────────
    const saveHighlight = useCallback((color, note = '') => {
        if (!selText || !activeFile) return;
        const ann = { id: `a${Date.now()}`, pdfId: activeFile.id, pageNumber: page, highlightText: selText, color, note, createdAt: new Date().toISOString() };
        const next = [ann, ...annotations];
        setAnnotations(next);
        const amap = LS.getMap(ANN_KEY); amap[activeFile.id] = next; LS.setMap(ANN_KEY, amap);
        setShowCtx(false); setSelText(''); setNoteInput(''); setShowNoteModal(false);
        window.getSelection()?.removeAllRanges();
    }, [selText, activeFile, page, annotations]);

    const delAnnotation = useCallback(id => {
        const next = annotations.filter(a => a.id !== id);
        setAnnotations(next);
        const amap = LS.getMap(ANN_KEY); amap[activeFile.id] = next; LS.setMap(ANN_KEY, amap);
    }, [annotations, activeFile]);

    // ── AI ─────────────────────────────────────────────────────────────────────
    const runAI = useCallback(async (fn) => {
        setPanel('ai'); setAiLoading(true); setSummary(''); setAiText('');
        await new Promise(r => setTimeout(r, 900));
        fn(); setAiLoading(false);
    }, []);

    const explainText = useCallback((txt = selText) => {
        if (!txt) return;
        setShowCtx(false);
        runAI(() => setAiText(aiExplain(txt)));
    }, [selText, runAI]);

    const genFlashcards = useCallback(() => {
        setPanel('flashcards'); setAiLoading(true); setFlashcards([]);
        setTimeout(() => {
            const texts = annotations.map(a => a.highlightText).join('. ') || activeFile?.title || '';
            setFlashcards(aiFlashcards(texts, activeFile?.title || ''));
            setCardIdx(0); setCardFlipped(false); setAiLoading(false);
        }, 1100);
    }, [annotations, activeFile]);

    const summarizePage = useCallback(() => {
        runAI(() => setSummary(aiSummary(page, activeFile?.title || '')));
    }, [page, activeFile, runAI]);

    // ── Search ─────────────────────────────────────────────────────────────────
    const doSearch = useCallback(async () => {
        if (!searchQ.trim() || !pdfDoc) return;
        const results = [];
        for (let i = 1; i <= total; i++) {
            const pg = await pdfDoc.getPage(i);
            const tc = await pg.getTextContent();
            const text = tc.items.map(it => it.str).join(' ');
            if (text.toLowerCase().includes(searchQ.toLowerCase())) {
                const idx = text.toLowerCase().indexOf(searchQ.toLowerCase());
                results.push({ page: i, snippet: text.slice(Math.max(0, idx - 25), idx + 60) });
            }
        }
        setSearchRes(results);
    }, [searchQ, pdfDoc, total]);

    // ── Fullscreen ─────────────────────────────────────────────────────────────
    const toggleFS = useCallback(() => {
        if (!document.fullscreenElement) readerRef.current?.requestFullscreen();
        else document.exitFullscreen();
    }, []);

    // ═══════════════════════════════════════════════════════════════════════════
    // ROUTE TO SUB-VIEWERS
    // ═══════════════════════════════════════════════════════════════════════════
    if (activeFile && activeFile.kind === 'image') {
        return <ImageViewer meta={activeFile} onClose={closeFile} />;
    }
    if (activeFile && (activeFile.kind === 'word' || activeFile.kind === 'ppt')) {
        return <OfficePreview meta={activeFile} onClose={closeFile} />;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // LIBRARY VIEW
    // ═══════════════════════════════════════════════════════════════════════════
    if (!activeFile) {
        return (
            <div className="pdf-library">
                {/* ── Upload zone ── */}
                <div
                    className={`pdf-drop-zone ${dragOver ? 'drag-over' : ''}`}
                    onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={e => { e.preventDefault(); setDragOver(false); handleUpload(e.dataTransfer.files[0]); }}
                    onClick={() => document.getElementById('sm-file-in').click()}
                >
                    <div className="pdf-drop-icon"><Upload size={34} /></div>
                    <h3>Upload Study Material</h3>
                    <p>Drag &amp; drop or click to upload</p>
                    <p className="sm-supported-types">
                        <span className="sm-type-chip pdf">PDF</span>
                        <span className="sm-type-chip word">Word</span>
                        <span className="sm-type-chip ppt">PPT</span>
                        <span className="sm-type-chip img">Images</span>
                    </p>
                    <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Max {MAX_MB} MB per file</p>
                    {loading   && <p className="pdf-processing">⏳ Processing file…</p>}
                    {uploadErr && <p className="pdf-err">{uploadErr}</p>}
                    <input
                        id="sm-file-in"
                        type="file"
                        accept=".pdf,.doc,.docx,.ppt,.pptx,.png,.jpg,.jpeg,.webp"
                        style={{ display: 'none' }}
                        onChange={e => handleUpload(e.target.files[0])}
                    />
                </div>

                {/* ── File grid ── */}
                {fileList.length > 0 ? (
                    <div className="pdf-grid">
                        {fileList.map(meta => {
                            const bm   = (LS.getMap(BM_KEY)[meta.id] || []).length;
                            const an   = (LS.getMap(ANN_KEY)[meta.id] || []).length;
                            const st   = LS.getMap(ST_KEY)[meta.id] || 0;
                            const mins = Math.floor(st / 60);
                            const kind = meta.kind || 'pdf';
                            const kindColor = fileKindColor(kind);
                            return (
                                <div key={meta.id} className="pdf-card" onClick={() => openFile(meta)}>
                                    <div className="pdf-card-thumb" style={{ background: `linear-gradient(135deg, ${kindColor}18, ${kindColor}08)` }}>
                                        <FileKindIcon kind={kind} size={38} />
                                        <span className="pdf-pages-badge" style={{ background: kindColor }}>
                                            {fileKindLabel(kind)}
                                        </span>
                                    </div>
                                    <div className="pdf-card-body">
                                        <h4 className="pdf-card-title" title={meta.title}>{meta.title}</h4>
                                        <div className="pdf-card-meta">
                                            <span><Clock size={11} /> {fmtDate(meta.createdAt)}</span>
                                            <span>{fmtSize(meta.fileSize)}</span>
                                        </div>
                                        <div className="pdf-card-stats">
                                            {an > 0  && <span className="pdf-stat-chip hl">✏️ {an}</span>}
                                            {bm > 0  && <span className="pdf-stat-chip bm">⭐ {bm}</span>}
                                            {mins > 0 && <span className="pdf-stat-chip st">🕐 {mins}m</span>}
                                        </div>
                                        <div className="pdf-card-actions">
                                            <button className="btn btn-primary btn-sm" onClick={e => { e.stopPropagation(); openFile(meta); }}>
                                                <BookOpen size={12} /> Open
                                            </button>
                                            <button className="pdf-del-btn" onClick={e => deleteFile(meta.id, e)} title="Delete">
                                                <Trash2 size={13} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="pdf-empty-state">
                        <Upload size={56} style={{ opacity: 0.15 }} />
                        <h3>No study materials yet</h3>
                        <p>Upload PDFs, Word documents, PowerPoint slides, or images to build your personal study library.</p>
                    </div>
                )}
            </div>
        );
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // PDF READER VIEW
    // ═══════════════════════════════════════════════════════════════════════════
    const pageBM  = bookmarks.includes(page);
    const curAnns = annotations.filter(a => a.pageNumber === page);

    return (
        <div className={`pdf-reader-root ${examMode ? 'exam-mode' : ''}`} ref={readerRef}>

            {/* Floating context menu */}
            {showCtx && selText && (
                <div className="pdf-ctx-menu" style={{ left: ctxPos.x, top: ctxPos.y }}>
                    {Object.entries(COLORS).map(([c, hex]) => (
                        <button key={c} className="ctx-color" style={{ background: hex }} title={`Highlight ${c}`} onClick={() => saveHighlight(c)} />
                    ))}
                    <div className="ctx-sep" />
                    <button className="ctx-act" onClick={() => { setShowCtx(false); setShowNoteModal(true); }}>
                        <StickyNote size={13} /> Note
                    </button>
                    <button className="ctx-act ai" onClick={() => explainText(selText)}>
                        <Brain size={13} /> AI
                    </button>
                    <button className="ctx-act" onClick={() => { setShowCtx(false); setSelText(''); }}>
                        <X size={13} />
                    </button>
                </div>
            )}

            {/* Note modal */}
            {showNoteModal && (
                <div className="pdf-modal-bg" onClick={() => setShowNoteModal(false)}>
                    <div className="pdf-modal" onClick={e => e.stopPropagation()}>
                        <div className="pdf-modal-hdr">
                            <h3><StickyNote size={15} /> Add Note to Highlight</h3>
                            <button onClick={() => setShowNoteModal(false)}><X size={16} /></button>
                        </div>
                        <div className="pdf-modal-body">
                            <blockquote className="modal-quote">"{selText?.slice(0, 120)}{selText?.length > 120 ? '…' : ''}"</blockquote>
                            <div className="modal-colors">
                                {Object.entries(COLORS).map(([c, hex]) => (
                                    <button key={c} className={`modal-clr ${hlColor === c ? 'sel' : ''}`} style={{ background: hex }} onClick={() => setHlColor(c)} />
                                ))}
                            </div>
                            <textarea className="modal-note-txt" placeholder="Add a note (optional)…" value={noteInput} onChange={e => setNoteInput(e.target.value)} rows={3} />
                            <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => saveHighlight(hlColor, noteInput)}>
                                Save Highlight
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Toolbar */}
            {!examMode && (
                <div className="pdf-toolbar">
                    <button className="pdf-back" onClick={closeFile}><ChevronLeft size={16} /> Library</button>
                    <span className="pdf-doc-title"><FileText size={14} /> {activeFile.title}</span>
                    <div className="pdf-toolbar-mid">
                        <button className="pdf-nav" onClick={() => goTo(page - 1)} disabled={page <= 1}><ChevronLeft size={16} /></button>
                        <input className="pdf-pg-input" type="number" value={page} min={1} max={total} onChange={e => goTo(Number(e.target.value))} />
                        <span className="pdf-pg-total">/ {total}</span>
                        <button className="pdf-nav" onClick={() => goTo(page + 1)} disabled={page >= total}><ChevronRight size={16} /></button>
                    </div>
                    <div className="pdf-toolbar-right">
                        <button className="pdf-tool" onClick={() => setScale(s => Math.max(0.4, +(s - 0.2).toFixed(1)))} title="Zoom out"><ZoomOut size={15} /></button>
                        <span className="pdf-zoom">{Math.round(scale * 100)}%</span>
                        <button className="pdf-tool" onClick={() => setScale(s => Math.min(3, +(s + 0.2).toFixed(1)))} title="Zoom in"><ZoomIn size={15} /></button>
                        <div className="pdf-sep" />
                        <button className={`pdf-tool ${pageBM ? 'on bm' : ''}`} onClick={toggleBM} title="Bookmark page">
                            {pageBM ? <BookmarkCheck size={15} /> : <Bookmark size={15} />}
                        </button>
                        <button className={`pdf-tool ${showSearch ? 'on' : ''}`} onClick={() => setShowSearch(s => !s)} title="Search"><Search size={15} /></button>
                        <button className={`pdf-tool ${examMode ? 'on exam' : ''}`} onClick={() => setExamMode(e => !e)} title="Focus Mode">🎯</button>
                        <button className="pdf-tool" onClick={toggleFS} title="Fullscreen">
                            {fullscreen ? <Minimize size={15} /> : <Maximize size={15} />}
                        </button>
                    </div>
                </div>
            )}

            {/* Search bar */}
            {showSearch && !examMode && (
                <div className="pdf-search-bar">
                    <Search size={14} />
                    <input placeholder="Search text in PDF… press Enter" value={searchQ} onChange={e => setSearchQ(e.target.value)} onKeyDown={e => e.key === 'Enter' && doSearch()} />
                    <button className="btn btn-primary btn-sm" onClick={doSearch}>Search</button>
                    {searchRes.length > 0 && <span className="srch-count">{searchRes.length} pages</span>}
                    <div className="srch-results">
                        {searchRes.map(r => (
                            <button key={r.page} className="srch-item" onClick={() => goTo(r.page)}>
                                <strong>p.{r.page}</strong> …{r.snippet.trim().slice(0, 50)}…
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Reader body */}
            <div className="pdf-reader-body">
                {/* Canvas */}
                <div className="pdf-canvas-wrap" onMouseUp={handleMouseUp}>
                    {(loading || rendering) && (
                        <div className="pdf-overlay-loading">
                            <div className="loader" />
                            <span>{loading ? 'Opening PDF…' : 'Rendering…'}</span>
                        </div>
                    )}
                    <div className="pdf-canvas-inner">
                        <canvas ref={canvasRef} className="pdf-canvas" />
                        <div ref={textRef} className="textLayer pdf-text-layer" />
                        {curAnns.map(a => (
                            <div key={a.id} className="pdf-hl-marker" style={{ borderLeftColor: COLORS[a.color] || COLORS.yellow }} title={a.note || a.highlightText?.slice(0, 60)} />
                        ))}
                    </div>
                    <div className="pdf-pg-progress"><div className="pdf-pg-fill" style={{ width: `${(page / total) * 100}%` }} /></div>
                </div>

                {/* Side panel */}
                {!examMode && (
                    <div className="pdf-side">
                        <div className="pdf-panel-tabs">
                            {[
                                { id: 'highlights', icon: Highlighter, label: 'Highlights' },
                                { id: 'bookmarks',  icon: Bookmark,    label: 'Bookmarks' },
                                { id: 'ai',         icon: Brain,       label: 'AI Study' },
                                { id: 'flashcards', icon: Zap,         label: 'Cards' },
                            ].map(t => (
                                <button key={t.id} className={`pdf-ptab ${panel === t.id ? 'active' : ''}`} onClick={() => setPanel(t.id)}>
                                    <t.icon size={14} /><span>{t.label}</span>
                                </button>
                            ))}
                        </div>

                        <div className="pdf-panel-body">
                            {/* HIGHLIGHTS */}
                            {panel === 'highlights' && (
                                <div className="pnl-section">
                                    <div className="pnl-hdr">
                                        <span>Highlights &amp; Notes</span>
                                        <span className="badge badge-violet">{annotations.length}</span>
                                    </div>
                                    {annotations.length === 0 ? (
                                        <div className="pnl-empty"><Highlighter size={26} style={{ opacity: 0.25 }} /><p>Select text on the PDF to highlight it</p></div>
                                    ) : (
                                        <div className="ann-list">
                                            {annotations.map(a => (
                                                <div key={a.id} className={`ann-item ${a.pageNumber === page ? 'curr' : ''}`}>
                                                    <div className="ann-item-hdr">
                                                        <div className="ann-dot" style={{ background: COLORS[a.color] }} />
                                                        <span className="ann-pg">p.{a.pageNumber}</span>
                                                        <button className="ann-goto" onClick={() => goTo(a.pageNumber)}>↗</button>
                                                        <button className="ann-del" onClick={() => delAnnotation(a.id)}><X size={10} /></button>
                                                    </div>
                                                    <p className="ann-txt">"{a.highlightText.slice(0, 90)}{a.highlightText.length > 90 ? '…' : ''}"</p>
                                                    {a.note && <p className="ann-note">📝 {a.note}</p>}
                                                    <button className="ann-ai-btn" onClick={() => explainText(a.highlightText)}><Brain size={11} /> Explain</button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* BOOKMARKS */}
                            {panel === 'bookmarks' && (
                                <div className="pnl-section">
                                    <div className="pnl-hdr">
                                        <span>Bookmarks</span>
                                        <span className="badge badge-amber">{bookmarks.length}</span>
                                    </div>
                                    {bookmarks.length === 0 ? (
                                        <div className="pnl-empty"><Star size={26} style={{ opacity: 0.25 }} /><p>Bookmark pages using ⭐ in the toolbar</p></div>
                                    ) : (
                                        <div className="bm-list">
                                            {bookmarks.map(pg => (
                                                <button key={pg} className={`bm-item ${pg === page ? 'active' : ''}`} onClick={() => goTo(pg)}>
                                                    <Star size={13} style={{ color: 'var(--amber)' }} /> Page {pg} <span className="bm-arrow">→</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* AI */}
                            {panel === 'ai' && (
                                <div className="pnl-section">
                                    <div className="pnl-hdr"><span>AI Study Assistant</span><Brain size={15} style={{ color: 'var(--violet)' }} /></div>
                                    <div className="ai-actions">
                                        <button className="ai-action-btn" onClick={summarizePage}>📄 Summarize Page {page}</button>
                                        <button className="ai-action-btn" onClick={() => explainText(selText)} disabled={!selText}>🔍 Explain Selected Text</button>
                                    </div>
                                    {aiLoading && <div className="ai-thinking"><div className="loader" /><span>AI is thinking…</span></div>}
                                    {!aiLoading && (summary || aiText) && (
                                        <div className="ai-resp">
                                            <div className="ai-resp-body">{summary || aiText}</div>
                                            <button className="ai-clear" onClick={() => { setSummary(''); setAiText(''); }}><X size={12} /> Clear</button>
                                        </div>
                                    )}
                                    {!aiLoading && !summary && !aiText && (
                                        <div className="pnl-empty"><Brain size={26} style={{ opacity: 0.25 }} /><p>Select text or click a quick action above</p></div>
                                    )}
                                </div>
                            )}

                            {/* FLASHCARDS */}
                            {panel === 'flashcards' && (
                                <div className="pnl-section">
                                    <div className="pnl-hdr"><span>Flashcards</span>{flashcards.length > 0 && <span className="badge badge-cyan">{flashcards.length}</span>}</div>
                                    <button className="btn btn-primary btn-sm fc-gen-btn" onClick={genFlashcards}><Zap size={13} /> Generate Flashcards</button>
                                    {aiLoading && <div className="ai-thinking"><div className="loader" /><span>Generating…</span></div>}
                                    {!aiLoading && flashcards.length > 0 && (
                                        <div className="fc-viewer">
                                            <div className="fc-counter">{cardIdx + 1} / {flashcards.length}</div>
                                            <div className={`fc-card ${cardFlipped ? 'flipped' : ''}`} onClick={() => setCardFlipped(f => !f)}>
                                                <div className="fc-front"><p>{flashcards[cardIdx]?.q}</p><span className="fc-hint">tap to flip</span></div>
                                                <div className="fc-back"><p>{flashcards[cardIdx]?.a}</p></div>
                                            </div>
                                            <div className="fc-nav">
                                                <button className="btn btn-secondary btn-sm" onClick={() => { setCardIdx(i => Math.max(0, i - 1)); setCardFlipped(false); }} disabled={cardIdx === 0}>← Prev</button>
                                                <button className="btn btn-secondary btn-sm" onClick={() => { setCardIdx(i => Math.min(flashcards.length - 1, i + 1)); setCardFlipped(false); }} disabled={cardIdx === flashcards.length - 1}>Next →</button>
                                            </div>
                                        </div>
                                    )}
                                    {!aiLoading && flashcards.length === 0 && (
                                        <div className="pnl-empty"><Zap size={26} style={{ opacity: 0.25 }} /><p>Highlights help generate better flashcards</p></div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Exam mode bar */}
            {examMode && (
                <div className="exam-bar">
                    <button className="pdf-nav" onClick={() => goTo(page - 1)} disabled={page <= 1}><ChevronLeft size={18} /></button>
                    <span className="exam-pg">Page {page} / {total}</span>
                    <button className="pdf-nav" onClick={() => goTo(page + 1)} disabled={page >= total}><ChevronRight size={18} /></button>
                    <button className="btn btn-secondary btn-sm" onClick={() => setExamMode(false)}>Exit Focus Mode</button>
                </div>
            )}
        </div>
    );
}
