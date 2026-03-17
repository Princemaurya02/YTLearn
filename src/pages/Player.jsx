import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
    Play, Pause, Volume2, Maximize, BookmarkPlus, MessageSquare,
    FileText, Lightbulb, Send, ChevronDown, ChevronUp, X, Zap,
    Clock, Target, SkipForward, Bot, StickyNote, CheckCircle
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useWatchHistory } from '../hooks/useWatchHistory';
import './Player.css';

// ─── Module-level YouTube IFrame API loader ──────────────────────────────────
// Singleton promise so multiple mounts never double-load the script.
let _ytApiPromise = null;
function loadYouTubeAPI() {
    if (_ytApiPromise) return _ytApiPromise;
    _ytApiPromise = new Promise((resolve) => {
        if (window.YT?.Player) { resolve(window.YT); return; }
        // Chain any existing callback (e.g. from another instance)
        const prev = window.onYouTubeIframeAPIReady;
        window.onYouTubeIframeAPIReady = () => {
            if (typeof prev === 'function') prev();
            resolve(window.YT);
        };
        if (!document.getElementById('yt-iframe-api-script')) {
            const tag = document.createElement('script');
            tag.id = 'yt-iframe-api-script';
            tag.src = 'https://www.youtube.com/iframe_api';
            document.head.appendChild(tag);
        }
    });
    return _ytApiPromise;
}

// ─── Known video metadata (for progress-save labels) ─────────────────────────
const VIDEO_META = {
    'PkZNo7MFNFg': { title: 'JavaScript Full Course — ES6+', channel: 'freeCodeCamp' },
    'SqcY0GlETPk': { title: 'React — Complete Guide 2024', channel: 'Academind' },
    '8hly31xKli0': { title: 'DSA — Zero to Hero', channel: 'freeCodeCamp' },
    '_uQrJ0TkZlc': { title: 'Python for Beginners — Full Course', channel: 'Programming with Mosh' },
    'fBNz5xF-Kx4': { title: 'Node.js Crash Course', channel: 'Traversy Media' },
    'rg7Fvvl3taU': { title: 'CSS Grid — Complete Tutorial', channel: 'Kevin Powell' },
    'yfoY53QXEnI': { title: 'CSS Crash Course', channel: 'Traversy Media' },
    'w7ejDZ8SWv8': { title: 'React Hooks Tutorial', channel: 'Codevolution' },
    'RBSGKlAvoiM': { title: 'Dynamic Programming — Masterclass', channel: 'freeCodeCamp' },
    'qz0aGYrrlhU': { title: 'HTML Full Course', channel: 'Traversy Media' },
    'dhYoOOa2i2M': { title: 'Git & GitHub Crash Course', channel: 'freeCodeCamp' },
    'ZjAqacIC_3c': { title: 'TypeScript Full Course', channel: 'Traversy Media' },
};

