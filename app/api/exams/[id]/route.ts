import { errorResponse, getExam } from "@/lib/exam/service";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    return Response.json(getExam(id));
  } catch (error) {
    return errorResponse(error);
  }
}
