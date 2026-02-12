'use client';

import GCPSetup from '@/components/GCPSetup';
import { Button } from '@/components/ui/Button';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';

export default function SetupPage() {
    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            <header className="h-16 border-b border-slate-200 bg-white flex items-center px-8 justify-between shrink-0">
                <Link href="/">
                    <Button variant="ghost" size="sm" className="gap-2 text-slate-500">
                        <ChevronLeft className="h-4 w-4" /> Back to Missions
                    </Button>
                </Link>
                <div className="text-sm font-medium text-slate-500 italic">Phase 2: Data Warehouse Setup</div>
            </header>

            <main className="flex-1 overflow-y-auto py-12">
                <GCPSetup />
            </main>
        </div>
    );
}
