'use client';

import { useState, useMemo } from 'react';
import {
    Calendar,
    Plus,
    Edit,
    Trash2,
    Copy,
    Clock,
    User,
    Check,
    X,
    ExternalLink,
} from 'lucide-react';
import type { Class } from '@/lib/db/schema';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const PROGRAM_COLORS: Record<string, string> = {
    adults_gi: 'bg-blue-100 text-blue-800 border-blue-200',
    adults_nogi: 'bg-purple-100 text-purple-800 border-purple-200',
    youth_gi: 'bg-green-100 text-green-800 border-green-200',
    youth_nogi: 'bg-teal-100 text-teal-800 border-teal-200',
    open_mat: 'bg-amber-100 text-amber-800 border-amber-200',
    women_only: 'bg-pink-100 text-pink-800 border-pink-200',
    kids: 'bg-orange-100 text-orange-800 border-orange-200',
};

interface ScheduleClientProps {
    initialClasses: Class[];
}

export default function ScheduleClient({ initialClasses }: ScheduleClientProps) {
    const [classes, setClasses] = useState(initialClasses);
    const [editingClass, setEditingClass] = useState<Class | null>(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedDay, setSelectedDay] = useState<number | null>(null);

    // Group classes by day
    const classesByDay = useMemo(() => {
        const grouped: Record<number, Class[]> = {};
        for (let i = 0; i < 7; i++) {
            grouped[i] = classes
                .filter((c) => c.dayOfWeek === i)
                .sort((a, b) => a.startTime.localeCompare(b.startTime));
        }
        return grouped;
    }, [classes]);

    const handleSaveClass = async (classData: Partial<Class>) => {
        try {
            const isNew = !classData.id;
            const response = await fetch('/api/classes', {
                method: isNew ? 'POST' : 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(classData),
            });

            if (response.ok) {
                const savedClass = await response.json();
                if (isNew) {
                    setClasses([...classes, savedClass]);
                } else {
                    setClasses(classes.map((c) => (c.id === savedClass.id ? savedClass : c)));
                }
                setEditingClass(null);
                setShowAddModal(false);
            }
        } catch (err) {
            console.error('Failed to save class:', err);
        }
    };

    const handleDeleteClass = async (classId: string) => {
        if (!confirm('Are you sure you want to delete this class?')) return;

        try {
            const response = await fetch(`/api/classes?id=${classId}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                setClasses(classes.filter((c) => c.id !== classId));
            }
        } catch (err) {
            console.error('Failed to delete class:', err);
        }
    };

    const copyApiEndpoint = () => {
        const url = `${window.location.origin}/api/timetable`;
        navigator.clipboard.writeText(url);
        alert('API endpoint copied to clipboard!');
    };

    return (
        <div className="p-4 lg:p-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
                <div>
                    <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">Schedule</h1>
                    <p className="text-slate-500 mt-1">Manage class timetable</p>
                </div>
                <div className="flex gap-3 mt-4 md:mt-0">
                    <button
                        onClick={copyApiEndpoint}
                        className="flex items-center px-4 py-2 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors"
                    >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Copy API URL
                    </button>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Class
                    </button>
                </div>
            </div>

            {/* Weekly Grid */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="grid grid-cols-1 md:grid-cols-7 divide-y md:divide-y-0 md:divide-x divide-slate-100">
                    {DAYS.map((day, dayIndex) => (
                        <div key={day} className="min-h-[200px]">
                            {/* Day Header */}
                            <div className="bg-slate-50 px-4 py-3 border-b border-slate-100">
                                <h3 className="font-medium text-slate-900">{day}</h3>
                                <p className="text-xs text-slate-500">
                                    {classesByDay[dayIndex]?.length || 0} classes
                                </p>
                            </div>

                            {/* Classes */}
                            <div className="p-2 space-y-2">
                                {classesByDay[dayIndex]?.map((cls) => (
                                    <div
                                        key={cls.id}
                                        className={`p-3 rounded-xl border text-sm cursor-pointer hover:shadow-sm transition-shadow ${PROGRAM_COLORS[cls.programType || ''] || 'bg-slate-50 border-slate-200'
                                            }`}
                                        onClick={() => setEditingClass(cls)}
                                    >
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="font-bold">{cls.startTime}</span>
                                            <span className="text-xs opacity-70">{cls.durationMinutes}min</span>
                                        </div>
                                        <p className="font-medium truncate">{cls.name}</p>
                                        <p className="text-xs opacity-70 flex items-center mt-1">
                                            <User className="w-3 h-3 mr-1" />
                                            {cls.coach}
                                        </p>
                                    </div>
                                ))}

                                {classesByDay[dayIndex]?.length === 0 && (
                                    <button
                                        onClick={() => {
                                            setSelectedDay(dayIndex);
                                            setShowAddModal(true);
                                        }}
                                        className="w-full p-4 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 hover:border-slate-300 hover:text-slate-500 transition-colors"
                                    >
                                        <Plus className="w-5 h-5 mx-auto" />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Edit/Add Modal */}
            {(editingClass || showAddModal) && (
                <ClassModal
                    classData={editingClass}
                    defaultDay={selectedDay}
                    onSave={handleSaveClass}
                    onDelete={editingClass ? () => handleDeleteClass(editingClass.id) : undefined}
                    onClose={() => {
                        setEditingClass(null);
                        setShowAddModal(false);
                        setSelectedDay(null);
                    }}
                />
            )}
        </div>
    );
}

// Class Modal Component
interface ClassModalProps {
    classData: Class | null;
    defaultDay: number | null;
    onSave: (data: Partial<Class>) => void;
    onDelete?: () => void;
    onClose: () => void;
}

function ClassModal({ classData, defaultDay, onSave, onDelete, onClose }: ClassModalProps) {
    const [formData, setFormData] = useState({
        name: classData?.name || '',
        dayOfWeek: classData?.dayOfWeek ?? defaultDay ?? 1,
        startTime: classData?.startTime || '18:00',
        durationMinutes: classData?.durationMinutes || 60,
        coach: classData?.coach || '',
        level: classData?.level || 'All Levels',
        programType: classData?.programType || 'adults_gi',
        maxCapacity: classData?.maxCapacity || null,
        description: classData?.description || '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
            ...classData,
            ...formData,
        });
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl">
                <div className="flex items-center justify-between p-6 border-b border-slate-100">
                    <h2 className="text-xl font-bold text-slate-900">
                        {classData ? 'Edit Class' : 'Add Class'}
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Class Name *</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Day *</label>
                            <select
                                value={formData.dayOfWeek}
                                onChange={(e) => setFormData({ ...formData, dayOfWeek: parseInt(e.target.value) })}
                                className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                            >
                                {DAYS.map((day, i) => (
                                    <option key={day} value={i}>
                                        {day}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Start Time *</label>
                            <input
                                type="time"
                                value={formData.startTime}
                                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                                className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                required
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Duration (min)</label>
                            <input
                                type="number"
                                value={formData.durationMinutes}
                                onChange={(e) => setFormData({ ...formData, durationMinutes: parseInt(e.target.value) })}
                                className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Program Type</label>
                            <select
                                value={formData.programType}
                                onChange={(e) => setFormData({ ...formData, programType: e.target.value as any })}
                                className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                            >
                                <option value="adults_gi">Adults Gi</option>
                                <option value="adults_nogi">Adults No Gi</option>
                                <option value="youth_gi">Youth Gi</option>
                                <option value="youth_nogi">Youth No Gi</option>
                                <option value="open_mat">Open Mat</option>
                                <option value="women_only">Women Only</option>
                                <option value="kids">Kids</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Coach</label>
                            <input
                                type="text"
                                value={formData.coach}
                                onChange={(e) => setFormData({ ...formData, coach: e.target.value })}
                                className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Level</label>
                            <select
                                value={formData.level}
                                onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                                className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                            >
                                <option value="All Levels">All Levels</option>
                                <option value="Fundamentals">Fundamentals</option>
                                <option value="Intermediate">Intermediate</option>
                                <option value="Advanced">Advanced</option>
                                <option value="Youth/Teens">Youth/Teens</option>
                                <option value="Open Mat">Open Mat</option>
                                <option value="Women's Only">Women&apos;s Only</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                        {onDelete && (
                            <button
                                type="button"
                                onClick={onDelete}
                                className="px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                            >
                                <Trash2 className="w-5 h-5" />
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-3 text-slate-600 font-medium hover:bg-slate-100 rounded-xl transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center"
                        >
                            <Check className="w-5 h-5 mr-2" />
                            Save
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
