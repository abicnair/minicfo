'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { PlayCircle, TrendingDown, AlertTriangle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Sidebar } from '@/components/layout/Sidebar';
import { useAuth } from '@/context/AuthContext';

interface MissionResult {
    id: string;
    title: string;
    description: string;
    subtitle: string;
    difficulty?: string;
    type?: string;
    status: string;
    color: string;
}

const comingSoonMissions = [
    {
        title: 'Pricing Lab',
        description: 'Optimize subscription tiers and usage-based pricing to maximize LTV.',
        icon: TrendingDown,
        difficulty: 'Hard',
        type: 'Optimization'
    },
    {
        title: 'Liquidity Crunch',
        description: 'Manage a sudden cash shortfall by optimizing burn rate and runway.',
        icon: AlertTriangle,
        difficulty: 'Critical',
        type: 'Crisis Management'
    },
    {
        title: 'Business Model Transition',
        description: 'Navigate the pivot from perpetual licenses to a recurring SaaS model.',
        icon: PlayCircle,
        difficulty: 'Hard',
        type: 'Strategic Pivot'
    },
];

export default function Dashboard() {
    const [missions, setMissions] = useState<MissionResult[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [retryCount, setRetryCount] = useState(0);
    const { loading: authLoading, user } = useAuth();

    useEffect(() => {
        let isMounted = true;
        let timeoutId: NodeJS.Timeout;

        const fetchMissions = async () => {
            if (authLoading) return;

            try {
                setLoading(true);
                setError(null);

                // Safety timeout to prevent indefinite spinning
                timeoutId = setTimeout(() => {
                    if (isMounted) {
                        console.warn('Dashboard: Loading timeout reached, forcing state to not loading');
                        setLoading(false);
                        setError('Loading timed out. Please try again.');
                    }
                }, 8000);

                const { data, error } = await supabase
                    .from('missions')
                    .select('*');

                if (error) throw error;
                if (!isMounted) return;

                console.log('Dashboard: Fetched missions:', data?.length || 0);

                const formattedMissions = (data || []).map((m: any) => ({
                    id: m.id,
                    title: m.title,
                    description: m.subtitle,
                    subtitle: m.subtitle,
                    difficulty: 'Medium', // Placeholder stats
                    type: 'Root Cause Analysis',
                    status: 'In Progress',
                    color: 'text-red-500',
                }));

                setMissions(formattedMissions);
                // Clear the timeout if we succeeded before 8 seconds
                clearTimeout(timeoutId);
            } catch (err: any) {
                if (!isMounted) return;

                // Clear the timeout if we errored before 8 seconds
                clearTimeout(timeoutId);

                if (err.name === 'AbortError' || err.message?.includes('aborted') || err.code === '20') {
                    console.log('Dashboard: Fetch aborted. Setting retry state.');
                    setError('Connection interrupted. Please try again.');
                } else {
                    console.error('Error fetching missions:', err);
                    setError(err.message || 'Failed to fetch missions.');
                }
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        if (!authLoading) {
            fetchMissions();
        }

        return () => {
            isMounted = false;
            clearTimeout(timeoutId);
        };
    }, [authLoading, user?.id, retryCount]);

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
                    {loading ? (
                        <div className="flex items-center justify-center p-12">
                            <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                        </div>
                    ) : error ? (
                        <div className="text-center p-12 bg-white rounded-xl border border-dashed border-red-300">
                            <AlertTriangle className="mx-auto h-8 w-8 text-red-500 mb-4" />
                            <p className="text-slate-800 font-medium mb-1">Failed to load missions</p>
                            <p className="text-slate-500 text-sm mb-4">{error}</p>
                            <Button onClick={() => setRetryCount(c => c + 1)} variant="outline" size="sm">
                                Retry
                            </Button>
                        </div>
                    ) : missions.length > 0 ? (
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {missions.map((mission) => (
                                <Card key={mission.id} className="transition-shadow hover:shadow-md">
                                    <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                                        <div className={`rounded-lg bg-slate-50 p-2 ${mission.color}`}>
                                            <TrendingDown className="h-6 w-6" />
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
                    ) : (
                        <div className="text-center p-12 bg-white rounded-xl border border-dashed border-slate-300">
                            <p className="text-slate-500">No active missions found.</p>
                        </div>
                    )}
                </section>

                <section className="mt-12">
                    <div className="mb-4">
                        <h2 className="text-xl font-semibold text-slate-800">Coming Soon</h2>
                        <p className="text-sm text-slate-500">Upcoming simulations currently in development.</p>
                    </div>
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 opacity-60 grayscale-[0.5]">
                        {comingSoonMissions.map((mission, i) => (
                            <Card key={i} className="bg-slate-50/50 border-slate-200">
                                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2 text-slate-400">
                                    <div className="rounded-lg bg-white p-2 border border-slate-100">
                                        <mission.icon className="h-6 w-6" />
                                    </div>
                                    <Badge variant="secondary" className="bg-slate-200 text-slate-500 border-none">
                                        Locked
                                    </Badge>
                                </CardHeader>
                                <CardContent>
                                    <CardTitle className="mb-2 text-lg text-slate-700">{mission.title}</CardTitle>
                                    <p className="mb-4 text-sm text-slate-400 italic">{mission.description}</p>
                                    <div className="flex items-center justify-between">
                                        <div className="text-xs font-medium text-slate-400">
                                            {mission.type} • {mission.difficulty}
                                        </div>
                                        <Button size="sm" variant="ghost" disabled className="text-slate-400">
                                            Prepare
                                        </Button>
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
