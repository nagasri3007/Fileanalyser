import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { analyzeFile } from '@/lib/file-analyzer';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());

        // Analyze
        const analysis = await analyzeFile(buffer, file.type, file.name);

        // Save to DB
        const record = await prisma.analysis.create({
            data: {
                filename: file.name,
                mimeType: file.type,
                size: buffer.length,
                // Basic Metadata
                title: analysis.text ? analysis.text.substring(0, 50) : file.name,
                wordCount: analysis.metadata?.wordCount || 0,
                pageCount: analysis.metadata?.pageCount || 0,
                resolution: analysis.metadata?.resolution || null,
                dimensions: JSON.stringify(analysis.metadata?.dimensions || {}),

                // Detailed Analysis
                summary: analysis.summary || "Pending Analysis",
                keywords: analysis.keywords?.join(', ') || "",
                sentiment: analysis.sentiment || "Neutral",
                complexity: analysis.complexity || 0,

                // Small file storage (Limit 5MB for demo purposes)
                content: buffer.length < 5 * 1024 * 1024 ? buffer : null
            }
        });

        // Remove raw content from response to save bandwidth
        const { content, ...responseRecord } = record;

        return NextResponse.json({ success: true, analysis: responseRecord });

    } catch (err: any) {
        console.error("Upload error:", err);
        return NextResponse.json({ error: err.message || "Unknown error" }, { status: 500 });
    }
}
