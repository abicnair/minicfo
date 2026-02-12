'use client';

import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MissionTimerProps {
    initialMinutes?: number;
    initialDays?: number;
    className?: string;
    onTimeExpire?: () => void;
}

export function MissionTimer({ initialMinutes = 30, initialDays = 0, className, onTimeExpire }: MissionTimerProps) {
    const [timeLeft, setTimeLeft] = useState((initialDays * 24 * 60 * 60) + (initialMinutes * 60));
    const [isWarning, setIsWarning] = useState(false);

    useEffect(() => {
        if (timeLeft <= 0) {
            onTimeExpire?.();
            return;
        }

        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [timeLeft, onTimeExpire]);

    useEffect(() => {
        if (timeLeft < 300 && initialDays === 0) { // Less than 5 minutes, only warn if no days involved
            setIsWarning(true);
        }
    }, [timeLeft, initialDays]);

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
