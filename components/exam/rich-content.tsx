"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import Image from "next/image";
import katex from "katex";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import type { QuestionImage, QuestionTable } from "@/lib/exam/types";
import { cn } from "@/lib/utils";

const CONTENT_TOKEN =
  /\\\[([\s\S]+?)\\\]|\\\(([\s\S]+?)\\\)|\[\[image:(\d+)\]\]|\[\[table:(\d+)\]\]/g;

interface RichContentProps {
  readonly content: string;
  readonly images: QuestionImage[];
  readonly tables: QuestionTable[];
  readonly className?: string;
}

function stableHash(value: string) {
  let hash = 2166136261;
  for (const character of value) {
    const codePoint = character.codePointAt(0);
    if (codePoint === undefined) continue;
    hash ^= codePoint;
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

function createStableKey(
  type: string,
  identity: string,
  occurrences: Map<string, number>,
) {
  const baseKey = `${type}-${stableHash(identity)}`;
  const occurrence = occurrences.get(baseKey) ?? 0;
  occurrences.set(baseKey, occurrence + 1);
  return `${baseKey}-${occurrence}`;
}

function renderText(text: string, keyOccurrences: Map<string, number>) {
  return (
    <span
      key={createStableKey("text", text, keyOccurrences)}
      className="whitespace-pre-wrap"
    >
      {text}
    </span>
  );
}

function Formula({
  source,
  displayMode,
}: Readonly<{
  source: string;
  displayMode: boolean;
}>) {
  const html = katex.renderToString(source, {
    displayMode,
    throwOnError: false,
    trust: false,
    maxExpand: 1000,
    maxSize: 20,
  });
  return (
    <span
      className={
        displayMode
          ? "my-3 block overflow-x-auto py-1"
          : "inline-block max-w-full align-middle"
      }
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

function QuestionImageView({ image }: Readonly<{ image: QuestionImage }>) {
  const [open, setOpen] = useState(false);
  const label = image.alt?.trim() || `문항 그림 ${image.seq}`;
  return (
    <>
      <button
        type="button"
        data-media-zoom
        aria-label={`그림 확대: ${label}`}
        onClick={() => setOpen(true)}
        className="pointer-events-auto relative z-10 my-2 block max-w-full overflow-hidden rounded-lg border border-border bg-white text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        <Image
          src={image.url}
          alt={image.alt ?? ""}
          width={image.width}
          height={image.height}
          unoptimized
          sizes="(max-width: 640px) 100vw, 720px"
          className="h-auto max-h-[32rem] max-w-full object-contain"
        />
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[95dvh] max-w-[min(95vw,1200px)] overflow-auto p-3 sm:p-5">
          <DialogTitle className="sr-only">{label} 확대 보기</DialogTitle>
          <Image
            src={image.url}
            alt={image.alt ?? ""}
            width={image.width}
            height={image.height}
            unoptimized
            className="mx-auto h-auto max-h-[82dvh] max-w-full object-contain"
          />
        </DialogContent>
      </Dialog>
    </>
  );
}

function QuestionTableView({
  table,
  images,
}: Readonly<{
  table: QuestionTable;
  images: QuestionImage[];
}>) {
  const rowOccurrences = new Map<string, number>();
  return (
    <div className="my-3 max-w-full overflow-x-auto rounded-lg border border-border">
      <table
        aria-label={`문항 표 ${table.seq}`}
        className="min-w-full border-collapse text-left text-sm"
      >
        <tbody>
          {table.rows.map((row) => {
            const cellOccurrences = new Map<string, number>();
            return (
              <tr
                key={createStableKey(
                  "row",
                  JSON.stringify(row),
                  rowOccurrences,
                )}
                className="border-b border-border last:border-b-0"
              >
                {row.map((cell) => (
                  <td
                    key={createStableKey(
                      "cell",
                      JSON.stringify(cell),
                      cellOccurrences,
                    )}
                    rowSpan={cell.rowSpan}
                    colSpan={cell.colSpan}
                    className="min-w-20 border-r border-border px-3 py-2 align-middle last:border-r-0"
                  >
                    <RichContent
                      content={cell.text}
                      images={images}
                      tables={[]}
                    />
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function renderFormulaToken(
  match: RegExpExecArray,
  keyOccurrences: Map<string, number>,
) {
  const source = match[1] ?? match[2];
  if (source === undefined) return null;

  const displayMode = match[1] !== undefined;
  return (
    <Formula
      key={createStableKey(
        "formula",
        `${displayMode ? "display" : "inline"}:${source}`,
        keyOccurrences,
      )}
      source={source}
      displayMode={displayMode}
    />
  );
}

function renderImageToken(
  match: RegExpExecArray,
  imageBySeq: Map<number, QuestionImage>,
  keyOccurrences: Map<string, number>,
) {
  const image = imageBySeq.get(Number(match[3]));
  const key = image
    ? createStableKey("image", String(image.seq), keyOccurrences)
    : createStableKey("missing-image", match[0], keyOccurrences);

  if (!image) {
    return (
      <span key={key} className="whitespace-pre-wrap">
        {match[0]}
      </span>
    );
  }

  return <QuestionImageView key={key} image={image} />;
}

function renderTableToken(
  match: RegExpExecArray,
  tableBySeq: Map<number, QuestionTable>,
  images: QuestionImage[],
  keyOccurrences: Map<string, number>,
) {
  const table = tableBySeq.get(Number(match[4]));
  const key = table
    ? createStableKey("table", String(table.seq), keyOccurrences)
    : createStableKey("missing-table", match[0], keyOccurrences);

  if (!table) {
    return (
      <span key={key} className="whitespace-pre-wrap">
        {match[0]}
      </span>
    );
  }

  return <QuestionTableView key={key} table={table} images={images} />;
}

function renderContentToken(
  match: RegExpExecArray,
  imageBySeq: Map<number, QuestionImage>,
  tableBySeq: Map<number, QuestionTable>,
  images: QuestionImage[],
  keyOccurrences: Map<string, number>,
) {
  const formula = renderFormulaToken(match, keyOccurrences);
  if (formula) return formula;
  if (match[3] !== undefined)
    return renderImageToken(match, imageBySeq, keyOccurrences);
  if (match[4] !== undefined)
    return renderTableToken(match, tableBySeq, images, keyOccurrences);
  return null;
}

export function RichContent({
  content,
  images,
  tables,
  className,
}: RichContentProps) {
  const imageBySeq = new Map(images.map((image) => [image.seq, image]));
  const tableBySeq = new Map(tables.map((table) => [table.seq, table]));
  const parts: ReactNode[] = [];
  const keyOccurrences = new Map<string, number>();
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  const contentToken = new RegExp(CONTENT_TOKEN.source, "g");

  while ((match = contentToken.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push(renderText(content.slice(lastIndex, match.index), keyOccurrences));
    }
    parts.push(
      renderContentToken(
        match,
        imageBySeq,
        tableBySeq,
        images,
        keyOccurrences,
      ),
    );
    lastIndex = contentToken.lastIndex;
  }
  if (lastIndex < content.length)
    parts.push(renderText(content.slice(lastIndex), keyOccurrences));

  return (
    <div className={cn("[overflow-wrap:anywhere]", className)}>{parts}</div>
  );
}
