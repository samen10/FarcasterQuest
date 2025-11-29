import { 
  type Participant, 
  type InsertParticipant,
  type LotteryConfig,
  type InsertLotteryConfig,
  type Winner,
  type InsertWinner,
  type User, 
  type InsertUser 
} from "@shared/schema";
import { randomUUID } from "crypto";

// Storage interface for the lottery application
export interface IStorage {
  // Participant operations
  getParticipant(id: string): Promise<Participant | undefined>;
  getParticipantByWallet(walletAddress: string): Promise<Participant | undefined>;
  getParticipantByFid(fid: number): Promise<Participant | undefined>;
  createParticipant(participant: InsertParticipant): Promise<Participant>;
  updateParticipant(id: string, updates: Partial<Participant>): Promise<Participant | undefined>;
  getAllParticipants(): Promise<Participant[]>;
  getParticipantCount(): Promise<number>;
  getMintedParticipantCount(): Promise<number>;
  getRecentParticipants(limit: number): Promise<Participant[]>;

  // Lottery config operations
  getLotteryConfig(): Promise<LotteryConfig | undefined>;
  updateLotteryConfig(updates: Partial<LotteryConfig>): Promise<LotteryConfig | undefined>;
  createLotteryConfig(config: InsertLotteryConfig): Promise<LotteryConfig>;

  // Winner operations
  createWinner(winner: InsertWinner): Promise<Winner>;
  getAllWinners(): Promise<Winner[]>;
  getWinnerByWallet(walletAddress: string): Promise<Winner | undefined>;
  updateWinner(id: string, updates: Partial<Winner>): Promise<Winner | undefined>;

  // User operations (legacy)
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
}

export class MemStorage implements IStorage {
  private participants: Map<string, Participant>;
  private lotteryConfig: LotteryConfig | undefined;
  private winners: Map<string, Winner>;
  private users: Map<string, User>;

  constructor() {
    this.participants = new Map();
    this.winners = new Map();
    this.users = new Map();
    
    // Initialize default lottery config
    this.lotteryConfig = {
      id: 'main',
      targetCastHash: '0x7d607440',
      targetUserFid: 0,
      targetUsername: 'football',
      prizePoolEth: '0.02',
      endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      isActive: true,
      winnersDrawn: false,
      contractAddress: null,
    };
  }

  // Participant operations
  async getParticipant(id: string): Promise<Participant | undefined> {
    return this.participants.get(id);
  }

  async getParticipantByWallet(walletAddress: string): Promise<Participant | undefined> {
    const lowerAddress = walletAddress.toLowerCase();
    return Array.from(this.participants.values()).find(
      (p) => p.walletAddress.toLowerCase() === lowerAddress
    );
  }

  async getParticipantByFid(fid: number): Promise<Participant | undefined> {
    return Array.from(this.participants.values()).find(
      (p) => p.farcasterFid === fid
    );
  }

  async createParticipant(insertParticipant: InsertParticipant): Promise<Participant> {
    const id = randomUUID();
    const participant: Participant = {
      ...insertParticipant,
      id,
      createdAt: new Date(),
    };
    this.participants.set(id, participant);
    return participant;
  }

  async updateParticipant(id: string, updates: Partial<Participant>): Promise<Participant | undefined> {
    const participant = this.participants.get(id);
    if (!participant) return undefined;
    
    const updated = { ...participant, ...updates };
    this.participants.set(id, updated);
    return updated;
  }

  async getAllParticipants(): Promise<Participant[]> {
    return Array.from(this.participants.values());
  }

  async getParticipantCount(): Promise<number> {
    return this.participants.size;
  }

  async getMintedParticipantCount(): Promise<number> {
    return Array.from(this.participants.values()).filter(p => p.hasMinted).length;
  }

  async getRecentParticipants(limit: number): Promise<Participant[]> {
    return Array.from(this.participants.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  // Lottery config operations
  async getLotteryConfig(): Promise<LotteryConfig | undefined> {
    return this.lotteryConfig;
  }

  async updateLotteryConfig(updates: Partial<LotteryConfig>): Promise<LotteryConfig | undefined> {
    if (!this.lotteryConfig) return undefined;
    
    this.lotteryConfig = { ...this.lotteryConfig, ...updates };
    return this.lotteryConfig;
  }

  async createLotteryConfig(config: InsertLotteryConfig): Promise<LotteryConfig> {
    this.lotteryConfig = {
      id: 'main',
      ...config,
    };
    return this.lotteryConfig;
  }

  // Winner operations
  async createWinner(insertWinner: InsertWinner): Promise<Winner> {
    const winner: Winner = {
      ...insertWinner,
      drawnAt: new Date(),
    };
    this.winners.set(insertWinner.id, winner);
    return winner;
  }

  async getAllWinners(): Promise<Winner[]> {
    return Array.from(this.winners.values());
  }

  async getWinnerByWallet(walletAddress: string): Promise<Winner | undefined> {
    const lowerAddress = walletAddress.toLowerCase();
    return Array.from(this.winners.values()).find(
      (w) => w.walletAddress.toLowerCase() === lowerAddress
    );
  }

  async updateWinner(id: string, updates: Partial<Winner>): Promise<Winner | undefined> {
    const winner = this.winners.get(id);
    if (!winner) return undefined;
    
    const updated = { ...winner, ...updates };
    this.winners.set(id, updated);
    return updated;
  }

  // User operations (legacy)
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
}

export const storage = new MemStorage();
