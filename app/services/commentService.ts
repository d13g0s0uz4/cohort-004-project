import { eq, and, isNull, desc, count } from "drizzle-orm";
import { db } from "~/db";
import { lessonComments, users, UserRole } from "~/db/schema";

export const COMMENTS_PAGE_SIZE = 10;

export function getCommentsForLesson(lessonId: number, offset = 0) {
  return db
    .select({
      id: lessonComments.id,
      body: lessonComments.body,
      createdAt: lessonComments.createdAt,
      userId: lessonComments.userId,
      userName: users.name,
      userRole: users.role,
      userAvatarUrl: users.avatarUrl,
    })
    .from(lessonComments)
    .innerJoin(users, eq(lessonComments.userId, users.id))
    .where(and(eq(lessonComments.lessonId, lessonId), isNull(lessonComments.deletedAt)))
    .orderBy(desc(lessonComments.createdAt))
    .limit(COMMENTS_PAGE_SIZE)
    .offset(offset)
    .all();
}

export function getCommentCount(lessonId: number) {
  const result = db
    .select({ count: count(lessonComments.id) })
    .from(lessonComments)
    .where(and(eq(lessonComments.lessonId, lessonId), isNull(lessonComments.deletedAt)))
    .get();
  return result?.count ?? 0;
}

export function createComment(userId: number, lessonId: number, body: string) {
  return db
    .insert(lessonComments)
    .values({ userId, lessonId, body })
    .returning()
    .get();
}

export function deleteComment(
  commentId: number,
  lessonId: number,
  requestingUserId: number,
  courseInstructorId: number
) {
  const comment = db
    .select()
    .from(lessonComments)
    .where(
      and(
        eq(lessonComments.id, commentId),
        eq(lessonComments.lessonId, lessonId),
        isNull(lessonComments.deletedAt)
      )
    )
    .get();

  if (!comment) return null;

  const canDelete =
    comment.userId === requestingUserId ||
    requestingUserId === courseInstructorId;

  if (!canDelete) return null;

  return db
    .update(lessonComments)
    .set({ deletedAt: new Date().toISOString() })
    .where(eq(lessonComments.id, commentId))
    .returning()
    .get();
}
