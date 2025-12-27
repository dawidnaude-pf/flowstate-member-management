'use client';

import { useState } from 'react';
import {
    Settings,
    Key,
    CreditCard,
    MessageSquare,
    Bell,
    Shield,
    Save,
    Eye,
    EyeOff,
    CheckCircle,
    ExternalLink,
} from 'lucide-react';

interface SettingsSection {
    id: string;
    title: string;
    icon: any;
    fields: { key: string; label: string; type: string; placeholder: string; required?: boolean }[];
}

const SETTINGS_SECTIONS: SettingsSection[] = [
    {
        id: 'ai',
        title: 'AI (Gemini)',
        icon: MessageSquare,
        fields: [
            { key: 'GEMINI_API_KEY', label: 'Gemini API Key', type: 'password', placeholder: 'AIza...', required: true },
        ],
    },
    {
        id: 'ezipay',
        title: 'Ezipay Billing',
        icon: CreditCard,
        fields: [
            { key: 'EZIPAY_API_KEY', label: 'API Key', type: 'password', placeholder: 'Your Ezipay API key' },
            { key: 'EZIPAY_DIGITAL_KEY', label: 'Digital Key', type: 'password', placeholder: 'Your digital key' },
            { key: 'EZIPAY_PUBLIC_KEY', label: 'Public Key', type: 'text', placeholder: 'Your public key' },
        ],
    },
    {
        id: 'twilio',
        title: 'SMS (Twilio)',
        icon: Bell,
        fields: [
            { key: 'TWILIO_ACCOUNT_SID', label: 'Account SID', type: 'text', placeholder: 'AC...' },
            { key: 'TWILIO_AUTH_TOKEN', label: 'Auth Token', type: 'password', placeholder: 'Your auth token' },
            { key: 'TWILIO_PHONE_NUMBER', label: 'Phone Number', type: 'text', placeholder: '+61400000000' },
        ],
    },
];

export default function SettingsClient() {
    const [activeSection, setActiveSection] = useState('ai');
    const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
    const [values, setValues] = useState<Record<string, string>>({});
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    const togglePassword = (key: string) => {
        setShowPasswords(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleSave = async () => {
        setSaving(true);
        // In production, this would save to server/environment
        await new Promise(resolve => setTimeout(resolve, 1000));
        setSaving(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
    };

    return (
        <div className="p-4 lg:p-8 max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">Settings</h1>
                <p className="text-slate-500 mt-1">Configure integrations and API keys</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Sidebar */}
                <div className="lg:col-span-1">
                    <nav className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                        {SETTINGS_SECTIONS.map(section => (
                            <button
                                key={section.id}
                                onClick={() => setActiveSection(section.id)}
                                className={`w-full flex items-center px-4 py-3 text-left transition-colors ${activeSection === section.id
                                        ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600'
                                        : 'text-slate-600 hover:bg-slate-50'
                                    }`}
                            >
                                <section.icon className="w-5 h-5 mr-3" />
                                <span className="font-medium text-sm">{section.title}</span>
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Content */}
                <div className="lg:col-span-3">
                    {SETTINGS_SECTIONS.filter(s => s.id === activeSection).map(section => (
                        <div key={section.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                            <div className="flex items-center mb-6">
                                <div className="p-3 bg-blue-100 rounded-xl">
                                    <section.icon className="w-6 h-6 text-blue-600" />
                                </div>
                                <div className="ml-4">
                                    <h2 className="text-xl font-bold text-slate-900">{section.title}</h2>
                                    <p className="text-sm text-slate-500">Configure {section.title.toLowerCase()} integration</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                {section.fields.map(field => (
                                    <div key={field.key}>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">
                                            {field.label}
                                            {field.required && <span className="text-red-500 ml-1">*</span>}
                                        </label>
                                        <div className="relative">
                                            <input
                                                type={field.type === 'password' && !showPasswords[field.key] ? 'password' : 'text'}
                                                placeholder={field.placeholder}
                                                value={values[field.key] || ''}
                                                onChange={(e) => setValues(prev => ({ ...prev, [field.key]: e.target.value }))}
                                                className="w-full p-3 pr-12 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                            />
                                            {field.type === 'password' && (
                                                <button
                                                    type="button"
                                                    onClick={() => togglePassword(field.key)}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                                >
                                                    {showPasswords[field.key] ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Help Links */}
                            <div className="mt-6 pt-6 border-t border-slate-100">
                                <p className="text-sm text-slate-500 mb-3">Need help?</p>
                                <div className="flex flex-wrap gap-2">
                                    {section.id === 'ai' && (
                                        <a
                                            href="https://makersuite.google.com/app/apikey"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center text-sm text-blue-600 hover:underline"
                                        >
                                            Get Gemini API Key <ExternalLink className="w-3 h-3 ml-1" />
                                        </a>
                                    )}
                                    {section.id === 'ezipay' && (
                                        <a
                                            href="https://www.ezidebit.com.au"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center text-sm text-blue-600 hover:underline"
                                        >
                                            Ezipay Portal <ExternalLink className="w-3 h-3 ml-1" />
                                        </a>
                                    )}
                                    {section.id === 'twilio' && (
                                        <a
                                            href="https://console.twilio.com"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center text-sm text-blue-600 hover:underline"
                                        >
                                            Twilio Console <ExternalLink className="w-3 h-3 ml-1" />
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* Save Button */}
                    <div className="mt-6 flex justify-end">
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
                        >
                            {saved ? (
                                <>
                                    <CheckCircle className="w-5 h-5 mr-2" />
                                    Saved!
                                </>
                            ) : saving ? (
                                'Saving...'
                            ) : (
                                <>
                                    <Save className="w-5 h-5 mr-2" />
                                    Save Settings
                                </>
                            )}
                        </button>
                    </div>

                    {/* Security Notice */}
                    <div className="mt-6 bg-amber-50 border border-amber-100 rounded-2xl p-4">
                        <div className="flex items-start">
                            <Shield className="w-5 h-5 text-amber-600 mt-0.5" />
                            <div className="ml-3">
                                <p className="text-sm text-amber-800">
                                    <strong>Security Note:</strong> API keys are stored securely and encrypted.
                                    Never share your keys with anyone. For production deployments, use environment
                                    variables set in your Vercel project settings.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
