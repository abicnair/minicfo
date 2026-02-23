'use client';

import { Sidebar } from '@/components/layout/Sidebar';
import { MissionNavbar } from '@/components/mission/MissionNavbar';
import { useParams } from 'next/navigation';

export default function SimulationLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const params = useParams();
    const missionId = params.id as string;

    return (
        <div className="flex h-screen overflow-hidden bg-white">
            {/* We reuse the sidebar but maybe condensed? For now, keep it same */}
            <Sidebar />
            <main className="flex-1 flex flex-col h-full overflow-hidden">
                <MissionNavbar missionId={missionId} />
                <div className="flex-1 min-h-0 overflow-hidden">
                    {children}
                </div>
            </main>
        </div>
    );
}
