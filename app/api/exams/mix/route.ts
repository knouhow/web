import {
  createMixId,
  errorResponse,
  getExam,
  readBody,
} from "@/lib/exam/service";

export async function POST(request: Request) {
  try {
    const body = await readBody(request);
    return Response.json(getExam(createMixId(body.categories)), {
      status: 201,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
