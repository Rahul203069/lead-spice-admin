"use server";

import { db } from "@/app/db"; // Adjust this import to match your db index file path
import { 
  user, 
  userProfile, 
  job, 
  project, 
  session, 
  promptTemplates 
} from "@/app/db/schema"; // Adjust this import to match your db schema file path
import { count, desc, eq, gte, sql, sum, and } from "drizzle-orm";

/**
 * 1. USER & ENGAGEMENT METRICS
 */
export async function getUserMetrics() {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [
    [totalUsersResult],
    [newUsersTodayResult],
    [newUsersWeekResult],
    [activeSessionsResult],
    [totalRowsResult]
  ] = await Promise.all([
    db.select({ value: count() }).from(user),
    db.select({ value: count() }).from(user).where(gte(user.createdAt, startOfToday)),
    db.select({ value: count() }).from(user).where(gte(user.createdAt, sevenDaysAgo)),
    // Active sessions in the last 24 hours
    db.select({ value: count() }).from(session).where(gte(session.updatedAt, new Date(now.getTime() - 24 * 60 * 60 * 1000))),
    // Total rows processed globally across all users
    db.select({ value: sum(userProfile.processedRows) }).from(userProfile),
  ]);

  return {
    totalUsers: totalUsersResult?.value ?? 0,
    newUsersToday: newUsersTodayResult?.value ?? 0,
    newUsersLast7Days: newUsersWeekResult?.value ?? 0,
    activeSessions24h: activeSessionsResult?.value ?? 0,
    totalRowsProcessed: Number(totalRowsResult?.value ?? 0),
  };
}

/**
 * 2. JOB & SYSTEM HEALTH METRICS
 */
export async function getJobMetrics() {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  // Using SQL conditional aggregation to get all stats in a single database trip
  const [jobStats] = await db.select({
    total: count(),
    completed: sum(sql`CASE WHEN ${job.status} = 'completed' THEN 1 ELSE 0 END`).mapWith(Number),
    failed: sum(sql`CASE WHEN ${job.status} = 'failed' THEN 1 ELSE 0 END`).mapWith(Number),
    processing: sum(sql`CASE WHEN ${job.status} IN ('processing', 'pending') THEN 1 ELSE 0 END`).mapWith(Number),
    failedToday: sum(sql`CASE WHEN ${job.status} = 'failed' AND ${job.createdAt} >= ${startOfToday.toISOString()} THEN 1 ELSE 0 END`).mapWith(Number),
  }).from(job);

  const successRate = jobStats.total > 0 
    ? ((jobStats.completed / jobStats.total) * 100).toFixed(2) 
    : "0.00";

  return {
    totalJobs: jobStats.total ?? 0,
    completedJobs: jobStats.completed ?? 0,
    failedJobs: jobStats.failed ?? 0,
    processingJobs: jobStats.processing ?? 0,
    failedToday: jobStats.failedToday ?? 0,
    successRate: Number(successRate),
  };
}

/**
 * 3. RECENT FAILED JOBS LOG
 * Useful for the admin table to quickly debug issues
 */
export async function getRecentFailedJobs(limitAmount = 10) {
  return await db
    .select({
      id: job.id,
      jobName: job.name,
      workflowType: job.workflowType,
      failedReason: job.failedReason,
      createdAt: job.createdAt,
      projectName: project.name,
      userEmail: user.email,
    })
    .from(job)
    .leftJoin(project, eq(job.projectId, project.id))
    .leftJoin(user, eq(job.userId, user.id))
    .where(eq(job.status, "failed"))
    .orderBy(desc(job.createdAt))
    .limit(limitAmount);
}

/**
 * 4. PROJECT & FEATURE ADOPTION METRICS
 */
export async function getProjectAndFeatureMetrics() {
  const [
    [projectStats],
    [promptsResult],
    [onboardingResult]
  ] = await Promise.all([
    // Get total projects and average size
    db.select({
      totalProjects: count(),
      avgRowsPerProject: sql`AVG(${project.totalRows})`.mapWith(Number),
    }).from(project),
    
    // Count total custom prompt templates created
    db.select({ value: count() }).from(promptTemplates),
    
    // Count how many users have finished onboarding (welcome email sent)
    db.select({ value: count() }).from(userProfile).where(eq(userProfile.welcomeEmailSent, true)),
  ]);

  return {
    totalProjects: projectStats?.totalProjects ?? 0,
    averageProjectSize: Math.round(projectStats?.avgRowsPerProject ?? 0),
    totalCustomPrompts: promptsResult?.value ?? 0,
    usersOnboarded: onboardingResult?.value ?? 0,
  };
}

