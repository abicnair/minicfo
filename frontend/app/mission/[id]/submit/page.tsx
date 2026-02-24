'use client';

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/Button';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    FileCode2,
    TableProperties,
    Presentation,
    UploadCloud,
    CheckCircle2,
    X,
    ChevronLeft,
    Send,
    AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface UploadSlot {
    id: string;
    step: number;
    label: string;
    description: string;
    accept: string;
    acceptLabel: string;
    icon: React.ReactNode;
    color: string;
    borderColor: string;
    bgColor: string;
    iconBg: string;
}

const SLOTS: UploadSlot[] = [
    {
        id: 'sql',
        step: 1,
        label: 'SQL Script(s)',
        description:
            'Upload one or more SQL files containing your queries and analysis logic.',
        accept: '.sql,.txt',
        acceptLabel: '.sql, .txt',
        icon: <FileCode2 className="h-6 w-6" />,
        color: 'text-indigo-600',
        borderColor: 'border-indigo-200',
        bgColor: 'bg-indigo-50',
        iconBg: 'bg-indigo-100',
    },
    {
        id: 'spreadsheet',
        step: 2,
        label: 'Supporting Spreadsheet',
        description:
            'Upload your spreadsheet with supporting calculations and data analysis.',
        accept: '.csv,.xlsx,.xls,.numbers,.ods',
        acceptLabel: '.csv, .xlsx, .numbers',
        icon: <TableProperties className="h-6 w-6" />,
        color: 'text-emerald-600',
        borderColor: 'border-emerald-200',
        bgColor: 'bg-emerald-50',
        iconBg: 'bg-emerald-100',
    },
    {
        id: 'presentation',
        step: 3,
        label: 'CEO Presentation',
        description:
            'Upload your presentation walking through the analyses and final recommendation for the CEO.',
        accept: '.pdf,.pptx,.ppt,.key',
        acceptLabel: '.pdf, .pptx, .key',
        icon: <Presentation className="h-6 w-6" />,
        color: 'text-amber-600',
        borderColor: 'border-amber-200',
        bgColor: 'bg-amber-50',
        iconBg: 'bg-amber-100',
    },
];

function UploadCard({ slot, file, onFile, onRemove }: {
    slot: UploadSlot;
    file: File | null;
    onFile: (file: File) => void;
    onRemove: () => void;
}) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [dragging, setDragging] = useState(false);

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragging(false);
        const dropped = e.dataTransfer.files[0];
        if (dropped) onFile(dropped);
    };

    return (
        <div className={cn(
            'rounded-xl border-2 transition-all duration-200',
            file ? `border-solid ${slot.borderColor} ${slot.bgColor}` : 'border-dashed border-slate-200 bg-white hover:border-slate-300',
            dragging && `border-solid ${slot.borderColor} ${slot.bgColor} scale-[1.01] shadow-md`
        )}>
            <div className="p-6">
                {/* Step + Label */}
                <div className="flex items-start gap-4 mb-5">
                    <div className={cn(
                        'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
                        file ? slot.iconBg : 'bg-slate-100',
                        file ? slot.color : 'text-slate-400'
                    )}>
                        {slot.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <span className={cn(
                                'text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full',
                                file ? `${slot.iconBg} ${slot.color}` : 'bg-slate-100 text-slate-400'
                            )}>
                                Step {slot.step}
                            </span>
                        </div>
                        <h3 className="mt-1 text-base font-semibold text-slate-800">{slot.label}</h3>
                        <p className="text-sm text-slate-500 mt-0.5 leading-snug">{slot.description}</p>
                    </div>
                </div>

                {/* Drop Zone or File Attached */}
                {file ? (
                    <div className={cn(
                        'flex items-center justify-between gap-3 rounded-lg px-4 py-3',
                        slot.iconBg
                    )}>
                        <div className="flex items-center gap-2 min-w-0">
                            <CheckCircle2 className={cn('h-4 w-4 shrink-0', slot.color)} />
                            <span className="text-sm font-medium text-slate-700 truncate">{file.name}</span>
                            <span className="text-xs text-slate-400 shrink-0">
                                {(file.size / 1024).toFixed(0)} KB
                            </span>
                        </div>
                        <button
                            onClick={onRemove}
                            className="p-1 rounded-md hover:bg-white/60 text-slate-400 hover:text-slate-600 transition-colors shrink-0"
                            title="Remove file"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                ) : (
                    <div
                        className="rounded-lg border border-dashed border-slate-200 p-5 flex flex-col items-center gap-2 cursor-pointer hover:bg-slate-50 transition-colors"
                        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                        onDragLeave={() => setDragging(false)}
                        onDrop={handleDrop}
                        onClick={() => inputRef.current?.click()}
                    >
                        <UploadCloud className="h-7 w-7 text-slate-300" />
                        <div className="text-center">
                            <p className="text-sm font-medium text-slate-600">
                                Drop file here or <span className={cn('underline', slot.color)}>browse</span>
                            </p>
                            <p className="text-xs text-slate-400 mt-0.5">{slot.acceptLabel}</p>
                        </div>
                    </div>
                )}
                <input
                    ref={inputRef}
                    type="file"
                    accept={slot.accept}
                    className="hidden"
                    onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) onFile(f);
                    }}
                />
            </div>
        </div>
    );
}

