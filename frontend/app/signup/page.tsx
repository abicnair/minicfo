'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { User, Mail, Lock, ArrowRight, Loader2, CheckCircle } from 'lucide-react';
import Link from 'next/link';

export default function SignupPage() {
    const [email, setEmail] = useState('');
    const [fullName, setFullName] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            console.log('Attempting signup for:', email);
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: fullName,
                    },
                },
            });

            if (error) {
                console.error('Signup error details:', error);
                setError(error.message);
                setLoading(false);
            } else {
                console.log('Signup successful, success state triggered.');
                setSuccess(true);
                setLoading(false);
            }
        } catch (err: any) {
            console.error('Unexpected signup exception:', err);
            setError(err.message || 'An unexpected error occurred. Please try again.');
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4">
                <Card className="w-full max-w-md border-slate-200 shadow-xl p-8 text-center space-y-6">
                    <div className="mx-auto w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                        <CheckCircle className="h-10 w-10" />
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-2xl font-bold text-slate-900">Access Requested</h2>
                        <p className="text-slate-500">
                            Verification email sent to <strong>{email}</strong>. Please check your inbox to activate your account.
                        </p>
                    </div>
                    <Link href="/login" className="block">
                        <Button className="w-full">Back to Login</Button>
                    </Link>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4">
            <Card className="w-full max-w-md border-slate-200 shadow-xl overflow-hidden">
                <div className="h-2 bg-indigo-600 w-full" />
                <CardHeader className="space-y-1 text-center pt-8">
                    <CardTitle className="text-2xl font-bold tracking-tight text-slate-900">
                        Join the Mission
                    </CardTitle>
                    <p className="text-slate-500 text-sm">
                        Create an account to start your carrier at Nimbus Edge
                    </p>
                </CardHeader>
                <CardContent className="p-8 space-y-6">
                    {error && (
                        <div className="p-3 bg-red-50 border border-red-100 rounded text-red-600 text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSignup} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="fullName">Full Name</Label>
                            <div className="relative">
                                <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                <Input
                                    id="fullName"
                                    placeholder="John Doe"
                                    className="pl-10"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    required
                                />
                            </div>
                        </div>
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
                            <Label htmlFor="password">Password</Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="Min 6 characters"
                                    className="pl-10"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    minLength={6}
                                />
                            </div>
                        </div>
                        <Button type="submit" className="w-full py-6 text-lg font-semibold" disabled={loading}>
                            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <>Request Mission Access <ArrowRight className="ml-2 h-5 w-5" /></>}
                        </Button>
                    </form>

                    <p className="text-center text-sm text-slate-500">
                        Already have access?{' '}
                        <Link href="/login" className="text-indigo-600 font-semibold hover:underline">
                            Login Here
                        </Link>
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
