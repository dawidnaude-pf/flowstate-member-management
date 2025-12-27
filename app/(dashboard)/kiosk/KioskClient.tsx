'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
    ScanFace,
    X,
    Camera,
    Loader,
    AlertTriangle,
    CheckCircle,
    UserPlus,
    ArrowLeft,
    Volume2,
    VolumeX,
    Maximize,
    Check,
} from 'lucide-react';
import { format } from 'date-fns';
import {
    loadModels,
    areModelsLoaded,
    detectFaces,
    matchFaces,
    getFaceDescriptor,
    type StoredMember,
    type MatchedFace,
} from '@/lib/faceDetection';

interface DetectedFace {
    id: string;
    box: { x: number; y: number; width: number; height: number };
    label: string;
    isUnknown: boolean;
    memberId?: string;
    confidence?: number;
    checkedIn?: boolean;
    descriptor?: Float32Array;
}

interface CheckedInMember {
    id: string;
    firstName: string;
    lastName: string;
    beltRank: string;
    profileImage?: string;
    className?: string;
}

export default function KioskClient() {
    const router = useRouter();
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const [isStreaming, setIsStreaming] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [modelsReady, setModelsReady] = useState(false);
    const [loadingModels, setLoadingModels] = useState(false);
    const [cameraError, setCameraError] = useState<string | null>(null);
    const [detectedFaces, setDetectedFaces] = useState<DetectedFace[]>([]);
    const [checkedInMember, setCheckedInMember] = useState<CheckedInMember | null>(null);
    const [showEnrollment, setShowEnrollment] = useState(false);
    const [enrollmentImage, setEnrollmentImage] = useState<string | null>(null);
    const [enrollmentDescriptor, setEnrollmentDescriptor] = useState<Float32Array | null>(null);
    const [soundEnabled, setSoundEnabled] = useState(true);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [checkedInFaces, setCheckedInFaces] = useState<Set<string>>(new Set());
    const [currentClass, setCurrentClass] = useState<string | null>(null);
    const [storedMembers, setStoredMembers] = useState<StoredMember[]>([]);

    // Update clock
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // Load face-api.js models on mount
    useEffect(() => {
        const initModels = async () => {
            if (areModelsLoaded()) {
                setModelsReady(true);
                return;
            }
            setLoadingModels(true);
            try {
                await loadModels();
                setModelsReady(true);
            } catch (error) {
                console.error('Failed to load face detection models:', error);
                setCameraError('Failed to load face detection models');
            }
            setLoadingModels(false);
        };
        initModels();
    }, []);

    // Fetch member embeddings for matching
    const fetchMemberEmbeddings = useCallback(async () => {
        try {
            const response = await fetch('/api/members/embeddings');
            const data = await response.json();
            if (data.members) {
                setStoredMembers(data.members);
            }
        } catch (error) {
            console.error('Failed to fetch member embeddings:', error);
        }
    }, []);

    // Start camera stream
    const startCamera = async () => {
        try {
            setCameraError(null);

            // Fetch member embeddings for matching
            await fetchMemberEmbeddings();

            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'user',
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                },
            });
            streamRef.current = stream;
            // Set streaming first to render the video element
            setIsStreaming(true);
        } catch (err) {
            console.error('Camera access error:', err);
            setCameraError('Could not access camera. Please allow camera permissions.');
        }
    };

    // Attach stream to video element after it's rendered
    useEffect(() => {
        if (isStreaming && streamRef.current && videoRef.current) {
            videoRef.current.srcObject = streamRef.current;
            videoRef.current.play().catch(console.error);
        }
    }, [isStreaming]);

    // Stop camera stream
    const stopCamera = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
        setIsStreaming(false);
        setDetectedFaces([]);
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            stopCamera();
        };
    }, [stopCamera]);

    // Process frame with local face-api.js detection
    const processFrame = useCallback(async () => {
        if (!videoRef.current || !isStreaming || checkedInMember || showEnrollment || !modelsReady) {
            return;
        }

        const video = videoRef.current;

        if (video.videoWidth === 0 || video.videoHeight === 0) {
            return;
        }

        if (!isProcessing) {
            setIsProcessing(true);
            try {
                // Detect faces locally using face-api.js
                const detections = await detectFaces(video);

                if (detections.length > 0) {
                    // Match against stored member embeddings
                    const matched = matchFaces(detections, storedMembers);

                    // Preserve check-in state for already checked-in faces
                    setDetectedFaces(matched.map((f: MatchedFace) => ({
                        ...f,
                        checkedIn: checkedInFaces.has(f.memberId || '') || false,
                    })));
                } else {
                    setDetectedFaces([]);
                }
            } catch (err) {
                console.error('Detection error:', err);
            }
            setIsProcessing(false);
        }
    }, [isStreaming, isProcessing, checkedInMember, showEnrollment, modelsReady, storedMembers, checkedInFaces]);

    // Processing loop - runs every 300ms for responsive detection
    useEffect(() => {
        let intervalId: NodeJS.Timeout;

        if (isStreaming && !checkedInMember && !showEnrollment && modelsReady) {
            intervalId = setInterval(() => {
                processFrame();
            }, 300);
        }

        return () => {
            if (intervalId) clearInterval(intervalId);
        };
    }, [isStreaming, checkedInMember, showEnrollment, modelsReady, processFrame]);

    // Handle manual check-in for a specific face
    const handleCheckIn = async (face: DetectedFace) => {
        if (!face.memberId || face.checkedIn) return;

        try {
            const response = await fetch('/api/kiosk/checkin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ memberId: face.memberId }),
            });

            const data = await response.json();

            if (data.success) {
                // Mark face as checked in locally
                setCheckedInFaces(prev => new Set(prev).add(face.memberId!));
                setDetectedFaces(prev => prev.map(f =>
                    f.id === face.id ? { ...f, checkedIn: true } : f
                ));

                // Learn: Store the face embedding to improve future recognition
                if (face.descriptor) {
                    fetch('/api/members/embeddings', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            memberId: face.memberId,
                            embedding: Array.from(face.descriptor),
                        }),
                    }).catch(() => { });
                }

                // Play success sound
                if (soundEnabled) {
                    const audio = new Audio('/sounds/success.mp3');
                    audio.play().catch(() => { });
                }

                // Show brief success overlay
                setCheckedInMember(data.member);
                setTimeout(() => setCheckedInMember(null), 2000);
            }
        } catch (err) {
            console.error('Check-in error:', err);
        }
    };

    // Handle enrollment of unknown face
    const handleStartEnrollment = async (face: DetectedFace) => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');

            if (ctx) {
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                ctx.drawImage(video, 0, 0);
                setEnrollmentImage(canvas.toDataURL('image/jpeg', 0.8));
            }
        }

        // Store the descriptor for enrollment
        if (face.descriptor) {
            setEnrollmentDescriptor(face.descriptor);
        }

        setShowEnrollment(true);
    };

    // Fullscreen toggle
    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    };

    // Belt color mapping
    const getBeltColor = (belt: string) => {
        const colors: Record<string, string> = {
            white: 'bg-slate-100 text-slate-800',
            blue: 'bg-blue-500 text-white',
            purple: 'bg-purple-600 text-white',
            brown: 'bg-amber-800 text-white',
            black: 'bg-slate-900 text-white',
        };
        return colors[belt] || 'bg-slate-400';
    };

    return (
        <div className="fixed inset-0 bg-slate-900 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 bg-slate-800/50 backdrop-blur-sm z-10">
                <button
                    onClick={() => router.push('/dashboard')}
                    className="flex items-center px-4 py-2 text-white/70 hover:text-white transition-colors"
                >
                    <ArrowLeft className="w-5 h-5 mr-2" />
                    Exit Kiosk
                </button>

                <div className="text-center">
                    <h1 className="text-white text-xl font-bold">Flow State BJJ</h1>
                    <p className="text-white/50 text-sm">
                        {format(currentTime, 'EEEE, MMMM d')} • {format(currentTime, 'h:mm a')}
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setSoundEnabled(!soundEnabled)}
                        className="p-2 text-white/70 hover:text-white transition-colors"
                    >
                        {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                    </button>
                    <button
                        onClick={toggleFullscreen}
                        className="p-2 text-white/70 hover:text-white transition-colors"
                    >
                        <Maximize className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Main Area */}
            <div className="flex-1 flex items-center justify-center p-4">
                {/* Loading Models */}
                {loadingModels && (
                    <div className="text-center">
                        <Loader className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
                        <p className="text-white text-lg">Loading face detection models...</p>
                        <p className="text-white/50 text-sm mt-2">This only happens once</p>
                    </div>
                )}

                {!loadingModels && !isStreaming ? (
                    // Start Screen
                    <div className="text-center">
                        <button
                            onClick={startCamera}
                            disabled={!modelsReady}
                            className="group flex flex-col items-center p-12 bg-gradient-to-br from-slate-800 to-slate-700 rounded-3xl shadow-2xl hover:from-slate-700 hover:to-slate-600 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <div className="w-24 h-24 bg-blue-600 rounded-full flex items-center justify-center mb-6 group-hover:bg-blue-500 transition-colors shadow-lg shadow-blue-600/30">
                                <ScanFace className="w-12 h-12 text-white" />
                            </div>
                            <span className="text-white text-2xl font-bold mb-2">Start Kiosk</span>
                            <span className="text-white/50">Tap to begin facial recognition check-in</span>
                        </button>

                        {cameraError && (
                            <div className="mt-6 px-6 py-4 bg-red-500/20 border border-red-500/30 rounded-xl text-red-400 flex items-center mx-auto max-w-md">
                                <AlertTriangle className="w-5 h-5 mr-3 flex-shrink-0" />
                                {cameraError}
                            </div>
                        )}
                    </div>
                ) : isStreaming && (
                    // Camera View
                    <div className="relative w-full max-w-4xl aspect-video bg-black rounded-3xl overflow-hidden shadow-2xl">
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                            className="w-full h-full object-cover kiosk-camera"
                        />
                        <canvas ref={canvasRef} className="hidden" />

                        {/* Face Detection Overlay */}
                        <div className="absolute inset-0 pointer-events-none">
                            {detectedFaces.map((face) => (
                                <div
                                    key={face.id}
                                    className={`absolute border-4 rounded-lg transition-all duration-150 ease-out ${face.checkedIn ? 'border-green-500 bg-green-500/20' :
                                        face.isUnknown ? 'border-amber-400' : 'border-blue-400'
                                        }`}
                                    style={{
                                        left: `${(1 - face.box.x - face.box.width) * 100}%`,
                                        top: `${face.box.y * 100}%`,
                                        width: `${face.box.width * 100}%`,
                                        height: `${face.box.height * 100}%`,
                                    }}
                                >
                                    {/* Name Label */}
                                    <div
                                        className={`absolute -top-12 left-1/2 -translate-x-1/2 px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap shadow-lg ${face.checkedIn ? 'bg-green-500 text-white' :
                                            face.isUnknown ? 'bg-amber-500 text-white' : 'bg-blue-500 text-white'
                                            }`}
                                    >
                                        {face.checkedIn ? '✓ ' : ''}{face.label}
                                        {face.confidence !== undefined && !face.isUnknown && (
                                            <span className="ml-2 opacity-70 text-xs">
                                                {Math.round(face.confidence * 100)}%
                                            </span>
                                        )}
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 pointer-events-auto flex gap-2">
                                        {/* Check-in button for recognized members */}
                                        {!face.isUnknown && !face.checkedIn && face.memberId && (
                                            <button
                                                onClick={() => handleCheckIn(face)}
                                                className="px-5 py-3 bg-green-500 text-white rounded-full text-sm font-bold shadow-xl flex items-center hover:bg-green-600 transition-all transform hover:scale-105"
                                            >
                                                <Check className="w-5 h-5 mr-2" />
                                                Check In
                                            </button>
                                        )}

                                        {/* Already checked in indicator */}
                                        {face.checkedIn && (
                                            <div className="px-5 py-3 bg-green-600 text-white rounded-full text-sm font-bold shadow-xl flex items-center">
                                                <CheckCircle className="w-5 h-5 mr-2" />
                                                Checked In
                                            </div>
                                        )}

                                        {/* Enroll button for unknown */}
                                        {face.isUnknown && (
                                            <button
                                                onClick={() => handleStartEnrollment(face)}
                                                className="px-5 py-3 bg-amber-500 text-white rounded-full text-sm font-bold shadow-xl flex items-center hover:bg-amber-600 transition-all transform hover:scale-105"
                                            >
                                                <UserPlus className="w-5 h-5 mr-2" />
                                                Add Profile
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}

                            {/* Scanning Corners (when no faces detected) */}
                            {detectedFaces.length === 0 && !checkedInMember && (
                                <>
                                    <div className="absolute top-8 left-8 w-20 h-20 border-l-4 border-t-4 border-white/30 rounded-tl-2xl" />
                                    <div className="absolute top-8 right-8 w-20 h-20 border-r-4 border-t-4 border-white/30 rounded-tr-2xl" />
                                    <div className="absolute bottom-8 left-8 w-20 h-20 border-l-4 border-b-4 border-white/30 rounded-bl-2xl" />
                                    <div className="absolute bottom-8 right-8 w-20 h-20 border-r-4 border-b-4 border-white/30 rounded-br-2xl" />
                                    <div className="absolute top-0 left-0 w-full h-1 bg-blue-500/50 animate-scan" />
                                </>
                            )}
                        </div>

                        {/* Status Bar */}
                        <div className="absolute bottom-6 left-1/2 -translate-x-1/2">
                            <div className="glass-dark px-6 py-3 rounded-full text-white flex items-center">
                                {isProcessing ? (
                                    <>
                                        <Loader className="w-4 h-4 animate-spin mr-2" />
                                        Scanning...
                                    </>
                                ) : (
                                    <>
                                        <Camera className="w-4 h-4 mr-2" />
                                        {`${storedMembers.filter(m => m.faceEmbedding).length} faces enrolled • Ready to scan`}
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Close Button */}
                        <button
                            onClick={stopCamera}
                            className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 rounded-full backdrop-blur-sm transition-colors"
                        >
                            <X className="w-5 h-5 text-white" />
                        </button>
                    </div>
                )}
            </div>

            {/* Check-in Success Overlay */}
            {checkedInMember && (
                <div className="fixed inset-0 bg-green-500/95 flex items-center justify-center z-50 animate-fade-in">
                    <div className="text-center text-white">
                        {checkedInMember.profileImage ? (
                            <img
                                src={checkedInMember.profileImage}
                                alt={checkedInMember.firstName}
                                className="w-32 h-32 rounded-full mx-auto mb-6 border-4 border-white shadow-lg object-cover"
                            />
                        ) : (
                            <div className="w-32 h-32 rounded-full mx-auto mb-6 bg-green-600 flex items-center justify-center border-4 border-white">
                                <CheckCircle className="w-16 h-16" />
                            </div>
                        )}
                        <h1 className="text-4xl font-bold mb-2">Welcome!</h1>
                        <p className="text-2xl text-green-100">
                            {checkedInMember.firstName} {checkedInMember.lastName}
                        </p>
                        <div className={`inline-block mt-4 px-4 py-2 rounded-full text-sm font-medium ${getBeltColor(checkedInMember.beltRank)}`}>
                            {checkedInMember.beltRank.charAt(0).toUpperCase() + checkedInMember.beltRank.slice(1)} Belt
                        </div>
                        {checkedInMember.className && (
                            <p className="mt-4 text-green-100 text-lg">
                                Checked in for: {checkedInMember.className}
                            </p>
                        )}
                    </div>
                </div>
            )}

            {/* Enrollment Modal */}
            {showEnrollment && (
                <EnrollmentModal
                    image={enrollmentImage}
                    descriptor={enrollmentDescriptor}
                    onClose={() => {
                        setShowEnrollment(false);
                        setEnrollmentImage(null);
                        setEnrollmentDescriptor(null);
                    }}
                    onSuccess={(member) => {
                        setShowEnrollment(false);
                        setEnrollmentImage(null);
                        setEnrollmentDescriptor(null);
                        setCheckedInMember(member);
                        if (member.id) {
                            setCheckedInFaces(prev => new Set(prev).add(member.id));
                        }
                        // Refresh member embeddings
                        fetchMemberEmbeddings();
                        setTimeout(() => setCheckedInMember(null), 2000);
                    }}
                />
            )}
        </div>
    );
}

// Enrollment Modal Component
interface EnrollmentModalProps {
    image: string | null;
    descriptor: Float32Array | null;
    onClose: () => void;
    onSuccess: (member: CheckedInMember) => void;
}

function EnrollmentModal({ image, descriptor, onClose, onSuccess }: EnrollmentModalProps) {
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Create member with profile image and face embedding
            const response = await fetch('/api/kiosk/enroll', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    firstName,
                    lastName,
                    email,
                    phone,
                    profileImage: image,
                    faceEmbedding: descriptor ? Array.from(descriptor) : null,
                }),
            });

            const data = await response.json();

            if (data.success) {
                onSuccess(data.member);
            }
        } catch (err) {
            console.error('Enrollment error:', err);
        }

        setLoading(false);
    };

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
                {/* Header with captured image */}
                <div className="relative h-48 bg-slate-900">
                    {image && (
                        <img src={image} alt="Captured" className="w-full h-full object-cover opacity-80" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end p-6">
                        <h2 className="text-2xl font-bold text-white">New Member</h2>
                        <p className="text-white/70">Create a profile for check-in</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 bg-black/30 rounded-full hover:bg-black/50 transition-colors"
                    >
                        <X className="w-5 h-5 text-white" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">First Name *</label>
                            <input
                                type="text"
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Last Name</label>
                            <input
                                type="text"
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                        <input
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-3 text-slate-600 font-medium hover:bg-slate-100 rounded-xl transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !firstName}
                            className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center"
                        >
                            {loading ? <Loader className="w-5 h-5 animate-spin" /> : 'Create & Check In'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
