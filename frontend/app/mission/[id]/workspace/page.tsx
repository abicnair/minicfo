'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Database, Play, MessageSquare, Table, Send, CloudUpload, AlertCircle, CheckCircle2, Loader2, ExternalLink, RefreshCw, Copy, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { MissionTimer } from '@/components/ui/MissionTimer';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

const ChatMessage = ({ content, role }: { content: string, role: 'ai' | 'user' }) => {
    // Split by code blocks first
    const parts = content.split(/(```[\s\S]*?```)/g);

    return (
        <div className={cn(
            "p-3 rounded-lg text-sm break-words max-w-[85%] whitespace-pre-wrap leading-relaxed",
            role === 'ai' ? "bg-slate-100 rounded-tl-none text-slate-800" : "bg-indigo-600 text-white rounded-tr-none"
        )}>
            {parts.map((part, i) => {
                if (part.startsWith('```')) {
                    // Extract code and language if present
                    const lines = part.split('\n');
                    const code = lines.slice(1, -1).join('\n').trim();
                    return (
                        <pre key={i} className="my-2 p-3 bg-slate-900 text-indigo-100 rounded-md text-xs overflow-x-auto font-mono border border-slate-700 shadow-inner">
                            <code>{code}</code>
                        </pre>
                    );
                }

                // Handle bolding within the text parts
                const subparts = part.split(/(\*\*.*?\*\*)/g);
                return (
                    <span key={i}>
                        {subparts.map((sub, j) => {
                            if (sub.startsWith('**') && sub.endsWith('**')) {
                                return <strong key={j} className="font-bold text-slate-900">{sub.slice(2, -2)}</strong>;
                            }
                            return sub;
                        })}
                    </span>
                );
            })}
        </div>
    );
};

