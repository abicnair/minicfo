'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { CheckCircle, Database } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';

interface GCPSetupProps {
    missionId?: string;
}

export default function GCPSetup({ missionId }: GCPSetupProps) {
    const { syncMissionProgress } = useAuth();
    const [connecting, setConnecting] = useState(false);
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

    const handleConnectAndContinue = async () => {
        setConnecting(true);
        try {
            // Kickoff Mission
            let activeMissionId = missionId;
            if (!activeMissionId) {
                // Try to find the first mission
                const { data: firstMission } = await supabase
                    .from('missions')
                    .select('id')
                    .limit(1)
                    .single();
                activeMissionId = firstMission?.id;
            }

            if (activeMissionId) {
                await syncMissionProgress(activeMissionId, true);
            }

            setStatus('success');
        } catch (err: any) {
            setStatus('error');
            console.error('Error starting mission:', err);
        } finally {
            setConnecting(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 p-6">
            <div className="space-y-2">
                <h1 className="text-3xl font-bold text-slate-900">Connect to Global CFO Lab Database</h1>
                <p className="text-slate-500">Your account will be connected to the central CFO Lab BigQuery dataset.</p>
            </div>

            <div className="grid grid-cols-1 gap-8">
                <Card className="border-slate-200">
                    <CardHeader>
                        <CardTitle className="text-xl flex items-center gap-2">
                            <Database className="h-6 w-6 text-indigo-600" />
                            Database Connection Ready
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl space-y-2">
                            <p className="text-sm font-medium text-indigo-900">
                                Global Dataset Access Enabled
                            </p>
                            <p className="text-xs text-indigo-700 leading-relaxed">
                                You no longer need to configure your own Google Cloud Project. We have securely connected your environment to the public `nimbus_edge` dataset on Google BigQuery.
                            </p>
                        </div>

                        {status === 'success' && (
                            <div className="p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3 text-green-700">
                                <CheckCircle className="h-5 w-5 shrink-0" />
                                <div className="text-sm">
                                    <strong>Ready!</strong> You are now connected and your mission has been initialized.
                                </div>
                            </div>
                        )}

                        <Button
                            onClick={handleConnectAndContinue}
                            disabled={connecting || status === 'success'}
                            className="w-full py-6 text-lg shadow-xl shadow-indigo-500/20"
                        >
                            {connecting ? 'Connecting...' : status === 'success' ? 'Connected' : 'Connect & Start Mission'}
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