// ── Rich AI knowledge base — contextual, intent-aware responses ──────────────
const AI_KNOWLEDGE = {
    javascript: [
        "**Closures** in JS are functions that 'remember' their outer scope even after the outer function has returned. Think of them like a backpack — the inner function carries its variables wherever it goes. Example:\n```js\nfunction counter() {\n  let count = 0;\n  return () => ++count;  // closes over count\n}\nconst c = counter(); c(); // 1, c(); // 2\n```",
        "The **Event Loop** makes JS feel async despite being single-threaded. Call-stack runs sync code → Web APIs handle timers/fetch → Callback queue → Event loop pushes queued callbacks onto the stack when it's empty. That's why `setTimeout(fn, 0)` still runs AFTER sync code finishes.",
        "**Promises** represent a future value. They can be *pending*, *fulfilled*, or *rejected*. Chain `.then()` for success, `.catch()` for errors. `async/await` is syntactic sugar — `await` pauses execution inside the function until the Promise resolves.",
        "**Hoisting** means JS moves *declarations* (not initializations) to the top of their scope at compile time. `var` declarations are hoisted and initialized as `undefined`. `let`/`const` are hoisted but sit in a 'Temporal Dead Zone' — accessing them before the declaration throws a ReferenceError.",
        "**Prototypal inheritance** — every JS object has an internal `[[Prototype]]` link. When you access a property, JS walks up the prototype chain until it finds it or hits `null`. `class` syntax is syntactic sugar over this mechanism.",
        "**Destructuring** lets you unpack values from arrays/objects: `const { a, b } = obj` or `const [x, y] = arr`. Combine with rest (`...rest`) and defaults (`= 'fallback'`) for expressive parameter patterns.",
        "**Arrow functions** differ from regular functions in two key ways: 1) they don't have their own `this` (they inherit from enclosing scope), and 2) they can't be used as constructors. Great for callbacks and class methods.",
    ],
    react: [
        "**useState** is React's way of tracking data that should cause a re-render when it changes. Never mutate state directly — always use the setter: `setState(newVal)` or `setState(prev => newVal)`. The functional form (`prev =>`) is essential inside closures to avoid stale state.",
        "**useEffect** lets you synchronize a component with the outside world (API calls, subscriptions, timers). The dependency array `[dep1, dep2]` tells React *when* to re-run it. Empty array `[]` = run once on mount. Return a cleanup function to avoid memory leaks.",
        "React's **reconciliation** algorithm (Fiber) compares the new Virtual DOM with the previous one and only patches the real DOM where things changed. Keys in lists help React identify which items moved/added/removed efficiently — always use stable IDs, not array indexes.",
        "**Context API** solves prop-drilling by broadcasting a value to any descendant component that subscribes via `useContext`. For complex state, pair it with `useReducer` instead of `useState`.",
        "**Custom hooks** are just functions starting with `use` that call other hooks. They let you extract and reuse stateful logic between components. Example: `useLocalStorage`, `useDebounce`, `useFetch`.",
        "**useMemo** and **useCallback** are optimisation tools. `useMemo` memoizes an *expensive computed value*. `useCallback` memoizes a *function reference* so child components that receive it as a prop don't re-render unnecessarily.",
        "The **Rules of Hooks**: only call hooks at the top level (not inside conditions/loops) and only inside React functions. This lets React maintain a stable call order between re-renders.",
    ],
    dsa: [
        "**Big-O notation** describes how runtime or space grows relative to input size. O(1) = constant, O(log n) = logarithmic (binary search), O(n) = linear, O(n log n) = merge sort, O(n²) = nested loops. Focus on the dominant term; drop constants.",
        "**Binary Search** works on *sorted* arrays. It halves the search space each iteration: compare the middle element, then recurse left or right. Time: O(log n). Remember: the array MUST be sorted first!",
        "A **Stack** is LIFO (Last In First Out) — think of a stack of plates. A **Queue** is FIFO (First In, First Out) — like a line at a store. Stacks are used in DFS, undo systems, call stacks. Queues power BFS and scheduling.",
        "**Dynamic Programming** breaks a problem into overlapping subproblems and stores their results (memoization/tabulation) to avoid recomputation. Key insight: if a problem has *optimal substructure* and *overlapping subproblems*, DP applies. Classic examples: Fibonacci, 0/1 Knapsack, Longest Common Subsequence.",
        "**Graph traversal**: BFS uses a queue and explores level-by-level (great for shortest path in unweighted graphs). DFS uses a stack/recursion and explores depth-first (great for detecting cycles, topological sort). Both are O(V + E).",
        "**Sorting algorithms**: Merge Sort O(n log n) stable sort — splits array, sorts halves, merges. Quick Sort O(n log n) average, O(n²) worst — pivot-based partition. For nearly-sorted data, Insertion Sort O(n) is surprisingly fast.",
        "**Hash Tables** provide O(1) average-case lookup by mapping keys through a hash function to array indices. Collisions are handled via chaining (linked lists) or open addressing. JavaScript objects and Maps use this internally.",
    ],
    python: [
        "**List comprehensions** are Pythonic one-liners for creating lists: `[x*2 for x in range(10) if x % 2 == 0]`. They're faster and more readable than equivalent for-loops for simple transformations.",
        "Python **decorators** are functions that wrap other functions, adding behaviour before/after. `@functools.wraps` preserves the wrapped function's metadata. Common built-ins: `@staticmethod`, `@classmethod`, `@property`.",
        "**Generators** (using `yield`) produce values lazily — they compute each item on demand instead of storing the entire sequence in memory. Perfect for large datasets. `next()` advances the generator; a `for` loop does this automatically.",
        "Python **scope** follows LEGB: Local → Enclosing → Global → Built-in. Use `global` or `nonlocal` keywords to assign to outer-scope variables from inside a function.",
        "**OOP in Python**: `__init__` is the constructor, `self` is the explicit instance reference. Use `@classmethod` for factory methods and `@staticmethod` for utility methods that don't need `self` or `cls`.",
        "**Error handling**: `try/except/finally`. Catch specific exceptions (`except ValueError`) before general ones (`except Exception`). Use `else` for code that runs only if no exception was raised. `finally` always runs — ideal for cleanup (closing files/connections).",
    ],
    general: [
        "Great question! Let me break it down: the key idea is to understand the *why* before the *how*. Start by identifying what problem this concept solves, then walk through a concrete example, then generalize.",
        "Think of it as building blocks — each concept in this video builds on simpler foundations. If something feels unclear, pause and revisit the prerequisite concept before moving on.",
        "A helpful mental model: think of the computer as a very literal instruction-follower. It does exactly what you tell it — no more, no less. Understanding this helps debug 'why doesn't it know what I mean?' moments.",
        "The best way to truly understand this is to *code along*. Pause the video, re-type each example by hand (not copy-paste), and intentionally break things to see what happens.",
    ],
};

const VIDEO_TOPIC_MAP = {
    'PkZNo7MFNFg': 'javascript', 'yfoY53QXEnI': 'javascript',
    'SqcY0GlETPk': 'react', 'w7ejDZ8SWv8': 'react',
    '8hly31xKli0': 'dsa', 'RBSGKlAvoiM': 'dsa',
    '_uQrJ0TkZlc': 'python',
    'qz0aGYrrlhU': 'general', 'dhYoOOa2i2M': 'general',
    'fBNz5xF-Kx4': 'general', 'rg7Fvvl3taU': 'general',
};

