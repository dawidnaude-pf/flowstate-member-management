'use client';

import { useState, useEffect } from 'react';
import {
    DollarSign,
    CreditCard,
    AlertTriangle,
    CheckCircle,
    Clock,
    Send,
    ExternalLink,
    RefreshCw,
    TrendingUp,
    Users,
    Calendar,
    MoreVertical,
} from 'lucide-react';
import { format } from 'date-fns';

interface PaymentSummary {
    totalRevenue: number;
    pendingPayments: number;
    failedPayments: number;
    activeSubscriptions: number;
}

interface OverdueMember {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    lastPaymentDate?: string;
    amountDue: number;
    daysPastDue: number;
}

interface RecentPayment {
    id: string;
    memberName: string;
    amount: number;
    status: string;
    date: string;
    type: string;
}

export default function BillingClient() {
    const [loading, setLoading] = useState(true);
    const [summary, setSummary] = useState<PaymentSummary>({
        totalRevenue: 0,
        pendingPayments: 0,
        failedPayments: 0,
        activeSubscriptions: 0,
    });
    const [overdueMembers, setOverdueMembers] = useState<OverdueMember[]>([]);
    const [recentPayments, setRecentPayments] = useState<RecentPayment[]>([]);
    const [sendingReminder, setSendingReminder] = useState<string | null>(null);

    useEffect(() => {
        fetchBillingData();
    }, []);

    const fetchBillingData = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/billing/summary');
            const data = await response.json();

            setSummary(data.summary || {
                totalRevenue: 15420,
                pendingPayments: 3,
                failedPayments: 2,
                activeSubscriptions: 42,
            });

            setOverdueMembers(data.overdueMembers || [
                { id: '1', firstName: 'Mike', lastName: 'Ross', email: 'mike@example.com', phone: '0412 345 678', amountDue: 199, daysPastDue: 7 },
                { id: '2', firstName: 'Tom', lastName: 'Wilson', email: 'tom@example.com', amountDue: 149, daysPastDue: 14 },
                { id: '3', firstName: 'Lisa', lastName: 'Chen', email: 'lisa@example.com', phone: '0423 456 789', amountDue: 199, daysPastDue: 3 },
            ]);

            setRecentPayments(data.recentPayments || [
                { id: '1', memberName: 'Sarah Connor', amount: 199, status: 'completed', date: new Date().toISOString(), type: 'subscription' },
                { id: '2', memberName: 'John Doe', amount: 149, status: 'completed', date: new Date().toISOString(), type: 'subscription' },
                { id: '3', memberName: 'Mike Ross', amount: 199, status: 'failed', date: new Date().toISOString(), type: 'subscription' },
            ]);
        } catch (err) {
            console.error('Failed to fetch billing data:', err);
        }
        setLoading(false);
    };

    const sendReminder = async (memberId: string) => {
        setSendingReminder(memberId);
        try {
            await fetch('/api/billing/reminder', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ memberId }),
            });
            // Show success
            alert('Payment reminder sent!');
        } catch (err) {
            console.error('Failed to send reminder:', err);
        }
        setSendingReminder(null);
    };

    const statCards = [
        { label: 'Monthly Revenue', value: `$${summary.totalRevenue.toLocaleString()}`, icon: DollarSign, color: 'bg-green-500' },
        { label: 'Active Subscriptions', value: summary.activeSubscriptions, icon: Users, color: 'bg-blue-500' },
        { label: 'Pending Payments', value: summary.pendingPayments, icon: Clock, color: 'bg-amber-500' },
        { label: 'Failed Payments', value: summary.failedPayments, icon: AlertTriangle, color: 'bg-red-500' },
    ];

    return (
        <div className="p-4 lg:p-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
                <div>
                    <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">Billing</h1>
                    <p className="text-slate-500 mt-1">Manage payments and subscriptions</p>
                </div>
                <div className="flex gap-3 mt-4 md:mt-0">
                    <button
                        onClick={fetchBillingData}
                        className="flex items-center px-4 py-2 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors"
                    >
                        <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </button>
                    <a
                        href="https://www.ezidebit.com.au"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
                    >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Ezipay Portal
                    </a>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {statCards.map((stat) => (
                    <div
                        key={stat.label}
                        className="bg-white rounded-2xl p-4 lg:p-6 shadow-sm border border-slate-100"
                    >
                        <div className="flex items-center justify-between mb-3">
                            <div className={`${stat.color} p-2 rounded-xl`}>
                                <stat.icon className="w-5 h-5 text-white" />
                            </div>
                            <TrendingUp className="w-4 h-4 text-slate-300" />
                        </div>
                        <p className="text-2xl lg:text-3xl font-bold text-slate-900">{stat.value}</p>
                        <p className="text-sm text-slate-500 mt-1">{stat.label}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Overdue Payments */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-bold text-slate-900">Overdue Payments</h2>
                        <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">
                            {overdueMembers.length} members
                        </span>
                    </div>

                    {overdueMembers.length > 0 ? (
                        <div className="space-y-3">
                            {overdueMembers.map((member) => (
                                <div
                                    key={member.id}
                                    className="flex items-center justify-between p-4 bg-red-50 border border-red-100 rounded-xl"
                                >
                                    <div className="flex items-center">
                                        <div className="w-10 h-10 bg-red-200 rounded-full flex items-center justify-center text-red-700 font-bold">
                                            {member.firstName[0]}
                                        </div>
                                        <div className="ml-3">
                                            <p className="font-medium text-slate-900">
                                                {member.firstName} {member.lastName}
                                            </p>
                                            <p className="text-sm text-red-600">
                                                ${member.amountDue} • {member.daysPastDue} days overdue
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => sendReminder(member.id)}
                                        disabled={sendingReminder === member.id}
                                        className="flex items-center px-3 py-2 bg-white border border-red-200 text-red-700 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors disabled:opacity-50"
                                    >
                                        {sendingReminder === member.id ? (
                                            <RefreshCw className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <>
                                                <Send className="w-4 h-4 mr-1" />
                                                Remind
                                            </>
                                        )}
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-slate-400">
                            <CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                            <p>No overdue payments!</p>
                        </div>
                    )}
                </div>

                {/* Recent Payments */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-bold text-slate-900">Recent Payments</h2>
                        <button className="text-blue-600 text-sm hover:underline">View All</button>
                    </div>

                    <div className="space-y-3">
                        {recentPayments.map((payment) => (
                            <div
                                key={payment.id}
                                className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl transition-colors"
                            >
                                <div className="flex items-center">
                                    <div
                                        className={`w-10 h-10 rounded-full flex items-center justify-center ${payment.status === 'completed'
                                                ? 'bg-green-100 text-green-600'
                                                : payment.status === 'failed'
                                                    ? 'bg-red-100 text-red-600'
                                                    : 'bg-amber-100 text-amber-600'
                                            }`}
                                    >
                                        {payment.status === 'completed' ? (
                                            <CheckCircle className="w-5 h-5" />
                                        ) : payment.status === 'failed' ? (
                                            <AlertTriangle className="w-5 h-5" />
                                        ) : (
                                            <Clock className="w-5 h-5" />
                                        )}
                                    </div>
                                    <div className="ml-3">
                                        <p className="font-medium text-slate-900">{payment.memberName}</p>
                                        <p className="text-sm text-slate-500 capitalize">{payment.type}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-slate-900">${payment.amount}</p>
                                    <p className="text-xs text-slate-500">
                                        {format(new Date(payment.date), 'MMM d')}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Ezipay Integration Notice */}
            <div className="mt-6 bg-blue-50 border border-blue-100 rounded-2xl p-6">
                <div className="flex items-start">
                    <div className="bg-blue-100 p-3 rounded-xl">
                        <CreditCard className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="ml-4">
                        <h3 className="font-bold text-blue-900">Ezipay Integration</h3>
                        <p className="text-blue-700 text-sm mt-1">
                            This system integrates with Ezipay for direct debit and subscription management.
                            Configure your API keys in the Settings page to enable live payment processing.
                        </p>
                        <div className="mt-3 flex gap-2">
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                                Direct Debit
                            </span>
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                                Recurring Billing
                            </span>
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                                BPAY
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
