'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { FileText, Database, Terminal } from 'lucide-react';

interface MissionNavbarProps {
    missionId: string;
}

export function MissionNavbar({ missionId }: MissionNavbarProps) {
    const pathname = usePathname();

    const stages = [
        {
            name: 'Briefing',
            href: `/mission/${missionId}`,
            icon: FileText,
            active: pathname === `/mission/${missionId}`,
        },
        {
            name: 'Data Room',
            href: `/mission/${missionId}/data-room`,
            icon: Database,
            active: pathname.includes('/data-room'),
        },
        {
            name: 'Workbench',
            href: `/mission/${missionId}/workspace`,
            icon: Terminal,
            active: pathname.includes('/workspace'),
        },
    ];

    return (
        <nav className="flex items-center justify-center border-b border-slate-200 bg-white px-8 h-12 shrink-0 z-20">
            <div className="flex items-center gap-1 h-full">
                {stages.map((stage, i) => (
                    <React.Fragment key={stage.href}>
                        <Link
                            href={stage.href}
                            className={cn(
                                "flex items-center gap-2 px-6 h-full text-sm font-medium transition-all relative border-b-2",
                                stage.active
                                    ? "text-indigo-600 border-indigo-600 bg-indigo-50/30"
                                    : "text-slate-500 border-transparent hover:text-slate-700 hover:bg-slate-50"
                            )}
                        >
                            <stage.icon className={cn("h-4 w-4", stage.active ? "text-indigo-600" : "text-slate-400")} />
                            {stage.name}
                        </Link>
                        {i < stages.length - 1 && (
                            <div className="h-4 w-px bg-slate-200 mx-2" />
                        )}
                    </React.Fragment>
                ))}
            </div>
        </nav>
    );
}
