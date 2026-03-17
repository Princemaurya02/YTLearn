import React, { useState } from 'react';
import {
    Map, Lock, CheckCircle, Clock, Star, ChevronRight, ChevronDown,
    Zap, BookOpen, Play, Search, Filter, ArrowLeft, Target, Layers
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './Roadmaps.css';

/* ============================================================
   ROADMAP DATA — Roadmap → Phase → Topics → (optional videoId)
   ============================================================ */
const ROADMAP_DETAILS = {
    frontend: {
        title: 'Frontend Developer',
        emoji: '🎨',
        color: '#7c6eff',
        category: 'Engineering',
        desc: 'Master beautiful, responsive web interfaces from scratch.',
        time: '4–5 months',
        phases: [
            {
                id: 1, name: 'Web Foundations',
                topics: [
                    { name: 'HTML Fundamentals', videoId: 'qz0aGYrrlhU', hours: 6, done: true },
                    { name: 'CSS & Styling Basics', videoId: 'yfoY53QXEnI', hours: 8, done: true },
                    { name: 'CSS Flexbox & Grid', videoId: 'rg7Fvvl3taU', hours: 6, done: false },
                ],
            },
            {
                id: 2, name: 'JavaScript Core',
                topics: [
                    { name: 'JavaScript Basics', videoId: 'PkZNo7MFNFg', hours: 12, done: true },
                    { name: 'DOM Manipulation', videoId: 'PkZNo7MFNFg', hours: 5, done: true },
                    { name: 'JavaScript ES6+', videoId: 'ZjAqacIC_3c', hours: 8, done: false },
                    { name: 'Async JS & Promises', videoId: 'PkZNo7MFNFg', hours: 6, done: false },
                ],
            },
            {
                id: 3, name: 'React Framework',
                topics: [
                    { name: 'React Fundamentals', videoId: 'SqcY0GlETPk', hours: 14, done: false },
                    { name: 'React Hooks', videoId: 'w7ejDZ8SWv8', hours: 8, done: false },
                    { name: 'React Advanced Patterns', videoId: 'w7ejDZ8SWv8', hours: 10, done: false },
                ],
            },
            {
                id: 4, name: 'Production Skills',
                topics: [
                    { name: 'Git & Version Control', videoId: 'dhYoOOa2i2M', hours: 4, done: false },
                    { name: 'TypeScript Basics', videoId: 'ZjAqacIC_3c', hours: 8, done: false },
                    { name: 'Deploy & Host Projects', videoId: null, hours: 4, done: false },
                ],
            },
        ],
    },

    dsa: {
        title: 'DSA & Competitive Programming',
        emoji: '🧩',
        color: '#00d4ff',
        category: 'Engineering',
        desc: 'Crack any coding interview with solid data structures & algorithms.',
        time: '5–6 months',
        phases: [
            {
                id: 1, name: 'Linear Data Structures',
                topics: [
                    { name: 'Arrays & Strings', videoId: '8hly31xKli0', hours: 6, done: true },
                    { name: 'Linked Lists', videoId: '8hly31xKli0', hours: 4, done: true },
                    { name: 'Stacks & Queues', videoId: '8hly31xKli0', hours: 4, done: false },
                ],
            },
            {
                id: 2, name: 'Non-Linear Structures',
                topics: [
                    { name: 'Trees & BST', videoId: '8hly31xKli0', hours: 8, done: false },
                    { name: 'Heaps & Priority Queues', videoId: '8hly31xKli0', hours: 5, done: false },
                    { name: 'Graphs & BFS/DFS', videoId: '8hly31xKli0', hours: 10, done: false },
                ],
            },
            {
                id: 3, name: 'Core Algorithms',
                topics: [
                    { name: 'Sorting Algorithms', videoId: '8hly31xKli0', hours: 5, done: false },
                    { name: 'Binary Search', videoId: '8hly31xKli0', hours: 4, done: false },
                    { name: 'Recursion & Backtracking', videoId: '8hly31xKli0', hours: 6, done: false },
                ],
            },
            {
                id: 4, name: 'Advanced Techniques',
                topics: [
                    { name: 'Dynamic Programming', videoId: 'RBSGKlAvoiM', hours: 14, done: false },
                    { name: 'Greedy Algorithms', videoId: '8hly31xKli0', hours: 6, done: false },
                    { name: 'Advanced Graph Algorithms', videoId: '8hly31xKli0', hours: 10, done: false },
                ],
            },
        ],
    },

    backend: {
        title: 'Backend Developer',
        emoji: '⚙️',
        color: '#00ff88',
        category: 'Engineering',
        desc: 'Build powerful server-side applications and REST APIs.',
        time: '4–5 months',
        phases: [
            {
                id: 1, name: 'Node.js Fundamentals',
                topics: [
                    { name: 'Node.js Core Concepts', videoId: 'fBNz5xF-Kx4', hours: 8, done: false },
                    { name: 'Modules & NPM', videoId: 'fBNz5xF-Kx4', hours: 4, done: false },
                    { name: 'File System & Events', videoId: 'fBNz5xF-Kx4', hours: 3, done: false },
                ],
            },
            {
                id: 2, name: 'Web Frameworks & APIs',
                topics: [
                    { name: 'Express Framework', videoId: 'fBNz5xF-Kx4', hours: 8, done: false },
                    { name: 'REST API Design', videoId: 'fBNz5xF-Kx4', hours: 6, done: false },
                    { name: 'Authentication & JWT', videoId: 'fBNz5xF-Kx4', hours: 5, done: false },
                ],
            },
            {
                id: 3, name: 'Databases',
                topics: [
                    { name: 'SQL & PostgreSQL', videoId: 'fBNz5xF-Kx4', hours: 8, done: false },
                    { name: 'MongoDB / NoSQL', videoId: 'fBNz5xF-Kx4', hours: 6, done: false },
                    { name: 'Redis & Caching', videoId: null, hours: 5, done: false },
                ],
            },
            {
                id: 4, name: 'Production & DevOps',
                topics: [
                    { name: 'Docker Basics', videoId: null, hours: 6, done: false },
                    { name: 'CI/CD Pipelines', videoId: null, hours: 4, done: false },
                    { name: 'Cloud Deployment (AWS/GCP)', videoId: null, hours: 6, done: false },
                ],
            },
        ],
    },

    ml: {
        title: 'Machine Learning Engineer',
        emoji: '🤖',
        color: '#ffb347',
        category: 'AI / Data',
        desc: 'From math fundamentals to building real AI models.',
        time: '7–8 months',
        phases: [
            {
                id: 1, name: 'Python & Math Foundations',
                topics: [
                    { name: 'Python for ML', videoId: '_uQrJ0TkZlc', hours: 8, done: false },
                    { name: 'NumPy & Pandas', videoId: '_uQrJ0TkZlc', hours: 6, done: false },
                    { name: 'Linear Algebra & Stats', videoId: '_uQrJ0TkZlc', hours: 10, done: false },
                ],
            },
            {
                id: 2, name: 'Core Machine Learning',
                topics: [
                    { name: 'Supervised Learning', videoId: '_uQrJ0TkZlc', hours: 10, done: false },
                    { name: 'Unsupervised Learning', videoId: '_uQrJ0TkZlc', hours: 8, done: false },
                    { name: 'Model Evaluation', videoId: '_uQrJ0TkZlc', hours: 5, done: false },
                ],
            },
            {
                id: 3, name: 'Deep Learning',
                topics: [
                    { name: 'Neural Networks', videoId: '_uQrJ0TkZlc', hours: 12, done: false },
                    { name: 'CNNs for Vision', videoId: '_uQrJ0TkZlc', hours: 10, done: false },
                    { name: 'RNNs & Transformers', videoId: '_uQrJ0TkZlc', hours: 14, done: false },
                ],
            },
            {
                id: 4, name: 'MLOps & Production',
                topics: [
                    { name: 'Model Deployment', videoId: null, hours: 8, done: false },
                    { name: 'MLflow & Experiment Tracking', videoId: null, hours: 4, done: false },
                    { name: 'Cloud ML Platforms', videoId: null, hours: 6, done: false },
                ],
            },
        ],
    },

    java: {
        title: 'Java Developer',
        emoji: '☕',
        color: '#f97316',
        category: 'Engineering',
        desc: 'Go from Java basics to building production-grade backend systems with Spring Boot.',
        time: '5–6 months',
        phases: [
            {
                id: 1, name: 'Programming Fundamentals',
                topics: [
                    { name: 'Introduction to Programming', videoId: 'PkZNo7MFNFg', hours: 4, done: false },
                    { name: 'Variables and Data Types', videoId: null, hours: 3, done: false },
                    { name: 'Control Flow (If, Switch, Loops)', videoId: null, hours: 4, done: false },
                    { name: 'Functions and Methods', videoId: null, hours: 4, done: false },
                    { name: 'Basic Problem Solving', videoId: '8hly31xKli0', hours: 5, done: false },
                ],
            },
            {
                id: 2, name: 'Core Java',
                topics: [
                    { name: 'Classes and Objects', videoId: null, hours: 5, done: false },
                    { name: 'Constructors', videoId: null, hours: 2, done: false },
                    { name: 'Inheritance and Polymorphism', videoId: null, hours: 6, done: false },
                    { name: 'Encapsulation and Abstraction', videoId: null, hours: 4, done: false },
                    { name: 'Exception Handling', videoId: null, hours: 4, done: false },
                ],
            },
            {
                id: 3, name: 'Advanced Java',
                topics: [
                    { name: 'Collections Framework', videoId: null, hours: 6, done: false },
                    { name: 'Generics', videoId: null, hours: 3, done: false },
                    { name: 'Multithreading', videoId: null, hours: 6, done: false },
                    { name: 'File Handling', videoId: null, hours: 3, done: false },
                    { name: 'Java Streams & Lambdas', videoId: null, hours: 5, done: false },
                ],
            },
            {
                id: 4, name: 'Backend with Java',
                topics: [
                    { name: 'JDBC & Database Connection', videoId: null, hours: 5, done: false },
                    { name: 'Spring Framework Basics', videoId: null, hours: 6, done: false },
                    { name: 'Spring Boot', videoId: null, hours: 8, done: false },
                    { name: 'REST APIs with Spring', videoId: null, hours: 6, done: false },
                    { name: 'Database Integration', videoId: null, hours: 5, done: false },
                ],
            },
            {
                id: 5, name: 'Production Skills',
                topics: [
                    { name: 'Build Tools (Maven / Gradle)', videoId: null, hours: 3, done: false },
                    { name: 'Unit Testing with JUnit', videoId: null, hours: 4, done: false },
                    { name: 'Docker Basics', videoId: null, hours: 4, done: false },
                    { name: 'Deployment', videoId: null, hours: 4, done: false },
                ],
            },
            {
                id: 6, name: 'Career Preparation',
                topics: [
                    { name: 'Build Java Projects', videoId: null, hours: 10, done: false },
                    { name: 'System Design Basics', videoId: null, hours: 8, done: false },
                    { name: 'Coding Interview Preparation', videoId: '8hly31xKli0', hours: 12, done: false },
                    { name: 'Resume and Portfolio', videoId: null, hours: 4, done: false },
                ],
            },
        ],
    },

    software_engineer: {
        title: 'Software Engineer',
        emoji: '💻',
        color: '#a855f7',
        category: 'Engineering',
        desc: 'A comprehensive path from programming basics to becoming a complete software engineer.',
        time: '8–12 months',
        phases: [
            {
                id: 1, name: 'Programming Foundations',
                topics: [
                    { name: 'Intro to Programming', videoId: 'PkZNo7MFNFg', hours: 6, done: false },
                    { name: 'Data Types & Variables', videoId: null, hours: 4, done: false },
                    { name: 'Control Structures & Loops', videoId: null, hours: 5, done: false },
                    { name: 'Functions & Recursion', videoId: null, hours: 6, done: false },
                ],
            },
            {
                id: 2, name: 'Data Structures & Algorithms',
                topics: [
                    { name: 'Arrays, Strings, Lists', videoId: '8hly31xKli0', hours: 8, done: false },
                    { name: 'Trees, Graphs & Hash Maps', videoId: '8hly31xKli0', hours: 10, done: false },
                    { name: 'Sorting & Searching', videoId: '8hly31xKli0', hours: 6, done: false },
                    { name: 'Dynamic Programming', videoId: 'RBSGKlAvoiM', hours: 12, done: false },
                ],
            },
            {
                id: 3, name: 'Systems & Architecture',
                topics: [
                    { name: 'Operating Systems Basics', videoId: null, hours: 8, done: false },
                    { name: 'Computer Networks', videoId: null, hours: 8, done: false },
                    { name: 'Databases & SQL', videoId: null, hours: 8, done: false },
                    { name: 'System Design Fundamentals', videoId: null, hours: 10, done: false },
                ],
            },
            {
                id: 4, name: 'Software Development Practices',
                topics: [
                    { name: 'Git & Version Control', videoId: 'dhYoOOa2i2M', hours: 4, done: false },
                    { name: 'Agile & Scrum', videoId: null, hours: 4, done: false },
                    { name: 'Testing & TDD', videoId: null, hours: 6, done: false },
                    { name: 'Clean Code & Design Patterns', videoId: null, hours: 8, done: false },
                ],
            },
            {
                id: 5, name: 'Career & Interviews',
                topics: [
                    { name: 'LeetCode Problem Solving', videoId: '8hly31xKli0', hours: 20, done: false },
                    { name: 'Behavioral Interview Prep', videoId: null, hours: 4, done: false },
                    { name: 'System Design Interviews', videoId: null, hours: 8, done: false },
                    { name: 'Resume & Portfolio Building', videoId: null, hours: 4, done: false },
                ],
            },
        ],
    },

    neet: {
        title: 'NEET Preparation',
        emoji: '🔬',
        color: '#10b981',
        category: 'Medical Entrance',
        desc: 'Structured NEET preparation covering all three subjects with MCQ practice.',
        time: '12–18 months',
        phases: [
            {
                id: 1, name: 'Biology Foundations',
                topics: [
                    { name: 'Cell Biology & Cell Division', videoId: null, hours: 10, done: false },
                    { name: 'Plant Physiology', videoId: null, hours: 8, done: false },
                    { name: 'Human Physiology', videoId: null, hours: 12, done: false },
                    { name: 'Genetics & Heredity', videoId: null, hours: 10, done: false },
                    { name: 'Ecology & Environment', videoId: null, hours: 6, done: false },
                ],
            },
            {
                id: 2, name: 'Chemistry Fundamentals',
                topics: [
                    { name: 'Atomic Structure & Periodic Table', videoId: null, hours: 8, done: false },
                    { name: 'Chemical Bonding', videoId: null, hours: 6, done: false },
                    { name: 'Organic Chemistry Basics', videoId: null, hours: 12, done: false },
                    { name: 'Chemical Equilibrium', videoId: null, hours: 6, done: false },
                    { name: 'Electrochemistry', videoId: null, hours: 5, done: false },
                ],
            },
            {
                id: 3, name: 'Physics Fundamentals',
                topics: [
                    { name: 'Mechanics (Laws of Motion)', videoId: null, hours: 10, done: false },
                    { name: 'Thermodynamics', videoId: null, hours: 6, done: false },
                    { name: 'Waves and Optics', videoId: null, hours: 8, done: false },
                    { name: 'Electrostatics & Current', videoId: null, hours: 10, done: false },
                    { name: 'Modern Physics', videoId: null, hours: 6, done: false },
                ],
            },
            {
                id: 4, name: 'Problem Solving & MCQ Practice',
                topics: [
                    { name: 'Previous Year Questions (Biology)', videoId: null, hours: 10, done: false },
                    { name: 'Previous Year Questions (Chemistry)', videoId: null, hours: 10, done: false },
                    { name: 'Previous Year Questions (Physics)', videoId: null, hours: 10, done: false },
                    { name: 'Concept-Based MCQs', videoId: null, hours: 8, done: false },
                    { name: 'Time Management Strategies', videoId: null, hours: 3, done: false },
                ],
            },
            {
                id: 5, name: 'Mock Tests & Final Revision',
                topics: [
                    { name: 'Full-Length Mock Tests', videoId: null, hours: 20, done: false },
                    { name: 'Error Analysis & Weak Areas', videoId: null, hours: 8, done: false },
                    { name: 'Revision Techniques', videoId: null, hours: 6, done: false },
                    { name: 'Exam Day Strategy', videoId: null, hours: 2, done: false },
                ],
            },
        ],
    },

    jee: {
        title: 'JEE Preparation',
        emoji: '⚗️',
        color: '#3b82f6',
        category: 'Engineering Entrance',
        desc: 'Complete JEE Mains & Advanced preparation with concept-to-problem-solving approach.',
        time: '18–24 months',
        phases: [
            {
                id: 1, name: 'Mathematics Core',
                topics: [
                    { name: 'Algebra', videoId: null, hours: 12, done: false },
                    { name: 'Trigonometry', videoId: null, hours: 8, done: false },
                    { name: 'Coordinate Geometry', videoId: null, hours: 10, done: false },
                    { name: 'Functions & Calculus', videoId: null, hours: 14, done: false },
                    { name: 'Probability & Statistics', videoId: null, hours: 8, done: false },
                ],
            },
            {
                id: 2, name: 'Physics Core Concepts',
                topics: [
                    { name: 'Mechanics & Kinematics', videoId: null, hours: 12, done: false },
                    { name: 'Thermodynamics', videoId: null, hours: 8, done: false },
                    { name: 'Electromagnetism', videoId: null, hours: 12, done: false },
                    { name: 'Optics & Modern Physics', videoId: null, hours: 10, done: false },
                ],
            },
            {
                id: 3, name: 'Chemistry Core Concepts',
                topics: [
                    { name: 'Physical Chemistry', videoId: null, hours: 12, done: false },
                    { name: 'Organic Chemistry', videoId: null, hours: 14, done: false },
                    { name: 'Inorganic Chemistry', videoId: null, hours: 10, done: false },
                ],
            },
            {
                id: 4, name: 'Problem Solving Mastery',
                topics: [
                    { name: 'Advanced Problems (Maths)', videoId: null, hours: 16, done: false },
                    { name: 'Advanced Problems (Physics)', videoId: null, hours: 14, done: false },
                    { name: 'Multi-Concept Questions', videoId: null, hours: 12, done: false },
                    { name: 'Time Optimization Drills', videoId: null, hours: 8, done: false },
                ],
            },
            {
                id: 5, name: 'Mock Tests & Revision',
                topics: [
                    { name: 'JEE Mains Mock Tests', videoId: null, hours: 20, done: false },
                    { name: 'JEE Advanced Mock Tests', videoId: null, hours: 16, done: false },
                    { name: 'Concept Revision Sprints', videoId: null, hours: 10, done: false },
                    { name: 'Exam Strategy & Mindset', videoId: null, hours: 4, done: false },
                ],
            },
        ],
    },


    medical_student: {
        title: 'Medical Student Path',
        emoji: '🏥',
        color: '#14b8a6',
        category: 'Medical Career',
        desc: 'Structured medical curriculum for MBBS & BDS students — basic to clinical.',
        time: '5–5.5 years',
        phases: [
            {
                id: 1, name: 'Basic Medical Sciences',
                topics: [
                    { name: 'Anatomy (Gross & Histology)', videoId: null, hours: 20, done: false },
                    { name: 'Physiology', videoId: null, hours: 18, done: false },
                    { name: 'Biochemistry', videoId: null, hours: 14, done: false },
                    { name: 'Biostatistics', videoId: null, hours: 6, done: false },
                ],
            },
            {
                id: 2, name: 'Intermediate Medical Sciences',
                topics: [
                    { name: 'Pathology (General & Systemic)', videoId: null, hours: 18, done: false },
                    { name: 'Pharmacology', videoId: null, hours: 16, done: false },
                    { name: 'Microbiology & Immunology', videoId: null, hours: 14, done: false },
                    { name: 'Forensic Medicine', videoId: null, hours: 8, done: false },
                ],
            },
            {
                id: 3, name: 'Clinical Subjects',
                topics: [
                    { name: 'General Medicine', videoId: null, hours: 20, done: false },
                    { name: 'General Surgery', videoId: null, hours: 18, done: false },
                    { name: 'Pediatrics', videoId: null, hours: 12, done: false },
                    { name: 'Obstetrics & Gynecology', videoId: null, hours: 14, done: false },
                    { name: 'Orthopedics & ENT', videoId: null, hours: 10, done: false },
                ],
            },
            {
                id: 4, name: 'Clinical Practice & Internship',
                topics: [
                    { name: 'Clinical Diagnosis Skills', videoId: null, hours: 15, done: false },
                    { name: 'Treatment Planning', videoId: null, hours: 12, done: false },
                    { name: 'Patient Communication', videoId: null, hours: 8, done: false },
                    { name: 'Internship Rotations', videoId: null, hours: 50, done: false },
                ],
            },
        ],
    },
};

/* ============================================================
   CATEGORY COLOURS
   ============================================================ */
const CATEGORY_COLORS = {
    'Engineering': '#7c6eff',
    'AI / Data': '#ffb347',
    'Medical Entrance': '#10b981',
    'Engineering Entrance': '#3b82f6',
    'Medical Career': '#ef4444',
};

const ALL_CATEGORIES = ['All', ...new Set(Object.values(ROADMAP_DETAILS).map(r => r.category))];

/* ============================================================
   HELPERS
   ============================================================ */
function roadmapStats(rm) {
    const allTopics = rm.phases.flatMap(p => p.topics);
    const total = allTopics.length;
    const done = allTopics.filter(t => t.done).length;
    const hours = allTopics.reduce((a, t) => a + t.hours, 0);
    const phases = rm.phases.length;
    return { total, done, hours, phases };
}

/* ============================================================
   PHASE ACCORDION
   ============================================================ */
function PhaseBlock({ phase, phaseIndex, rmColor, navigate, allPhasesUnlocked }) {
    const [open, setOpen] = useState(phaseIndex === 0);

    const allTopics = phase.topics;
    const doneCnt = allTopics.filter(t => t.done).length;
    const pct = Math.round((doneCnt / allTopics.length) * 100);
    const phaseHours = allTopics.reduce((a, t) => a + t.hours, 0);
    const isComplete = doneCnt === allTopics.length;

    return (
        <div className={`phase-block ${isComplete ? 'phase-done' : ''}`}>
            {/* Phase header */}
            <button
                className="phase-header"
                onClick={() => setOpen(o => !o)}
                style={{ '--phase-color': rmColor }}
            >
                <div className="phase-number" style={{ background: isComplete ? '#00ff8822' : undefined, borderColor: isComplete ? '#00ff88' : rmColor + '44', color: isComplete ? '#00ff88' : rmColor }}>
                    {isComplete ? <CheckCircle size={16} /> : phaseIndex + 1}
                </div>
                <div className="phase-header-info">
                    <div className="phase-name">
                        Phase {phaseIndex + 1}: {phase.name}
                    </div>
                    <div className="phase-meta-row">
                        <span><BookOpen size={11} /> {allTopics.length} topics</span>
                        <span><Clock size={11} /> {phaseHours}h</span>
                        <span className={isComplete ? 'phase-meta-done' : ''}>{doneCnt}/{allTopics.length} done</span>
                    </div>
                </div>
                <div className="phase-right">
                    <div className="phase-pct" style={{ color: isComplete ? '#00ff88' : rmColor }}>{pct}%</div>
                    <div className={`phase-chevron ${open ? 'open' : ''}`}>
                        <ChevronDown size={16} />
                    </div>
                </div>
            </button>

            {/* Topic list */}
            {open && (
                <div className="phase-topics">
                    <div className="phase-progress-bar">
                        <div className="phase-progress-fill" style={{ width: `${pct}%`, background: rmColor }} />
                    </div>
                    {allTopics.map((topic, ti) => (
                        <div key={ti} className={`topic-row ${topic.done ? 'topic-done' : ''}`}>
                            <div className="topic-dot" style={{ borderColor: topic.done ? '#00ff88' : rmColor + '66', background: topic.done ? '#00ff8820' : 'transparent' }}>
                                {topic.done
                                    ? <CheckCircle size={13} style={{ color: '#00ff88' }} />
                                    : <span style={{ color: rmColor, fontSize: 11, fontWeight: 700 }}>{ti + 1}</span>
                                }
                            </div>
                            <div className="topic-info">
                                <span className="topic-name">{topic.name}</span>
                                <span className="topic-hours"><Clock size={10} /> {topic.hours}h</span>
                            </div>
                            <div className="topic-action">
                                {topic.done ? (
                                    <span className="topic-done-badge">✅ Done</span>
                                ) : topic.videoId ? (
                                    <button
                                        className="btn btn-primary btn-sm topic-watch-btn"
                                        style={{ background: rmColor, borderColor: rmColor }}
                                        onClick={() => navigate(`/player/${topic.videoId}`)}
                                    >
                                        <Play size={11} /> Watch
                                    </button>
                                ) : (
                                    <span className="topic-no-video">Study Topic</span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

/* ============================================================
   ROADMAP DETAIL VIEW
   ============================================================ */
function RoadmapDetail({ rmId, onBack }) {
    const navigate = useNavigate();
    const rm = ROADMAP_DETAILS[rmId];
    const { total, done, hours, phases } = roadmapStats(rm);
    const pct = Math.round((done / Math.max(1, total)) * 100);

    return (
        <div className="roadmap-detail animate-fade-in">
            <button className="rm-back-btn" onClick={onBack}>
                <ArrowLeft size={16} /> Back to Roadmaps
            </button>

            {/* Hero */}
            <div className="roadmap-detail-header" style={{ '--rm-color': rm.color }}>
                <div className="rm-hero-icon">{rm.emoji}</div>
                <div className="rm-hero-info">
                    <div className="rm-category-tag" style={{ color: rm.color, borderColor: rm.color + '44', background: rm.color + '12' }}>
                        {rm.category}
                    </div>
                    <h2>{rm.title}</h2>
                    <p>{rm.desc}</p>
                    <div className="rm-hero-stats">
                        <span><Layers size={13} /> {phases} phases</span>
                        <span><BookOpen size={13} /> {total} topics</span>
                        <span><Clock size={13} /> {hours}h total</span>
                        <span><Target size={13} /> {rm.time}</span>
                        <span><CheckCircle size={13} /> {done} completed</span>
                    </div>
                </div>
                <div className="rm-hero-progress">
                    <div className="rm-progress-circle" style={{ '--pct': pct, '--rm-color': rm.color }}>
                        <span>{pct}%</span>
                    </div>
                    <div className="rm-progress-label">{done}/{total}<br /><small>topics done</small></div>
                </div>
            </div>

            {/* Phase blocks */}
            <div className="roadmap-phases">
                {rm.phases.map((phase, i) => (
                    <PhaseBlock
                        key={phase.id}
                        phase={phase}
                        phaseIndex={i}
                        rmColor={rm.color}
                        navigate={navigate}
                    />
                ))}
            </div>
        </div>
    );
}

/* ============================================================
   ROADMAP CARD (grid)
   ============================================================ */
function RoadmapCard({ rmId, rm, onSelect }) {
    const { total, done, hours, phases } = roadmapStats(rm);
    const pct = Math.round((done / Math.max(1, total)) * 100);

    return (
        <div
            className="roadmap-card"
            style={{ '--rm-color': rm.color }}
            onClick={() => onSelect(rmId)}
        >
            <div className="roadmap-card-top">
                <div className="roadmap-card-icon">{rm.emoji}</div>
                <div className="rm-cat-badge" style={{ color: rm.color, background: rm.color + '18', borderColor: rm.color + '40' }}>
                    {rm.category}
                </div>
            </div>
            <div className="roadmap-card-info">
                <h3>{rm.title}</h3>
                <p>{rm.desc}</p>
            </div>
            <div className="roadmap-card-stats">
                <span><Layers size={12} /> {phases} phases</span>
                <span><BookOpen size={12} /> {total} topics</span>
                <span><Clock size={12} /> {hours}h</span>
            </div>
            <div className="roadmap-card-progress">
                <div className="progress-track">
                    <div className="progress-fill" style={{ width: `${pct}%`, background: rm.color }} />
                </div>
                <span>{pct}%</span>
            </div>
            <button
                className="btn btn-sm rm-start-btn"
                style={{ background: rm.color + '22', color: rm.color, borderColor: rm.color + '44' }}
            >
                {pct > 0 ? 'Continue Path' : 'Start Path'} <ChevronRight size={13} />
            </button>
        </div>
    );
}

/* ============================================================
   MAIN PAGE
   ============================================================ */
export default function Roadmaps() {
    const [selected, setSelected] = useState(null);
    const [category, setCategory] = useState('All');
    const [search, setSearch] = useState('');

    if (selected) {
        return <RoadmapDetail rmId={selected} onBack={() => setSelected(null)} />;
    }

    const filtered = Object.entries(ROADMAP_DETAILS).filter(([, rm]) => {
        const catOk = category === 'All' || rm.category === category;
        const srchOk = rm.title.toLowerCase().includes(search.toLowerCase())
            || rm.desc.toLowerCase().includes(search.toLowerCase())
            || rm.category.toLowerCase().includes(search.toLowerCase());
        return catOk && srchOk;
    });

    return (
        <div className="roadmaps-page">
            <div className="roadmaps-intro">
                <h2>🗺️ Learning Roadmaps</h2>
                <p>Structured phase-by-phase learning paths. Pick a roadmap, follow the phases, watch the videos.</p>
            </div>

            {/* Search + Category filter */}
            <div className="roadmaps-controls">
                <div className="rm-search">
                    <Search size={15} />
                    <input
                        placeholder="Search roadmaps…"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
                <div className="rm-cats">
                    {ALL_CATEGORIES.map(cat => (
                        <button
                            key={cat}
                            className={`rm-cat-btn ${category === cat ? 'active' : ''}`}
                            style={category === cat && CATEGORY_COLORS[cat]
                                ? { borderColor: CATEGORY_COLORS[cat], color: CATEGORY_COLORS[cat] }
                                : undefined}
                            onClick={() => setCategory(cat)}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            <div className="rm-count">{filtered.length} roadmap{filtered.length !== 1 ? 's' : ''}</div>

            <div className="roadmaps-grid">
                {filtered.map(([id, rm]) => (
                    <RoadmapCard key={id} rmId={id} rm={rm} onSelect={setSelected} />
                ))}
            </div>
        </div>
    );
}
