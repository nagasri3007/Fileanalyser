"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Copy, UploadCloud, FileText, FileImage, FileCode, CheckCircle, XCircle, AlertCircle, BarChart2, Hash, Layers } from "lucide-react";
import clsx from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

// Simple color palette using CSS variables or Tailwind classes
// Using Tailwind's slate/zinc/neutral for modern feel.

export default function Home() {
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setAnalyzing(true);
    setResult(null);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");

      setResult(data.analysis);
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setAnalyzing(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
    maxSize: 4.5 * 1024 * 1024, // 4.5MB limit for Vercel Serverless
  });

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 selection:bg-cyan-500/30 font-sans pb-20">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-900/20 via-slate-950 to-slate-950 pointer-events-none" />

      <div className="relative max-w-5xl mx-auto px-6 py-20 z-10">
        {/* Header */}
        <header className="text-center mb-16 space-y-4">
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight bg-gradient-to-b from-white to-slate-400 bg-clip-text text-transparent">
            File Analyzer
          </h1>
          <div className="flex justify-center">
            <span className="inline-flex items-center rounded-full bg-cyan-400/10 px-3 py-1 text-xs font-medium text-cyan-300 ring-1 ring-inset ring-cyan-400/20">
              Powered by Gemini 3 Flash ⚡
            </span>
          </div>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Drag and drop your documents or images to get instant, detailed analysis powered by advanced heuristics.
            <br className="hidden md:block" /> Supports <span className="text-cyan-400">PDF, DOCX, PNG, JPG, & Text</span>.
          </p>
        </header>

        {/* Upload Zone */}
        <div
          {...getRootProps()}
          className={cn(
            "group relative border-2 border-dashed rounded-3xl p-12 transition-all duration-300 ease-in-out cursor-pointer overflow-hidden isolate",
            isDragActive
              ? "border-cyan-500/50 bg-cyan-500/5 ring-4 ring-cyan-500/20 scale-[1.02]"
              : "border-slate-800 bg-slate-900/30 hover:border-slate-600 hover:bg-slate-800/50"
          )}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className={cn("p-4 rounded-full bg-slate-800 transition-transform group-hover:scale-110", isDragActive ? "bg-cyan-500/20 text-cyan-400" : "text-slate-400")}>
              {analyzing ? (
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-current" />
              ) : (
                <UploadCloud className="w-8 h-8" />
              )}
            </div>
            <div className="space-y-1">
              <p className={cn("text-lg font-medium transition-colors", isDragActive ? "text-cyan-400" : "text-slate-200")}>
                {analyzing ? "Analyzing file..." : isDragActive ? "Drop file here" : "Click to upload or drag and drop"}
              </p>
              <p className="text-sm text-slate-500">
                Max file size: 10MB
              </p>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mt-8 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400 animate-in fade-in slide-in-from-bottom-2">
            <XCircle className="w-5 h-5 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {/* Results Section */}
        {result && (
          <div className="mt-16 space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-500">
            <div className="flex items-center gap-4 border-b border-slate-800 pb-4">
              <div className="p-3 bg-cyan-500/10 rounded-xl text-cyan-400">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">{result.filename}</h2>
                <div className="flex items-center gap-3 text-sm text-slate-400 mt-1">
                  <span className="bg-slate-800 px-2 py-0.5 rounded text-xs uppercase tracking-wider">{result.mimeType.split('/')[1] || "File"}</span>
                  <span>•</span>
                  <span>{(result.size / 1024).toFixed(1)} KB</span>
                  <span>•</span>
                  <span>{new Date(result.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Summary Card */}
              <Card title="Summary" icon={<Layers className="w-5 h-5 text-indigo-400" />} className="lg:col-span-2">
                <p className="text-slate-300 leading-relaxed">
                  {result.summary || "No summary available."}
                </p>
              </Card>

              {/* Stats Card */}
              <Card title="Key Metrics" icon={<BarChart2 className="w-5 h-5 text-emerald-400" />}>
                <div className="space-y-4">
                  <Stat label="Word Count" value={result.wordCount || 0} />
                  <Stat label="Complexity Score" value={result.complexity?.toFixed(1) || "N/A"} subtext="(0-100 Scale)" />
                  <Stat label="Analysis Sentiment" value={result.sentiment || "Neutral"} highlight={result.sentiment === "Positive" ? "text-emerald-400" : result.sentiment === "Negative" ? "text-red-400" : "text-amber-400"} />
                </div>
              </Card>

              {/* Keywords Card */}
              <Card title="Top Keywords" icon={<Hash className="w-5 h-5 text-pink-400" />}>
                <div className="flex flex-wrap gap-2">
                  {result.keywords ? result.keywords.split(', ').map((k: string, i: number) => (
                    <span key={i} className="px-3 py-1 bg-slate-800/50 border border-slate-700 rounded-full text-xs text-slate-300">
                      #{k}
                    </span>
                  )) : (
                    <p className="text-slate-500 text-sm">No keywords extracted.</p>
                  )}
                </div>
              </Card>

              {/* Resolution Card if Image */}
              {result.resolution && (
                <Card title="Dimensions" icon={<FileImage className="w-5 h-5 text-orange-400" />}>
                  <div className="text-2xl font-mono text-slate-200">{result.resolution}</div>
                  <p className="text-sm text-slate-500 mt-1">Width x Height</p>
                </Card>
              )}

            </div>
          </div>
        )}
      </div>
    </main>
  );
}

function Card({ children, title, icon, className }: { children: React.ReactNode; title: string; icon: React.ReactNode; className?: string }) {
  return (
    <div className={cn("bg-slate-900/50 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm hover:border-slate-700 transition-colors", className)}>
      <div className="flex items-center gap-3 mb-4">
        {icon}
        <h3 className="font-semibold text-slate-200">{title}</h3>
      </div>
      <div>{children}</div>
    </div>
  );
}

function Stat({ label, value, subtext, highlight }: { label: string; value: string | number; subtext?: string; highlight?: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-slate-400 text-sm">{label}</span>
      <div className="text-right">
        <span className={cn("font-medium block", highlight || "text-slate-200")}>{value}</span>
        {subtext && <span className="text-xs text-slate-600 block">{subtext}</span>}
      </div>
    </div>
  );
}
