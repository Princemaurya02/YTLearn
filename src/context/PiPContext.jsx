import React, { createContext, useContext, useState, useCallback } from 'react';

const PiPContext = createContext(null);

export function PiPProvider({ children }) {
    const [pip, setPip] = useState(null);
    // pip = { videoId, title, channel, startTime }

    const startPiP = useCallback((video) => {
        setPip(video);
    }, []);

    const stopPiP = useCallback(() => {
        setPip(null);
    }, []);

    return (
        <PiPContext.Provider value={{ pip, startPiP, stopPiP }}>
            {children}
        </PiPContext.Provider>
    );
}

export function usePiP() {
    const ctx = useContext(PiPContext);
    if (!ctx) throw new Error('usePiP must be used inside PiPProvider');
    return ctx;
}