function getEnhancedAIResponse(question, videoId) {
    const q = question.toLowerCase();
    // Determine topic from video or keywords
    let topic = VIDEO_TOPIC_MAP[videoId] || 'general';
    if (q.includes('javascript') || q.includes('closure') || q.includes('promise') || q.includes('async') || q.includes('hoisting')) topic = 'javascript';
    else if (q.includes('react') || q.includes('hook') || q.includes('usestate') || q.includes('component') || q.includes('props')) topic = 'react';
    else if (q.includes('algorithm') || q.includes('array') || q.includes('tree') || q.includes('graph') || q.includes('sort') || q.includes('big o')) topic = 'dsa';
    else if (q.includes('python') || q.includes('list') || q.includes('dict') || q.includes('decorator') || q.includes('generator')) topic = 'python';

    const pool = AI_KNOWLEDGE[topic] || AI_KNOWLEDGE.general;
    // Simple hash to avoid repeating same answer sequentially
    const idx = (q.length + q.charCodeAt(0) + (q.charCodeAt(Math.floor(q.length / 2)) || 0)) % pool.length;
    return pool[idx];
}

// ── Per-topic quiz banks (20 questions each) ─────────────────────────────────
const QUIZ_BANKS = {
    javascript: [
        { q: 'What is a closure in JavaScript?', opts: ['A function with no return value', 'A function that remembers its outer scope', 'A way to close the browser', 'An error handler'], correct: 1, exp: 'Closures give functions access to variables from their enclosing scope even after the outer function has returned.' },
        { q: 'What does the Event Loop do?', opts: ['Renders HTML', 'Manages async callbacks between call stack and task queue', 'Handles CSS animations', 'Controls memory allocation'], correct: 1, exp: 'The Event Loop continuously checks if the call stack is empty and moves queued callbacks onto it.' },
        { q: 'Which keyword creates a block-scoped variable?', opts: ['var', 'function', 'let', 'global'], correct: 2, exp: '`let` and `const` are block-scoped; `var` is function-scoped.' },
        { q: 'True or False: Arrow functions have their own `this` binding.', opts: ['True', 'False'], correct: 1, exp: 'Arrow functions inherit `this` from their enclosing lexical scope — they do NOT have their own `this`.' },
        { q: 'What does `const` guarantee?', opts: ['The value cannot change', 'The binding cannot be reassigned', 'The object is frozen', 'The variable is global'], correct: 1, exp: '`const` prevents reassignment of the binding, but if the value is an object, its properties can still be mutated.' },
        { q: 'What is hoisting?', opts: ['Optimising render performance', 'Moving declarations to the top of their scope at compile time', 'A CSS flex technique', 'A server-side pattern'], correct: 1, exp: 'JS hoists declarations (not initializations) before executing code.' },
        { q: 'What does `Promise.all()` do?', opts: ['Runs promises sequentially', 'Resolves when ALL promises resolve, rejects if any reject', 'Ignores rejected promises', 'Returns the first resolved promise'], correct: 1, exp: '`Promise.all()` waits for all promises and rejects fast if any one fails.' },
        { q: 'Which method does NOT mutate the original array?', opts: ['push()', 'pop()', 'splice()', 'map()'], correct: 3, exp: '`map()` returns a new array; `push`, `pop`, and `splice` all mutate in place.' },
        { q: 'What is the output of: `typeof null`?', opts: ['"null"', '"undefined"', '"object"', '"boolean"'], correct: 2, exp: '`typeof null === "object"` is a long-standing JavaScript bug preserved for backward compatibility.' },
        { q: 'What does `async` before a function do?', opts: ['Makes the function synchronous', 'Makes the function always return a Promise', 'Disables error handling', 'Enables multi-threading'], correct: 1, exp: '`async` functions always return a Promise, allowing use of `await` inside them.' },
    ],
    react: [
        { q: 'What triggers a component re-render in React?', opts: ['Changing a local JS variable', 'Calling setState or updating context', 'Modifying the DOM directly', 'Adding a class to a div'], correct: 1, exp: 'React re-renders a component when its state or props change.' },
        { q: 'What is the Virtual DOM?', opts: ['A server-side cache', 'A lightweight in-memory representation of the real DOM', 'A CSS preprocessor', 'A database for React'], correct: 1, exp: 'React diffs the Virtual DOM against the previous snapshot and only updates what actually changed in the real DOM.' },
        { q: 'True or False: `useEffect` with an empty dependency array runs on every render.', opts: ['True', 'False'], correct: 1, exp: 'An empty `[]` dependency array means the effect runs ONCE after the initial mount.' },
        { q: 'What does `useCallback` memoize?', opts: ['A value', 'A function reference', 'A DOM node', 'A Promise'], correct: 1, exp: '`useCallback` returns a memoized function, preventing unnecessary re-creations on each render.' },
        { q: 'What is the purpose of a `key` prop in a list?', opts: ['To style list items', 'To help React identify which items changed, added, or removed', 'To make the list sortable', 'To set the tab order'], correct: 1, exp: 'Keys give React a stable identity for list items, improving reconciliation performance.' },
        { q: 'Which hook replaces componentDidMount?', opts: ['useState', 'useRef', 'useEffect with []', 'useMemo'], correct: 2, exp: '`useEffect(() => {...}, [])` runs once after mount, equivalent to `componentDidMount`.' },
        { q: 'What does React Context solve?', opts: ['Network requests', 'Prop drilling through many component levels', 'CSS styling', 'Routing'], correct: 1, exp: 'Context provides a way to share values between components without passing props at every level.' },
        { q: 'What is JSX?', opts: ['A JavaScript framework', 'Syntactic sugar that compiles to React.createElement() calls', 'A CSS-in-JS library', 'A testing framework'], correct: 1, exp: 'JSX looks like HTML but compiles to `React.createElement(type, props, children)` calls.' },
        { q: 'True or False: Hooks can be called inside a conditional block.', opts: ['True', 'False'], correct: 1, exp: 'Hooks must be called at the top level of a React function — not inside conditions, loops, or nested functions.' },
        { q: 'What does `useMemo` optimize?', opts: ['Network calls', 'Expensive computed values that should not recalculate on every render', 'Component styling', 'DOM traversal'], correct: 1, exp: '`useMemo` caches an expensive computed value and only recomputes it when its dependencies change.' },
    ],
    dsa: [
        { q: 'What is the time complexity of binary search?', opts: ['O(n)', 'O(n²)', 'O(log n)', 'O(1)'], correct: 2, exp: 'Binary search halves the search space each step, giving O(log n) complexity.' },
        { q: 'Which data structure uses LIFO ordering?', opts: ['Queue', 'Stack', 'Heap', 'Graph'], correct: 1, exp: 'A Stack is Last In, First Out — the last element pushed is the first one popped.' },
        { q: 'What is the worst-case time of Quick Sort?', opts: ['O(n log n)', 'O(n)', 'O(n²)', 'O(log n)'], correct: 2, exp: 'Quick Sort degrades to O(n²) when the pivot is always the smallest/largest element (already sorted input).' },
        { q: 'True or False: Hash tables guarantee O(1) lookup in ALL cases.', opts: ['True', 'False'], correct: 1, exp: 'Hash tables are O(1) on *average*, but collisions can degrade to O(n) in the worst case.' },
        { q: 'Which traversal uses a queue?', opts: ['DFS', 'BFS', 'Inorder', 'Postorder'], correct: 1, exp: 'Breadth-First Search uses a queue to explore nodes level by level.' },
        { q: 'What makes a problem suitable for Dynamic Programming?', opts: ['Large input size', 'Optimal substructure and overlapping subproblems', 'Sorted input', 'Graph structure'], correct: 1, exp: 'DP works when a problem can be broken into overlapping subproblems whose solutions can be reused.' },
        { q: 'What is the space complexity of Merge Sort?', opts: ['O(1)', 'O(log n)', 'O(n)', 'O(n²)'], correct: 2, exp: 'Merge Sort requires O(n) auxiliary space for the temporary arrays used during merging.' },
        { q: 'In a Min-Heap, where is the smallest element?', opts: ['At a leaf node', 'At the root', 'At the last index', 'At a random position'], correct: 1, exp: 'In a Min-Heap, the root always contains the minimum element.' },
        { q: 'Which algorithm detects cycles in a linked list?', opts: ['Binary Search', "Floyd's Cycle Detection", 'Merge Sort', 'BFS'], correct: 1, exp: "Floyd's (fast/slow pointer) algorithm detects cycles in O(n) time and O(1) space." },
        { q: 'True or False: An array provides O(1) random access.', opts: ['True', 'False'], correct: 0, exp: 'Arrays store elements in contiguous memory, enabling O(1) access by index.' },
    ],
    python: [
        { q: 'What does a list comprehension return?', opts: ['A generator', 'A new list', 'A tuple', 'A dictionary'], correct: 1, exp: 'List comprehensions always evaluate eagerly and return a new list.' },
        { q: 'What does the `yield` keyword do?', opts: ['Returns a value and exits the function', 'Produces a value lazily without exiting the generator', 'Creates a list', 'Calls another function'], correct: 1, exp: '`yield` pauses execution and returns a value; the generator resumes from where it left off on next().' },
        { q: 'True or False: Python lists are mutable.', opts: ['True', 'False'], correct: 0, exp: 'Python lists are mutable — you can add, remove, and modify elements in place.' },
        { q: 'What is a decorator?', opts: ['A CSS styling tool', 'A function that wraps another function to add behaviour', 'A class attribute', 'A loop construct'], correct: 1, exp: 'Decorators use the `@syntax` to apply a wrapper function, adding behaviour before/after the original.' },
        { q: 'What does `*args` allow?', opts: ['Keyword-only arguments', 'A variable number of positional arguments', 'Default argument values', 'Type annotations'], correct: 1, exp: '`*args` collects extra positional arguments into a tuple.' },
        { q: 'Which method removes AND returns the last element of a list?', opts: ['remove()', 'delete()', 'pop()', 'discard()'], correct: 2, exp: '`list.pop()` removes and returns the last element (or the element at a given index).' },
        { q: 'What is the LEGB rule?', opts: ['A sorting algorithm', 'Python\'s scope resolution order: Local → Enclosing → Global → Built-in', 'A data structure', 'An error type'], correct: 1, exp: 'Python looks up names in this order: Local, Enclosing, Global, Built-in.' },
        { q: 'True or False: Tuples are immutable in Python.', opts: ['True', 'False'], correct: 0, exp: 'Tuples cannot be modified after creation — they are immutable sequences.' },
        { q: 'What does `__init__` do in a class?', opts: ['Destroys the object', 'Initializes a new instance — the constructor method', 'Creates a class attribute', 'Imports a module'], correct: 1, exp: '`__init__` is called automatically when a new object is created from a class.' },
        { q: 'Which built-in function returns key-value pairs for a dictionary?', opts: ['dict.keys()', 'dict.values()', 'dict.items()', 'dict.pairs()'], correct: 2, exp: '`dict.items()` returns view objects of (key, value) tuple pairs.' },
    ],
    general: [
        { q: 'What does this video primarily cover?', opts: ['Theory only', 'Practical implementation', 'Both theory and practice', 'Neither'], correct: 2, exp: 'Good learning resources combine conceptual understanding with hands-on examples.' },
        { q: 'What is the best approach when you encounter a bug?', opts: ['Rewrite everything', 'Isolate, reproduce, then fix — one step at a time', 'Ask someone else immediately', 'Ignore it'], correct: 1, exp: 'Systematic debugging: isolate the problem, reproduce it reliably, then fix and verify.' },
        { q: 'True or False: Reading code is as important as writing code.', opts: ['True', 'False'], correct: 0, exp: 'Developers spend more time reading code than writing it — learning to read well is a core skill.' },
        { q: 'What does DRY stand for?', opts: ['Debug, Refactor, Yield', "Don't Repeat Yourself", 'Define, Run, Yield', 'Dynamic Recursive Yield'], correct: 1, exp: 'DRY is a principle to reduce code duplication by abstracting repeated logic.' },
        { q: 'Which is NOT a principle of clean code?', opts: ['Meaningful names', 'Small functions', 'Writing everything in one function', 'Consistent formatting'], correct: 2, exp: 'Clean code favors small, focused functions — NOT cramming everything into one large function.' },
    ],
};

