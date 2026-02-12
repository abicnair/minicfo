'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { PlayCircle, FileText, CheckCircle, ArrowRight } from 'lucide-react';

interface Mission {
    id: string;
    title: string;
    subtitle: string;
    briefing_from: string;
    briefing_body: string[];
}

interface Objective {
    id: string;
    body: string;
    sort_order: number;
}

interface DatasetLabel {
    id: string;
    intel_label: string;
}

export default function MissionBriefingPage() {
    const params = useParams();
    const missionId = params.id as string;

    const [mission, setMission] = useState<Mission | null>(null);
    const [objectives, setObjectives] = useState<Objective[]>([]);
    const [datasets, setDatasets] = useState<DatasetLabel[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMissionData = async () => {
            try {
                // Fetch Mission (for now we simplify and just get the first mission or by title if we had it, 
                // but since the seed only creates one, we'll fetch the first one)
                const { data: missionData, error: missionError } = await supabase
                    .from('missions')
                    .select('*')
                    .limit(1)
                    .single();

                if (missionError) throw missionError;
                setMission(missionData);

                // Fetch Objectives
                const { data: objectiveData, error: objectiveError } = await supabase
                    .from('objectives')
                    .select('*')
                    .eq('mission_id', missionData.id)
                    .order('sort_order', { ascending: true });

                if (objectiveError) throw objectiveError;
                setObjectives(objectiveData);

                // Fetch Dataset Labels
                const { data: datasetData, error: datasetError } = await supabase
                    .from('datasets')
                    .select('id, intel_label')
                    .eq('mission_id', missionData.id)
                    .order('sort_order', { ascending: true });

                if (datasetError) throw datasetError;
                setDatasets(datasetData);

            } catch (error) {
                console.error('Error fetching mission data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchMissionData();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full bg-slate-50">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-slate-500 font-medium">Loading transmission...</p>
                </div>
            </div>
        );
    }

    if (!mission) {
        return (
            <div className="flex items-center justify-center h-full bg-slate-50">
                <div className="text-center p-8 bg-white rounded-xl shadow-sm border border-slate-200">
                    <h2 className="text-xl font-bold text-slate-900 mb-2">No Mission Found</h2>
                    <p className="text-slate-500">Please check your database configuration.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-slate-50 overflow-y-auto">
            {/* Hero Section */}
            <div className="relative h-64 bg-slate-900 text-white flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent z-10" />
                {/* Placeholder for Video Background */}
                <div className="absolute inset-0 opacity-30 bg-[url('https://images.unsplash.com/photo-1556761175-5973dc0f32e7?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center" />

                <div className="relative z-20 text-center space-y-4 max-w-2xl px-4">
                    <Badge variant="secondary" className="bg-indigo-500/20 text-indigo-100 border-indigo-500/30 backdrop-blur-sm">
                        Incoming Transmission
                    </Badge>
                    <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
                        {mission.title}
                    </h1>
                    <p className="text-slate-300 text-lg">
                        "{mission.subtitle}"
                    </p>
                </div>
            </div>

            <div className="max-w-4xl mx-auto w-full p-6 space-y-8 -mt-8 relative z-30">
                {/* The Briefing Card */}
                <Card className="shadow-lg border-t-4 border-t-indigo-500">
                    <CardContent className="p-8 space-y-6">
                        <div className="flex items-start gap-4">
                            <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                                <PlayCircle className="h-6 w-6 text-indigo-600" />
                            </div>
                            <div className="space-y-2">
                                <h2 className="text-xl font-semibold text-slate-900">Briefing from {mission.briefing_from}</h2>
                                <div className="prose prose-slate text-slate-600">
                                    {mission.briefing_body.map((para, i) => (
                                        <p key={i}>"{para}"</p>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Objectives */}
                <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                            <CheckCircle className="h-5 w-5 text-green-600" />
                            Primary Objectives
                        </h3>
                        <Card>
                            <CardContent className="p-4 space-y-3">
                                {objectives.map((obj, i) => (
                                    <div key={obj.id} className="flex gap-3 text-sm text-slate-700">
                                        <div className="h-5 w-5 rounded-full bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200 text-xs font-medium">{obj.sort_order}</div>
                                        <p>{obj.body}</p>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    </div>

                    <div className="space-y-4">
                        <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                            <FileText className="h-5 w-5 text-indigo-600" />
                            Intel Available
                        </h3>
                        <Card>
                            <CardContent className="p-4">
                                <ul className="space-y-2 text-sm text-slate-600">
                                    {datasets.map((dataset) => (
                                        <li key={dataset.id} className="flex items-center gap-2">
                                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                                            {dataset.intel_label}
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Action Bar */}
                <div className="flex justify-end pt-4">
                    <Link href={`/mission/${missionId}/data-room`}>
                        <Button size="lg" className="gap-2 shadow-xl shadow-indigo-500/20">
                            Inspect Data <ArrowRight className="h-4 w-4" />
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
