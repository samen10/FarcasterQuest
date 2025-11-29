import { pgTable, text, varchar, boolean, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Participants table - stores users who have minted SBT
export const participants = pgTable("participants", {
  id: varchar("id", { length: 255 }).primaryKey(),
  walletAddress: varchar("wallet_address", { length: 42 }).notNull().unique(),
  farcasterFid: integer("farcaster_fid").notNull(),
  farcasterUsername: varchar("farcaster_username", { length: 255 }),
  hasLiked: boolean("has_liked").default(false).notNull(),
  hasRecasted: boolean("has_recasted").default(false).notNull(),
  hasFollowed: boolean("has_followed").default(false).notNull(),
  hasMinted: boolean("has_minted").default(false).notNull(),
  mintTxHash: varchar("mint_tx_hash", { length: 66 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Lottery configuration table
export const lotteryConfig = pgTable("lottery_config", {
  id: varchar("id", { length: 255 }).primaryKey().default("main"),
  targetCastHash: varchar("target_cast_hash", { length: 255 }).notNull(),
  targetUserFid: integer("target_user_fid").notNull(),
  targetUsername: varchar("target_username", { length: 255 }),
  prizePoolEth: varchar("prize_pool_eth", { length: 100 }).default("0").notNull(),
  endTime: timestamp("end_time").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  winnersDrawn: boolean("winners_drawn").default(false).notNull(),
  contractAddress: varchar("contract_address", { length: 42 }),
});

// Winners table
export const winners = pgTable("winners", {
  id: varchar("id", { length: 255 }).primaryKey(),
  participantId: varchar("participant_id", { length: 255 }).notNull(),
  walletAddress: varchar("wallet_address", { length: 42 }).notNull(),
  prizeAmount: varchar("prize_amount", { length: 100 }).notNull(),
  claimTxHash: varchar("claim_tx_hash", { length: 66 }),
  drawnAt: timestamp("drawn_at").defaultNow().notNull(),
});

// Insert schemas
export const insertParticipantSchema = createInsertSchema(participants).omit({
  createdAt: true,
});

export const insertLotteryConfigSchema = createInsertSchema(lotteryConfig).omit({
  id: true,
});

export const insertWinnerSchema = createInsertSchema(winners).omit({
  drawnAt: true,
});

// Types
export type Participant = typeof participants.$inferSelect;
export type InsertParticipant = z.infer<typeof insertParticipantSchema>;

export type LotteryConfig = typeof lotteryConfig.$inferSelect;
export type InsertLotteryConfig = z.infer<typeof insertLotteryConfigSchema>;

export type Winner = typeof winners.$inferSelect;
export type InsertWinner = z.infer<typeof insertWinnerSchema>;

// Task status type for frontend
export interface TaskStatus {
  liked: boolean;
  recasted: boolean;
  followed: boolean;
}

// Lottery stats type for frontend
export interface LotteryStats {
  participantCount: number;
  prizePoolEth: string;
  endTime: Date;
  isActive: boolean;
  winnersCount: number;
}

// API Response types
export interface VerifyTasksResponse {
  success: boolean;
  tasks: TaskStatus;
  message?: string;
}

export interface MintEligibilityResponse {
  eligible: boolean;
  reason?: string;
  tasks: TaskStatus;
}

// Legacy user types for compatibility
export const users = pgTable("users", {
  id: varchar("id", { length: 255 }).primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
