'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    BarChart3,
    Bot,
    Briefcase,
    Home,
    Settings,
    ShieldCheck,
    Search,
    PlusCircle,
    Users
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
    { label: 'Find Work', icon: Search, href: '/marketplace' },
    { label: 'My Contracts', icon: Briefcase, href: '/contracts' },
    { label: 'Hire Freelancer', icon: Bot, href: '/chat' },
];

export function Sidebar() {
    const pathname = usePathname();

    return (
        <div className="w-64 h-screen border-r border-slate-200 bg-white flex flex-col fixed left-0 top-0 z-40 pt-20">
            <nav className="flex-1 px-4 space-y-1 mt-4">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                                isActive
                                    ? "bg-emerald-50 text-emerald-700 shadow-sm shadow-emerald-500/5"
                                    : "text-slate-500 hover:text-emerald-600 hover:bg-slate-50"
                            )}
                        >
                            <item.icon className={cn(
                                "w-5 h-5 transition-transform group-hover:scale-110",
                                isActive ? "text-emerald-600" : "text-slate-500"
                            )} />
                            <span className="font-bold text-sm tracking-tight">{item.label}</span>
                            {isActive && (
                                <div className="ml-auto w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                            )}
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 mt-auto">
                <button className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl text-sm font-bold transition-all shadow-lg shadow-emerald-500/20 active:scale-95 mb-4">
                    <PlusCircle className="w-4 h-4" />
                    Post a Job
                </button>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 italic">
                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-1">AI Agent Status</p>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                        <span className="text-[10px] font-medium text-slate-600">Idle / Monitoring Chain</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