export default function SimulationPage({ params }: { params: Promise<{ id: string }> }) {
    const { id: missionId } = React.use(params);
    const { userMissions, markDatasetSynced, profile } = useAuth();
    const missionProgress = userMissions.find(m => m.mission_id === missionId);
    const syncedDatasets = missionProgress?.synced_datasets ?? [];

    const [activeTab, setActiveTab] = useState<'sql'>('sql');
    const [missionTitle, setMissionTitle] = useState('Loading...');
    const [unlockedDatasets, setUnlockedDatasets] = useState<any[]>([]);
    const [expandedTables, setExpandedTables] = useState<Record<string, boolean>>({});
    const [sqlQuery, setSqlQuery] = useState<string>(`SELECT c.Company_Name, SUM(b.Booking_Amount_USD) AS total_bookings
FROM \`nimbus_edge.bookings\` b
JOIN \`nimbus_edge.customer_dim\` c ON b.Customer_ID = c.Customer_ID
GROUP BY c.Company_Name 
ORDER BY total_bookings DESC
LIMIT 10`);
    const [results, setResults] = useState<any[]>([]);
    const [executing, setExecuting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [aiInput, setAiInput] = useState('');
    const [messages, setMessages] = useState<Array<{ role: 'ai' | 'user', content: string }>>([
        { role: 'ai', content: "Hello! I'm your AI Junior Analyst. I have access to your unlocked mission data. How can I help you today?" }
    ]);
    const [isThinking, setIsThinking] = useState(false);
    const [missionBriefing, setMissionBriefing] = useState<string>('');
    const [missionObjectives, setMissionObjectives] = useState<string[]>([]);

    const [loading, setLoading] = useState(true);
    const [bqTables, setBqTables] = useState<any[]>([]);
    const [bqLoading, setBqLoading] = useState(false);
    const [syncingTable, setSyncingTable] = useState<string | null>(null);
    const [syncSuccess, setSyncSuccess] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const scrollRef = React.useRef<HTMLDivElement>(null);
    const gcpConfig = profile?.gcp_config;

    const isGcpConfigured = !!(profile?.gcp_config?.projectId && profile?.gcp_config?.serviceAccountJson);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isThinking]);

    const fetchBqTables = async () => {
        if (!isGcpConfigured) return;
        setBqLoading(true);
        try {
            const response = await fetch('/api/list-tables');
            const data = await response.json();
            if (data.success) {
                setBqTables(data.tables || []);
            }
        } catch (err) {
            console.error('Error fetching BQ tables:', err);
        } finally {
            setBqLoading(false);
        }
    };

    useEffect(() => {
        if (isGcpConfigured) {
            fetchBqTables();
        }
    }, [isGcpConfigured, syncedDatasets]);

    useEffect(() => {
        const fetchMissionData = async () => {
            if (!missionId) return;
            setLoading(true);
            try {
                // Fetch mission title
                const { data: mission, error: mError } = await supabase
                    .from('missions')
                    .select('title, briefing_body, objectives(body)')
                    .eq('id', missionId)
                    .single();
                if (mError) throw mError;
                setMissionTitle(mission.title || 'Untitled Mission');
                setMissionBriefing(mission.briefing_body?.join(' ') || '');
                setMissionObjectives(mission.objectives?.map((o: any) => o.body) || []);

                // Fetch all datasets for the mission
                const { data: ds, error: dsError } = await supabase
                    .from('datasets')
                    .select('id, name, column_json')
                    .eq('mission_id', missionId);
                if (dsError) throw dsError;

                // Sync with unlocked status from missionProgress
                const unlockedIds = missionProgress?.unlocked_datasets || [];
                const filtered = (ds || []).filter(d => unlockedIds.includes(d.id));
                setUnlockedDatasets(filtered);

                // Expand the first one by default if not already expanded
                if (filtered.length > 0 && Object.keys(expandedTables).length === 0) {
                    setExpandedTables({ [filtered[0].id]: true });
                }
            } catch (err) {
                console.error('Error fetching workspace data:', err);
                setError('Failed to load mission data. Please check your connection.');
            } finally {
                setLoading(false);
            }
        };

        fetchMissionData();
    }, [missionId, missionProgress?.unlocked_datasets]);

    const toggleTable = (id: string) => {
        setExpandedTables(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const runQuery = async () => {
        if (!isGcpConfigured) {
            setError("BigQuery is not configured. Please use the 'Connect BigQuery' setup first.");
            return;
        }
        setExecuting(true);
        setError(null);
        setResults([]);
        try {
            const response = await fetch('/api/query', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sql: sqlQuery }),
            });

            const data = await response.json();
            if (!response.ok || data.error) {
                // Improve error message for common issues
                let msg = data.error || 'Failed to execute query';
                if (msg.includes('Not found: Table')) {
                    msg = `Table not found in BigQuery. Have you clicked 'Sync to BQ' for this dataset yet?\n\nError: ${msg}`;
                }
                setError(msg);
            } else {
                setResults(data.rows || []);
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setExecuting(false);
        }
    };

    const handleSync = async (tableId: string) => {
        setSyncingTable(tableId);
        setSyncSuccess(null);
        try {
            const response = await fetch('/api/sync-bigquery', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tableId }),
            });

            const data = await response.json();
            if (data.success) {
                // Persist state
                await markDatasetSynced(missionId, tableId);
                setSyncSuccess(tableId);
                fetchBqTables(); // Refresh table list
                setTimeout(() => setSyncSuccess(null), 3000);
            } else {
                setError(`Sync failed: ${data.error}`);
            }
        } catch (err: any) {
            setError(`Sync error: ${err.message}`);
        } finally {
            setSyncingTable(null);
        }
    };

    const handleAiSubmit = async () => {
        if (!aiInput.trim() || isThinking) return;

        const userMessage = aiInput.trim();
        setAiInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
        setIsThinking(true);

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: userMessage,
                    history: messages,
                    context: {
                        missionTitle,
                        briefing: missionBriefing,
                        objectives: missionObjectives,
                        schemas: unlockedDatasets.map(d => ({
                            name: d.name,
                            columns: d.column_json
                        }))
                    }
                }),
            });

            const data = await response.json();
            if (data.error) throw new Error(data.error);

            setMessages(prev => [...prev, { role: 'ai', content: data.message }]);
        } catch (err: any) {
            console.error('Chat Error:', err);
            setMessages(prev => [...prev, { role: 'ai', content: "Sorry, I'm having trouble connecting to my brain right now. Please try again." }]);
        } finally {
            setIsThinking(false);
        }
    };

    const copyToClipboard = () => {
        if (results.length === 0) return;

        const headers = Object.keys(results[0]);
        const rows = results.map(row => headers.map(h => row[h]).join('\t'));
        const tsv = [headers.join('\t'), ...rows].join('\n');

        navigator.clipboard.writeText(tsv).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };


    return (
        <div className="flex h-full flex-col">
            {/* Header */}
            <header className="flex h-14 items-center justify-between border-b border-slate-200 px-4 bg-white shrink-0">
                <div className="flex items-center gap-4">
                    <h1 className="text-lg font-semibold text-slate-800">{missionTitle}</h1>
                    <MissionTimer kickoffAt={missionProgress?.kickoff_at} />
                    <div className="flex items-center gap-2 px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full font-medium text-xs">
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                        Credits: {missionProgress?.credits ?? 0}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" onClick={runQuery} disabled={executing}>
                        {executing ? 'Running...' : <><Play className="h-3 w-3 mr-2" /> Run SQL</>}
                    </Button>

                    <Link href={`/mission/${missionId}/submit`}>
                        <Button size="sm">Submit Recommendations</Button>
                    </Link>
                </div>
            </header>

            {/* Main Content - Split Pane */}
            <div className="flex flex-1 overflow-hidden">

                {/* Left Pane: Schema / Assets */}
                <aside className="w-80 border-r border-slate-200 bg-slate-50 flex flex-col overflow-hidden">
                    <div className="p-4 border-b border-slate-200 bg-white">
                        <div className="flex items-center justify-between font-semibold text-slate-700">
                            <div className="flex items-center gap-2">
                                <Database className="h-4 w-4 text-indigo-600" />
                                <span>Data Room</span>
                            </div>
                            {isGcpConfigured && (
                                <button
                                    onClick={fetchBqTables}
                                    disabled={bqLoading}
                                    className="p-1 hover:bg-slate-100 rounded transition-colors"
                                    title="Refresh Tables"
                                >
                                    <RefreshCw className={cn("h-3 w-3 text-slate-400", bqLoading && "animate-spin")} />
                                </button>
                            )}
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-1">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center p-8 space-y-3">
                                <div className="h-5 w-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                                <span className="text-[10px] text-slate-400 font-medium">Loading Data...</span>
                            </div>
                        ) : unlockedDatasets.length === 0 ? (
                            <div className="p-4 text-xs text-slate-400 italic text-center">
                                No datasets unlocked.
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {!isGcpConfigured && (
                                    <div className="mx-2 p-3 bg-amber-50 border border-amber-200 rounded-lg space-y-2">
                                        <div className="flex items-start gap-2 text-amber-800 text-[10px] font-medium leading-tight">
                                            <AlertCircle className="h-3 w-3 shrink-0 mt-0.5 text-amber-500" />
                                            <span>BigQuery is not connected. You won't be able to run SQL queries.</span>
                                        </div>
                                        <Link href="/settings">
                                            <Button variant="outline" size="sm" className="w-full h-7 text-[10px] bg-white border-amber-200 text-amber-700 hover:bg-amber-100">
                                                Connect GCP
                                            </Button>
                                        </Link>
                                    </div>
                                )}
                                <div className="space-y-1 px-1">
                                    {unlockedDatasets.map(ds => {
                                        const isSynced = bqTables.some(t => t.id === ds.id) || syncedDatasets.includes(ds.id);

                                        return (
                                            <div key={ds.id} className="space-y-0.5">
                                                <div className="flex items-center gap-1">
                                                    <button
                                                        onClick={() => toggleTable(ds.id)}
                                                        className={cn(
                                                            "flex-1 flex items-center justify-between p-2 rounded-lg text-sm font-medium transition-colors hover:bg-slate-200",
                                                            expandedTables[ds.id] ? "bg-slate-200 text-slate-900" : "text-slate-600"
                                                        )}
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <Table className={cn("h-3.5 w-3.5", isSynced ? "text-indigo-500" : "text-slate-400")} />
                                                            <span className="truncate">{ds.name}</span>
                                                        </div>
                                                        <span className="text-[10px] text-slate-400 font-mono">
                                                            {expandedTables[ds.id] ? '−' : '+'}
                                                        </span>
                                                    </button>
                                                    {isGcpConfigured && (
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            className={cn(
                                                                "h-8 w-8 p-0 shrink-0",
                                                                (syncSuccess === ds.id || isSynced) ? "text-green-600" : "text-slate-400 hover:text-indigo-600"
                                                            )}
                                                            title={isSynced ? "Synced to BigQuery" : "Sync to BigQuery"}
                                                            disabled={syncingTable === ds.id}
                                                            onClick={() => handleSync(ds.id)}
                                                        >
                                                            {syncingTable === ds.id ? (
                                                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                            ) : (syncSuccess === ds.id || isSynced) ? (
                                                                <CheckCircle2 className="h-3.5 w-3.5" />
                                                            ) : (
                                                                <CloudUpload className="h-3.5 w-3.5" />
                                                            )}
                                                        </Button>
                                                    )}
                                                    {isSynced && gcpConfig?.projectId && (
                                                        <a
                                                            href={`https://console.cloud.google.com/bigquery?p=${gcpConfig.projectId}&d=nimbus_edge&t=${ds.id}&page=table`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="h-8 w-8 flex items-center justify-center text-indigo-400 hover:text-indigo-600 transition-colors"
                                                            title="View in BigQuery"
                                                        >
                                                            <ExternalLink className="h-3 w-3" />
                                                        </a>
                                                    )}
                                                </div>

                                                {expandedTables[ds.id] && ds.column_json && (
                                                    <div className="ml-4 pl-3 border-l-2 border-slate-200 py-1 space-y-1">
                                                        <div className="text-[9px] text-slate-400 uppercase font-bold mb-1 tracking-tight">
                                                            bigquery: `nimbus_edge.{ds.id}`
                                                        </div>
                                                        {ds.column_json.map((col: any) => (
                                                            <div key={col.name} className="flex flex-col py-1">
                                                                <div className="flex items-center justify-between text-[11px]">
                                                                    <span className="font-mono text-slate-700 font-bold">{col.name}</span>
                                                                    <span className="text-[9px] text-slate-400 uppercase font-mono">{col.type}</span>
                                                                </div>
                                                                <div className="text-[10px] text-slate-400 leading-tight">
                                                                    {col.desc}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}

                                    {/* Additional tables in BQ that are NOT in unlockedDatasets */}
                                    {bqTables.filter(t => !unlockedDatasets.some(ds => ds.id === t.id)).length > 0 && (
                                        <div className="mt-4 space-y-2">
                                            <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                                Additional Tables
                                            </div>
                                            {bqTables.filter(t => !unlockedDatasets.some(ds => ds.id === t.id)).map(table => (
                                                <div key={table.id} className="px-2">
                                                    <div className="flex items-center justify-between p-2 rounded-lg text-sm font-medium bg-slate-100 text-slate-600 border border-slate-200">
                                                        <div className="flex items-center gap-2">
                                                            <Table className="h-3.5 w-3.5 text-slate-400" />
                                                            <span className="truncate">{table.id}</span>
                                                        </div>
                                                        <a
                                                            href={`https://console.cloud.google.com/bigquery?p=${gcpConfig?.projectId}&d=nimbus_edge&t=${table.id}&page=table`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-slate-400 hover:text-indigo-600"
                                                        >
                                                            <ExternalLink className="h-3 w-3" />
                                                        </a>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </aside>

                {/* Center Pane: Workbench */}
                <section className="flex-1 flex flex-col min-w-0 bg-white">
                    {/* Workbench Tabs */}
                    <div className="flex border-b border-slate-200">
                        <button
                            onClick={() => setActiveTab('sql')}
                            className={cn("px-4 py-2 text-sm font-medium border-b-2", activeTab === 'sql' ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-600 hover:text-slate-800")}
                        >
                            <div className="flex items-center gap-2">
                                <Database className="h-4 w-4" /> SQL Editor
                            </div>
                        </button>

                    </div>

                    {/* Content Area */}
                    <div className="flex-1 p-4 bg-slate-50/50 flex flex-col gap-4 overflow-hidden">
                        <>
                            <div className="h-1/2 rounded-lg border border-slate-300 bg-white shadow-sm overflow-hidden flex flex-col relative group">
                                <textarea
                                    value={sqlQuery}
                                    onChange={(e) => setSqlQuery(e.target.value)}
                                    onKeyDown={(e) => {
                                        if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                                            runQuery();
                                        }
                                    }}
                                    className="flex-1 w-full p-4 font-mono text-sm resize-none focus:outline-none"
                                    spellCheck={false}
                                    placeholder="Enter your SQL query here..."
                                />
                                <div className="absolute bottom-4 right-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                    <div className="flex items-center gap-1 text-[10px] text-slate-400 font-mono bg-slate-50 px-2 py-1 rounded border border-slate-200">
                                        <span>Cmd</span>
                                        <span>+</span>
                                        <span>Enter</span>
                                    </div>
                                    <Button
                                        size="sm"
                                        onClick={runQuery}
                                        disabled={executing}
                                        className="shadow-lg h-9 pointer-events-auto"
                                    >
                                        {executing ? 'Running...' : <><Play className="h-3 w-3 mr-2" /> Run Query</>}
                                    </Button>
                                </div>
                            </div>
                            <div className="h-1/2 rounded-lg border border-slate-200 bg-white shadow-sm flex flex-col overflow-auto relative">
                                {results.length > 0 && !error && (
                                    <div className="sticky top-0 right-0 z-10 p-2 flex justify-end pointer-events-none">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={copyToClipboard}
                                            className="bg-white/80 backdrop-blur-sm shadow-sm h-8 pointer-events-auto"
                                            title="Copy as TSV (Spreadsheet friendly)"
                                        >
                                            {copied ? (
                                                <><Check className="h-3 w-3 mr-2 text-green-600" /> Copied!</>
                                            ) : (
                                                <><Copy className="h-3 w-3 mr-2 text-slate-500" /> Copy Results</>
                                            )}
                                        </Button>
                                    </div>
                                )}
                                {error ? (
                                    <div className="p-4 text-red-600 text-sm font-mono whitespace-pre-wrap flex items-start gap-2">
                                        <span className="shrink-0 mt-1">❌</span>
                                        {error}
                                    </div>
                                ) : results.length > 0 ? (
                                    <table className="w-full text-left text-xs border-collapse">
                                        <thead className="bg-slate-50 sticky top-0 border-b border-slate-200">
                                            <tr>
                                                {Object.keys(results[0]).map(key => (
                                                    <th key={key} className="px-4 py-2 font-semibold text-slate-600 uppercase tracking-wider">{key}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {results.map((row, i) => (
                                                <tr key={i} className="hover:bg-slate-50/50">
                                                    {Object.values(row).map((val: any, j) => (
                                                        <td key={j} className="px-4 py-2 text-slate-700">
                                                            {typeof val === 'object' && val !== null ? JSON.stringify(val) : String(val)}
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                ) : (
                                    <div className="flex-1 flex items-center justify-center text-slate-400 text-sm italic">
                                        {executing ? 'Executing query...' : 'Run a query to see results'}
                                    </div>
                                )}
                            </div>
                        </>

                    </div>
                </section>

                {/* Right Pane: AI Copilot */}
                <aside className="w-80 border-l border-slate-200 bg-white flex flex-col">
                    <div className="p-4 border-b border-slate-200 bg-indigo-50/50">
                        <h2 className="font-semibold text-indigo-900 flex items-center gap-2">
                            <MessageSquare className="h-4 w-4" /> AI Junior Analyst
                        </h2>
                        <p className="text-xs text-indigo-700 mt-1">
                            Ready to help! Ask me to write SQL or explain the data.
                        </p>
                    </div>

                    <div
                        ref={scrollRef}
                        className="flex-1 p-4 overflow-y-auto space-y-4 scroll-smooth"
                    >
                        {messages.map((msg, i) => (
                            <div key={i} className={cn("flex gap-3", msg.role === 'user' ? "flex-row-reverse" : "")}>
                                <div className={cn(
                                    "h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
                                    msg.role === 'ai' ? "bg-indigo-100 text-indigo-600" : "bg-slate-200 text-slate-600"
                                )}>
                                    {msg.role === 'ai' ? 'AI' : 'U'}
                                </div>
                                <ChatMessage content={msg.content} role={msg.role} />
                            </div>
                        ))}
                        {isThinking && (
                            <div className="flex gap-3 animate-pulse">
                                <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-600 shrink-0">AI</div>
                                <div className="bg-slate-100 p-3 rounded-lg rounded-tl-none text-sm text-slate-400">
                                    Analyzing data...
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="p-4 border-t border-slate-200">
                        <div className="flex gap-2">
                            <input
                                value={aiInput}
                                onChange={(e) => setAiInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        handleAiSubmit();
                                    }
                                }}
                                className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-sm"
                                placeholder="Ask a question..."
                            />
                            <Button
                                size="sm"
                                onClick={handleAiSubmit}
                                disabled={!aiInput.trim()}
                                className="px-3 shrink-0"
                            >
                                <Send className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </aside>

            </div>
        </div>
    );
}
