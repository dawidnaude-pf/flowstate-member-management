'use client';

import * as faceapi from 'face-api.js';

let modelsLoaded = false;
let loadingPromise: Promise<void> | null = null;

// Threshold for face matching (lower = stricter)
const MATCH_THRESHOLD = 0.55;

export interface FaceDetection {
    box: { x: number; y: number; width: number; height: number };
    descriptor: Float32Array;
    landmarks?: faceapi.FaceLandmarks68;
}

export interface MatchedFace extends FaceDetection {
    id: string;
    label: string;
    isUnknown: boolean;
    memberId?: string;
    confidence: number;
}

export interface StoredMember {
    id: string;
    firstName: string;
    lastName: string;
    faceEmbedding: number[] | null;
}

/**
 * Load face-api.js models (called once on initialization)
 */
export async function loadModels(): Promise<void> {
    if (modelsLoaded) return;

    if (loadingPromise) {
        await loadingPromise;
        return;
    }

    loadingPromise = (async () => {
        try {
            const MODEL_URL = '/models';

            await Promise.all([
                faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
                faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
                faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
            ]);

            modelsLoaded = true;
            console.log('Face-api.js models loaded successfully');
        } catch (error) {
            console.error('Failed to load face-api.js models:', error);
            loadingPromise = null;
            throw error;
        }
    })();

    await loadingPromise;
}

/**
 * Check if models are loaded
 */
export function areModelsLoaded(): boolean {
    return modelsLoaded;
}

/**
 * Detect faces in a video element and return their bounding boxes and descriptors
 */
export async function detectFaces(
    input: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement
): Promise<FaceDetection[]> {
    if (!modelsLoaded) {
        await loadModels();
    }

    // Detect all faces with landmarks and descriptors in one pass
    const detections = await faceapi
        .detectAllFaces(input, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 }))
        .withFaceLandmarks()
        .withFaceDescriptors();

    // Get dimensions for normalizing bounding boxes
    const displayWidth = input instanceof HTMLVideoElement ? input.videoWidth : input.width;
    const displayHeight = input instanceof HTMLVideoElement ? input.videoHeight : input.height;

    return detections.map(d => ({
        box: {
            x: d.detection.box.x / displayWidth,
            y: d.detection.box.y / displayHeight,
            width: d.detection.box.width / displayWidth,
            height: d.detection.box.height / displayHeight,
        },
        descriptor: d.descriptor,
        landmarks: d.landmarks,
    }));
}

/**
 * Calculate Euclidean distance between two face descriptors
 */
export function euclideanDistance(descriptor1: Float32Array | number[], descriptor2: Float32Array | number[]): number {
    let sum = 0;
    for (let i = 0; i < descriptor1.length; i++) {
        const diff = descriptor1[i] - descriptor2[i];
        sum += diff * diff;
    }
    return Math.sqrt(sum);
}

/**
 * Match detected faces against stored member embeddings
 */
export function matchFaces(
    detections: FaceDetection[],
    members: StoredMember[]
): MatchedFace[] {
    return detections.map((detection, index) => {
        let bestMatch: { member: StoredMember; distance: number } | null = null;

        // Find the closest matching member
        for (const member of members) {
            if (!member.faceEmbedding) continue;

            const distance = euclideanDistance(detection.descriptor, member.faceEmbedding);

            if (!bestMatch || distance < bestMatch.distance) {
                bestMatch = { member, distance };
            }
        }

        // Check if the best match is within threshold
        const isMatch = bestMatch && bestMatch.distance < MATCH_THRESHOLD;

        if (isMatch && bestMatch) {
            // Convert distance to confidence (0-1 scale, where 1 = exact match)
            const confidence = Math.max(0, 1 - bestMatch.distance / MATCH_THRESHOLD);

            return {
                ...detection,
                id: `face-${index}-${Date.now()}`,
                label: `${bestMatch.member.firstName} ${bestMatch.member.lastName}`,
                isUnknown: false,
                memberId: bestMatch.member.id,
                confidence,
            };
        }

        return {
            ...detection,
            id: `face-${index}-${Date.now()}`,
            label: 'Unknown',
            isUnknown: true,
            confidence: 0,
        };
    });
}

/**
 * Get face descriptor from a single face image
 * Used for enrollment - captures embedding from captured photo
 */
export async function getFaceDescriptor(
    input: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement
): Promise<Float32Array | null> {
    if (!modelsLoaded) {
        await loadModels();
    }

    const detection = await faceapi
        .detectSingleFace(input, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 }))
        .withFaceLandmarks()
        .withFaceDescriptor();

    return detection?.descriptor || null;
}
