import { notFound } from "next/navigation";
import { ExamViewerPage } from "@/components/exam/exam-viewer-page";

export default async function ExamPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!/^\d+$/.test(id) && !/^mix-[0-9a-f-]{36}$/i.test(id)) notFound();
  return <ExamViewerPage key={id} examId={id} />;
}
