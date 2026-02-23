'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Database, ArrowRight, Lock, Unlock, AlertCircle, Eye, Download, CloudUpload, CheckCircle2, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { MissionTimer } from '@/components/ui/MissionTimer';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

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

export default function DataRoomPage({ params }: { params: Promise<{ id: string }> }) {
    const { id: missionId } = React.use(params);
    const { userMissions, unlockDataset, syncMissionProgress, loading: authLoading, markDatasetSynced, profile } = useAuth();
    const missionProgress = userMissions.find(m => m.mission_id === missionId);

    const [datasets, setDatasets] = useState<Dataset[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDataset, setSelectedDataset] = useState<string | null>(null);
    const [isDownloading, setIsDownloading] = useState<string | null>(null);
    const [isSyncing, setIsSyncing] = useState<string | null>(null);
    const [syncSuccess, setSyncSuccess] = useState<string | null>(null);

    const credits = missionProgress?.credits ?? 0;
    const unlockedDatasets = missionProgress?.unlocked_datasets ?? [];
    const syncedDatasets = missionProgress?.synced_datasets ?? [];
    const gcpConfig = profile?.gcp_config;

    useEffect(() => {
        const fetchDatasets = async () => {
            try {
                // Fetch datasets for this mission
                const { data, error } = await supabase
                    .from('datasets')
                    .select('id, name, description, row_count, unlock_cost, column_json')
                    .eq('mission_id', missionId)
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

    // Fallback: Kickoff mission if we land here and it hasn't started
    useEffect(() => {
        if (!loading && !authLoading && missionId && !missionProgress?.kickoff_at) {
            console.log('DataRoom: Mission not kicked off, starting now...');
            syncMissionProgress(missionId, true);
        }
    }, [loading, authLoading, missionId, missionProgress, syncMissionProgress]);

    const handleUnlock = async (datasetId: string, cost: number) => {
        if (credits >= cost) {
            await unlockDataset(missionId, datasetId, cost);
        }
    };

    const handleDownload = async (datasetId: string) => {
        setIsDownloading(datasetId);
        try {
            const response = await fetch('/api/download-dataset', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ missionId, datasetId }),
            });

            if (!response.ok) throw new Error('Download failed');

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;

            // Get filename from response header or default
            const contentDisposition = response.headers.get('Content-Disposition');
            let fileName = 'dataset.csv';
            if (contentDisposition) {
                const match = contentDisposition.match(/filename="(.+)"/);
                if (match) fileName = match[1];
            }

            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (err) {
            console.error('Download error:', err);
        } finally {
            setIsDownloading(null);
        }
    };

    const handleSync = async (datasetId: string) => {
        setIsSyncing(datasetId);
        setSyncSuccess(null);
        try {
            const response = await fetch('/api/sync-bigquery', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tableId: datasetId }), // Dataset ID matches table mapping
            });

            if (!response.ok) throw new Error('Sync failed');

            // Persist the sync state in Supabase
            await markDatasetSynced(missionId, datasetId);

            setSyncSuccess(datasetId);
            setTimeout(() => setSyncSuccess(null), 3000);
        } catch (err) {
            console.error('Sync error:', err);
        } finally {
            setIsSyncing(null);
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
            <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-8 shrink-0">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2 font-semibold text-slate-700">
                        <Database className="h-5 w-5 text-indigo-600" />
                        <span>Mission Data Room</span>
                    </div>

                    <div className="h-6 w-px bg-slate-200" />

                    <Link href={`/mission/${missionId}/workspace`}>
                        <Button
                            disabled={unlockedDatasets.length === 0}
                            size="sm"
                            className="gap-2 shadow-sm"
                        >
                            Enter Workbench <ArrowRight className="h-4 w-4" />
                        </Button>
                    </Link>

                    {unlockedDatasets.length === 0 && (
                        <span className="text-xs text-amber-600 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" /> Unlock data to proceed
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-6">
                    <MissionTimer kickoffAt={missionProgress?.kickoff_at} />
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-full font-medium text-sm">
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
                                                <div className="space-y-1">
                                                    <CardTitle className="text-xl flex items-center gap-2">
                                                        <Database className="h-5 w-5 text-indigo-600" />
                                                        {dataset.name}
                                                    </CardTitle>
                                                    <p className="text-slate-500">{dataset.description}</p>

                                                    {isUnlocked && (
                                                        <div className="flex items-center gap-2 mt-3">
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className="h-8 gap-2 text-xs border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                                                                onClick={() => handleDownload(dataset.id)}
                                                                disabled={isDownloading === dataset.id}
                                                            >
                                                                {isDownloading === dataset.id ? (
                                                                    <div className="h-3 w-3 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                                                                ) : <Download className="h-3 w-3" />}
                                                                Download CSV
                                                            </Button>
                                                            <div className="flex items-center gap-2">
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    className={cn(
                                                                        "h-8 gap-2 text-xs border-amber-200 text-amber-700 hover:bg-amber-50",
                                                                        (syncSuccess === dataset.id || syncedDatasets.includes(dataset.id)) && "bg-green-50 text-green-700 border-green-200"
                                                                    )}
                                                                    onClick={() => handleSync(dataset.id)}
                                                                    disabled={isSyncing === dataset.id}
                                                                >
                                                                    {isSyncing === dataset.id ? (
                                                                        <div className="h-3 w-3 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                                                                    ) : (syncSuccess === dataset.id || syncedDatasets.includes(dataset.id)) ? (
                                                                        <CheckCircle2 className="h-3 w-3" />
                                                                    ) : <CloudUpload className="h-3 w-3" />}
                                                                    {(syncSuccess === dataset.id || syncedDatasets.includes(dataset.id)) ? 'Synced' : 'Load to BigQuery'}
                                                                </Button>

                                                                {(syncSuccess === dataset.id || syncedDatasets.includes(dataset.id)) && gcpConfig?.projectId && (
                                                                    <a
                                                                        href={`https://console.cloud.google.com/bigquery?p=${gcpConfig.projectId}&d=nimbus_edge&t=${dataset.id}&page=table`}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="text-[10px] text-indigo-600 hover:text-indigo-800 flex items-center gap-1 font-medium bg-white px-2 py-1 rounded border border-indigo-100 hover:border-indigo-300 transition-colors"
                                                                    >
                                                                        View in BQ <ExternalLink className="h-3 w-3" />
                                                                    </a>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}
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
