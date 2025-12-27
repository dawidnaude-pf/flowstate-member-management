import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { members, classes } from '@/lib/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { GoogleGenAI } from '@google/genai';

// Initialize Gemini
const genai = process.env.GEMINI_API_KEY
    ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
    : null;

interface DetectedFace {
    id: string;
    box: { x: number; y: number; width: number; height: number };
    label: string;
    isUnknown: boolean;
    memberId?: string;
    confidence: number;
    checkedIn?: boolean;
}

export async function POST(request: NextRequest) {
    try {
        const { image } = await request.json();

        if (!image) {
            return NextResponse.json({ faces: [], error: 'No image provided' });
        }

        // Get all members with profile images for matching
        let allMembers: any[] = [];
        try {
            allMembers = await db
                .select({
                    id: members.id,
                    firstName: members.firstName,
                    lastName: members.lastName,
                    profileImage: members.profileImage,
                    faceEmbedding: members.faceEmbedding,
                    beltRank: members.beltRank,
                })
                .from(members)
                .where(sql`${members.status} IN ('active', 'trial')`);
        } catch (dbError) {
            console.log('Database not available');
        }

        // Get current/upcoming class
        let currentClass = null;
        try {
            const now = new Date();
            const currentDay = now.getDay();
            const currentTimeMinutes = now.getHours() * 60 + now.getMinutes();

            const todayClasses = await db
                .select()
                .from(classes)
                .where(and(eq(classes.dayOfWeek, currentDay), eq(classes.isActive, true)));

            for (const cls of todayClasses) {
                const [hours, minutes] = cls.startTime.split(':').map(Number);
                const classStartMinutes = hours * 60 + minutes;
                const classEndMinutes = classStartMinutes + (cls.durationMinutes || 60);

                if (currentTimeMinutes >= classStartMinutes - 30 && currentTimeMinutes <= classEndMinutes) {
                    currentClass = cls.name;
                    break;
                }
            }
        } catch (err) {
            console.log('Could not get current class');
        }

        // If no Gemini API, return mock multi-face detection
        if (!genai) {
            const mockFaces: DetectedFace[] = [];
            const faceCount = Math.floor(Math.random() * 3) + 1; // 1-3 faces

            for (let i = 0; i < faceCount; i++) {
                const xOffset = (i * 0.3) + 0.1;
                const isKnown = Math.random() > 0.3 && allMembers.length > 0;

                if (isKnown) {
                    const randomMember = allMembers[Math.floor(Math.random() * allMembers.length)];
                    mockFaces.push({
                        id: `face-${Date.now()}-${i}`,
                        box: { x: xOffset, y: 0.15, width: 0.25, height: 0.4 },
                        label: `${randomMember.firstName} ${randomMember.lastName}`,
                        isUnknown: false,
                        memberId: randomMember.id,
                        confidence: 0.92 + Math.random() * 0.06,
                    });
                } else {
                    mockFaces.push({
                        id: `face-${Date.now()}-${i}`,
                        box: { x: xOffset, y: 0.15, width: 0.25, height: 0.4 },
                        label: 'Unknown Person',
                        isUnknown: true,
                        confidence: 0,
                    });
                }
            }

            return NextResponse.json({ faces: mockFaces, currentClass, mock: true });
        }

        // Use Gemini Vision for multi-face detection and recognition
        const base64Image = image.replace(/^data:image\/\w+;base64,/, '');

        // Build member reference for the AI
        const membersWithImages = allMembers.filter(m => m.profileImage);
        const memberList = allMembers
            .map(m => `- ${m.firstName} ${m.lastName} (ID: ${m.id})`)
            .join('\n');

        const prompt = `Analyze this image for face detection. Detect ALL visible faces and their positions.

For each face detected, try to match against these known gym members:
${memberList || 'No members registered yet'}

IMPORTANT: 
- Detect ALL faces visible in the image (there may be multiple people)
- Return bounding boxes in normalized coordinates (0-1000 scale)
- For each face, indicate if it matches a known member or is unknown
- Multiple faces should each have their own entry

Respond ONLY with valid JSON in this exact format:
{
  "faces": [
    {
      "boundingBox": [ymin, xmin, ymax, xmax],
      "isKnownMember": true,
      "memberId": "uuid-here",
      "memberName": "First Last",
      "confidence": 0.95
    },
    {
      "boundingBox": [ymin, xmin, ymax, xmax],
      "isKnownMember": false,
      "memberId": null,
      "memberName": null,
      "confidence": 0
    }
  ]
}

If no faces detected, return: {"faces": []}`;

        try {
            const result = await genai.models.generateContent({
                model: 'gemini-2.0-flash-exp',
                contents: [{
                    role: 'user',
                    parts: [
                        { text: prompt },
                        { inlineData: { mimeType: 'image/jpeg', data: base64Image } },
                    ],
                }],
            });

            const responseText = result.text || '';

            // Parse JSON from response
            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);

                const faces: DetectedFace[] = (parsed.faces || []).map((face: any, index: number) => {
                    const [ymin, xmin, ymax, xmax] = face.boundingBox || [200, 300, 800, 700];

                    return {
                        id: `face-${Date.now()}-${index}`,
                        box: {
                            x: xmin / 1000,
                            y: ymin / 1000,
                            width: (xmax - xmin) / 1000,
                            height: (ymax - ymin) / 1000,
                        },
                        label: face.isKnownMember && face.memberName ? face.memberName : 'Unknown Person',
                        isUnknown: !face.isKnownMember,
                        memberId: face.memberId || undefined,
                        confidence: face.confidence || 0,
                    };
                });

                return NextResponse.json({ faces, currentClass });
            }
        } catch (aiError) {
            console.error('Gemini API error:', aiError);
        }

        return NextResponse.json({ faces: [], currentClass });
    } catch (error) {
        console.error('Detection error:', error);
        return NextResponse.json({ faces: [], error: 'Detection failed' }, { status: 500 });
    }
}
