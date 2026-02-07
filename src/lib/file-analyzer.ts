// @ts-nocheck
import { GoogleGenAI } from "@google/genai";

const client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const modelId = "gemini-3-flash-preview";

export interface AnalysisResult {
    text?: string;
    metadata: {
        wordCount?: number;
        pageCount?: number;
        resolution?: string;
        dimensions?: { width: number; height: number };
        format?: string;
    };
    summary?: string;
    keywords?: string[];
    sentiment?: string;
    complexity?: number;
}

export async function analyzeFile(buffer: Buffer, mimeType: string, filename: string): Promise<AnalysisResult> {
    const result: AnalysisResult = {
        metadata: {},
    };

    let originalText = "";
    let geminiParts: any[] = [];

    try {
        // For PDFs and Images: Send directly to Gemini (no local parsing needed)
        // For DOCX: Use mammoth to extract text
        // For Text: Just read as string

        if (mimeType === 'application/pdf') {
            // PDFs go directly to Gemini - it handles them natively!
            geminiParts.push({
                inlineData: {
                    data: buffer.toString('base64'),
                    mimeType: mimeType
                }
            });
            // We don't have local page count, Gemini will analyze
            result.metadata.format = 'pdf';

        } else if (
            mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
            mimeType === 'application/msword'
        ) {
            // Lazy load mammoth for DOCX
            const mammoth = (await import("mammoth")).default;
            const { value } = await mammoth.extractRawText({ buffer });
            originalText = value;
            result.text = value;
            result.metadata.wordCount = value.split(/\s+/).filter(w => w.length > 0).length;
            result.metadata.format = 'docx';
            geminiParts.push({ text: value });

        } else if (mimeType.startsWith('image/')) {
            // Images go directly to Gemini
            // Optionally use sharp for metadata, but skip if it causes issues
            try {
                const sharp = (await import("sharp")).default;
                const image = sharp(buffer);
                const metadata = await image.metadata();
                result.metadata.resolution = `${metadata.width}x${metadata.height}`;
                result.metadata.dimensions = { width: metadata.width!, height: metadata.height! };
                result.metadata.format = metadata.format;
            } catch (sharpError) {
                console.warn("Sharp failed (expected on some serverless), skipping image metadata:", sharpError);
                result.metadata.format = mimeType.split('/')[1];
            }

            geminiParts.push({
                inlineData: {
                    data: buffer.toString('base64'),
                    mimeType: mimeType
                }
            });

        } else {
            // Plain text file
            originalText = buffer.toString('utf-8');
            result.text = originalText;
            result.metadata.wordCount = originalText.split(/\s+/).filter(w => w.length > 0).length;
            result.metadata.format = 'text';
            geminiParts.push({ text: originalText });
        }

        // --- Gemini Analysis ---
        try {
            const prompt = `Analyze this file thoroughly. Return a JSON object with:
            - summary: A detailed summary of the content (string, 2-3 sentences).
            - keywords: Top 5 relevant keywords (array of strings).
            - sentiment: Overall sentiment - exactly one of: "Positive", "Negative", or "Neutral" (string).
            - complexity: A readability/complexity score from 0-100 where 0 is very simple and 100 is very complex (number).
            - wordCount: Estimated word count if applicable, otherwise 0 (number).
            - pageCount: Number of pages if applicable (for PDFs), otherwise 0 (number).
            
            Output ONLY valid JSON, no markdown formatting.`;

            geminiParts.push({ text: prompt });

            const response = await client.models.generateContent({
                model: modelId,
                contents: [{ role: 'user', parts: geminiParts }],
                config: { responseMimeType: "application/json" }
            });

            const responseText = response.text;
            if (!responseText) throw new Error("Empty response from Gemini");

            // Clean potential markdown wrapper
            const cleanJson = responseText.replace(/```json\n?|\n?```/g, "").trim();
            const aiData = JSON.parse(cleanJson);

            result.summary = aiData.summary;
            result.keywords = aiData.keywords;
            result.sentiment = aiData.sentiment;
            result.complexity = aiData.complexity;

            // Use Gemini's counts if we don't have them locally
            if (!result.metadata.wordCount && aiData.wordCount) {
                result.metadata.wordCount = aiData.wordCount;
            }
            if (!result.metadata.pageCount && aiData.pageCount) {
                result.metadata.pageCount = aiData.pageCount;
            }

        } catch (aiError: any) {
            console.error("Gemini AI Analysis failed:", aiError.message || aiError);
            // Fallback summary
            result.summary = `Analysis of ${filename}. AI processing encountered an issue.`;
            result.sentiment = "Neutral";
            result.complexity = 50;
            result.keywords = [filename.split('.')[0]];
        }

    } catch (error: any) {
        console.error("Analysis pipeline failed:", error.message || error);
        result.summary = `Failed to analyze: ${error.message || 'Unknown error'}`;
    }

    return result;
}
