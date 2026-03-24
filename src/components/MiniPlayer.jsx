import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Maximize2, GripHorizontal } from 'lucide-react';
import { usePiP } from '../context/PiPContext';
import './MiniPlayer.css';

export default function MiniPlayer() {
    const { pip, stopPiP } = usePiP();
    const navigate = useNavigate();
    const [expanded, setExpanded] = useState(false);

    function handleExpand() {
        // Navigate back to the full player at the pip's resume time
        navigate(`/player/${pip.videoId}`, {
            state: { resumeAt: pip.startTime || 0 },
        });
        stopPiP();
    }

    return (
        <AnimatePresence>
            {pip && (
                <motion.div
                    className={`mini-player ${expanded ? 'expanded' : ''}`}
                    initial={{ opacity: 0, y: 80, scale: 0.85 }}
                    animate={{ opacity: 1, y: 0,  scale: 1 }}
                    exit={{   opacity: 0, y: 80, scale: 0.85 }}
                    transition={{ type: 'spring', stiffness: 340, damping: 28 }}
                    drag
                    dragMomentum={false}
                    dragElastic={0.08}
                    whileDrag={{ cursor: 'grabbing', scale: 1.02 }}
                >
                    {/* Drag handle */}
                    <div className="mp-drag-handle" title="Drag to move">
                        <GripHorizontal size={14} />
                    </div>

                    {/* YouTube iframe */}
                    <div className="mp-iframe-wrap">
                        <iframe
                            src={`https://www.youtube.com/embed/${pip.videoId}?autoplay=1&start=${Math.floor(pip.startTime || 0)}&mute=0&rel=0&modestbranding=1&controls=1`}
                            title={pip.title || 'Mini Player'}
                            allowFullScreen
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            className="mp-iframe"
                        />
                    </div>

                    {/* Controls overlay */}
                    <div className="mp-controls">
                        <p className="mp-title">{pip.title || 'Now Playing'}</p>
                        <div className="mp-actions">
                            <button
                                className="mp-btn"
                                onClick={handleExpand}
                                title="Open fullscreen player"
                            >
                                <Maximize2 size={13} />
                                <span>Expand</span>
                            </button>
                            <button
                                className="mp-btn mp-btn-close"
                                onClick={stopPiP}
                                title="Close mini player"
                            >
                                <X size={13} />
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
