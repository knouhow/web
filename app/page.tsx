import { ExamViewerPage } from "@/components/exam/exam-viewer-page";
import { getExam } from "@/lib/exam/service";

export default function HomePage() {
  return <ExamViewerPage examId="knou-cs" initialExam={getExam("knou-cs")} />;
}