function getQuizForVideo(videoId) {
    const topic = VIDEO_TOPIC_MAP[videoId] || 'general';
    const bank = QUIZ_BANKS[topic] || QUIZ_BANKS.general;
    // Shuffle and take up to 10 questions
    const shuffled = [...bank].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(10, shuffled.length)).map(q => ({
        q: q.q, opts: q.opts, correct: q.correct, explanation: q.exp
    }));
}

export default function Player() {
    const { videoId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { addNote, addBookmark, startSession, endSession, addXP } = useApp();
    const { saveProgress } = useWatchHistory();

    // Resume timestamp passed via navigate state from Library / Dashboard
    const resumeAt = location.state?.resumeAt || 0;

    const [activePanel, setActivePanel] = useState('ai');
    const [chatMessages, setChatMessages] = useState([
        { role: 'ai', text: "👋 Hey! I'm your AI Study Companion. Ask me anything about this video — I'll give you context-aware explanations! 🧠", time: 'now' }
    ]);
    const [chatInput, setChatInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [focusMode, setFocusMode] = useState(false);
    const [noteText, setNoteText] = useState('');
    const [notesSaved, setNotesSaved] = useState([]);
    const [sessionTime, setSessionTime] = useState(0);
    const [quizActive, setQuizActive] = useState(false);
    const [quizQuestions] = useState(() => getQuizForVideo(videoId));
    const [quizQ, setQuizQ] = useState(0);
    const [quizScore, setQuizScore] = useState(0);
    const [quizAnswered, setQuizAnswered] = useState(null);
    const [quizDone, setQuizDone] = useState(false);
    const [bookmarkSaved, setBookmarkSaved] = useState(false);
    const [flashcards, setFlashcards] = useState([]);
    const [showFlashcards, setShowFlashcards] = useState(false);

    // ── Refs ──────────────────────────────────────────────────────────────
    const chatEndRef = useRef(null);
    const playerContainerRef = useRef(null); // div that YT.Player injects into
    const ytPlayerRef = useRef(null); // YT.Player instance
    const timerRef = useRef(null); // session timer interval
    const progressIntervalRef = useRef(null); // watch-progress save interval
    const sessionTimeRef = useRef(0);    // always current, avoids stale closure
    // Keep saveProgress ref fresh so the cleanup effect never closes over stale fn
    const saveProgressRef = useRef(saveProgress);
    useEffect(() => { saveProgressRef.current = saveProgress; }, [saveProgress]);

    // ── Session timer (fixed stale-closure bug) ────────────────────────────
    useEffect(() => {
        const meta = VIDEO_META[videoId] || {};
        startSession({ id: videoId, title: meta.title || 'Video' }, null);
        sessionTimeRef.current = 0;
        timerRef.current = setInterval(() => {
            setSessionTime(t => {
                sessionTimeRef.current = t + 1; // always up-to-date in ref
                return t + 1;
            });
        }, 1000);
        return () => {
            clearInterval(timerRef.current);
            endSession(sessionTimeRef.current); // ✅ uses ref, never stale
        };
    }, [videoId]);

    // ── YouTube IFrame API integration ─────────────────────────────────────
    useEffect(() => {
        const meta = VIDEO_META[videoId] || {};
        const origin = window.location.origin || 'http://localhost:5173';
        let mounted = true;

        /** Save current position directly via the YT.Player instance */
        function flushProgress(player) {
            try {
                const ct = player.getCurrentTime?.();
                const dur = player.getDuration?.();
                if (typeof ct === 'number' && typeof dur === 'number' && dur > 0) {
                    saveProgressRef.current({
                        videoId,
                        title: meta.title || `Video – ${videoId}`,
                        channel: meta.channel || '',
                        thumbnail: `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`,
                        currentTime: ct,
                        duration: dur,
                    });
                }
            } catch { /* player may be destroyed already */ }
        }

        function initYTPlayer() {
            if (!mounted || !playerContainerRef.current) return;

            const player = new window.YT.Player(playerContainerRef.current, {
                videoId,
                width: '100%',
                height: '100%',
                playerVars: {
                    autoplay: 0,
                    rel: 0,
                    modestbranding: 1,
                    iv_load_policy: 3,
                    fs: 1,
                    cc_load_policy: 0,
                    enablejsapi: 1,
                    origin: origin,
                    widget_referrer: origin,
                    playsinline: 1,
                },
                events: {
                    onReady: (evt) => {
                        ytPlayerRef.current = evt.target;
                        // ✅ Seek to saved position on resume
                        if (resumeAt > 5) {
                            evt.target.seekTo(resumeAt, true);
                        }
                    },
                    onStateChange: (evt) => {
                        const YTS = window.YT.PlayerState;
                        if (evt.data === YTS.PLAYING) {
                            setIsPlaying(true);
                            // Save every 10 s while playing
                            clearInterval(progressIntervalRef.current);
                            progressIntervalRef.current = setInterval(() => {
                                if (ytPlayerRef.current) flushProgress(ytPlayerRef.current);
                            }, 10_000);
                        } else {
                            setIsPlaying(false);
                            clearInterval(progressIntervalRef.current);
                            // Save immediately on pause or end
                            if (evt.data === YTS.PAUSED || evt.data === YTS.ENDED) {
                                if (ytPlayerRef.current) flushProgress(ytPlayerRef.current);
                            }
                        }
                    },
                },
            });

            ytPlayerRef.current = player;
        }

        loadYouTubeAPI().then(() => {
            if (mounted) initYTPlayer();
        });

        return () => {
            mounted = false;
            clearInterval(progressIntervalRef.current);
            if (ytPlayerRef.current) {
                flushProgress(ytPlayerRef.current); // ✅ save on navigate away
                try { ytPlayerRef.current.destroy(); } catch { /* ignore */ }
                ytPlayerRef.current = null;
            }
        };
    }, [videoId]); // re-runs only when video changes

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatMessages]);

    function formatTime(s) {
        const m = Math.floor(s / 60);
        const sec = s % 60;
        return `${m}:${sec.toString().padStart(2, '0')}`;
    }

    function sendMessage() {
        if (!chatInput.trim()) return;
        const userMsg = { role: 'user', text: chatInput, time: new Date().toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' }) };
        setChatMessages(prev => [...prev, userMsg]);
        setChatInput('');
        setIsTyping(true);
        const delay = 800 + Math.random() * 1200;
        setTimeout(() => {
            const aiText = getEnhancedAIResponse(userMsg.text, videoId);
            setChatMessages(prev => [...prev, {
                role: 'ai',
                text: aiText,
                time: new Date().toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })
            }]);
            setIsTyping(false);
        }, delay);
    }

    function saveNote() {
        if (!noteText.trim()) return;
        const note = { videoId, text: noteText, timestamp: sessionTime, videoTitle: 'Current Video' };
        addNote(note);
        setNotesSaved(prev => [...prev, note]);
        setNoteText('');
        addXP(15, 'Note saved');
    }

    function saveBookmark() {
        const meta = VIDEO_META[videoId] || {};
        addBookmark({
            videoId,
            title: meta.title || `Video – ${videoId}`,
            thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
            channel: meta.channel || '',
            duration: '',
            timestamp: sessionTime,
        });
        setBookmarkSaved(true);
        setTimeout(() => setBookmarkSaved(false), 2000);
        addXP(5, 'Bookmark saved');
    }

    function handleQuizAnswer(idx) {
        if (quizAnswered !== null) return;
        setQuizAnswered(idx);
        const correct = idx === quizQuestions[quizQ].correct;
        if (correct) setQuizScore(s => s + 1);
        setTimeout(() => {
            if (quizQ + 1 >= quizQuestions.length) {
                setQuizDone(true);
                addXP(50 + quizScore * 25, 'Quiz completed');
            } else {
                setQuizQ(q => q + 1);
                setQuizAnswered(null);
            }
        }, 1400);
    }

    function generateFlashcards() {
        const cards = [
            { front: 'What is the main concept in this video?', back: 'The core idea demonstrated with practical examples and real-world applications.' },
            { front: 'What problem does this solve?', back: 'It solves the complexity of understanding abstract concepts by showing concrete implementations.' },
            { front: 'What is the time complexity mentioned?', back: 'Depends on the algorithm — generally O(n) for linear operations, O(log n) for binary search.' },
            { front: 'Name 3 key takeaways from this lesson', back: '1. Practice consistently 2. Understand before memorizing 3. Apply concepts to real projects' },
        ];
        setFlashcards(cards);
        setShowFlashcards(true);
        addXP(20, 'Flashcards generated');
    }

    return (
        <div className={`player-page ${focusMode ? 'focus-mode' : ''}`}>
            {/* Main Player Area */}
            <div className="player-main">
                {/* Video — YT.Player injects its own <iframe> into this div */}
                <div className="player-video-wrapper">
                    <div className={`video-container ${focusMode ? 'theater' : ''}`}>
                        <div
                            ref={playerContainerRef}
                            className="video-iframe"
                            id={`yt-player-${videoId}`}
                        />
                    </div>


                    {/* Player Controls Bar */}
                    <div className="player-controls-bar">
                        <div className="player-meta">
                            <div className="session-timer">
                                <Clock size={13} />
                                <span>Session: {formatTime(sessionTime)}</span>
                            </div>
                            <div className="focus-score-live">
                                <div className="focus-dot-live" />
                                <span>Focus: {Math.max(70, 94 - Math.floor(Math.random() * 10))}%</span>
                            </div>
                        </div>

                        <div className="player-actions">
                            <button
                                className={`btn ${bookmarkSaved ? 'btn-cyan' : 'btn-secondary'} btn-sm`}
                                onClick={saveBookmark}
                                id="bookmark-btn"
                            >
                                <BookmarkPlus size={14} />
                                {bookmarkSaved ? 'Saved!' : 'Bookmark'}
                            </button>
                            <button
                                className={`btn ${focusMode ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                                onClick={() => setFocusMode(f => !f)}
                                id="focus-mode-btn"
                            >
                                <Target size={14} />
                                {focusMode ? 'Exit Focus' : 'Focus Mode'}
                            </button>
                            <button className="btn btn-secondary btn-sm" onClick={generateFlashcards} id="flashcard-btn">
                                <Zap size={14} /> AI Flashcards
                            </button>
                        </div>
                    </div>
                </div>

                {/* Video Description */}
                <div className="video-meta-card">
                    <h2 className="video-meta-title">Currently Watching</h2>
                    <p className="video-meta-sub">Video ID: {videoId} • Zero ads • No recommendations • Full focus mode available</p>
                    <div className="video-meta-tags">
                        <span className="badge badge-green">✅ Ad-Free</span>
                        <span className="badge badge-cyan">🎯 Distraction-Free</span>
                        <span className="badge badge-violet">🤖 AI Tutor Active</span>
                        <span className="badge badge-amber">📊 Analytics Tracking</span>
                    </div>
                </div>
            </div>

            {/* Side Panel */}
            <div className="player-panel">
                {/* Panel Tabs */}
                <div className="panel-tabs">
                    <button
                        className={`panel-tab ${activePanel === 'ai' ? 'active' : ''}`}
                        onClick={() => setActivePanel('ai')}
                    >
                        <Bot size={15} /> AI Tutor
                    </button>
                    <button
                        className={`panel-tab ${activePanel === 'notes' ? 'active' : ''}`}
                        onClick={() => setActivePanel('notes')}
                    >
                        <StickyNote size={15} /> Notes
                    </button>
                    <button
                        className={`panel-tab ${activePanel === 'quiz' ? 'active' : ''}`}
                        onClick={() => { setActivePanel('quiz'); setQuizActive(true); }}
                    >
                        <CheckCircle size={15} /> Quiz
                    </button>
                </div>

                {/* AI Chat Panel */}
                {activePanel === 'ai' && (
                    <div className="chat-panel">
                        <div className="chat-messages">
                            {chatMessages.map((msg, i) => (
                                <div key={i} className={`chat-bubble ${msg.role}`}>
                                    {msg.role === 'ai' && (
                                        <div className="chat-avatar ai-avatar"><Bot size={14} /></div>
                                    )}
                                    <div className="chat-content">
                                        <p>{msg.text}</p>
                                        <span className="chat-time">{msg.time}</span>
                                    </div>
                                    {msg.role === 'user' && (
                                        <div className="chat-avatar user-avatar">P</div>
                                    )}
                                </div>
                            ))}
                            {isTyping && (
                                <div className="chat-bubble ai">
                                    <div className="chat-avatar ai-avatar"><Bot size={14} /></div>
                                    <div className="chat-content typing-indicator">
                                        <span /><span /><span />
                                    </div>
                                </div>
                            )}
                            <div ref={chatEndRef} />
                        </div>

                        {/* Quick Prompts */}
                        <div className="quick-prompts">
                            {['Explain this concept', 'Give me an example', 'Why is this important?', 'Simplify this'].map(p => (
                                <button key={p} className="quick-prompt" onClick={() => { setChatInput(p); }}>
                                    {p}
                                </button>
                            ))}
                        </div>

                        <div className="chat-input-row">
                            <input
                                className="chat-input"
                                placeholder="Ask anything about this video..."
                                value={chatInput}
                                onChange={e => setChatInput(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && sendMessage()}
                            />
                            <button className="btn btn-primary btn-icon" onClick={sendMessage} id="chat-send-btn">
                                <Send size={15} />
                            </button>
                        </div>
                    </div>
                )}

                {/* Notes Panel */}
                {activePanel === 'notes' && (
                    <div className="notes-panel">
                        <div className="note-input-area">
                            <div className="note-timestamp-label">
                                <Clock size={12} /> Note at {formatTime(sessionTime)}
                            </div>
                            <textarea
                                className="note-textarea"
                                placeholder="Type your note here... It'll be linked to the current timestamp automatically 📌"
                                value={noteText}
                                onChange={e => setNoteText(e.target.value)}
                                rows={4}
                            />
                            <button className="btn btn-primary" style={{ width: '100%' }} onClick={saveNote}>
                                <FileText size={14} /> Save Note
                            </button>
                        </div>

                        <div className="saved-notes">
                            <h4>Saved Notes ({notesSaved.length})</h4>
                            {notesSaved.length === 0 && (
                                <div className="empty-notes">
                                    <StickyNote size={32} style={{ color: 'var(--text-muted)' }} />
                                    <p>No notes yet. Start taking notes!</p>
                                </div>
                            )}
                            {notesSaved.map((note, i) => (
                                <div key={i} className="saved-note-item">
                                    <div className="note-ts">⏱ {formatTime(note.timestamp)}</div>
                                    <p>{note.text}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Quiz Panel */}
                {activePanel === 'quiz' && (
                    <div className="quiz-panel">
                        {!quizDone ? (
                            <>
                                <div className="quiz-header">
                                    <span>Question {quizQ + 1} of {quizQuestions.length}</span>
                                    <div className="quiz-progress-track">
                                        <div className="quiz-progress-fill" style={{ width: `${(quizQ / quizQuestions.length) * 100}%` }} />
                                    </div>
                                </div>
                                <div className="quiz-question">{quizQuestions[quizQ]?.q}</div>
                                <div className="quiz-options">
                                    {quizQuestions[quizQ]?.opts.map((opt, i) => (
                                        <button
                                            key={i}
                                            className={`quiz-option ${
                                                quizAnswered === i
                                                    ? (i === quizQuestions[quizQ].correct ? 'correct' : 'wrong')
                                                    : ''
                                            } ${
                                                quizAnswered !== null && i === quizQuestions[quizQ].correct ? 'correct' : ''
                                            }`}
                                            onClick={() => handleQuizAnswer(i)}
                                        >
                                            <span className="quiz-opt-letter">{String.fromCharCode(65 + i)}</span>
                                            {opt}
                                        </button>
                                    ))}
                                </div>
                                {quizAnswered !== null && quizQuestions[quizQ]?.explanation && (
                                    <div className="quiz-explanation">
                                        💡 {quizQuestions[quizQ].explanation}
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="quiz-result">
                                <div className="quiz-score-circle">
                                    <span>{quizScore}/{quizQuestions.length}</span>
                                    <small>Score</small>
                                </div>
                                <h3>{quizScore >= Math.ceil(quizQuestions.length * 0.7) ? '🎉 Great job!' : '📚 Keep practicing!'}</h3>
                                <p>{quizScore >= Math.ceil(quizQuestions.length * 0.7) ? 'You understood the concept well!' : 'Review the video and try again.'}</p>
                                <div className="badge badge-green">+{50 + quizScore * 25} XP earned</div>
                                <button
                                    className="btn btn-primary"
                                    style={{ marginTop: 12 }}
                                    onClick={() => { setQuizQ(0); setQuizScore(0); setQuizAnswered(null); setQuizDone(false); }}
                                >
                                    Retake Quiz
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Flashcards Modal */}
            {showFlashcards && (
                <FlashcardModal cards={flashcards} onClose={() => setShowFlashcards(false)} />
            )}
        </div>
    );
}

function FlashcardModal({ cards, onClose }) {
    const [current, setCurrent] = useState(0);
    const [flipped, setFlipped] = useState(false);

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="flashcard-modal animate-scale-in" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>🃏 AI Flashcards ({current + 1}/{cards.length})</h3>
                    <button className="btn btn-ghost btn-sm" onClick={onClose}><X size={16} /></button>
                </div>
                <div className={`flashcard ${flipped ? 'flipped' : ''}`} onClick={() => setFlipped(f => !f)}>
                    <div className="flashcard-front">{cards[current].front}</div>
                    <div className="flashcard-back">{cards[current].back}</div>
                </div>
                <p className="flashcard-hint">Click card to flip</p>
                <div className="flashcard-nav">
                    <button className="btn btn-secondary" onClick={() => { setCurrent(c => Math.max(0, c - 1)); setFlipped(false); }} disabled={current === 0}>← Prev</button>
                    <button className="btn btn-primary" onClick={() => { setCurrent(c => Math.min(cards.length - 1, c + 1)); setFlipped(false); }} disabled={current === cards.length - 1}>Next →</button>
                </div>
            </div>
        </div>
    );
}
