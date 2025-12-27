'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import {
    Search,
    Filter,
    UserPlus,
    MoreVertical,
    Mail,
    Phone,
    ChevronDown,
    Download,
    Users,
} from 'lucide-react';
import type { Member } from '@/lib/db/schema';

const BELT_COLORS = {
    white: 'bg-slate-100 text-slate-700 border border-slate-300',
    blue: 'bg-blue-500 text-white',
    purple: 'bg-purple-600 text-white',
    brown: 'bg-amber-800 text-white',
    black: 'bg-slate-900 text-white',
};

const STATUS_COLORS = {
    active: 'bg-green-100 text-green-700',
    overdue: 'bg-red-100 text-red-700',
    trial: 'bg-blue-100 text-blue-700',
    inactive: 'bg-slate-100 text-slate-600',
    pending: 'bg-amber-100 text-amber-700',
    cancelled: 'bg-slate-100 text-slate-500',
};

interface MembersClientProps {
    initialMembers: Member[];
}

export default function MembersClient({ initialMembers }: MembersClientProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [beltFilter, setBeltFilter] = useState<string>('all');
    const [showFilters, setShowFilters] = useState(false);

    const filteredMembers = useMemo(() => {
        return initialMembers.filter((member) => {
            // Search filter
            const searchLower = searchQuery.toLowerCase();
            const matchesSearch =
                searchQuery === '' ||
                `${member.firstName} ${member.lastName}`.toLowerCase().includes(searchLower) ||
                member.email?.toLowerCase().includes(searchLower) ||
                member.phone?.includes(searchQuery);

            // Status filter
            const matchesStatus = statusFilter === 'all' || member.status === statusFilter;

            // Belt filter
            const matchesBelt = beltFilter === 'all' || member.beltRank === beltFilter;

            return matchesSearch && matchesStatus && matchesBelt;
        });
    }, [initialMembers, searchQuery, statusFilter, beltFilter]);

    const stats = useMemo(() => {
        return {
            total: initialMembers.length,
            active: initialMembers.filter((m) => m.status === 'active').length,
            overdue: initialMembers.filter((m) => m.status === 'overdue').length,
            trial: initialMembers.filter((m) => m.status === 'trial').length,
        };
    }, [initialMembers]);

    return (
        <div className="p-4 lg:p-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
                <div>
                    <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">Members</h1>
                    <p className="text-slate-500 mt-1">
                        {filteredMembers.length} of {stats.total} members
                    </p>
                </div>
                <div className="flex gap-3 mt-4 md:mt-0">
                    <button className="flex items-center px-4 py-2 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors">
                        <Download className="w-4 h-4 mr-2" />
                        Export
                    </button>
                    <Link
                        href="/members/new"
                        className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
                    >
                        <UserPlus className="w-4 h-4 mr-2" />
                        Add Member
                    </Link>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-4 gap-4 mb-6">
                <button
                    onClick={() => setStatusFilter('all')}
                    className={`p-4 rounded-xl text-center transition-all ${statusFilter === 'all' ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200'
                        }`}
                >
                    <p className="text-2xl font-bold">{stats.total}</p>
                    <p className="text-sm opacity-70">Total</p>
                </button>
                <button
                    onClick={() => setStatusFilter('active')}
                    className={`p-4 rounded-xl text-center transition-all ${statusFilter === 'active' ? 'bg-green-600 text-white' : 'bg-white border border-slate-200'
                        }`}
                >
                    <p className="text-2xl font-bold">{stats.active}</p>
                    <p className="text-sm opacity-70">Active</p>
                </button>
                <button
                    onClick={() => setStatusFilter('overdue')}
                    className={`p-4 rounded-xl text-center transition-all ${statusFilter === 'overdue' ? 'bg-red-600 text-white' : 'bg-white border border-slate-200'
                        }`}
                >
                    <p className="text-2xl font-bold">{stats.overdue}</p>
                    <p className="text-sm opacity-70">Overdue</p>
                </button>
                <button
                    onClick={() => setStatusFilter('trial')}
                    className={`p-4 rounded-xl text-center transition-all ${statusFilter === 'trial' ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200'
                        }`}
                >
                    <p className="text-2xl font-bold">{stats.trial}</p>
                    <p className="text-sm opacity-70">Trial</p>
                </button>
            </div>

            {/* Search & Filters */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 mb-6">
                <div className="p-4 flex flex-col md:flex-row gap-4">
                    {/* Search */}
                    <div className="flex-1 relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by name, email, or phone..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        />
                    </div>

                    {/* Filter Toggle */}
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`flex items-center px-4 py-3 border rounded-xl transition-colors ${showFilters ? 'bg-slate-900 text-white border-slate-900' : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                            }`}
                    >
                        <Filter className="w-4 h-4 mr-2" />
                        Filters
                        <ChevronDown className={`w-4 h-4 ml-2 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                    </button>
                </div>

                {/* Filter Options */}
                {showFilters && (
                    <div className="px-4 pb-4 pt-2 border-t border-slate-100 flex flex-wrap gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Belt Rank</label>
                            <select
                                value={beltFilter}
                                onChange={(e) => setBeltFilter(e.target.value)}
                                className="px-4 py-2 border border-slate-200 rounded-lg"
                            >
                                <option value="all">All Belts</option>
                                <option value="white">White</option>
                                <option value="blue">Blue</option>
                                <option value="purple">Purple</option>
                                <option value="brown">Brown</option>
                                <option value="black">Black</option>
                            </select>
                        </div>
                    </div>
                )}
            </div>

            {/* Members Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50">
                            <tr className="text-left text-sm text-slate-500">
                                <th className="px-6 py-4 font-medium">Member</th>
                                <th className="px-6 py-4 font-medium hidden md:table-cell">Contact</th>
                                <th className="px-6 py-4 font-medium">Belt</th>
                                <th className="px-6 py-4 font-medium">Status</th>
                                <th className="px-6 py-4 font-medium hidden lg:table-cell">Last Check-in</th>
                                <th className="px-6 py-4 font-medium hidden lg:table-cell">Classes</th>
                                <th className="px-6 py-4 font-medium"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredMembers.length > 0 ? (
                                filteredMembers.map((member) => (
                                    <tr
                                        key={member.id}
                                        className="border-t border-slate-50 hover:bg-slate-50 transition-colors"
                                    >
                                        <td className="px-6 py-4">
                                            <Link href={`/members/${member.id}`} className="flex items-center group">
                                                <div
                                                    className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${BELT_COLORS[member.beltRank as keyof typeof BELT_COLORS] || 'bg-slate-400'
                                                        }`}
                                                >
                                                    {member.firstName[0]}
                                                </div>
                                                <div className="ml-3">
                                                    <p className="font-medium text-slate-900 group-hover:text-blue-600 transition-colors">
                                                        {member.firstName} {member.lastName}
                                                    </p>
                                                    <p className="text-sm text-slate-500 md:hidden">{member.email}</p>
                                                </div>
                                            </Link>
                                        </td>
                                        <td className="px-6 py-4 hidden md:table-cell">
                                            <div className="space-y-1">
                                                {member.email && (
                                                    <p className="text-sm text-slate-600 flex items-center">
                                                        <Mail className="w-3 h-3 mr-2" />
                                                        {member.email}
                                                    </p>
                                                )}
                                                {member.phone && (
                                                    <p className="text-sm text-slate-600 flex items-center">
                                                        <Phone className="w-3 h-3 mr-2" />
                                                        {member.phone}
                                                    </p>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span
                                                className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium capitalize ${BELT_COLORS[member.beltRank as keyof typeof BELT_COLORS] || 'bg-slate-100 text-slate-600'
                                                    }`}
                                            >
                                                {member.beltRank}
                                                {member.stripes && member.stripes > 0 && ` (${member.stripes})`}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span
                                                className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium capitalize ${STATUS_COLORS[member.status as keyof typeof STATUS_COLORS] || 'bg-slate-100 text-slate-600'
                                                    }`}
                                            >
                                                {member.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 hidden lg:table-cell text-sm text-slate-500">
                                            {member.lastCheckIn
                                                ? format(new Date(member.lastCheckIn), 'MMM d, yyyy')
                                                : 'Never'}
                                        </td>
                                        <td className="px-6 py-4 hidden lg:table-cell">
                                            <span className="text-sm font-medium text-slate-900">
                                                {member.attendanceCount || 0}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                                                <MoreVertical className="w-4 h-4 text-slate-400" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center">
                                        <Users className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                                        <p className="text-slate-500">No members found</p>
                                        <p className="text-sm text-slate-400 mt-1">
                                            Try adjusting your search or filters
                                        </p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
