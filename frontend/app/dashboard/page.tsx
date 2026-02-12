'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { PlayCircle, TrendingDown, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { Sidebar } from '@/components/layout/Sidebar';

const activeMissions = [
    {
        id: 'mission-001',
        title: 'The SaaS Dip',
        description: 'Revenue growth has stalled despite heavy sales hiring. NRR is declining. Board meeting in 30 days.',
        difficulty: 'Medium',
        type: 'Root Cause Analysis',
        status: 'In Progress',
        icon: TrendingDown,
        color: 'text-red-500',
    },
    {
        id: 'mission-002',
        title: 'Margin Squeeze',
        description: 'Gross margins are slipping below 70%. Cloud costs are skyrocketing. Identify the leakage.',
        difficulty: 'Hard',
        type: 'Cost Optimization',
        status: 'New',
        icon: AlertTriangle,
        color: 'text-amber-500',
    },
];

export default function Dashboard() {
    return (
        <div className="flex h-screen bg-slate-50">
            <Sidebar />
            <main className="flex-1 overflow-y-auto p-8">
                <header className="mb-8">
                    <h1 className="text-3xl font-bold text-slate-900">Mission Control</h1>
                    <p className="text-slate-500">Select a mission to begin your analysis.</p>
                </header>

                <section>
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="text-xl font-semibold text-slate-800">Active Missions</h2>
                    </div>
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {activeMissions.map((mission) => (
                            <Card key={mission.id} className="transition-shadow hover:shadow-md">
                                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                                    <div className={`rounded-lg bg-slate-50 p-2 ${mission.color}`}>
                                        <mission.icon className="h-6 w-6" />
                                    </div>
                                    <Badge variant={mission.status === 'In Progress' ? 'default' : 'secondary'}>
                                        {mission.status}
                                    </Badge>
                                </CardHeader>
                                <CardContent>
                                    <CardTitle className="mb-2 text-lg">{mission.title}</CardTitle>
                                    <p className="mb-4 text-sm text-slate-500">{mission.description}</p>

                                    <div className="flex items-center justify-between">
                                        <div className="text-xs font-medium text-slate-400">
                                            {mission.type} • {mission.difficulty}
                                        </div>
                                        <Link href={`/mission/${mission.id}`}>
                                            <Button size="sm" className="gap-2">
                                                <PlayCircle className="h-4 w-4" />
                                                {mission.status === 'In Progress' ? 'Resume' : 'Start'}
                                            </Button>
                                        </Link>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </section>
            </main>
        </div>
    );
}
