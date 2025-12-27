'use client';

import {
    Users,
    AlertTriangle,
    Clock,
    TrendingUp,
    CreditCard,
    Calendar,
    CheckCircle,
    XCircle,
    ArrowRight,
    UserPlus,
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

interface DashboardData {
    stats: {
        total: number;
        active: number;
        overdue: number;
        trial: number;
    };
    todayClasses: any[];
    recentAttendance: any[];
    atRiskMembers: any[];
    recentPayments: any[];
}

export default function DashboardClient({ data }: { data: DashboardData }) {
    const { stats, todayClasses, atRiskMembers, recentPayments } = data;

    const statCards = [
        { label: 'Total Members', value: stats.total, icon: Users, color: 'bg-blue-500' },
        { label: 'Active', value: stats.active, icon: CheckCircle, color: 'bg-green-500' },
        { label: 'Overdue', value: stats.overdue, icon: AlertTriangle, color: 'bg-red-500' },
        { label: 'On Trial', value: stats.trial, icon: UserPlus, color: 'bg-amber-500' },
    ];

    return (
        <div className="p-4 lg:p-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
                <div>
                    <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">Dashboard</h1>
                    <p className="text-slate-500 mt-1">
                        {format(new Date(), 'EEEE, MMMM d, yyyy')}
                    </p>
                </div>
                <div className="flex gap-3 mt-4 md:mt-0">
                    <Link
                        href="/kiosk"
                        className="flex items-center px-4 py-2 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors"
                    >
                        <Clock className="w-4 h-4 mr-2" />
                        Open Kiosk
                    </Link>
                    <Link
                        href="/members/new"
                        className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
                    >
                        <UserPlus className="w-4 h-4 mr-2" />
                        Add Member
                    </Link>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
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

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Today's Classes */}
                <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-bold text-slate-900">Today&apos;s Classes</h2>
                        <Link href="/schedule" className="text-blue-600 text-sm hover:underline flex items-center">
                            View Schedule <ArrowRight className="w-4 h-4 ml-1" />
                        </Link>
                    </div>

                    {todayClasses.length > 0 ? (
                        <div className="space-y-3">
                            {todayClasses.map((cls) => (
                                <div
                                    key={cls.id}
                                    className="flex items-center justify-between p-4 bg-slate-50 rounded-xl"
                                >
                                    <div className="flex items-center">
                                        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 font-bold text-sm">
                                            {cls.startTime}
                                        </div>
                                        <div className="ml-4">
                                            <p className="font-medium text-slate-900">{cls.name}</p>
                                            <p className="text-sm text-slate-500">{cls.coach} • {cls.level}</p>
                                        </div>
                                    </div>
                                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                                        {cls.durationMinutes} min
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-slate-400">
                            <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                            <p>No classes scheduled for today</p>
                        </div>
                    )}
                </div>

                {/* Members at Risk */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-bold text-slate-900">Needs Attention</h2>
                        <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">
                            {atRiskMembers.length} members
                        </span>
                    </div>

                    {atRiskMembers.length > 0 ? (
                        <div className="space-y-3">
                            {atRiskMembers.map((member) => (
                                <Link
                                    key={member.id}
                                    href={`/members/${member.id}`}
                                    className="flex items-center p-3 hover:bg-slate-50 rounded-xl transition-colors group"
                                >
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${member.status === 'overdue' ? 'bg-red-500' : 'bg-slate-400'
                                        }`}>
                                        {member.firstName[0]}
                                    </div>
                                    <div className="ml-3 flex-1 min-w-0">
                                        <p className="font-medium text-slate-900 truncate">
                                            {member.firstName} {member.lastName}
                                        </p>
                                        <p className="text-xs text-slate-500 capitalize">{member.status}</p>
                                    </div>
                                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-slate-600 transition-colors" />
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-slate-400">
                            <CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                            <p>All members are in good standing!</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Recent Payments */}
            <div className="mt-6 bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-slate-900">Recent Payments</h2>
                    <Link href="/billing" className="text-blue-600 text-sm hover:underline flex items-center">
                        View All <ArrowRight className="w-4 h-4 ml-1" />
                    </Link>
                </div>

                {recentPayments.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="text-left text-sm text-slate-500 border-b border-slate-100">
                                    <th className="pb-3 font-medium">Member</th>
                                    <th className="pb-3 font-medium">Amount</th>
                                    <th className="pb-3 font-medium">Status</th>
                                    <th className="pb-3 font-medium">Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentPayments.map((payment) => (
                                    <tr key={payment.id} className="border-b border-slate-50 last:border-0">
                                        <td className="py-3">
                                            <p className="font-medium text-slate-900">
                                                {payment.memberFirstName} {payment.memberLastName}
                                            </p>
                                        </td>
                                        <td className="py-3">
                                            <p className="text-slate-900">${(payment.amount / 100).toFixed(2)}</p>
                                        </td>
                                        <td className="py-3">
                                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${payment.status === 'completed' ? 'bg-green-100 text-green-700' :
                                                    payment.status === 'failed' ? 'bg-red-100 text-red-700' :
                                                        'bg-amber-100 text-amber-700'
                                                }`}>
                                                {payment.status === 'completed' && <CheckCircle className="w-3 h-3 mr-1" />}
                                                {payment.status === 'failed' && <XCircle className="w-3 h-3 mr-1" />}
                                                {payment.status}
                                            </span>
                                        </td>
                                        <td className="py-3 text-sm text-slate-500">
                                            {payment.paymentDate ? format(new Date(payment.paymentDate), 'MMM d, yyyy') : '-'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="text-center py-8 text-slate-400">
                        <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>No recent payments</p>
                    </div>
                )}
            </div>
        </div>
    );
}
