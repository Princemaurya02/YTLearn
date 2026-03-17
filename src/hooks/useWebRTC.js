/**
 * useWebRTC — Screen Share + Voice for Study Rooms (fixed)
 *
 * Signaling via BroadcastChannel (same-origin tabs / same browser).
 *
 * KEY FIX: every mutable value that is read inside the BroadcastChannel
 * onmessage callback is stored in a ref so the handler always sees the
 * LATEST value — no stale-closure bugs.
 */

import { useState, useEffect, useRef, useCallback } from 'react';

const STUN_CFG = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };

export function useWebRTC({ roomId, myId, amHost, members }) {

    // ── React state (drives re-renders) ─────────────────────────────────────
    const [screenStream, setScreenStream] = useState(null);
    const [micOn, setMicOn] = useState(false);
    const [sharing, setSharing] = useState(false);
    const [remoteStreams, setRemoteStreams] = useState({});   // { peerId: MediaStream }
    const [micStatuses, setMicStatuses] = useState({});   // { peerId: bool }
    const [shareActive, setShareActive] = useState(false);

    // ── Refs — always current, safe to read inside async callbacks ──────────
    const screenStreamRef = useRef(null);   // mirrors screenStream state
    const micStreamRef = useRef(null);   // mirrors micStream
    const sharingRef = useRef(false);  // mirrors sharing state
    const amHostRef = useRef(amHost);
    const myIdRef = useRef(myId);
    const membersRef = useRef(members);
    const pcsRef = useRef({});     // { peerId: RTCPeerConnection }
    const chanRef = useRef(null);   // BroadcastChannel

    // Keep refs in sync with latest props / state
    useEffect(() => { amHostRef.current = amHost; }, [amHost]);
    useEffect(() => { myIdRef.current = myId; }, [myId]);
    useEffect(() => { membersRef.current = members; }, [members]);

    // ── Low-level signaling helpers ─────────────────────────────────────────
    /** Unicast — send to a specific peer */
    function sendTo(to, type, payload) {
        try {
            chanRef.current?.postMessage({ type, from: myIdRef.current, to, payload });
        } catch { /* ignore — channel may be closed */ }
    }

    /** Broadcast — send to everyone (they filter by `to === undefined`) */
    function bcast(type, payload) {
        try {
            chanRef.current?.postMessage({ type, from: myIdRef.current, payload });
        } catch { /* ignore */ }
    }

    // ── RTCPeerConnection factory ────────────────────────────────────────────
    function getOrCreatePC(peerId) {
        if (pcsRef.current[peerId]) return pcsRef.current[peerId];

        const pc = new RTCPeerConnection(STUN_CFG);

        pc.ontrack = (e) => {
            const stream = e.streams[0];
            if (stream) {
                setRemoteStreams(prev => ({ ...prev, [peerId]: stream }));
            }
        };

        pc.onicecandidate = (e) => {
            if (e.candidate) sendTo(peerId, 'ice', e.candidate);
        };

        pc.onconnectionstatechange = () => {
            if (['failed', 'disconnected', 'closed'].includes(pc.connectionState)) {
                setRemoteStreams(prev => {
                    const next = { ...prev };
                    delete next[peerId];
                    return next;
                });
            }
        };

        pcsRef.current[peerId] = pc;
        return pc;
    }

    function closePC(peerId) {
        try { pcsRef.current[peerId]?.close(); } catch { /* ok */ }
        delete pcsRef.current[peerId];
    }

    function closeAllPCs() {
        Object.keys(pcsRef.current).forEach(closePC);
        pcsRef.current = {};
    }

    // ── Offer / Answer helpers ───────────────────────────────────────────────
    /**
     * Host creates and sends an offer to `peerId`.
     * Reads tracks directly from `screenStreamRef` / `micStreamRef` refs
     * to avoid stale closures.
     */
    async function createOffer(peerId) {
        // Clean up any previous connection to this peer
        closePC(peerId);
        const pc = getOrCreatePC(peerId);

        // Add screen tracks
        const ss = screenStreamRef.current;
        if (ss) {
            ss.getTracks().forEach(track => {
                try { pc.addTrack(track, ss); } catch { /* already added */ }
            });
        }

        // Add mic tracks
        const ms = micStreamRef.current;
        if (ms) {
            ms.getTracks().forEach(track => {
                try { pc.addTrack(track, ms); } catch { /* already added */ }
            });
        }

        try {
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            sendTo(peerId, 'offer', pc.localDescription);
        } catch (err) {
            console.warn('[WebRTC] createOffer failed:', err.message);
        }
    }

    async function handleOffer(from, offerSdp) {
        const pc = getOrCreatePC(from);
        try {
            await pc.setRemoteDescription(new RTCSessionDescription(offerSdp));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            sendTo(from, 'answer', pc.localDescription);
        } catch (err) {
            console.warn('[WebRTC] handleOffer failed:', err.message);
        }
    }

    async function handleAnswer(from, answerSdp) {
        const pc = pcsRef.current[from];
        if (!pc) return;
        try {
            await pc.setRemoteDescription(new RTCSessionDescription(answerSdp));
        } catch (err) {
            console.warn('[WebRTC] handleAnswer failed:', err.message);
        }
    }

    async function handleIce(from, candidate) {
        const pc = pcsRef.current[from];
        if (!pc) return;
        try {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch { /* ignore benign ICE errors */ }
    }

    // ── BroadcastChannel message handler ────────────────────────────────────
    useEffect(() => {
        if (!roomId) return;
        const chan = new BroadcastChannel(`ytlearn_webrtc_${roomId}`);
        chanRef.current = chan;

        chan.onmessage = async ({ data }) => {
            const { type, from, to, payload } = data;

            // Skip our own messages
            if (from === myIdRef.current) return;
            // Skip unicast not aimed at us
            if (to && to !== myIdRef.current) return;

            switch (type) {
                // ── Signaling ────────────────────────────────────────
                case 'offer':
                    await handleOffer(from, payload);
                    break;

                case 'answer':
                    await handleAnswer(from, payload);
                    break;

                case 'ice':
                    await handleIce(from, payload);
                    break;

                // ── Screen share events ──────────────────────────────
                case 'share-started':
                    setShareActive(true);
                    // Member: request an offer from the host
                    if (!amHostRef.current) {
                        sendTo(payload.hostId, 'request-offer', { requesterId: myIdRef.current });
                    }
                    break;

                case 'share-stopped':
                    setShareActive(false);
                    setRemoteStreams({});
                    break;

                // Host: a member wants us to send them an offer
                case 'request-offer':
                    if (amHostRef.current && screenStreamRef.current) {
                        await createOffer(from);
                    }
                    break;

                // ── Mic status ───────────────────────────────────────
                case 'mic-status':
                    setMicStatuses(prev => ({ ...prev, [from]: payload.on }));
                    break;

                default:
                    break;
            }
        };

        return () => {
            chan.close();
            chanRef.current = null;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [roomId]);

    // ── Public API ───────────────────────────────────────────────────────────

    /** HOST: start screen sharing */
    const startScreenShare = useCallback(async () => {
        if (!amHostRef.current) return null;
        try {
            const stream = await navigator.mediaDevices.getDisplayMedia({
                video: { frameRate: 15, width: { ideal: 1920 } },
                audio: false,
            });

            // Update ref FIRST so createOffer can read it synchronously
            screenStreamRef.current = stream;
            setScreenStream(stream);
            setSharing(true);
            sharingRef.current = true;

            // Broadcast share-started to all members
            bcast('share-started', { hostId: myIdRef.current });

            // Send an offer to every current member immediately
            const others = membersRef.current
                .filter(m => m.id !== myIdRef.current)
                .map(m => m.id);

            for (const peerId of others) {
                await createOffer(peerId);
            }

            // Handle host stopping via browser's built-in "Stop sharing" button
            stream.getVideoTracks()[0]?.addEventListener('ended', () => {
                stopScreenShare();
            });

            return stream;
        } catch (err) {
            console.warn('[WebRTC] Screen share denied or cancelled:', err.message);
            return null;
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    /** HOST: stop screen sharing */
    const stopScreenShare = useCallback(() => {
        screenStreamRef.current?.getTracks().forEach(t => t.stop());
        screenStreamRef.current = null;
        setScreenStream(null);
        setSharing(false);
        sharingRef.current = false;
        bcast('share-stopped', { hostId: myIdRef.current });
        closeAllPCs();
        setRemoteStreams({});
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    /** ALL USERS: toggle microphone on/off */
    const toggleMic = useCallback(async () => {
        if (micStreamRef.current) {
            // Turn OFF
            micStreamRef.current.getTracks().forEach(t => t.stop());
            micStreamRef.current = null;
            setMicOn(false);
            bcast('mic-status', { on: false });
        } else {
            // Turn ON
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
                micStreamRef.current = stream;
                setMicOn(true);
                bcast('mic-status', { on: true });

                // Add mic track to all existing peer connections
                Object.values(pcsRef.current).forEach(pc => {
                    stream.getAudioTracks().forEach(track => {
                        try { pc.addTrack(track, stream); } catch { /* ok */ }
                    });
                });
            } catch (err) {
                console.warn('[WebRTC] Mic access denied:', err.message);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ── Cleanup on unmount ───────────────────────────────────────────────────
    useEffect(() => {
        return () => {
            screenStreamRef.current?.getTracks().forEach(t => t.stop());
            micStreamRef.current?.getTracks().forEach(t => t.stop());
            closeAllPCs();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return {
        screenStream,      // host's local display MediaStream
        micOn,             // local mic is currently on
        sharing,           // this host is actively sharing
        remoteStreams,     // { peerId: MediaStream } received from peers
        micStatuses,       // { peerId: bool } who has mic on
        shareActive,       // any host in room is sharing (visible to all)
        startScreenShare,
        stopScreenShare,
        toggleMic,
    };
}
