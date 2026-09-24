import { errorResponse, gradeExam, readBody } from "@/lib/exam/service";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const body = await readBody(request);
    return Response.json(gradeExam(id, body.answers));
  } catch (error) {
    return errorResponse(error);
  }
}
