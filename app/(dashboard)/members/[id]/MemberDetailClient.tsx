'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    ArrowLeft,
    Edit,
    Trash2,
    Mail,
    Phone,
    Calendar,
    Award,
    Camera,
    Save,
    X,
    CheckCircle,
    Clock,
    User,
} from 'lucide-react';
import { format } from 'date-fns';
import type { Member, Attendance } from '@/lib/db/schema';

interface MemberDetailClientProps {
    member: Member;
    attendance: Attendance[];
}

const beltColors: Record<string, string> = {
    white: 'bg-slate-100 text-slate-800 border-slate-300',
    blue: 'bg-blue-500 text-white border-blue-600',
    purple: 'bg-purple-600 text-white border-purple-700',
    brown: 'bg-amber-800 text-white border-amber-900',
    black: 'bg-slate-900 text-white border-slate-950',
};

const statusColors: Record<string, string> = {
    active: 'bg-green-100 text-green-700',
    trial: 'bg-blue-100 text-blue-700',
    pending: 'bg-yellow-100 text-yellow-700',
    overdue: 'bg-red-100 text-red-700',
    inactive: 'bg-slate-100 text-slate-600',
    cancelled: 'bg-red-100 text-red-700',
};

export default function MemberDetailClient({ member, attendance }: MemberDetailClientProps) {
    const router = useRouter();
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        firstName: member.firstName,
        lastName: member.lastName,
        email: member.email || '',
        phone: member.phone || '',
        beltRank: (member.beltRank || 'white') as string,
        stripes: member.stripes || 0,
        status: (member.status || 'active') as string,
        notes: member.notes || '',
    });

    const handleSave = async () => {
        try {
            const response = await fetch(`/api/members/${member.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                setIsEditing(false);
                router.refresh();
            }
        } catch (error) {
            console.error('Error updating member:', error);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this member? This action cannot be undone.')) {
            return;
        }

        try {
            const response = await fetch(`/api/members/${member.id}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                router.push('/members');
            }
        } catch (error) {
            console.error('Error deleting member:', error);
        }
    };

    return (
        <div className="p-6 max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <Link
                        href="/members"
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 text-slate-600" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">
                            {member.firstName} {member.lastName}
                        </h1>
                        <p className="text-slate-500">
                            Member since {member.joinDate ? format(new Date(member.joinDate), 'MMMM yyyy') : 'Unknown'}
                        </p>
                    </div>
                </div>

                <div className="flex gap-2">
                    {isEditing ? (
                        <>
                            <button
                                onClick={() => setIsEditing(false)}
                                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors flex items-center gap-2"
                            >
                                <X className="w-4 h-4" />
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-2"
                            >
                                <Save className="w-4 h-4" />
                                Save
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                onClick={() => setIsEditing(true)}
                                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors flex items-center gap-2"
                            >
                                <Edit className="w-4 h-4" />
                                Edit
                            </button>
                            <button
                                onClick={handleDelete}
                                className="px-4 py-2 bg-red-100 text-red-700 rounded-xl hover:bg-red-200 transition-colors flex items-center gap-2"
                            >
                                <Trash2 className="w-4 h-4" />
                                Delete
                            </button>
                        </>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Info */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Profile Card */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                        <div className="flex items-start gap-6">
                            {/* Avatar */}
                            <div className="relative">
                                {member.profileImage ? (
                                    <img
                                        src={member.profileImage}
                                        alt={member.firstName}
                                        className="w-24 h-24 rounded-2xl object-cover"
                                    />
                                ) : (
                                    <div className="w-24 h-24 rounded-2xl bg-slate-100 flex items-center justify-center">
                                        <User className="w-10 h-10 text-slate-400" />
                                    </div>
                                )}
                                <button className="absolute -bottom-2 -right-2 p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors shadow-lg">
                                    <Camera className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Info */}
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-3">
                                    {isEditing ? (
                                        <select
                                            value={formData.beltRank}
                                            onChange={(e) => setFormData({ ...formData, beltRank: e.target.value })}
                                            className="p-2 border border-slate-200 rounded-lg"
                                        >
                                            {['white', 'blue', 'purple', 'brown', 'black'].map(belt => (
                                                <option key={belt} value={belt}>{belt.charAt(0).toUpperCase() + belt.slice(1)}</option>
                                            ))}
                                        </select>
                                    ) : (
                                        <span className={`px-3 py-1 rounded-full text-sm font-medium border ${beltColors[member.beltRank || 'white']}`}>
                                            {member.beltRank?.charAt(0).toUpperCase()}{member.beltRank?.slice(1)} Belt
                                            {(member.stripes || 0) > 0 && ` - ${member.stripes} stripe${member.stripes === 1 ? '' : 's'}`}
                                        </span>
                                    )}
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[member.status || 'active']}`}>
                                        {member.status?.charAt(0).toUpperCase()}{member.status?.slice(1)}
                                    </span>
                                </div>

                                <div className="space-y-2 text-sm text-slate-600">
                                    {member.email && (
                                        <div className="flex items-center gap-2">
                                            <Mail className="w-4 h-4" />
                                            {isEditing ? (
                                                <input
                                                    type="email"
                                                    value={formData.email}
                                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                    className="flex-1 p-1 border border-slate-200 rounded"
                                                />
                                            ) : (
                                                <a href={`mailto:${member.email}`} className="hover:text-blue-600">
                                                    {member.email}
                                                </a>
                                            )}
                                        </div>
                                    )}
                                    {member.phone && (
                                        <div className="flex items-center gap-2">
                                            <Phone className="w-4 h-4" />
                                            {isEditing ? (
                                                <input
                                                    type="tel"
                                                    value={formData.phone}
                                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                                    className="flex-1 p-1 border border-slate-200 rounded"
                                                />
                                            ) : (
                                                <a href={`tel:${member.phone}`} className="hover:text-blue-600">
                                                    {member.phone}
                                                </a>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Notes */}
                        {(isEditing || member.notes) && (
                            <div className="mt-6 pt-6 border-t border-slate-100">
                                <h3 className="text-sm font-medium text-slate-700 mb-2">Notes</h3>
                                {isEditing ? (
                                    <textarea
                                        value={formData.notes}
                                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                        rows={3}
                                        className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                                    />
                                ) : (
                                    <p className="text-slate-600">{member.notes}</p>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Attendance History */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                        <h2 className="text-lg font-semibold text-slate-900 mb-4">Recent Attendance</h2>
                        {attendance.length > 0 ? (
                            <div className="space-y-3">
                                {attendance.map((record) => (
                                    <div
                                        key={record.id}
                                        className="flex items-center justify-between p-3 bg-slate-50 rounded-xl"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                                                <CheckCircle className="w-5 h-5 text-green-600" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-slate-900">
                                                    {record.className || 'Class'}
                                                </p>
                                                <p className="text-sm text-slate-500">
                                                    {record.checkInTime
                                                        ? format(new Date(record.checkInTime), 'PPP • p')
                                                        : 'Unknown date'}
                                                </p>
                                            </div>
                                        </div>
                                        <span className="text-xs text-slate-400 capitalize">
                                            {record.checkInMethod}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-slate-500 text-center py-8">No attendance records yet</p>
                        )}
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Quick Stats */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                        <h2 className="text-lg font-semibold text-slate-900 mb-4">Statistics</h2>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-slate-600">Total Classes</span>
                                <span className="font-bold text-slate-900">{member.attendanceCount || 0}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-slate-600">Last Check-in</span>
                                <span className="text-sm text-slate-900">
                                    {member.lastCheckIn
                                        ? format(new Date(member.lastCheckIn), 'MMM d')
                                        : 'Never'}
                                </span>
                            </div>
                            {member.programs && Array.isArray(member.programs) && member.programs.length > 0 && (
                                <div className="pt-4 border-t border-slate-100">
                                    <span className="text-sm text-slate-600">Programs</span>
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {member.programs.map((program: string) => (
                                            <span
                                                key={program}
                                                className="px-2 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs"
                                            >
                                                {program}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Billing */}
                    {member.billingStatus && (
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                            <h2 className="text-lg font-semibold text-slate-900 mb-4">Billing</h2>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-slate-600">Status</span>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${member.billingStatus === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                        }`}>
                                        {member.billingStatus}
                                    </span>
                                </div>
                                {member.subscriptionPlan && (
                                    <div className="flex items-center justify-between">
                                        <span className="text-slate-600">Plan</span>
                                        <span className="text-slate-900">{member.subscriptionPlan}</span>
                                    </div>
                                )}
                                {member.nextPaymentDate && (
                                    <div className="flex items-center justify-between">
                                        <span className="text-slate-600">Next Payment</span>
                                        <span className="text-sm text-slate-900">
                                            {format(new Date(member.nextPaymentDate), 'MMM d, yyyy')}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Emergency Contact */}
                    {member.emergencyContact && (
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                            <h2 className="text-lg font-semibold text-slate-900 mb-4">Emergency Contact</h2>
                            <p className="font-medium text-slate-900">{member.emergencyContact}</p>
                            {member.emergencyPhone && (
                                <a
                                    href={`tel:${member.emergencyPhone}`}
                                    className="text-blue-600 hover:underline text-sm"
                                >
                                    {member.emergencyPhone}
                                </a>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