export default function SubmitRecommendationsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id: missionId } = React.use(params);
    const router = useRouter();

    const [files, setFiles] = useState<Record<string, File | null>>({
        sql: null,
        spreadsheet: null,
        presentation: null,
    });
    const [submitted, setSubmitted] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const allUploaded = Object.values(files).every(Boolean);
    const anyUploaded = Object.values(files).some(Boolean);

    const handleSubmit = async () => {
        if (!allUploaded) return;
        setSubmitting(true);
        // Simulate submission
        await new Promise(r => setTimeout(r, 1800));
        setSubmitting(false);
        setSubmitted(true);
    };

    if (submitted) {
        return (
            <div className="h-full flex flex-col items-center justify-center gap-6 p-8 bg-slate-50">
                <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center">
                    <CheckCircle2 className="h-10 w-10 text-emerald-500" />
                </div>
                <div className="text-center max-w-sm">
                    <h2 className="text-2xl font-bold text-slate-800">Recommendation Submitted!</h2>
                    <p className="text-slate-500 mt-2">
                        Your SQL scripts, spreadsheet, and presentation have been submitted successfully. Good luck!
                    </p>
                </div>
                <Link href={`/mission/${missionId}/workspace`}>
                    <Button variant="outline">Back to Workspace</Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col overflow-hidden">
            {/* Header */}
            <header className="flex h-14 items-center justify-between border-b border-slate-200 px-6 bg-white shrink-0">
                <div className="flex items-center gap-3">
                    <Link
                        href={`/mission/${missionId}/workspace`}
                        className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors"
                    >
                        <ChevronLeft className="h-4 w-4" />
                        Back to Workspace
                    </Link>
                    <span className="text-slate-300">|</span>
                    <h1 className="text-base font-semibold text-slate-800">Submit Recommendations</h1>
                </div>
                <Button
                    onClick={handleSubmit}
                    disabled={!allUploaded || submitting}
                    className="gap-2"
                >
                    {submitting ? (
                        <>
                            <span className="h-3.5 w-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                            Submitting...
                        </>
                    ) : (
                        <>
                            <Send className="h-3.5 w-3.5" />
                            Submit
                        </>
                    )}
                </Button>
            </header>

            {/* Body */}
            <div className="flex-1 overflow-y-auto bg-slate-50 p-8">
                <div className="max-w-2xl mx-auto">
                    {/* Instructions */}
                    <div className="mb-8">
                        <h2 className="text-xl font-bold text-slate-800">Deliverables</h2>
                        <p className="text-slate-500 mt-1 text-sm">
                            Upload all three required files below before submitting your recommendation to the CEO.
                        </p>
                    </div>

                    {/* Upload Cards */}
                    <div className="space-y-4">
                        {SLOTS.map(slot => (
                            <UploadCard
                                key={slot.id}
                                slot={slot}
                                file={files[slot.id]}
                                onFile={(f) => setFiles(prev => ({ ...prev, [slot.id]: f }))}
                                onRemove={() => setFiles(prev => ({ ...prev, [slot.id]: null }))}
                            />
                        ))}
                    </div>

                    {/* Footer note */}
                    {anyUploaded && !allUploaded && (
                        <div className="mt-5 flex items-start gap-2 text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm">
                            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                            <span>Upload all 3 files to enable submission.</span>
                        </div>
                    )}

                    <div className="mt-8 flex justify-end">
                        <Button
                            onClick={handleSubmit}
                            disabled={!allUploaded || submitting}
                            className="gap-2 px-8"
                        >
                            {submitting ? (
                                <>
                                    <span className="h-3.5 w-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                    Submitting...
                                </>
                            ) : (
                                <>
                                    <Send className="h-3.5 w-3.5" />
                                    Submit Recommendations
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
