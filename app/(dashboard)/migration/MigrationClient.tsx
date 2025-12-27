'use client';

import { useState, useRef } from 'react';
import {
    Upload,
    FileSpreadsheet,
    CheckCircle,
    AlertTriangle,
    ArrowRight,
    Users,
    CreditCard,
    Database,
    Loader,
    Download,
    X,
} from 'lucide-react';

type MigrationStep = 'upload' | 'mapping' | 'preview' | 'importing' | 'complete';

interface MappedField {
    source: string;
    target: string;
    sampleData?: string;
}

export default function MigrationClient() {
    const [step, setStep] = useState<MigrationStep>('upload');
    const [file, setFile] = useState<File | null>(null);
    const [csvData, setCsvData] = useState<any[]>([]);
    const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
    const [fieldMappings, setFieldMappings] = useState<MappedField[]>([]);
    const [importProgress, setImportProgress] = useState(0);
    const [importResults, setImportResults] = useState({ success: 0, failed: 0, errors: [] as string[] });
    const fileInputRef = useRef<HTMLInputElement>(null);

    const TARGET_FIELDS = [
        { key: 'firstName', label: 'First Name', required: true },
        { key: 'lastName', label: 'Last Name', required: true },
        { key: 'email', label: 'Email', required: false },
        { key: 'phone', label: 'Phone', required: false },
        { key: 'beltRank', label: 'Belt Rank', required: false },
        { key: 'joinDate', label: 'Join Date', required: false },
        { key: 'status', label: 'Status', required: false },
        { key: 'subscriptionPlan', label: 'Subscription Plan', required: false },
        { key: 'clubworxId', label: 'Clubworx ID', required: false },
        { key: 'notes', label: 'Notes', required: false },
    ];

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (!selectedFile) return;

        setFile(selectedFile);

        // Parse CSV
        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target?.result as string;
            const lines = text.split('\n').filter(line => line.trim());
            const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));

            const data = lines.slice(1).map(line => {
                const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
                const row: Record<string, string> = {};
                headers.forEach((header, i) => {
                    row[header] = values[i] || '';
                });
                return row;
            });

            setCsvHeaders(headers);
            setCsvData(data);

            // Auto-map fields
            const mappings: MappedField[] = TARGET_FIELDS.map(target => {
                const matchingHeader = headers.find(h =>
                    h.toLowerCase().includes(target.key.toLowerCase()) ||
                    target.key.toLowerCase().includes(h.toLowerCase().replace(/[^a-z]/g, ''))
                );
                return {
                    source: matchingHeader || '',
                    target: target.key,
                    sampleData: matchingHeader ? data[0]?.[matchingHeader] : undefined,
                };
            });

            setFieldMappings(mappings);
            setStep('mapping');
        };
        reader.readAsText(selectedFile);
    };

    const updateMapping = (targetKey: string, sourceField: string) => {
        setFieldMappings(prev =>
            prev.map(m => {
                if (m.target === targetKey) {
                    return { ...m, source: sourceField, sampleData: csvData[0]?.[sourceField] };
                }
                return m;
            })
        );
    };

    const startImport = async () => {
        setStep('importing');
        setImportProgress(0);

        const results = { success: 0, failed: 0, errors: [] as string[] };

        for (let i = 0; i < csvData.length; i++) {
            const row = csvData[i];

            // Map row data
            const memberData: Record<string, any> = {};
            fieldMappings.forEach(m => {
                if (m.source && row[m.source]) {
                    memberData[m.target] = row[m.source];
                }
            });

            // API call to import member
            try {
                const response = await fetch('/api/members', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(memberData),
                });

                if (response.ok) {
                    results.success++;
                } else {
                    results.failed++;
                    results.errors.push(`Row ${i + 2}: ${memberData.firstName || 'Unknown'} - Import failed`);
                }
            } catch (err) {
                results.failed++;
                results.errors.push(`Row ${i + 2}: Network error`);
            }

            setImportProgress(Math.round(((i + 1) / csvData.length) * 100));
        }

        setImportResults(results);
        setStep('complete');
    };

    return (
        <div className="p-4 lg:p-8 max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">Clubworx Migration</h1>
                <p className="text-slate-500 mt-1">Import your members and data from Clubworx</p>
            </div>

            {/* Progress Steps */}
            <div className="flex items-center mb-8">
                {['Upload', 'Map Fields', 'Preview', 'Complete'].map((label, i) => {
                    const stepOrder = ['upload', 'mapping', 'preview', 'complete'];
                    const currentIndex = stepOrder.indexOf(step === 'importing' ? 'preview' : step);
                    const isComplete = i < currentIndex;
                    const isCurrent = i === currentIndex;

                    return (
                        <div key={label} className="flex items-center flex-1">
                            <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${isComplete ? 'bg-green-500 text-white' :
                                    isCurrent ? 'bg-blue-600 text-white' :
                                        'bg-slate-200 text-slate-500'
                                }`}>
                                {isComplete ? <CheckCircle className="w-5 h-5" /> : i + 1}
                            </div>
                            <span className={`ml-2 text-sm font-medium hidden md:block ${isCurrent ? 'text-slate-900' : 'text-slate-500'
                                }`}>{label}</span>
                            {i < 3 && <div className="flex-1 h-0.5 bg-slate-200 mx-4" />}
                        </div>
                    );
                })}
            </div>

            {/* Step Content */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                {step === 'upload' && (
                    <div className="text-center py-12">
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className="border-2 border-dashed border-slate-300 rounded-2xl p-12 cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
                        >
                            <Upload className="w-12 h-12 mx-auto text-slate-400 mb-4" />
                            <h3 className="text-lg font-bold text-slate-900 mb-2">
                                Upload Clubworx Export
                            </h3>
                            <p className="text-slate-500 mb-4">
                                Export your members from Clubworx as CSV and upload here
                            </p>
                            <span className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium">
                                <FileSpreadsheet className="w-4 h-4 mr-2" />
                                Select CSV File
                            </span>
                        </div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".csv"
                            onChange={handleFileSelect}
                            className="hidden"
                        />

                        <div className="mt-8 text-left bg-slate-50 rounded-xl p-6">
                            <h4 className="font-bold text-slate-900 mb-3">How to export from Clubworx:</h4>
                            <ol className="text-sm text-slate-600 space-y-2">
                                <li>1. Log in to Clubworx admin panel</li>
                                <li>2. Go to Members → All Members</li>
                                <li>3. Click "Export" and select CSV format</li>
                                <li>4. Include all fields (name, email, phone, membership, etc.)</li>
                                <li>5. Upload the downloaded file here</li>
                            </ol>
                        </div>
                    </div>
                )}

                {step === 'mapping' && (
                    <div>
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">Map Fields</h3>
                                <p className="text-sm text-slate-500">
                                    {csvData.length} records found in {file?.name}
                                </p>
                            </div>
                            <button
                                onClick={() => setStep('upload')}
                                className="text-slate-500 hover:text-slate-700"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-3 mb-6">
                            {fieldMappings.map((mapping) => {
                                const targetField = TARGET_FIELDS.find(f => f.key === mapping.target);
                                return (
                                    <div key={mapping.target} className="flex items-center gap-4">
                                        <div className="w-40">
                                            <span className="text-sm font-medium text-slate-700">
                                                {targetField?.label}
                                                {targetField?.required && <span className="text-red-500">*</span>}
                                            </span>
                                        </div>
                                        <ArrowRight className="w-4 h-4 text-slate-300" />
                                        <select
                                            value={mapping.source}
                                            onChange={(e) => updateMapping(mapping.target, e.target.value)}
                                            className="flex-1 p-2 border border-slate-200 rounded-lg"
                                        >
                                            <option value="">-- Select column --</option>
                                            {csvHeaders.map(h => (
                                                <option key={h} value={h}>{h}</option>
                                            ))}
                                        </select>
                                        {mapping.sampleData && (
                                            <span className="text-xs text-slate-400 w-32 truncate">
                                                e.g. {mapping.sampleData}
                                            </span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setStep('upload')}
                                className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50"
                            >
                                Back
                            </button>
                            <button
                                onClick={() => setStep('preview')}
                                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                                Preview Import
                            </button>
                        </div>
                    </div>
                )}

                {step === 'preview' && (
                    <div>
                        <h3 className="text-lg font-bold text-slate-900 mb-4">Preview Import</h3>
                        <p className="text-slate-500 mb-6">
                            Review the first 5 records before importing all {csvData.length} members.
                        </p>

                        <div className="overflow-x-auto mb-6">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th className="px-3 py-2 text-left">Name</th>
                                        <th className="px-3 py-2 text-left">Email</th>
                                        <th className="px-3 py-2 text-left">Phone</th>
                                        <th className="px-3 py-2 text-left">Belt</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {csvData.slice(0, 5).map((row, i) => {
                                        const firstName = row[fieldMappings.find(m => m.target === 'firstName')?.source || ''] || '';
                                        const lastName = row[fieldMappings.find(m => m.target === 'lastName')?.source || ''] || '';
                                        const email = row[fieldMappings.find(m => m.target === 'email')?.source || ''] || '';
                                        const phone = row[fieldMappings.find(m => m.target === 'phone')?.source || ''] || '';
                                        const belt = row[fieldMappings.find(m => m.target === 'beltRank')?.source || ''] || '';

                                        return (
                                            <tr key={i} className="border-b border-slate-100">
                                                <td className="px-3 py-2">{firstName} {lastName}</td>
                                                <td className="px-3 py-2">{email}</td>
                                                <td className="px-3 py-2">{phone}</td>
                                                <td className="px-3 py-2">{belt}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setStep('mapping')}
                                className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50"
                            >
                                Back
                            </button>
                            <button
                                onClick={startImport}
                                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center"
                            >
                                <Database className="w-4 h-4 mr-2" />
                                Import {csvData.length} Members
                            </button>
                        </div>
                    </div>
                )}

                {step === 'importing' && (
                    <div className="text-center py-12">
                        <Loader className="w-12 h-12 mx-auto animate-spin text-blue-600 mb-4" />
                        <h3 className="text-lg font-bold text-slate-900 mb-2">Importing Members...</h3>
                        <p className="text-slate-500 mb-4">Please don't close this page</p>
                        <div className="w-full max-w-md mx-auto bg-slate-200 rounded-full h-3">
                            <div
                                className="bg-blue-600 h-3 rounded-full transition-all"
                                style={{ width: `${importProgress}%` }}
                            />
                        </div>
                        <p className="text-sm text-slate-500 mt-2">{importProgress}% complete</p>
                    </div>
                )}

                {step === 'complete' && (
                    <div className="text-center py-12">
                        <CheckCircle className="w-16 h-16 mx-auto text-green-500 mb-4" />
                        <h3 className="text-2xl font-bold text-slate-900 mb-2">Import Complete!</h3>
                        <div className="flex justify-center gap-8 my-6">
                            <div className="text-center">
                                <p className="text-3xl font-bold text-green-600">{importResults.success}</p>
                                <p className="text-sm text-slate-500">Imported</p>
                            </div>
                            <div className="text-center">
                                <p className="text-3xl font-bold text-red-600">{importResults.failed}</p>
                                <p className="text-sm text-slate-500">Failed</p>
                            </div>
                        </div>

                        {importResults.errors.length > 0 && (
                            <div className="text-left bg-red-50 rounded-xl p-4 mb-6 max-h-40 overflow-y-auto">
                                <h4 className="font-medium text-red-800 mb-2">Errors:</h4>
                                {importResults.errors.map((err, i) => (
                                    <p key={i} className="text-sm text-red-600">{err}</p>
                                ))}
                            </div>
                        )}

                        <a
                            href="/members"
                            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700"
                        >
                            <Users className="w-5 h-5 mr-2" />
                            View Members
                        </a>
                    </div>
                )}
            </div>
        </div>
    );
}
