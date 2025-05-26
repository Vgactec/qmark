import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const vulnerabilities = pgTable("vulnerabilities", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(),
  severity: text("severity").notNull(),
  file: text("file").notNull(),
  line: integer("line"),
  description: text("description").notNull(),
  recommendation: text("recommendation").notNull(),
  status: text("status").notNull().default("open"),
  detectedAt: timestamp("detected_at").defaultNow().notNull(),
  fixedAt: timestamp("fixed_at"),
});

export const securityScans = pgTable("security_scans", {
  id: serial("id").primaryKey(),
  repository: text("repository").notNull(),
  branch: text("branch").notNull().default("main"),
  totalVulnerabilities: integer("total_vulnerabilities").notNull().default(0),
  criticalCount: integer("critical_count").notNull().default(0),
  highCount: integer("high_count").notNull().default(0),
  mediumCount: integer("medium_count").notNull().default(0),
  lowCount: integer("low_count").notNull().default(0),
  status: text("status").notNull().default("running"),
  startedAt: timestamp("started_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
  metadata: jsonb("metadata"),
});

export const remediationTasks = pgTable("remediation_tasks", {
  id: serial("id").primaryKey(),
  vulnerabilityId: integer("vulnerability_id").references(() => vulnerabilities.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  priority: text("priority").notNull(),
  category: text("category").notNull(),
  affectedFiles: text("affected_files").array(),
  autoFixAvailable: boolean("auto_fix_available").notNull().default(false),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
});

export const insertVulnerabilitySchema = createInsertSchema(vulnerabilities).omit({
  id: true,
  detectedAt: true,
  fixedAt: true,
});

export const insertSecurityScanSchema = createInsertSchema(securityScans).omit({
  id: true,
  startedAt: true,
  completedAt: true,
});

export const insertRemediationTaskSchema = createInsertSchema(remediationTasks).omit({
  id: true,
  createdAt: true,
  completedAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Vulnerability = typeof vulnerabilities.$inferSelect;
export type InsertVulnerability = z.infer<typeof insertVulnerabilitySchema>;
export type SecurityScan = typeof securityScans.$inferSelect;
export type InsertSecurityScan = z.infer<typeof insertSecurityScanSchema>;
export type RemediationTask = typeof remediationTasks.$inferSelect;
export type InsertRemediationTask = z.infer<typeof insertRemediationTaskSchema>;
