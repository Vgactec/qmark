import {
  users,
  oauthConnections,
  leads,
  automations,
  activities,
  metrics,
  type User,
  type UpsertUser,
  type OauthConnection,
  type InsertOauthConnection,
  type Lead,
  type InsertLead,
  type Automation,
  type InsertAutomation,
  type Activity,
  type InsertActivity,
  type Metric,
  type InsertMetric,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gte, count } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // OAuth connections
  getOauthConnections(userId: string): Promise<OauthConnection[]>;
  getOauthConnection(id: number): Promise<OauthConnection | undefined>;
  createOauthConnection(connection: InsertOauthConnection): Promise<OauthConnection>;
  updateOauthConnection(id: number, updates: Partial<InsertOauthConnection>): Promise<OauthConnection | undefined>;
  deleteOauthConnection(id: number): Promise<void>;
  
  // Leads
  getLeads(userId: string, limit?: number): Promise<Lead[]>;
  createLead(lead: InsertLead): Promise<Lead>;
  updateLead(id: number, updates: Partial<InsertLead>): Promise<Lead | undefined>;
  
  // Automations
  getAutomations(userId: string): Promise<Automation[]>;
  createAutomation(automation: InsertAutomation): Promise<Automation>;
  updateAutomation(id: number, updates: Partial<InsertAutomation>): Promise<Automation | undefined>;
  
  // Activities
  getActivities(userId: string, limit?: number): Promise<Activity[]>;
  createActivity(activity: InsertActivity): Promise<Activity>;
  
  // Metrics
  getMetrics(userId: string, fromDate?: Date): Promise<Metric[]>;
  createOrUpdateMetric(metric: InsertMetric): Promise<Metric>;
  getDashboardStats(userId: string): Promise<{
    totalLeads: number;
    totalConversions: number;
    activeAutomations: number;
    totalRevenue: string;
  }>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // OAuth connections
  async getOauthConnections(userId: string): Promise<OauthConnection[]> {
    return await db
      .select()
      .from(oauthConnections)
      .where(eq(oauthConnections.userId, userId))
      .orderBy(desc(oauthConnections.createdAt));
  }

  async getOauthConnection(id: number): Promise<OauthConnection | undefined> {
    const [connection] = await db
      .select()
      .from(oauthConnections)
      .where(eq(oauthConnections.id, id));
    return connection;
  }

  async createOauthConnection(connection: InsertOauthConnection): Promise<OauthConnection> {
    const [newConnection] = await db
      .insert(oauthConnections)
      .values(connection)
      .returning();
    return newConnection;
  }

  async updateOauthConnection(
    id: number,
    updates: Partial<InsertOauthConnection>
  ): Promise<OauthConnection | undefined> {
    const [connection] = await db
      .update(oauthConnections)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(oauthConnections.id, id))
      .returning();
    return connection;
  }

  async deleteOauthConnection(id: number): Promise<void> {
    await db.delete(oauthConnections).where(eq(oauthConnections.id, id));
  }

  // Leads
  async getLeads(userId: string, limit = 50): Promise<Lead[]> {
    return await db
      .select()
      .from(leads)
      .where(eq(leads.userId, userId))
      .orderBy(desc(leads.createdAt))
      .limit(limit);
  }

  async createLead(lead: InsertLead): Promise<Lead> {
    const [newLead] = await db.insert(leads).values(lead).returning();
    return newLead;
  }

  async updateLead(id: number, updates: Partial<InsertLead>): Promise<Lead | undefined> {
    const [lead] = await db
      .update(leads)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(leads.id, id))
      .returning();
    return lead;
  }

  // Automations
  async getAutomations(userId: string): Promise<Automation[]> {
    return await db
      .select()
      .from(automations)
      .where(eq(automations.userId, userId))
      .orderBy(desc(automations.createdAt));
  }

  async createAutomation(automation: InsertAutomation): Promise<Automation> {
    const [newAutomation] = await db.insert(automations).values(automation).returning();
    return newAutomation;
  }

  async updateAutomation(
    id: number,
    updates: Partial<InsertAutomation>
  ): Promise<Automation | undefined> {
    const [automation] = await db
      .update(automations)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(automations.id, id))
      .returning();
    return automation;
  }

  // Activities
  async getActivities(userId: string, limit = 20): Promise<Activity[]> {
    return await db
      .select()
      .from(activities)
      .where(eq(activities.userId, userId))
      .orderBy(desc(activities.createdAt))
      .limit(limit);
  }

  async createActivity(activity: InsertActivity): Promise<Activity> {
    const [newActivity] = await db.insert(activities).values(activity).returning();
    return newActivity;
  }

  // Metrics
  async getMetrics(userId: string, fromDate?: Date): Promise<Metric[]> {
    const whereCondition = fromDate
      ? and(eq(metrics.userId, userId), gte(metrics.date, fromDate))
      : eq(metrics.userId, userId);

    return await db
      .select()
      .from(metrics)
      .where(whereCondition)
      .orderBy(desc(metrics.date));
  }

  async createOrUpdateMetric(metric: InsertMetric): Promise<Metric> {
    const [existingMetric] = await db
      .select()
      .from(metrics)
      .where(
        and(
          eq(metrics.userId, metric.userId),
          eq(metrics.date, metric.date)
        )
      );

    if (existingMetric) {
      const [updatedMetric] = await db
        .update(metrics)
        .set(metric)
        .where(eq(metrics.id, existingMetric.id))
        .returning();
      return updatedMetric;
    } else {
      const [newMetric] = await db.insert(metrics).values(metric).returning();
      return newMetric;
    }
  }

  async getDashboardStats(userId: string): Promise<{
    totalLeads: number;
    totalConversions: number;
    activeAutomations: number;
    totalRevenue: string;
  }> {
    // Get total leads count
    const [leadsResult] = await db
      .select({ count: count() })
      .from(leads)
      .where(eq(leads.userId, userId));

    // Get conversions count (leads with status 'converted')
    const [conversionsResult] = await db
      .select({ count: count() })
      .from(leads)
      .where(and(eq(leads.userId, userId), eq(leads.status, "converted")));

    // Get active automations count
    const [automationsResult] = await db
      .select({ count: count() })
      .from(automations)
      .where(and(eq(automations.userId, userId), eq(automations.isActive, true)));

    // Get total revenue from current month
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const monthlyMetrics = await db
      .select()
      .from(metrics)
      .where(and(eq(metrics.userId, userId), gte(metrics.date, startOfMonth)));

    const totalRevenue = monthlyMetrics.reduce(
      (sum, metric) => sum + parseFloat(metric.revenue || "0"),
      0
    );

    return {
      totalLeads: leadsResult.count || 0,
      totalConversions: conversionsResult.count || 0,
      activeAutomations: automationsResult.count || 0,
      totalRevenue: totalRevenue.toFixed(2),
    };
  }
}

export const storage = new DatabaseStorage();
