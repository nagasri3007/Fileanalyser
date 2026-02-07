-- CreateTable
CREATE TABLE "Analysis" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "filename" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "title" TEXT,
    "wordCount" INTEGER,
    "pageCount" INTEGER,
    "resolution" TEXT,
    "dimensions" TEXT,
    "summary" TEXT,
    "keywords" TEXT,
    "sentiment" TEXT,
    "complexity" REAL,
    "content" BLOB
);
