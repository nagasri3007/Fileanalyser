// @ts-nocheck
import mammoth from 'mammoth';
const pdf = require('pdf-parse');
const sharp = require('sharp');
// Import GoogleGenAI from the new SDK
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
        // 1. Basic Metadata Extraction & Pre-processing
        if (mimeType === 'application/pdf') {
            const data = await pdf(buffer);
            originalText = data.text;
            result.text = originalText;
            result.metadata.pageCount = data.numpages;
            result.metadata.wordCount = data.text.split(/\s+/).length;

            // Prepare for Gemini
            geminiParts.push({
                inlineData: {
                    data: buffer.toString('base64'),
                    mimeType: mimeType
                }
            });
        } else if (
            mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
            mimeType === 'application/msword'
        ) {
            const { value } = await mammoth.extractRawText({ buffer });
            originalText = value;
            result.text = value;
            result.metadata.wordCount = value.split(/\s+/).length;

            geminiParts.push({ text: value });

        } else if (mimeType.startsWith('image/')) {
            const image = sharp(buffer);
            const metadata = await image.metadata();
            result.metadata.resolution = `${metadata.width}x${metadata.height}`;
            result.metadata.dimensions = { width: metadata.width!, height: metadata.height! };
            result.metadata.format = metadata.format;

            geminiParts.push({
                inlineData: {
                    data: buffer.toString('base64'),
                    mimeType: mimeType
                }
            });
        } else {
            // Text file
            originalText = buffer.toString('utf-8');
            result.text = originalText;
            result.metadata.wordCount = originalText.split(/\s+/).length;
            geminiParts.push({ text: originalText });
        }

        // 2. Gemini Analysis
        try {
            const prompt = `Analyze this file. Return a JSON object with the following fields:
            - summary: A concise summary of the content (string).
            - keywords: Top 5 relevant keywords (array of strings).
            - sentiment: The overall sentiment (Positive, Negative, Neutral) (string).
            - complexity: A readability score from 0-100 (number).
            
            Output ONLY valid JSON.`;

            // Add prompt to parts
            geminiParts.push({ text: prompt });

            // Call Gemini 3 Flash using new SDK signature
            const response = await client.models.generateContent({
                model: modelId,
                contents: [
                    {
                        role: 'user',
                        parts: geminiParts
                    }
                ],
                config: {
                    responseMimeType: "application/json"
                }
            });

            const responseText = response.text; // Assuming .text property based on docs

            if (!responseText) throw new Error("No response text from Gemini");

            const aiData = JSON.parse(responseText);

            result.summary = aiData.summary;
            result.keywords = aiData.keywords;
            result.sentiment = aiData.sentiment;
            result.complexity = aiData.complexity;

        } catch (aiError) {
            console.error("Gemini AI Analysis failed, falling back to heuristics:", aiError);
            if (originalText) {
                // Heuristics Fallback
                const words = originalText.split(/\s+/).filter(w => w.length > 0);
                const sentences = originalText.split(/[.!?]+/).filter(s => s.length > 0);
                const syllables = words.reduce((acc, w) => acc + countSyllables(w), 0);
                const score = 206.835 - 1.015 * (words.length / (sentences.length || 1)) - 84.6 * (syllables / (words.length || 1));

                result.complexity = parseFloat(score.toFixed(2));
                result.summary = "AI Analysis unavailable. Basic analysis: " + originalText.substring(0, 100) + "...";
                result.sentiment = "Neutral";

                const frequency: Record<string, number> = {};
                words.forEach(w => {
                    const clean = w.toLowerCase().replace(/[^a-z0-9]/g, '');
                    if (clean.length > 3) frequency[clean] = (frequency[clean] || 0) + 1;
                });
                result.keywords = Object.entries(frequency).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([k]) => k);
            } else {
                result.summary = "Analysis failed and no text could be extracted.";
            }
        }

    } catch (error) {
        console.error("Analysis pipeline failed:", error);
        result.summary = "Critical failure in analysis pipeline.";
    }

    return result;
}

function countSyllables(word: string): number {
    word = word.toLowerCase();
    if (word.length <= 3) return 1;
    word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
    word = word.replace(/^y/, '');
    const syllables = word.match(/[aeiouy]{1,2}/g);
    return syllables ? syllables.length : 1;
}
