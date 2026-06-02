import { data } from "react-router";
import { z } from "zod";
import type { Route } from "./+types/api.lesson-comments";
import { getCurrentUserId } from "~/lib/session";
import { getCommentsForLesson, getCommentCount, COMMENTS_PAGE_SIZE } from "~/services/commentService";
import { getLessonById } from "~/services/lessonService";
import { getModuleById } from "~/services/moduleService";
import { isUserEnrolled } from "~/services/enrollmentService";

const querySchema = z.object({
  lessonId: z.coerce.number().int().positive(),
  offset: z.coerce.number().int().min(0).default(0),
});

export async function loader({ request }: Route.LoaderArgs) {
  const currentUserId = await getCurrentUserId(request);
  if (!currentUserId) {
    throw data("Unauthorized", { status: 401 });
  }

  const url = new URL(request.url);
  const parsed = querySchema.safeParse({
    lessonId: url.searchParams.get("lessonId"),
    offset: url.searchParams.get("offset"),
  });

  if (!parsed.success) {
    throw data("Invalid parameters", { status: 400 });
  }

  const { lessonId, offset } = parsed.data;

  const lesson = getLessonById(lessonId);
  if (!lesson) throw data("Lesson not found", { status: 404 });

  const mod = getModuleById(lesson.moduleId);
  if (!mod) throw data("Module not found", { status: 404 });

  const enrolled = isUserEnrolled(currentUserId, mod.courseId);
  if (!enrolled) throw data("Forbidden", { status: 403 });

  const comments = getCommentsForLesson(lessonId, offset);
  const totalCount = getCommentCount(lessonId);

  return {
    comments,
    totalCount,
    hasMore: offset + COMMENTS_PAGE_SIZE < totalCount,
    nextOffset: offset + COMMENTS_PAGE_SIZE,
  };
}
