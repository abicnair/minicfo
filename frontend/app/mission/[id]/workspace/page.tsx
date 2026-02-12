'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Database, Play, MessageSquare, Table, FileSpreadsheet } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';

export default function SimulationPage({ params }: { params: { id: string } }) {
    const [activeTab, setActiveTab] = useState<'sql' | 'sheets'>('sql');
    const [missionTitle, setMissionTitle] = useState('Loading...');
    const [tables, setTables] = useState<string[]>([]);
    const [sqlQuery, setSqlQuery] = useState<string>(`SELECT c.Company_Name, SUM(b.Booking_Amount_USD) AS total_bookings
FROM \`nimbus_edge.bookings\` b
JOIN \`nimbus_edge.customer_dim\` c ON b.Customer_ID = c.Customer_ID
GROUP BY c.Company_Name 
ORDER BY total_bookings DESC
LIMIT 10`);
    const [results, setResults] = useState<any[]>([]);
    const [executing, setExecuting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [sheetUrl, setSheetUrl] = useState<string | null>(null);
    const [exporting, setExporting] = useState(false);

    useEffect(() => {
        // ... existing fetchData logic
    }, []);

    const runQuery = async () => {
        // ... existing runQuery logic
    };

    const exportToSheets = async () => {
        if (results.length === 0) return;
        setExporting(true);
        setError(null);
        try {
            const response = await fetch('/api/export-sheets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    data: results,
                    title: `Export: ${missionTitle}`
                }),
            });

            const data = await response.json();
            if (data.error) {
                setError(data.error);
            } else {
                setSheetUrl(data.spreadsheetUrl);
                setActiveTab('sheets');
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setExporting(false);
        }
    };

    return (
        <div className="flex h-full flex-col">
            {/* Header */}
            <header className="flex h-14 items-center justify-between border-b border-slate-200 px-4 bg-white">
                <div className="flex items-center gap-4">
                    <h1 className="text-lg font-semibold text-slate-800">{missionTitle}</h1>
                    <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-500">Day 1 of 30</span>
                </div>
                <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" onClick={runQuery} disabled={executing}>
                        {executing ? 'Running...' : <><Play className="h-3 w-3 mr-2" /> Run SQL</>}
                    </Button>
                    {results.length > 0 && (
                        <Button size="sm" variant="outline" className="bg-green-600 hover:bg-green-700 text-white border-green-700" onClick={exportToSheets} disabled={exporting}>
                            {exporting ? 'Exporting...' : <><FileSpreadsheet className="h-3 w-3 mr-2" /> Export to Sheets</>}
                        </Button>
                    )}
                    <Button size="sm">Submit Recommendations</Button>
                </div>
            </header>

            {/* Main Content - Split Pane */}
            <div className="flex flex-1 overflow-hidden">

                {/* Left Pane: Schema / Assets */}
                <aside className="w-64 border-r border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center gap-2 mb-4 font-semibold text-slate-700">
                        <Database className="h-4 w-4" /> Data Room
                    </div>
                    <div className="space-y-2">
                        {tables.map(table => (
                            <div key={table} className="flex items-center gap-2 p-2 rounded hover:bg-slate-200 cursor-pointer text-sm font-mono">
                                <Table className="h-4 w-4 text-slate-500" />
                                <span>{table}</span>
                            </div>
                        ))}
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
                        <button
                            onClick={() => setActiveTab('sheets')}
                            className={cn("px-4 py-2 text-sm font-medium border-b-2", activeTab === 'sheets' ? "border-green-600 text-green-700" : "border-transparent text-slate-600 hover:text-slate-800")}
                        >
                            <div className="flex items-center gap-2">
                                <FileSpreadsheet className="h-4 w-4" /> Google Sheets
                            </div>
                        </button>
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 p-4 bg-slate-50/50 flex flex-col gap-4 overflow-hidden">
                        {activeTab === 'sql' ? (
                            <>
                                <div className="h-1/2 rounded-lg border border-slate-300 bg-white shadow-sm overflow-hidden flex flex-col">
                                    <textarea
                                        value={sqlQuery}
                                        onChange={(e) => setSqlQuery(e.target.value)}
                                        className="flex-1 w-full p-4 font-mono text-sm resize-none focus:outline-none"
                                        spellCheck={false}
                                    />
                                </div>
                                <div className="h-1/2 rounded-lg border border-slate-200 bg-white shadow-sm flex flex-col overflow-auto">
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
                        ) : (
                            <div className="h-full rounded-lg border border-slate-200 bg-white shadow-sm flex items-center justify-center text-slate-400">
                                <iframe className="w-full h-full" src="https://docs.google.com/spreadsheets/d/1BxiMvs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit?usp=sharing&rm=demo" />
                            </div>
                        )}
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

                    <div className="flex-1 p-4 overflow-y-auto space-y-4">
                        <div className="flex gap-3">
                            <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-600">AI</div>
                            <div className="bg-slate-100 p-3 rounded-lg rounded-tl-none text-sm text-slate-800">
                                Hello! I see we're looking into the NRR decline. Shall I pull up the latest booking trends by segment?
                            </div>
                        </div>
                    </div>

                    <div className="p-4 border-t border-slate-200">
                        <input
                            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            placeholder="Ask a question..."
                        />
                    </div>
                </aside>

            </div>
        </div>
    );
}
