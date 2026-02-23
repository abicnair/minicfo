'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, GraduationCap, Settings, User, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';

const tools = [
    {
        name: 'Dashboard',
        href: '/dashboard',
        icon: LayoutDashboard,
    },
    {
        name: 'Learn & Wiki',
        href: '/learn',
        icon: GraduationCap,
    },
    {
        name: 'Settings',
        href: '/settings',
        icon: Settings,
    },
];

export function Sidebar() {
    const pathname = usePathname();
    const { profile, user, signOut } = useAuth();

    const displayName = profile?.full_name || user?.email?.split('@')[0] || 'User';

    return (
        <div className="flex h-screen w-52 flex-col border-r border-slate-200 bg-white">
            <div className="flex h-16 items-center border-b border-slate-200 px-4">
                <Link href="/dashboard" className="flex items-center gap-2 font-bold text-indigo-600 hover:opacity-80 transition-opacity">
                    <div className="relative h-7 w-7 overflow-hidden rounded-lg shadow-sm">
                        <Image
                            src="/logo.png"
                            alt="CFO Ops Logo"
                            fill
                            unoptimized
                            className="object-cover"
                        />
                    </div>
                    <span className="text-lg tracking-tight">CFO Ops</span>
                </Link>
            </div>

            <nav className="flex-1 space-y-1 px-3 py-4">
                {tools.map((item) => {
                    const isActive = pathname.startsWith(item.href);
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                                isActive
                                    ? 'bg-indigo-50 text-indigo-700'
                                    : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                            )}
                        >
                            <item.icon className={cn('h-5 w-5', isActive ? 'text-indigo-600' : 'text-slate-400')} />
                            {item.name}
                        </Link>
                    );
                })}
            </nav>

            <div className="border-t border-slate-200 p-3">
                <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100">
                            <User className="h-4 w-4 text-slate-500" />
                        </div>
                        <div className="text-xs">
                            <p className="font-medium text-slate-700 truncate max-w-[90px]">
                                {displayName}
                            </p>
                            <p className="text-[10px] text-slate-500">Analyst</p>
                        </div>
                    </div>
                    <button
                        onClick={signOut}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Log out"
                    >
                        <LogOut className="h-4 w-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}
