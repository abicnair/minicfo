'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { User, Settings as SettingsIcon, Database, LogOut, ChevronLeft, ShieldCheck, Key, BrainCircuit, AlertCircle, Link as LinkIcon, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import GCPSetup from '@/components/GCPSetup';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';

export default function SettingsPage() {
    const { user, profile, signOut } = useAuth();
    const [activeTab, setActiveTab] = useState<'profile' | 'gcp' | 'ai'>('profile');
    const [geminiKey, setGeminiKey] = useState(profile?.ai_config?.gemini_api_key || '');
    const [saving, setSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            <header className="h-16 border-b border-slate-200 bg-white flex items-center px-8 justify-between shrink-0 sticky top-0 z-10">
                <div className="flex items-center gap-4">
                    <Link href="/">
                        <Button variant="ghost" size="sm" className="gap-2 text-slate-500">
                            <ChevronLeft className="h-4 w-4" /> Dashboard
                        </Button>
                    </Link>
                    <div className="h-4 w-px bg-slate-200" />
                    <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                        <SettingsIcon className="h-5 w-5 text-indigo-600" /> User Settings
                    </h1>
                </div>
                <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-50 gap-2" onClick={signOut}>
                    <LogOut className="h-4 w-4" /> Sign Out
                </Button>
            </header>

            <main className="flex-1 max-w-6xl mx-auto w-full p-8 grid grid-cols-12 gap-8">
                {/* Sidebar Navigation */}
                <aside className="col-span-12 md:col-span-3 space-y-2">
                    <button
                        onClick={() => setActiveTab('profile')}
                        className={cn(
                            "w-full flex items-center gap-3 p-3 rounded-lg text-sm font-medium transition-all text-left",
                            activeTab === 'profile' ? "bg-white text-indigo-700 shadow-sm border border-slate-200" : "text-slate-500 hover:bg-slate-100"
                        )}
                    >
                        <User className="h-4 w-4" /> Personal Profile
                    </button>
                    <button
                        onClick={() => setActiveTab('gcp')}
                        className={cn(
                            "w-full flex items-center gap-3 p-3 rounded-lg text-sm font-medium transition-all text-left",
                            activeTab === 'gcp' ? "bg-white text-indigo-700 shadow-sm border border-slate-200" : "text-slate-500 hover:bg-slate-100"
                        )}
                    >
                        <Database className="h-4 w-4" /> Cloud Connection
                    </button>
                    <button
                        onClick={() => setActiveTab('ai')}
                        className={cn(
                            "w-full flex items-center gap-3 p-3 rounded-lg text-sm font-medium transition-all text-left",
                            activeTab === 'ai' ? "bg-white text-indigo-700 shadow-sm border border-slate-200" : "text-slate-500 hover:bg-slate-100"
                        )}
                    >
                        <BrainCircuit className="h-4 w-4" /> AI Analyst Settings
                    </button>
                    <div className="pt-4 border-t border-slate-200 mt-4">
                        <div className="p-3 rounded-lg bg-indigo-50 border border-indigo-100">
                            <p className="text-xs font-semibold text-indigo-900 flex items-center gap-1.5 mb-1">
                                <ShieldCheck className="h-3.5 w-3.5" /> Security Note
                            </p>
                            <p className="text-[10px] text-indigo-700 leading-normal">
                                Your GCP credentials are encrypted at rest and never shared with other users.
                            </p>
                        </div>
                    </div>
                </aside>

                {/* Content Area */}
                <div className="col-span-12 md:col-span-9">
                    {activeTab === 'profile' ? (
                        <div className="space-y-6">
                            <Card className="border-slate-200">
                                <CardHeader>
                                    <CardTitle>Profile Information</CardTitle>
                                    <CardDescription>Update your personal details and how you appear in the mission.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4 pt-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Full Name</Label>
                                            <Input disabled value={profile?.full_name || ''} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Email Address</Label>
                                            <Input disabled value={user?.email || ''} />
                                        </div>
                                    </div>
                                    <div className="pt-4 flex justify-end">
                                        <Button disabled variant="outline">Save Changes</Button>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-slate-200 border-l-4 border-l-amber-500">
                                <CardHeader>
                                    <CardTitle className="text-amber-800">Account Security</CardTitle>
                                    <CardDescription>Managed via Supabase Auth</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-slate-600">
                                        Passwords and multi-factor authentication are handled securely through our identity provider.
                                        Contact system admin if you need to reset your account.
                                    </p>
                                </CardContent>
                            </Card>
                        </div>
                    ) : activeTab === 'gcp' ? (
                        <div className="space-y-6">
                            <GCPSetup />
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <Card className="border-slate-200 bg-white shadow-sm overflow-hidden">
                                <CardHeader className="border-b border-slate-100 bg-slate-50/50">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                                            <BrainCircuit className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-xl">AI Analyst Setup</CardTitle>
                                            <CardDescription>Follow these steps to activate your AI Junior Analyst.</CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-0 divide-y divide-slate-100">
                                    {/* Step 1: API Key */}
                                    <div className="p-8 space-y-6 transition-all hover:bg-slate-50/30">
                                        <div className="flex items-center gap-3">
                                            <span className="flex items-center justify-center w-10 h-10 rounded-full bg-indigo-600 text-white font-bold text-lg shadow-inner">1</span>
                                            <h3 className="text-xl font-bold text-slate-900">Configure Gemini API Key</h3>
                                        </div>

                                        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-sm flex items-start gap-4" style={{ minHeight: '120px' }}>
                                            <div className="flex-1">
                                                <p className="text-sm text-slate-600 leading-relaxed mb-4">
                                                    Your Analyst requires a Gemini API key to process missions and generate SQL queries. This key stays private to your account.
                                                </p>
                                                <a
                                                    href="https://aistudio.google.com/app/apikey"
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-2 text-indigo-600 text-sm font-bold bg-indigo-50 px-4 py-2 rounded-lg hover:bg-indigo-100 transition-colors"
                                                >
                                                    Get a free API Key from Google AI Studio <Key className="h-3.5 w-3.5" />
                                                </a>
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <Label htmlFor="gemini-key" className="text-sm font-bold text-slate-700 ml-1">Paste your API Key</Label>
                                            <div className="flex gap-3">
                                                <Input
                                                    id="gemini-key"
                                                    type="password"
                                                    placeholder="Enter your Gemini API key..."
                                                    value={geminiKey}
                                                    onChange={(e) => setGeminiKey(e.target.value)}
                                                    className="font-mono flex-1 h-12 text-base px-4 rounded-xl border-slate-200 focus:border-indigo-500 focus:ring-indigo-500 shadow-sm"
                                                />
                                                <Button
                                                    onClick={async () => {
                                                        if (!user?.id) {
                                                            alert('Error: No User ID found. Please refresh the page.');
                                                            return;
                                                        }
                                                        setSaving(true);
                                                        setSaveStatus('idle');
                                                        try {
                                                            const { data, error } = await supabase
                                                                .from('profiles')
                                                                .update({
                                                                    ai_config: { gemini_api_key: geminiKey }
                                                                })
                                                                .eq('id', user.id)
                                                                .select();
                                                            if (error) throw error;
                                                            if (!data || data.length === 0) throw new Error('Update failed.');
                                                            setSaveStatus('success');
                                                        } catch (err: any) {
                                                            setSaveStatus('error');
                                                            alert(`Save Failed: ${err.message || 'Unknown error'}`);
                                                        } finally {
                                                            setSaving(false);
                                                        }
                                                    }}
                                                    disabled={saving}
                                                    className="h-12 px-8 font-bold shadow-lg shadow-indigo-500/20 bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all"
                                                >
                                                    {saving ? 'Saving...' : 'Save Key'}
                                                </Button>
                                            </div>
                                            {saveStatus === 'success' && <p className="text-sm text-green-600 font-bold mt-2 flex items-center gap-1.5"><ShieldCheck className="h-4 w-4" /> Key saved successfully</p>}
                                            {saveStatus === 'error' && <p className="text-sm text-red-600 font-bold mt-2 flex items-center gap-1.5"><AlertCircle className="h-4 w-4" /> Failed to save key</p>}
                                        </div>
                                    </div>

                                    {/* Step 2: Billing */}
                                    <div className="p-8 space-y-6 bg-amber-50/10 border-t border-amber-100">
                                        <div className="flex items-center gap-3">
                                            <span className="flex items-center justify-center w-10 h-10 rounded-full bg-amber-600 text-white font-bold text-lg shadow-inner">2</span>
                                            <h3 className="text-xl font-bold text-slate-900">Required: Set Up High-Quota Billing</h3>
                                        </div>

                                        <div className="space-y-4 max-w-2xl">
                                            <p className="text-lg text-slate-800 leading-relaxed font-semibold">
                                                To ensure the Analyst remains online during complex data tasks, you <span className="text-amber-700 underline decoration-amber-400 decoration-4 underline-offset-8">must enable billing</span> in your Google AI Studio project.
                                            </p>
                                            <p className="text-base text-slate-600 leading-relaxed">
                                                Free-tier accounts are strictly limited and will often fail or hang during long SQL generations or multi-step dataset analysis.
                                            </p>
                                            <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-lg">
                                                <p className="text-xs text-blue-700 flex items-center gap-2">
                                                    <AlertCircle className="h-3 w-3" />
                                                    Note: You will only be billed if you exceed Google's generous daily free-tier limits.
                                                </p>
                                            </div>
                                        </div>

                                        <a
                                            href="https://aistudio.google.com/app/plan_management"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="w-full h-16 text-lg font-bold border-2 border-indigo-200 text-indigo-700 hover:bg-indigo-50 hover:border-indigo-400 transition-all rounded-2xl shadow-sm bg-white hover:shadow-md flex items-center justify-center gap-3"
                                        >
                                            Complete Billing Setup in AI Studio <ArrowRight className="h-6 w-6 animate-pulse" />
                                        </a>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
