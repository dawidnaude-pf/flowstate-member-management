'use client';

import { useState } from 'react';
import {
    Zap,
    Bell,
    Mail,
    MessageSquare,
    Calendar,
    Clock,
    Users,
    AlertTriangle,
    Gift,
    TrendingDown,
    Check,
    Play,
    Pause,
    Settings,
} from 'lucide-react';

interface Automation {
    id: string;
    name: string;
    description: string;
    trigger: string;
    action: string;
    isActive: boolean;
    lastRun?: string;
    runCount: number;
    icon: any;
}

const DEFAULT_AUTOMATIONS: Automation[] = [
    {
        id: 'payment-reminder',
        name: 'Payment Reminder',
        description: 'Send SMS/email reminder 3 days before payment due',
        trigger: '3 days before payment',
        action: 'Send SMS + Email',
        isActive: true,
        lastRun: '2 hours ago',
        runCount: 45,
        icon: Bell,
    },
    {
        id: 'overdue-followup',
        name: 'Overdue Payment Follow-up',
        description: 'Escalating reminders for overdue payments (1, 3, 7 days)',
        trigger: 'Payment overdue',
        action: 'Send reminder sequence',
        isActive: true,
        lastRun: 'Yesterday',
        runCount: 12,
        icon: AlertTriangle,
    },
    {
        id: 'inactive-outreach',
        name: 'Inactive Member Outreach',
        description: 'Reach out to members who haven\'t attended in 14+ days',
        trigger: '14 days no check-in',
        action: 'Send "We miss you" email',
        isActive: true,
        lastRun: '3 days ago',
        runCount: 28,
        icon: TrendingDown,
    },
    {
        id: 'birthday-wishes',
        name: 'Birthday Wishes',
        description: 'Send personalized birthday message with special offer',
        trigger: 'Member birthday',
        action: 'Send birthday email',
        isActive: true,
        lastRun: 'Last week',
        runCount: 8,
        icon: Gift,
    },
    {
        id: 'attendance-milestone',
        name: 'Attendance Milestones',
        description: 'Celebrate when members hit 50, 100, 200+ classes',
        trigger: 'Milestone reached',
        action: 'Send congratulations',
        isActive: false,
        runCount: 15,
        icon: Calendar,
    },
    {
        id: 'trial-conversion',
        name: 'Trial Conversion',
        description: 'Follow up with trial members after their first class',
        trigger: 'Trial check-in',
        action: 'Send welcome sequence',
        isActive: true,
        lastRun: 'Today',
        runCount: 32,
        icon: Users,
    },
];

export default function AutomationsClient() {
    const [automations, setAutomations] = useState(DEFAULT_AUTOMATIONS);

    const toggleAutomation = (id: string) => {
        setAutomations(prev =>
            prev.map(a => {
                if (a.id === id) {
                    return { ...a, isActive: !a.isActive };
                }
                return a;
            })
        );
    };

    const activeCount = automations.filter(a => a.isActive).length;
    const totalRuns = automations.reduce((sum, a) => sum + a.runCount, 0);

    return (
        <div className="p-4 lg:p-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
                <div>
                    <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">Automations</h1>
                    <p className="text-slate-500 mt-1">Automated workflows to save admin time</p>
                </div>
                <div className="flex gap-3 mt-4 md:mt-0">
                    <div className="px-4 py-2 bg-green-100 text-green-700 rounded-xl text-sm font-medium">
                        {activeCount} Active
                    </div>
                    <div className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-sm font-medium">
                        {totalRuns} Total Runs
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-blue-100 text-sm">Hours Saved (Est.)</p>
                            <p className="text-3xl font-bold mt-1">12.5</p>
                            <p className="text-blue-100 text-sm mt-1">This month</p>
                        </div>
                        <Clock className="w-12 h-12 text-blue-300" />
                    </div>
                </div>
                <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-green-100 text-sm">Messages Sent</p>
                            <p className="text-3xl font-bold mt-1">{totalRuns}</p>
                            <p className="text-green-100 text-sm mt-1">Automated contacts</p>
                        </div>
                        <MessageSquare className="w-12 h-12 text-green-300" />
                    </div>
                </div>
                <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-purple-100 text-sm">Payment Recovery</p>
                            <p className="text-3xl font-bold mt-1">$1,240</p>
                            <p className="text-purple-100 text-sm mt-1">From reminders</p>
                        </div>
                        <Zap className="w-12 h-12 text-purple-300" />
                    </div>
                </div>
            </div>

            {/* Automations Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {automations.map((automation) => (
                    <div
                        key={automation.id}
                        className={`bg-white rounded-2xl p-6 shadow-sm border transition-all ${automation.isActive ? 'border-green-200' : 'border-slate-100 opacity-60'
                            }`}
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center">
                                <div className={`p-3 rounded-xl ${automation.isActive ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-400'
                                    }`}>
                                    <automation.icon className="w-6 h-6" />
                                </div>
                                <div className="ml-4">
                                    <h3 className="font-bold text-slate-900">{automation.name}</h3>
                                    <p className="text-sm text-slate-500">{automation.description}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => toggleAutomation(automation.id)}
                                className={`p-2 rounded-lg transition-colors ${automation.isActive
                                        ? 'bg-green-100 text-green-600 hover:bg-green-200'
                                        : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                                    }`}
                            >
                                {automation.isActive ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                            </button>
                        </div>

                        <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center text-slate-500">
                                <Clock className="w-4 h-4 mr-1" />
                                {automation.lastRun || 'Never run'}
                            </div>
                            <div className="flex items-center">
                                <span className="text-slate-400 mr-2">{automation.runCount} runs</span>
                                <button className="p-1 hover:bg-slate-100 rounded">
                                    <Settings className="w-4 h-4 text-slate-400" />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Info Box */}
            <div className="mt-6 bg-amber-50 border border-amber-100 rounded-2xl p-6">
                <div className="flex items-start">
                    <div className="bg-amber-100 p-3 rounded-xl">
                        <Zap className="w-6 h-6 text-amber-600" />
                    </div>
                    <div className="ml-4">
                        <h3 className="font-bold text-amber-900">Pro Tip</h3>
                        <p className="text-amber-700 text-sm mt-1">
                            Automations run in the background and require Twilio (SMS) and SendGrid/Mailgun (Email)
                            API keys to be configured in Settings. Without these, automations will log actions but
                            not send actual messages.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
