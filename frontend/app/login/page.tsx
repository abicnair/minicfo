'use client';
//inserted this comment to check something

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Github, Mail, Lock, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function LoginContent() {
    const searchParams = useSearchParams();
    const router = useRouter();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    // Check for Supabase redirect errors in URL (e.g. expired email links)
    const urlError = searchParams.get('error_description')
        ? decodeURIComponent(searchParams.get('error_description')!.replace(/\+/g, ' '))
        : null;

    const [error, setError] = useState<string | null>(urlError);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        console.log('--- LOGIN SUBMITTED ---');
        setLoading(true);
        setError(null);

        try {
            console.log('Attempting login for:', email);
            if (!supabase) {
                console.error('Supabase client is not initialized!');
            }
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                console.error('Login error details:', error);

                // Enhance "Email not confirmed" error to explain enterprise scanner issues
                if (error.message.toLowerCase().includes('email not confirmed')) {
                    setError('Email not confirmed. If you already clicked the link, your company\'s email security scanner may have consumed it. Please reply to your invite email for a manual activation.');
                } else {
                    setError(error.message);
                }

                setLoading(false);
            } else {
                console.log('Login successful, redirecting...');
                router.push('/');
                // In case navigation takes long, allow user to try again if needed
                setTimeout(() => setLoading(false), 5000);
            }
        } catch (err: any) {
            console.error('Unexpected login exception:', err);
            setError(err.message || 'An unexpected error occurred. Please try again.');
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4">
            <Card className="w-full max-w-md border-slate-200 shadow-xl overflow-hidden">
                <div className="h-2 bg-indigo-600 w-full" />
                <CardHeader className="space-y-1 text-center pt-8">
                    <CardTitle className="text-2xl font-bold tracking-tight text-slate-900">
                        Welcome Back, Analyst
                    </CardTitle>
                    <p className="text-slate-500 text-sm">
                        Enter your credentials to access the Mission Command
                    </p>
                </CardHeader>
                <CardContent className="p-8 space-y-6">
                    {error && (
                        <div className="p-3 bg-red-50 border border-red-100 rounded text-red-600 text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Work Email</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="name@nimbusedge.com"
                                    className="pl-10"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <Label htmlFor="password">Password</Label>
                                <a href="#" className="text-xs text-indigo-600 hover:underline">Forgot?</a>
                            </div>
                            <div className="relative">
                                <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                <Input
                                    id="password"
                                    type="password"
                                    className="pl-10"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                        </div>
                        <Button type="submit" className="w-full py-6 text-lg font-semibold" disabled={loading}>
                            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <>Login to Workbench <ArrowRight className="ml-2 h-5 w-5" /></>}
                        </Button>
                    </form>

                    <p className="text-center text-sm text-slate-500">
                        Don't have an account?{' '}
                        <Link href="/signup" className="text-indigo-600 font-semibold hover:underline">
                            Request Access
                        </Link>
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
            </div>
        }>
            <LoginContent />
        </Suspense>
    );
}
