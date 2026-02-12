'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Database, ArrowRight, Lock, Unlock, AlertCircle, Eye } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { MissionTimer } from '@/components/ui/MissionTimer';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';

interface DatasetColumn {
    name: string;
    type: string;
    desc: string;
}

interface Dataset {
    id: string;
    name: string;
    description: string;
    row_count: string;
    unlock_cost: number;
    column_json: DatasetColumn[];
}

export default function DataRoomPage() {
    const params = useParams();
    const missionId = params.id as string;

    const [datasets, setDatasets] = useState<Dataset[]>([]);
    const [loading, setLoading] = useState(true);
    const [credits, setCredits] = useState(100);
    const [unlockedDatasets, setUnlockedDatasets] = useState<string[]>([]);
    const [selectedDataset, setSelectedDataset] = useState<string | null>(null);

    useEffect(() => {
        const fetchDatasets = async () => {
            try {
                // Fetch datasets for this mission
                // In this simplified version, we fetch all datasets (since they're usually small in number)
                const { data, error } = await supabase
                    .from('datasets')
                    .select('id, name, description, row_count, unlock_cost, column_json')
                    .order('sort_order', { ascending: true });

                if (error) throw error;
                setDatasets(data || []);

                // Set the first dataset as selected by default if available
                if (data && data.length > 0) {
                    setSelectedDataset(data[0].id);
                }
            } catch (error) {
                console.error('Error fetching datasets:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchDatasets();
    }, []);

    const handleUnlock = (datasetId: string, cost: number) => {
        if (credits >= cost) {
            setCredits(c => c - cost);
            setUnlockedDatasets(prev => [...prev, datasetId]);
            setSelectedDataset(datasetId);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full bg-slate-50">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-slate-500 font-medium">Entering Data Room...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-slate-50 overflow-y-auto">
            {/* Header with Game Stats */}
            <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-8 sticky top-0 z-10">
                <div className="flex items-center gap-2 font-semibold text-slate-700">
                    <Database className="h-5 w-5 text-indigo-600" />
                    <span>Mission Data Room</span>
                </div>
                <div className="flex items-center gap-6">
                    <MissionTimer initialDays={30} initialMinutes={0} />
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-full font-medium">
                        <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                        Credits: {credits}
                    </div>
                </div>
            </header>

            <main className="max-w-6xl mx-auto w-full p-8 grid grid-cols-12 gap-8">

                {/* Left Column: Dataset Grid */}
                <div className="col-span-12 lg:col-span-5 space-y-6">
                    <div className="space-y-2">
                        <h1 className="text-2xl font-bold text-slate-900">Data Sources</h1>
                        <p className="text-slate-500 text-sm">
                            Select a database to inspect. Unlock to grant access for analysis.
                        </p>
                    </div>

                    <div className="grid gap-4">
                        {datasets.map((dataset) => {
                            const isUnlocked = unlockedDatasets.includes(dataset.id);
                            const isSelected = selectedDataset === dataset.id;

                            return (
                                <div
                                    key={dataset.id}
                                    onClick={() => setSelectedDataset(dataset.id)}
                                    className={cn(
                                        "group relative flex items-center gap-4 p-4 rounded-xl border transition-all cursor-pointer",
                                        isSelected
                                            ? "border-indigo-600 bg-indigo-50 shadow-md transform scale-[1.02]"
                                            : "border-slate-200 bg-white hover:border-indigo-300 hover:shadow-sm"
                                    )}
                                >
                                    <div className={cn(
                                        "h-12 w-12 rounded-lg flex items-center justify-center shrink-0 transition-colors",
                                        isUnlocked ? "bg-indigo-100 text-indigo-600" : "bg-slate-100 text-slate-400 group-hover:bg-slate-200"
                                    )}>
                                        {isUnlocked ? <Database className="h-6 w-6" /> : <Eye className="h-6 w-6" />}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <h3 className={cn("font-semibold truncate", isUnlocked ? "text-slate-900" : "text-slate-600")}>
                                            {dataset.name}
                                        </h3>
                                        <p className="text-xs text-slate-500">{dataset.row_count} rows</p>
                                    </div>

                                    {!isUnlocked && (
                                        <Badge variant="secondary" className="bg-slate-100 text-slate-600">
                                            {dataset.unlock_cost} pts
                                        </Badge>
                                    )}

                                    {isUnlocked && <Badge variant="success" className="bg-green-100 text-green-700">Access Granted</Badge>}
                                </div>
                            );
                        })}
                    </div>

                    {/* Action to proceed */}
                    <div className="pt-6 border-t border-slate-200">
                        <Link href={`/mission/${missionId}/workspace`}>
                            <Button disabled={unlockedDatasets.length === 0} size="lg" className="w-full gap-2 shadow-lg shadow-indigo-500/20">
                                Enter Workbench <ArrowRight className="h-4 w-4" />
                            </Button>
                        </Link>
                        {unlockedDatasets.length === 0 && (
                            <p className="text-center text-xs text-amber-600 mt-2 flex items-center justify-center gap-1">
                                <AlertCircle className="h-3 w-3" /> Unlock at least one dataset to proceed
                            </p>
                        )}
                    </div>
                </div>

                {/* Right Column: Inspector Panel */}
                <div className="col-span-12 lg:col-span-7">
                    <Card className="h-full border-slate-200 shadow-sm bg-slate-50/50">
                        {selectedDataset ? (
                            (() => {
                                const dataset = datasets.find(d => d.id === selectedDataset)!;
                                const isUnlocked = unlockedDatasets.includes(dataset.id);

                                return (
                                    <div className="flex flex-col h-full">
                                        <CardHeader className="bg-white border-b border-slate-100">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <CardTitle className="text-xl flex items-center gap-2">
                                                        <Database className="h-5 w-5 text-indigo-600" />
                                                        {dataset.name}
                                                    </CardTitle>
                                                    <p className="text-slate-500 mt-1">{dataset.description}</p>
                                                </div>
                                                {!isUnlocked && (
                                                    <Button
                                                        onClick={() => handleUnlock(dataset.id, dataset.unlock_cost)}
                                                        disabled={credits < dataset.unlock_cost}
                                                        className="gap-2 shrink-0 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
                                                    >
                                                        <Unlock className="h-4 w-4" />
                                                        Unlock Data ({dataset.unlock_cost} pts)
                                                    </Button>
                                                )}
                                            </div>
                                        </CardHeader>

                                        <CardContent className="p-0 flex-1 overflow-auto bg-white flex flex-col">
                                            {/* Locked Banner */}
                                            {!isUnlocked && (
                                                <div className="bg-amber-50 border-b border-amber-100 p-3 flex items-center gap-3 text-sm text-amber-800">
                                                    <Lock className="h-4 w-4" />
                                                    <span>
                                                        <strong>Preview Mode:</strong> Schema is visible below. Unlock to query this data in the Workbench.
                                                    </span>
                                                </div>
                                            )}

                                            <table className="w-full text-left text-sm">
                                                <thead className="bg-slate-50 text-slate-500 sticky top-0 shadow-sm">
                                                    <tr>
                                                        <th className="px-6 py-3 font-medium">Column Name</th>
                                                        <th className="px-6 py-3 font-medium">Type</th>
                                                        <th className="px-6 py-3 font-medium">Description</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100">
                                                    {dataset.column_json.map((col) => (
                                                        <tr key={col.name} className="hover:bg-slate-50/50">
                                                            <td className="px-6 py-3 font-mono text-slate-700">{col.name}</td>
                                                            <td className="px-6 py-3">
                                                                <Badge variant="secondary" className="font-mono text-[10px] uppercase">
                                                                    {col.type}
                                                                </Badge>
                                                            </td>
                                                            <td className="px-6 py-3 text-slate-600">{col.desc}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </CardContent>
                                    </div>
                                );
                            })()
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center p-8 text-center space-y-4 text-slate-400">
                                <Database className="h-12 w-12 text-slate-200" />
                                <p>Select a data source from the list to view details.</p>
                            </div>
                        )}
                    </Card>
                </div>

            </main>
        </div>
    );
}
