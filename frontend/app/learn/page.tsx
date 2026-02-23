'use client';

import React from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import {
    Search,
    BarChart3,
    MessageSquare,
    LineChart,
    BrainCircuit,
    PieChart,
    FileText,
    ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

const categories = [
    {
        title: 'Analysis',
        description: 'Master BigQuery SQL patterns, root cause analysis frameworks, and anomaly detection.',
        icon: BarChart3,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
    },
    {
        title: 'Communication',
        description: 'How to write executive summaries, build board decks, and narrate financial variance.',
        icon: MessageSquare,
        color: 'text-purple-600',
        bgColor: 'bg-purple-50',
    },
    {
        title: 'Benchmarks',
        description: 'Industry-standard KPIs, Bessemer scales, and performance markers for B2B SaaS.',
        icon: LineChart,
        color: 'text-amber-600',
        bgColor: 'bg-amber-50',
    },
    {
        title: 'Decision Intelligence',
        description: 'Unit economics, growth vs. efficiency trade-offs, and strategic scenario planning.',
        icon: BrainCircuit,
        color: 'text-emerald-600',
        bgColor: 'bg-emerald-50',
    },
    {
        title: 'Metrics',
        description: 'Deep dives into NRR, LTV/CAC, and the subtle nuances of revenue recognition.',
        icon: PieChart,
        color: 'text-rose-600',
        bgColor: 'bg-rose-50',
    },
    {
        title: 'Whitepapers',
        description: 'Long-form strategic research and deep dives into the modern finance stack.',
        icon: FileText,
        color: 'text-indigo-600',
        bgColor: 'bg-indigo-50',
    },
];

export default function LearnPage() {
    return (
        <div className="flex h-screen bg-slate-50">
            <Sidebar />
            <main className="flex-1 overflow-y-auto p-8">
                <header className="mb-12 max-w-4xl">
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">Knowledge Base</h1>
                    <p className="text-slate-500 text-lg">
                        The Strategic Finance Playbook. Master the art and science of CFO Operations.
                    </p>

                    <div className="mt-8 relative max-w-2xl">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-slate-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search for metrics, SQL templates, or playbooks..."
                            className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all sm:text-sm"
                        />
                    </div>
                </header>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {categories.map((category) => (
                        <Card
                            key={category.title}
                            className="group hover:shadow-lg transition-all border-slate-200 hover:border-indigo-200 cursor-pointer overflow-hidden"
                        >
                            <CardHeader className="pb-2">
                                <div className={`${category.bgColor} ${category.color} w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                                    <category.icon className="h-6 w-6" />
                                </div>
                                <CardTitle className="text-xl group-hover:text-indigo-600 transition-colors">
                                    {category.title}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-slate-500 text-sm leading-relaxed mb-6">
                                    {category.description}
                                </p>
                                <Button
                                    variant="ghost"
                                    className="p-0 h-auto font-semibold text-indigo-600 group-hover:translate-x-1 transition-transform"
                                >
                                    Explore Library <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <footer className="mt-16 pt-8 border-t border-slate-200 flex items-center justify-between text-slate-400 text-sm">
                    <p>© 2026 CFO Ops. All Rights Reserved.</p>
                    <div className="flex gap-6">
                        <a href="#" className="hover:text-slate-600 transition-colors">Updates</a>
                        <a href="#" className="hover:text-slate-600 transition-colors">Contributions</a>
                        <a href="#" className="hover:text-slate-600 transition-colors">Archive</a>
                    </div>
                </footer>
            </main>
        </div>
    );
}
