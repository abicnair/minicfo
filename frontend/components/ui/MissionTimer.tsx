'use client';

import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MissionTimerProps {
    kickoffAt?: string | null;
    className?: string;
    onTimeExpire?: () => void;
}

export function MissionTimer({ kickoffAt, className, onTimeExpire }: MissionTimerProps) {
    const [timeLeft, setTimeLeft] = useState<number | null>(null);
    const [isWarning, setIsWarning] = useState(false);

    useEffect(() => {
        if (!kickoffAt) {
            setTimeLeft(null);
            return;
        }

        // Fixed expiry date: March 16, 2026, end of day UTC
        const expiryDate = new Date('2026-03-16T23:59:59Z');

        const calculateTimeLeft = () => {
            const now = new Date();
            const difference = expiryDate.getTime() - now.getTime();

            if (difference <= 0) {
                setTimeLeft(0);
                onTimeExpire?.();
                return;
            }

            setTimeLeft(Math.floor(difference / 1000));
        };

        // Initial calculation
        calculateTimeLeft();

        const timer = setInterval(calculateTimeLeft, 1000);

        return () => clearInterval(timer);
    }, [kickoffAt, onTimeExpire]);

    useEffect(() => {
        if (timeLeft !== null && timeLeft < 86400) { // Less than 1 day
            setIsWarning(true);
        } else {
            setIsWarning(false);
        }
    }, [timeLeft]);

    if (timeLeft === null) {
        return (
            <div className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-full border font-mono font-medium bg-slate-100 text-slate-500 border-slate-200",
                className
            )}>
                <Clock className="w-4 h-4" />
                <span>Waiting for Kickoff</span>
            </div>
        );
    }

    const days = Math.floor(timeLeft / (24 * 60 * 60));
    const hours = Math.floor((timeLeft % (24 * 60 * 60)) / (60 * 60));
    const minutes = Math.floor((timeLeft % (60 * 60)) / 60);
    const seconds = timeLeft % 60;

    return (
        <div className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-full border font-mono font-medium transition-colors",
            isWarning
                ? "bg-red-50 text-red-600 border-red-200 animate-pulse"
                : "bg-slate-50 text-slate-700 border-slate-200",
            className
        )}>
            <Clock className="w-4 h-4" />
            <span>
                {days > 0 && <>{days}d </>}
                {days > 0 || hours > 0 ? <>{hours.toString().padStart(2, '0')}:</> : null}
                {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
            </span>
        </div>
    );
}
