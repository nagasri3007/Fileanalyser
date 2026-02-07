
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
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

        // Optimize: Convert buffer back to a format usable by Supabase upload if needed, 
        // or just use the `file` object if it's a File/Blob which `req.formData()` provides.
        // Supabase-js accepts File, Blob, Buffer, etc.

        // Analyze
        const analysis = await analyzeFile(buffer, file.type, file.name);

        // 1. Upload to Supabase Storage ('files' bucket)
        const timestamp = Date.now();
        const safeName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
        const storagePath = `${timestamp}_${safeName}`;

        const { data: storageData, error: storageError } = await supabase.storage
            .from('files')
            .upload(storagePath, file, {
                contentType: file.type,
                upsert: false
            });

        let contentUrl = null;
        if (storageError) {
            console.error("Storage upload failed, proceeding with DB only:", storageError);
            // Note: If you haven't created the bucket yet, this will error.
            // We will handle this by returning a clear error if critical.
        } else if (storageData) {
            const { data: publicUrlData } = supabase.storage.from('files').getPublicUrl(storageData.path);
            contentUrl = publicUrlData.publicUrl;
        }

        // 2. Save Metadata to Supabase Database ('Analysis' table)
        // Note: We use the Supabase Client (REST), not Prisma.
        const { data: dbData, error: dbError } = await supabase
            .from('Analysis')
            .insert({
                filename: file.name,
                mimeType: file.type,
                size: buffer.length,

                title: analysis.text ? analysis.text.substring(0, 50) : file.name,
                wordCount: analysis.metadata?.wordCount || 0,
                pageCount: analysis.metadata?.pageCount || 0,
                resolution: analysis.metadata?.resolution || null,
                dimensions: JSON.stringify(analysis.metadata?.dimensions || {}),

                summary: analysis.summary || "Pending Analysis",
                keywords: analysis.keywords?.join(', ') || "",
                sentiment: analysis.sentiment || "Neutral",
                complexity: analysis.complexity || 0,

                content_url: contentUrl, // Store URL
                // content: null // We don't store raw bytes in DB anymore with Supabase
            })
            .select() // Return the created record
            .single();

        if (dbError) {
            console.error("Database insert failed:", dbError);
            throw new Error(`Database Error: ${dbError.message}`);
        }

        return NextResponse.json({ success: true, analysis: dbData });

    } catch (err: any) {
        console.error("Upload error:", err);
        return NextResponse.json({ error: err.message || "Unknown error" }, { status: 500 });
    }
}
