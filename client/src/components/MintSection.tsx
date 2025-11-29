import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Lock, 
  Sparkles, 
  CheckCircle2, 
  Loader2, 
  Shield,
  Hexagon,
  ExternalLink
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import type { TaskStatus } from '@shared/schema';
import confetti from 'canvas-confetti';

interface MintSectionProps {
  tasks: TaskStatus;
  hasMinted: boolean;
  isMinting: boolean;
  mintTxHash?: string;
  onMint: () => void;
  isWalletConnected: boolean;
}

export function MintSection({
  tasks,
  hasMinted,
  isMinting,
  mintTxHash,
  onMint,
  isWalletConnected,
}: MintSectionProps) {
  const allTasksCompleted = tasks.liked && tasks.recasted && tasks.followed;
  const canMint = allTasksCompleted && !hasMinted && isWalletConnected;

  const handleMint = () => {
    if (canMint) {
      onMint();
    }
  };

  const triggerConfetti = () => {
    const duration = 2000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

    const interval = window.setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        colors: ['#3b82f6', '#60a5fa', '#93c5fd', '#1d4ed8'],
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        colors: ['#3b82f6', '#60a5fa', '#93c5fd', '#1d4ed8'],
      });
    }, 250);
  };

  // Trigger confetti when mint is successful
  if (hasMinted && mintTxHash) {
    // Only trigger once
    const hasTriggered = sessionStorage.getItem(`confetti-${mintTxHash}`);
    if (!hasTriggered) {
      sessionStorage.setItem(`confetti-${mintTxHash}`, 'true');
      setTimeout(triggerConfetti, 100);
    }
  }

  const completedCount = [tasks.liked, tasks.recasted, tasks.followed].filter(Boolean).length;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay: 0.2 }}
    >
      <Card 
        className={cn(
          'relative overflow-visible transition-all duration-500',
          hasMinted 
            ? 'bg-gradient-to-br from-success/10 to-success/5 border-success/30 border-2' 
            : canMint
            ? 'base-gradient border-0 animate-pulse-glow'
            : 'border border-border'
        )}
        data-testid="card-mint-section"
      >
        {/* Decorative Elements */}
        {canMint && !hasMinted && (
          <div className="absolute -top-2 -right-2">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            >
              <Sparkles className="w-6 h-6 text-yellow-400" />
            </motion.div>
          </div>
        )}

        <CardHeader className="pb-2">
          <div className="flex items-center justify-between gap-4">
            <CardTitle className={cn(
              'flex items-center gap-2',
              hasMinted ? 'text-success' : canMint ? 'text-white' : 'text-foreground'
            )}>
              <Hexagon className="w-5 h-5" />
              Soulbound Token (SBT)
            </CardTitle>
            <Badge 
              variant={hasMinted ? 'default' : 'secondary'}
              className={cn(
                hasMinted && 'bg-success text-success-foreground'
              )}
            >
              {hasMinted ? 'Minted' : `${completedCount}/3 Tasks`}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* SBT Preview */}
          <div className="flex justify-center py-4">
            <motion.div
              className={cn(
                'relative w-32 h-32 rounded-2xl flex items-center justify-center',
                hasMinted 
                  ? 'bg-gradient-to-br from-success to-emerald-600' 
                  : canMint
                  ? 'bg-white/20 backdrop-blur-sm'
                  : 'bg-muted'
              )}
              animate={hasMinted ? { scale: [1, 1.05, 1] } : {}}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Hexagon 
                className={cn(
                  'w-16 h-16',
                  hasMinted ? 'text-white' : canMint ? 'text-white/80' : 'text-muted-foreground'
                )} 
              />
              
              {/* Status Overlay */}
              <AnimatePresence>
                {hasMinted && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -bottom-2 -right-2 bg-success rounded-full p-1"
                  >
                    <CheckCircle2 className="w-6 h-6 text-white" />
                  </motion.div>
                )}
                {!allTasksCompleted && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-0 bg-background/80 rounded-2xl flex items-center justify-center"
                  >
                    <Lock className="w-8 h-8 text-muted-foreground" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>

          {/* Status Messages */}
          <div className="text-center space-y-2">
            {hasMinted ? (
              <>
                <p className="font-semibold text-success">
                  Congratulations! You're in the lottery!
                </p>
                <p className="text-sm text-muted-foreground">
                  Your SBT has been minted successfully. Good luck!
                </p>
                {mintTxHash && (
                  <a
                    href={`https://basescan.org/tx/${mintTxHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                    data-testid="link-tx-hash"
                  >
                    <ExternalLink className="w-3 h-3" />
                    View Transaction
                  </a>
                )}
              </>
            ) : !allTasksCompleted ? (
              <>
                <p className="font-medium text-foreground">
                  Complete all tasks to unlock
                </p>
                <p className="text-sm text-muted-foreground">
                  Finish the 3 social tasks above to mint your SBT
                </p>
              </>
            ) : !isWalletConnected ? (
              <>
                <p className="font-medium text-white">
                  Connect your wallet
                </p>
                <p className="text-sm text-white/70">
                  Connect your wallet to mint your SBT
                </p>
              </>
            ) : (
              <>
                <p className="font-medium text-white">
                  Ready to mint!
                </p>
                <p className="text-sm text-white/70">
                  Claim your Soulbound Token to enter the lottery
                </p>
              </>
            )}
          </div>

          {/* Mint Button */}
          <Button
            className={cn(
              'w-full h-12 text-base font-semibold gap-2',
              canMint 
                ? 'bg-white text-primary hover:bg-white/90' 
                : hasMinted
                ? 'bg-success/20 text-success border border-success/30'
                : ''
            )}
            disabled={!canMint || isMinting}
            onClick={handleMint}
            data-testid="button-mint-sbt"
          >
            {isMinting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Minting...
              </>
            ) : hasMinted ? (
              <>
                <CheckCircle2 className="w-5 h-5" />
                SBT Minted
              </>
            ) : !allTasksCompleted ? (
              <>
                <Lock className="w-5 h-5" />
                Complete Tasks First
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Mint Your SBT
              </>
            )}
          </Button>

          {/* Security Badge */}
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Shield className="w-3 h-3" />
            <span>Verified on Base Network</span>
            <span className="text-border">|</span>
            <span>One mint per wallet</span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