/**
 * 5. WORKFLOW POPULARITY
 * Returns an array of workflow types and how many times they've been run
 */
export async function getWorkflowPopularity() {
  return await db
    .select({
      workflowType: job.workflowType,
      count: count(),
    })
    .from(job)
    .where(sql`${job.workflowType} IS NOT NULL`)
    .groupBy(job.workflowType)
    .orderBy(desc(count()));
}

export async function getDailyUserSignups(days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const data = await db
    .select({
      date: sql<string>`to_char(${user.createdAt}, 'Mon DD')`,
      sortDate: sql<string>`DATE(${user.createdAt})`,
      newUsers: count(), // Counting actual new registrations
    })
    .from(user)
    .where(gte(user.createdAt, startDate))
    .groupBy(
      sql`to_char(${user.createdAt}, 'Mon DD')`, 
      sql`DATE(${user.createdAt})`
    )
    .orderBy(sql`DATE(${user.createdAt})`);

  return data;


export async function getPaginatedUsers(page: number = 1, limit: number = 10) {
  const offset = (page - 1) * limit;

  // 1. Fetch the paginated users with distinct counts
  const data = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
      // Use DISTINCT to prevent inflated counts when joining multiple tables
      workflowCount: sql<number>`COUNT(DISTINCT ${job.id})`.mapWith(Number),
      tablesImported: sql<number>`COUNT(DISTINCT ${project.id})`.mapWith(Number), 
    })
    .from(user)
    .leftJoin(job, eq(user.id, job.userId))
    .leftJoin(project, eq(user.id, project.userId)) // <-- Join the project table
    .groupBy(user.id)
    .orderBy(desc(user.createdAt)) 
    .limit(limit)
    .offset(offset);

  // 2. Get the total count of users
  const [{ total }] = await db.select({ total: count() }).from(user);

  return {
    users: data,
    totalPages: Math.ceil(total / limit),
    currentPage: page,
    totalUsers: total,
  };
}
export async function getDailySignIns(days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const data = await db
    .select({
      // Format the date for the chart X-axis (e.g., 'Oct 12')
      date: sql<string>`to_char(${session.updatedAt}, 'Mon DD')`,
      sortDate: sql<string>`DATE(${session.updatedAt})`,
      
      // We use COUNT(DISTINCT) so if a user logs in 5 times in one day, 
      // they only count as 1 active user for that day.
      signIns: sql<number>`COUNT(DISTINCT ${session.userId})`.mapWith(Number),
    })
    .from(session)
    .where(gte(session.updatedAt, startDate))
    .groupBy(
      sql`to_char(${session.updatedAt}, 'Mon DD')`, 
      sql`DATE(${session.updatedAt})`
    )
    .orderBy(sql`DATE(${session.updatedAt})`);

  return data;
}

export async function getPaginatedFailedJobs(page: number = 1, limit: number = 5) {
  const offset = (page - 1) * limit;

  // 1. Fetch the paginated failed jobs
  const data = await db
    .select({
      id: job.id,
      jobName: job.name,
      workflowType: job.workflowType,
      failedReason: job.failedReason,
      createdAt: job.createdAt,
      projectName: project.name,
      userEmail: user.email,
    })
    .from(job)
    .leftJoin(project, eq(job.projectId, project.id))
    .leftJoin(user, eq(job.userId, user.id))
    .where(eq(job.status, "failed"))
    .orderBy(desc(job.createdAt))
    .limit(limit)
    .offset(offset);

  // 2. Get the total count of failed jobs for pagination math
  const [{ total }] = await db
    .select({ total: count() })
    .from(job)
    .where(eq(job.status, "failed"));

  return {
    jobs: data,
    totalPages: Math.ceil(total / limit),
    currentPage: page,
    totalJobs: total,
  };
}
