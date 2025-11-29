import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  getUserByAddress, 
  getUserByFid, 
  verifyAllTasks, 
  verifyTask 
} from "./neynar";
import { randomUUID } from "crypto";
import { ethers } from "ethers";

// Backend signer for mint signatures
// In development, we generate a new wallet for testing
// In production, set BACKEND_SIGNER_KEY environment variable
const getBackendSigner = (): ethers.Wallet => {
  const privateKey = process.env.BACKEND_SIGNER_KEY;
  if (privateKey) {
    return new ethers.Wallet(privateKey);
  }
  // For development/demo, create a deterministic wallet (NOT FOR PRODUCTION)
  const devWallet = ethers.Wallet.createRandom();
  console.log('[DEV MODE] Generated temporary signer wallet. Set BACKEND_SIGNER_KEY for production.');
  return devWallet;
};

const backendSigner = getBackendSigner();

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // ==================== Lottery Stats ====================
  
  // Get lottery statistics
  app.get('/api/lottery/stats', async (req, res) => {
    try {
      const config = await storage.getLotteryConfig();
      const participantCount = await storage.getMintedParticipantCount();
      const winners = await storage.getAllWinners();
      
      // Calculate winners count based on participants
      let winnersCount = 0;
      if (participantCount >= 2000) winnersCount = 4;
      else if (participantCount >= 1000) winnersCount = 3;
      else if (participantCount >= 500) winnersCount = 2;
      else if (participantCount >= 100) winnersCount = 1;

      res.json({
        participantCount,
        prizePoolEth: config?.prizePoolEth || '0',
        endTime: config?.endTime || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        isActive: config?.isActive ?? true,
        winnersCount: config?.winnersDrawn ? winners.length : winnersCount,
      });
    } catch (error) {
      console.error('Error getting lottery stats:', error);
      res.status(500).json({ error: 'Failed to get lottery stats' });
    }
  });

  // ==================== User Status ====================
  
  // Get user status by wallet address
  app.get('/api/user/status', async (req, res) => {
    try {
      const walletAddress = req.query.address as string;
      
      if (!walletAddress) {
        return res.json({
          tasks: { liked: false, recasted: false, followed: false },
          hasMinted: false,
        });
      }

      const participant = await storage.getParticipantByWallet(walletAddress);
      
      if (!participant) {
        return res.json({
          tasks: { liked: false, recasted: false, followed: false },
          hasMinted: false,
        });
      }

      res.json({
        tasks: {
          liked: participant.hasLiked,
          recasted: participant.hasRecasted,
          followed: participant.hasFollowed,
        },
        hasMinted: participant.hasMinted,
        mintTxHash: participant.mintTxHash,
      });
    } catch (error) {
      console.error('Error getting user status:', error);
      res.status(500).json({ error: 'Failed to get user status' });
    }
  });

  // ==================== Task Verification ====================
  
  // Verify tasks for a user
  app.post('/api/tasks/verify', async (req, res) => {
    try {
      const { walletAddress, taskType } = req.body;
      
      if (!walletAddress) {
        return res.status(400).json({ error: 'Wallet address required' });
      }

      // Get Farcaster user by wallet address
      const farcasterUser = await getUserByAddress(walletAddress);
      
      if (!farcasterUser) {
        return res.status(404).json({ 
          error: 'No Farcaster account found for this wallet. Please connect your Farcaster account first.',
          success: false,
          tasks: { liked: false, recasted: false, followed: false },
        });
      }

      const config = await storage.getLotteryConfig();
      if (!config) {
        return res.status(500).json({ error: 'Lottery not configured' });
      }

      // Get or create participant
      let participant = await storage.getParticipantByWallet(walletAddress);
      
      if (!participant) {
        participant = await storage.createParticipant({
          id: randomUUID(),
          walletAddress: walletAddress.toLowerCase(),
          farcasterFid: farcasterUser.fid,
          farcasterUsername: farcasterUser.username,
          hasLiked: false,
          hasRecasted: false,
          hasFollowed: false,
          hasMinted: false,
          mintTxHash: null,
        });
      }

      // Verify tasks
      let tasks;
      if (taskType) {
        // Verify specific task
        const result = await verifyTask(
          farcasterUser.fid,
          taskType,
          config.targetCastHash,
          config.targetUserFid
        );
        
        tasks = {
          liked: taskType === 'like' ? result : participant.hasLiked,
          recasted: taskType === 'recast' ? result : participant.hasRecasted,
          followed: taskType === 'follow' ? result : participant.hasFollowed,
        };
      } else {
        // Verify all tasks
        tasks = await verifyAllTasks(
          farcasterUser.fid,
          config.targetCastHash,
          config.targetUserFid
        );
      }

      // Update participant
      await storage.updateParticipant(participant.id, {
        hasLiked: tasks.liked,
        hasRecasted: tasks.recasted,
        hasFollowed: tasks.followed,
      });

      res.json({
        success: true,
        tasks,
        message: tasks.liked && tasks.recasted && tasks.followed 
          ? 'All tasks completed! You can now mint your SBT.'
          : 'Tasks verified. Complete all tasks to mint your SBT.',
      });
    } catch (error) {
      console.error('Error verifying tasks:', error);
      res.status(500).json({ error: 'Failed to verify tasks' });
    }
  });

  // ==================== Minting ====================
  
  // Check mint eligibility and get signature
  app.post('/api/mint', async (req, res) => {
    try {
      const { walletAddress } = req.body;
      
      if (!walletAddress) {
        return res.status(400).json({ error: 'Wallet address required' });
      }

      const participant = await storage.getParticipantByWallet(walletAddress);
      
      if (!participant) {
        return res.status(404).json({ 
          error: 'Please complete tasks first',
          eligible: false,
        });
      }

      if (participant.hasMinted) {
        return res.status(400).json({ 
          error: 'Already minted',
          eligible: false,
        });
      }

      if (!participant.hasLiked || !participant.hasRecasted || !participant.hasFollowed) {
        return res.status(400).json({ 
          error: 'Complete all tasks first',
          eligible: false,
          tasks: {
            liked: participant.hasLiked,
            recasted: participant.hasRecasted,
            followed: participant.hasFollowed,
          },
        });
      }

      // Generate signature for minting
      const messageHash = ethers.solidityPackedKeccak256(
        ['address', 'uint256'],
        [walletAddress, participant.farcasterFid]
      );
      const signature = await backendSigner.signMessage(ethers.getBytes(messageHash));

      // For now, simulate mint success (in production, this would wait for on-chain confirmation)
      const mockTxHash = `0x${randomUUID().replace(/-/g, '')}`;
      
      await storage.updateParticipant(participant.id, {
        hasMinted: true,
        mintTxHash: mockTxHash,
      });

      res.json({
        success: true,
        signature,
        farcasterFid: participant.farcasterFid,
        txHash: mockTxHash,
        message: 'SBT minted successfully! You are now entered in the lottery.',
      });
    } catch (error) {
      console.error('Error minting:', error);
      res.status(500).json({ error: 'Failed to mint' });
    }
  });

  // ==================== Admin Routes ====================
  
  // Get admin config
  app.get('/api/admin/config', async (req, res) => {
    try {
      const config = await storage.getLotteryConfig();
      res.json(config);
    } catch (error) {
      console.error('Error getting config:', error);
      res.status(500).json({ error: 'Failed to get config' });
    }
  });

  // Update admin config
  app.patch('/api/admin/config', async (req, res) => {
    try {
      const updates = req.body;
      const config = await storage.updateLotteryConfig(updates);
      res.json(config);
    } catch (error) {
      console.error('Error updating config:', error);
      res.status(500).json({ error: 'Failed to update config' });
    }
  });

  // Get winners
  app.get('/api/admin/winners', async (req, res) => {
    try {
      const winners = await storage.getAllWinners();
      res.json(winners);
    } catch (error) {
      console.error('Error getting winners:', error);
      res.status(500).json({ error: 'Failed to get winners' });
    }
  });

  // Get participants
  app.get('/api/admin/participants', async (req, res) => {
    try {
      const count = await storage.getParticipantCount();
      const recent = await storage.getRecentParticipants(20);
      res.json({ count, recent });
    } catch (error) {
      console.error('Error getting participants:', error);
      res.status(500).json({ error: 'Failed to get participants' });
    }
  });

  // Draw winners
  app.post('/api/admin/draw', async (req, res) => {
    try {
      const config = await storage.getLotteryConfig();
      if (!config) {
        return res.status(500).json({ error: 'Lottery not configured' });
      }

      if (config.winnersDrawn) {
        return res.status(400).json({ error: 'Winners already drawn' });
      }

      const participants = await storage.getAllParticipants();
      const mintedParticipants = participants.filter(p => p.hasMinted);
      
      if (mintedParticipants.length < 100) {
        return res.status(400).json({ error: 'Not enough participants (minimum 100)' });
      }

      // Calculate winner count
      let winnerCount = 0;
      if (mintedParticipants.length >= 2000) winnerCount = 4;
      else if (mintedParticipants.length >= 1000) winnerCount = 3;
      else if (mintedParticipants.length >= 500) winnerCount = 2;
      else winnerCount = 1;

      // Randomly select winners
      const shuffled = [...mintedParticipants].sort(() => Math.random() - 0.5);
      const selectedWinners = shuffled.slice(0, winnerCount);

      // Create winner records
      const prizePerWinner = '0.002'; // ~$5 in ETH
      
      for (const winner of selectedWinners) {
        await storage.createWinner({
          id: randomUUID(),
          participantId: winner.id,
          walletAddress: winner.walletAddress,
          prizeAmount: prizePerWinner,
          claimTxHash: null,
        });
      }

      // Update config
      await storage.updateLotteryConfig({
        winnersDrawn: true,
        isActive: false,
      });

      res.json({
        success: true,
        winnersCount: winnerCount,
        winners: selectedWinners.map(w => ({
          walletAddress: w.walletAddress,
          farcasterUsername: w.farcasterUsername,
        })),
      });
    } catch (error) {
      console.error('Error drawing winners:', error);
      res.status(500).json({ error: 'Failed to draw winners' });
    }
  });

  return httpServer;
}
