import React from 'react';
import { useApp } from '../context/AppContext';
import { Zap } from 'lucide-react';
import './XPToast.css';

export default function XPToast() {
    const { xpGained } = useApp();
    if (!xpGained) return null;
    return (
        <div className="xp-toast animate-fade-in">
            <Zap size={16} />
            <span>+{xpGained.amount} XP</span>
            {xpGained.reason && <span className="xp-reason">{xpGained.reason}</span>}
        </div>
    );
}
