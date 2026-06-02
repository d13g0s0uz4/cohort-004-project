import { eq, and, avg, count, sql } from "drizzle-orm";
import { db } from "~/db";
import { courseReviews } from "~/db/schema";

export function upsertCourseReview(userId: number, courseId: number, rating: number) {
  const existing = db
    .select()
    .from(courseReviews)
    .where(and(eq(courseReviews.userId, userId), eq(courseReviews.courseId, courseId)))
    .get();

  if (existing) {
    return db
      .update(courseReviews)
      .set({ rating, updatedAt: new Date().toISOString() })
      .where(eq(courseReviews.id, existing.id))
      .returning()
      .get();
  }

  return db
    .insert(courseReviews)
    .values({ userId, courseId, rating })
    .returning()
    .get();
}

export function getUserReviewForCourse(userId: number, courseId: number) {
  return db
    .select()
    .from(courseReviews)
    .where(and(eq(courseReviews.userId, userId), eq(courseReviews.courseId, courseId)))
    .get();
}

export function getCourseRatingSummary(courseId: number) {
  const result = db
    .select({
      averageRating: avg(courseReviews.rating),
      reviewCount: count(courseReviews.id),
    })
    .from(courseReviews)
    .where(eq(courseReviews.courseId, courseId))
    .get();

  return {
    averageRating: result?.averageRating ? Number(result.averageRating) : null,
    reviewCount: result?.reviewCount ?? 0,
  };
}

export function getCourseRatingSummaries(courseIds: number[]) {
  if (courseIds.length === 0) return new Map<number, { averageRating: number | null; reviewCount: number }>();

  const results = db
    .select({
      courseId: courseReviews.courseId,
      averageRating: avg(courseReviews.rating),
      reviewCount: count(courseReviews.id),
    })
    .from(courseReviews)
    .where(sql`${courseReviews.courseId} IN (${sql.join(courseIds.map(id => sql`${id}`), sql`, `)})`)
    .groupBy(courseReviews.courseId)
    .all();

  const map = new Map<number, { averageRating: number | null; reviewCount: number }>();
  for (const row of results) {
    map.set(row.courseId, {
      averageRating: row.averageRating ? Number(row.averageRating) : null,
      reviewCount: row.reviewCount,
    });
  }
  return map;
}
