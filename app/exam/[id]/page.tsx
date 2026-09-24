import { notFound } from "next/navigation";
import { ExamViewerPage } from "@/components/exam/exam-viewer-page";
import { ExamError, getExam } from "@/lib/exam/service";

export default async function ExamPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let exam;
  try {
    exam = getExam(id);
  } catch (error) {
    if (error instanceof ExamError) notFound();
    throw error;
  }
  return <ExamViewerPage key={id} examId={id} initialExam={exam} />;
}
