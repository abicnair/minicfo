'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { User, Settings as SettingsIcon, Database, LogOut, ChevronLeft, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import GCPSetup from '@/components/GCPSetup';
import { cn } from '@/lib/utils';

export default function SettingsPage() {
    const { user, profile, signOut } = useAuth();
    const [activeTab, setActiveTab] = useState<'profile' | 'gcp'>('profile');

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
                    ) : (
                        <div className="space-y-6">
                            <GCPSetup />
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
