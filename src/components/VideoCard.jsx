import React, { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import { Play, Clock, BookmarkPlus, CheckCircle } from 'lucide-react';
import './VideoCard.css';

/* ─── Framer Motion variants ─────────────────────────────────────────────── */
const cardVariants = {
    hidden:  { opacity: 0, y: 32, scale: 0.96 },
    visible: {
        opacity: 1, y: 0, scale: 1,
        transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] },
    },
};

const overlayVariants = {
    rest:  { opacity: 0 },
    hover: { opacity: 1, transition: { duration: 0.2 } },
};

const playBtnVariants = {
    rest:  { scale: 0.7, opacity: 0 },
    hover: { scale: 1,   opacity: 1, transition: { type: 'spring', stiffness: 400, damping: 20 } },
};

/* ─── VideoCard ──────────────────────────────────────────────────────────── */
export default function VideoCard({
    video,           // { id, title, duration, watched, thumbnail? }
    playlist,        // { id, title }
    onBookmark,
    delay = 0,
    index = 0,
}) {
    const navigate   = useNavigate();
    const cardRef    = useRef(null);
    const [bookmarked, setBookmarked] = useState(false);

    /* 3-D tilt (desktop only) */
    const rotX = useMotionValue(0);
    const rotY = useMotionValue(0);
    const sX   = useSpring(rotX, { stiffness: 180, damping: 22 });
    const sY   = useSpring(rotY, { stiffness: 180, damping: 22 });

    const onMouseMove = useCallback(e => {
        if (!cardRef.current) return;
        const { left, top, width, height } = cardRef.current.getBoundingClientRect();
        rotX.set(-((e.clientY - top)  / height - 0.5) * 12);
        rotY.set( ((e.clientX - left) / width  - 0.5) * 12);
    }, [rotX, rotY]);

    const onMouseLeave = useCallback(() => {
        rotX.set(0); rotY.set(0);
    }, [rotX, rotY]);

    function handlePlay(e) {
        e.stopPropagation();
        navigate(`/player/${video.id}`, { state: { playlistId: playlist?.id } });
    }

    function handleBookmark(e) {
        e.stopPropagation();
        setBookmarked(true);
        onBookmark?.(video);
    }

    const thumb = video.thumbnail
        || `https://i.ytimg.com/vi/${video.id}/mqdefault.jpg`;

    return (
        <motion.div
            ref={cardRef}
            className={`vc-card ${video.watched ? 'vc-watched' : ''}`}
            variants={cardVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-40px' }}
            whileHover="hover"
            whileTap={{ scale: 0.97 }}
            transition={{ delay: delay + index * 0.06 }}
            style={{ rotateX: sX, rotateY: sY, transformPerspective: 900 }}
            onMouseMove={onMouseMove}
            onMouseLeave={onMouseLeave}
            onClick={handlePlay}
        >
            {/* Thumbnail */}
            <div className="vc-thumb-wrap">
                <img
                    src={thumb}
                    alt={video.title}
                    className="vc-thumb"
                    loading="lazy"
                />

                {/* Hover overlay */}
                <motion.div className="vc-overlay" variants={overlayVariants}>
                    <motion.button
                        className="vc-play-btn"
                        variants={playBtnVariants}
                        onClick={handlePlay}
                        aria-label={`Play ${video.title}`}
                    >
                        <Play size={22} fill="white" />
                    </motion.button>
                </motion.div>

                {/* Duration badge */}
                {video.duration && (
                    <div className="vc-duration">
                        <Clock size={10} />
                        {video.duration}
                    </div>
                )}

                {/* Watched checkmark */}
                {video.watched && (
                    <div className="vc-watched-badge" title="Completed">
                        <CheckCircle size={14} />
                    </div>
                )}

                {/* Shimmer on load */}
                <div className="vc-shimmer" />
            </div>

            {/* Info */}
            <div className="vc-info">
                <p className="vc-title" title={video.title}>{video.title}</p>
                {playlist?.title && (
                    <span className="vc-playlist">{playlist.title}</span>
                )}
            </div>

            {/* Bookmark button */}
            <motion.button
                className={`vc-bookmark ${bookmarked ? 'bookmarked' : ''}`}
                onClick={handleBookmark}
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.85 }}
                aria-label="Bookmark"
            >
                <BookmarkPlus size={15} />
            </motion.button>
        </motion.div>
    );
}
