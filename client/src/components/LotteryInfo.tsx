import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Trophy, 
  Users, 
  Clock, 
  Coins,
  TrendingUp
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { CountdownTimer } from './CountdownTimer';
import { formatEth } from '@/lib/wagmiConfig';

interface LotteryInfoProps {
  participantCount: number;
  prizePoolEth: string;
  endTime: Date;
  isActive: boolean;
}

// Winner count based on participants
function getWinnersCount(participants: number): number {
  if (participants >= 2000) return 4;
  if (participants >= 1000) return 3;
  if (participants >= 500) return 2;
  if (participants >= 100) return 1;
  return 0;
}

// Prize per winner (5 ETH equivalent shown as $5)
const PRIZE_PER_WINNER = '0.002'; // ~$5 at current rates

// Milestones for progress visualization
const MILESTONES = [
  { count: 100, winners: 1, label: '100' },
  { count: 500, winners: 2, label: '500' },
  { count: 1000, winners: 3, label: '1K' },
  { count: 2000, winners: 4, label: '2K+' },
];

export function LotteryInfo({
  participantCount,
  prizePoolEth,
  endTime,
  isActive,
}: LotteryInfoProps) {
  const winnersCount = getWinnersCount(participantCount);
  const currentMilestoneIndex = MILESTONES.findIndex(m => participantCount < m.count);
  const progressPercent = currentMilestoneIndex === -1 
    ? 100 
    : currentMilestoneIndex === 0
    ? (participantCount / MILESTONES[0].count) * 25
    : ((currentMilestoneIndex * 25) + ((participantCount - MILESTONES[currentMilestoneIndex - 1].count) / (MILESTONES[currentMilestoneIndex].count - MILESTONES[currentMilestoneIndex - 1].count) * 25));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.3 }}
    >
      <Card 
        className={cn(
          'relative overflow-visible',
          isActive ? 'border-primary/30 border-2' : 'border border-border'
        )}
        data-testid="card-lottery-info"
      >
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              Lottery Status
            </CardTitle>
            <Badge 
              variant={isActive ? 'default' : 'secondary'}
              className={isActive ? 'bg-success' : ''}
            >
              {isActive ? 'Active' : 'Ended'}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Countdown Timer */}
          {isActive && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>Time Remaining</span>
              </div>
              <CountdownTimer endTime={endTime} />
            </div>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            {/* Participants */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="w-4 h-4" />
                <span>Participants</span>
              </div>
              <motion.p 
                className="text-3xl font-bold text-foreground"
                key={participantCount}
                initial={{ scale: 1.2, color: 'hsl(var(--primary))' }}
                animate={{ scale: 1, color: 'hsl(var(--foreground))' }}
                transition={{ duration: 0.3 }}
                data-testid="text-participant-count"
              >
                {participantCount.toLocaleString()}
              </motion.p>
            </div>

            {/* Prize Pool */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Coins className="w-4 h-4" />
                <span>Prize Pool</span>
              </div>
              <p 
                className="text-3xl font-bold text-foreground font-mono"
                data-testid="text-prize-pool"
              >
                {formatEth(prizePoolEth)} <span className="text-lg text-muted-foreground">ETH</span>
              </p>
            </div>
          </div>

          {/* Winners Count */}
          <div className="p-4 rounded-lg bg-muted/50 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-medium">
                <TrendingUp className="w-4 h-4 text-primary" />
                <span>Current Winners</span>
              </div>
              <Badge variant="outline" className="text-primary border-primary">
                {winnersCount} {winnersCount === 1 ? 'Winner' : 'Winners'}
              </Badge>
            </div>

            {/* Milestones Progress */}
            <div className="space-y-2">
              <Progress value={progressPercent} className="h-2" />
              <div className="flex justify-between text-xs text-muted-foreground">
                {MILESTONES.map((milestone, index) => (
                  <div 
                    key={milestone.count}
                    className={cn(
                      'flex flex-col items-center',
                      participantCount >= milestone.count && 'text-primary font-medium'
                    )}
                  >
                    <span>{milestone.label}</span>
                    <span className="text-[10px]">
                      {milestone.winners}x
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Prize Distribution Info */}
            <p className="text-xs text-center text-muted-foreground">
              Each winner receives ~{PRIZE_PER_WINNER} ETH (~$5)
            </p>
          </div>

          {/* Next Milestone Hint */}
          {currentMilestoneIndex !== -1 && currentMilestoneIndex < MILESTONES.length && (
            <p className="text-sm text-center text-muted-foreground">
              <span className="font-medium text-primary">
                {MILESTONES[currentMilestoneIndex].count - participantCount}
              </span>{' '}
              more participants to unlock{' '}
              <span className="font-medium">
                {MILESTONES[currentMilestoneIndex].winners} winner{MILESTONES[currentMilestoneIndex].winners > 1 ? 's' : ''}
              </span>
            </p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
