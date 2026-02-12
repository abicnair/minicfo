'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { ExternalLink, CheckCircle, ChevronRight, Key, Database, RefreshCw, Terminal, Copy } from 'lucide-react';
import { AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function GCPSetup() {
    const [step, setStep] = useState(1);
    const [projectId, setProjectId] = useState('');
    const [serviceAccountJson, setServiceAccountJson] = useState('');
    const [testing, setTesting] = useState(false);
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');

    const testConnection = async () => {
        setTesting(true);
        setStatus('idle');
        try {
            const response = await fetch('/api/setup/test-connection', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ projectId, serviceAccountJson }),
            });
            const data = await response.json();
            if (data.success) {
                // Save to Supabase Profile
                const { error: updateError } = await supabase
                    .from('profiles')
                    .update({
                        gcp_config: {
                            projectId,
                            serviceAccountJson: JSON.parse(serviceAccountJson)
                        }
                    })
                    .eq('id', (await supabase.auth.getUser()).data.user?.id);

                if (updateError) throw updateError;

                setStatus('success');
            } else {
                setStatus('error');
                setErrorMessage(data.error || 'Connection failed');
            }
        } catch (err: any) {
            setStatus('error');
            setErrorMessage(err.message);
        } finally {
            setTesting(false);
        }
    };

    const nextStep = () => setStep(s => Math.min(s + 1, 5));
    const prevStep = () => setStep(s => Math.max(s - 1, 1));

    return (
        <div className="max-w-4xl mx-auto space-y-8 p-6">
            <div className="space-y-2">
                <h1 className="text-3xl font-bold text-slate-900">Connect Google Cloud</h1>
                <p className="text-slate-500">Follow these steps to set up BigQuery and Google Sheets for your Mission Workbench.</p>
            </div>

            <div className="grid grid-cols-12 gap-8">
                {/* Stepper Sidebar */}
                <div className="col-span-12 md:col-span-4 space-y-4">
                    {[
                        { num: 1, label: 'Create GCP Project' },
                        { num: 2, label: 'Enable APIs' },
                        { num: 3, label: 'Service Account' },
                        { num: 4, label: 'Generate JSON Key' },
                        { num: 5, label: 'Verify Connection' },
                    ].map((s) => (
                        <div
                            key={s.num}
                            className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${step === s.num ? 'bg-indigo-50 text-indigo-700 shadow-sm border border-indigo-100' : 'text-slate-500'
                                }`}
                        >
                            <div className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold border ${step === s.num ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white border-slate-200'
                                }`}>
                                {s.num < step ? <CheckCircle className="h-4 w-4" /> : s.num}
                            </div>
                            <span className="text-sm font-medium">{s.label}</span>
                        </div>
                    ))}
                </div>

                {/* Content Area */}
                <Card className="col-span-12 md:col-span-8 border-slate-200">
                    <CardHeader>
                        <CardTitle className="text-xl">
                            {step === 1 && "Step 1: Create a Google Cloud Project"}
                            {step === 2 && "Step 2: Enable BigQuery & Sheets APIs"}
                            {step === 3 && "Step 3: Create a Service Account"}
                            {step === 4 && "Step 4: Generate a JSON Key"}
                            {step === 5 && "Step 5: Connect and Verify"}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {step === 1 && (
                            <div className="space-y-4">
                                <p className="text-slate-600 text-sm leading-relaxed">
                                    Go to the <strong>Google Cloud Console</strong> and create a new project. This will be the host for your BigQuery data warehouse.
                                </p>
                                <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg flex items-start gap-3">
                                    <ExternalLink className="h-5 w-5 text-indigo-500 shrink-0 mt-0.5" />
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium text-slate-800">GCP Console</p>
                                        <a href="https://console.cloud.google.com/projectcreate" target="_blank" rel="noopener noreferrer" className="text-sm text-indigo-600 hover:underline">
                                            console.cloud.google.com/projectcreate
                                        </a>
                                    </div>
                                </div>
                                <div className="space-y-2 pt-4">
                                    <Label htmlFor="projectId" className="text-slate-700">Project ID</Label>
                                    <Input
                                        id="projectId"
                                        placeholder="e.g. minicfo-analytics-4029"
                                        value={projectId}
                                        onChange={(e) => setProjectId(e.target.value)}
                                        className="font-mono text-sm"
                                    />
                                    <p className="text-xs text-slate-400">You can find this on your GCP Dashboard.</p>
                                </div>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="space-y-4">
                                <p className="text-slate-600 text-sm">
                                    We need to enable the specific APIs that allowed the app to run SQL queries and export to spreadsheets.
                                </p>
                                <div className="space-y-3">
                                    <div className="p-3 border border-slate-200 rounded-lg flex items-center justify-between hover:bg-slate-50 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-indigo-50 rounded text-indigo-600"><Database className="h-4 w-4" /></div>
                                            <span className="text-sm font-medium text-slate-700">BigQuery API</span>
                                        </div>
                                        <a href="https://console.cloud.google.com/apis/library/bigquery.googleapis.com" target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-600 flex items-center gap-1 hover:underline">
                                            Enable <ExternalLink className="h-3 w-3" />
                                        </a>
                                    </div>
                                    <div className="p-3 border border-slate-200 rounded-lg flex items-center justify-between hover:bg-slate-50 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-green-50 rounded text-green-600"><RefreshCw className="h-4 w-4" /></div>
                                            <span className="text-sm font-medium text-slate-700">Google Sheets API</span>
                                        </div>
                                        <a href="https://console.cloud.google.com/apis/library/sheets.googleapis.com" target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-600 flex items-center gap-1 hover:underline">
                                            Enable <ExternalLink className="h-3 w-3" />
                                        </a>
                                    </div>
                                </div>
                            </div>
                        )}

                        {step === 3 && (
                            <div className="space-y-4 text-sm text-slate-600 leading-relaxed">
                                <p>A Service Account is like a special user account that the app uses to access BigQuery on your behalf.</p>
                                <ol className="list-decimal list-inside space-y-3">
                                    <li>Navigate to <strong>IAM & Admin &gt; Service Accounts</strong>.</li>
                                    <li>Click <strong>+ Create Service Account</strong>.</li>
                                    <li>Enter a name like <code>minicfo-analyst</code>.</li>
                                    <li>Grant this account the following roles:
                                        <div className="mt-2 flex flex-wrap gap-2">
                                            <span className="px-2 py-1 bg-slate-100 border border-slate-200 rounded text-xs font-mono text-slate-700">BigQuery Admin</span>
                                            <span className="px-2 py-1 bg-slate-100 border border-slate-200 rounded text-xs font-mono text-slate-700">Editor</span>
                                        </div>
                                    </li>
                                </ol>
                            </div>
                        )}

                        {step === 4 && (
                            <div className="space-y-4">
                                <p className="text-slate-600 text-sm">
                                    Now we need to download the secret key for that service account so the app can authenticate.
                                </p>
                                <ul className="list-disc list-inside space-y-2 text-sm text-slate-600">
                                    <li>Go to the **Service Accounts** list.</li>
                                    <li>Click on the service account you just created.</li>
                                    <li>Navigate to the **Keys** tab.</li>
                                    <li>Click **Add Key &gt; Create New Key**, select **JSON**, and click **Create**.</li>
                                </ul>
                                <div className="space-y-2 pt-4">
                                    <Label htmlFor="json" className="text-slate-700">Paste Service Account JSON</Label>
                                    <textarea
                                        id="json"
                                        placeholder='{ "type": "service_account", ... }'
                                        value={serviceAccountJson}
                                        onChange={(e) => setServiceAccountJson(e.target.value)}
                                        className="w-full h-32 p-3 font-mono text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-slate-50"
                                    />
                                </div>
                            </div>
                        )}

                        {step === 5 && (
                            <div className="space-y-6">
                                <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-xl space-y-2">
                                    <p className="text-sm font-medium text-indigo-900 flex items-center gap-2">
                                        <RefreshCw className="h-4 w-4" /> Ready to Verify
                                    </p>
                                    <p className="text-xs text-indigo-700">
                                        We will test the connection by creating a temporary dataset in your BigQuery project.
                                    </p>
                                </div>

                                {status === 'success' && (
                                    <div className="p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3 text-green-700">
                                        <CheckCircle className="h-5 w-5 shrink-0" />
                                        <div className="text-sm">
                                            <strong>Connection Successful!</strong> Your mission workbench is now connected to BigQuery.
                                        </div>
                                    </div>
                                )}

                                {status === 'error' && (
                                    <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 text-red-700">
                                        <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                                        <div className="text-sm">
                                            <strong>Connection Failed:</strong>
                                            <p className="mt-1 font-mono text-xs">{errorMessage}</p>
                                        </div>
                                    </div>
                                )}

                                <Button
                                    onClick={testConnection}
                                    disabled={!projectId || !serviceAccountJson || testing}
                                    className="w-full py-6 text-lg shadow-xl shadow-indigo-500/20"
                                >
                                    {testing ? 'Verifying...' : 'Finish Setup & Test Connection'}
                                </Button>
                            </div>
                        )}

                        {/* Navigation */}
                        <div className="flex justify-between pt-6 border-t border-slate-100">
                            <Button
                                variant="outline"
                                onClick={prevStep}
                                disabled={step === 1}
                                className="px-6"
                            >
                                Back
                            </Button>
                            {step < 5 && (
                                <Button
                                    onClick={nextStep}
                                    disabled={step === 1 && !projectId}
                                    className="px-6 gap-2"
                                >
                                    Continue <ChevronRight className="h-4 w-4" />
                                </Button>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
