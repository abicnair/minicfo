'use client';

import { Sidebar } from '@/components/layout/Sidebar';

export default function SimulationLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex h-screen overflow-hidden bg-white">
            {/* We reuse the sidebar but maybe condensed? For now, keep it same */}
            <Sidebar />
            <main className="flex-1 flex flex-col h-full overflow-hidden">
                {children}
            </main>
        </div>
    );
}
