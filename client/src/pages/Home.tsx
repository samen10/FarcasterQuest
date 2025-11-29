import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useQuery, useMutation } from '@tanstack/react-query';
import { TaskCard, type TaskType } from '@/components/TaskCard';
import { MintSection } from '@/components/MintSection';
import { LotteryInfo } from '@/components/LotteryInfo';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, RefreshCw, AlertCircle, Hexagon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import type { TaskStatus, LotteryStats } from '@shared/schema';
import { motion } from 'framer-motion';

export default function Home() {
  const { address, isConnected } = useAccount();
  const { toast } = useToast();
  const [verifyingTask, setVerifyingTask] = useState<TaskType | null>(null);

  // Fetch lottery stats
  const { data: lotteryStats, isLoading: isLoadingStats } = useQuery<LotteryStats>({
    queryKey: ['/api/lottery/stats'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch user task status
  const { 
    data: userStatus, 
    isLoading: isLoadingUser,
    refetch: refetchUserStatus 
  } = useQuery<{ tasks: TaskStatus; hasMinted: boolean; mintTxHash?: string }>({
    queryKey: ['/api/user/status', address],
    enabled: !!address,
  });

  // Verify tasks mutation
  const verifyTasksMutation = useMutation({
    mutationFn: async (taskType?: TaskType) => {
      const response = await apiRequest('POST', '/api/tasks/verify', { 
        walletAddress: address,
        taskType 
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user/status', address] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Verification Failed',
        description: error.message || 'Could not verify tasks. Please try again.',
        variant: 'destructive',
      });
    },
  });

  // Mint SBT mutation
  const mintMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/mint', { walletAddress: address });
      return response;
    },
    onSuccess: (data: any) => {
      toast({
        title: 'SBT Minted Successfully!',
        description: 'You are now entered in the lottery. Good luck!',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/user/status', address] });
      queryClient.invalidateQueries({ queryKey: ['/api/lottery/stats'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Minting Failed',
        description: error.message || 'Could not mint SBT. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const handleVerifyTask = async (taskType: TaskType) => {
    setVerifyingTask(taskType);
    try {
      await verifyTasksMutation.mutateAsync(taskType);
    } finally {
      setVerifyingTask(null);
    }
  };

  const handleVerifyAll = async () => {
    await verifyTasksMutation.mutateAsync();
  };

  const tasks: TaskStatus = userStatus?.tasks || {
    liked: false,
    recasted: false,
    followed: false,
  };

  const defaultStats: LotteryStats = {
    participantCount: 0,
    prizePoolEth: '0',
    endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    isActive: true,
    winnersCount: 0,
  };

  const stats = lotteryStats || defaultStats;

  // Target URLs for tasks (from config)
  const targetCastUrl = 'https://farcaster.xyz/football/0x7d607440';
  const targetUserUrl = 'https://farcaster.xyz/football';

  return (
    <div className="min-h-[calc(100vh-3.5rem)] py-6 px-4">
      <div className="container max-w-screen-md mx-auto space-y-6">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4 py-6"
        >
          <div className="flex items-center justify-center gap-3">
            <motion.div 
              className="w-16 h-16 rounded-2xl base-gradient flex items-center justify-center animate-float"
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 4, repeat: Infinity }}
            >
              <Hexagon className="w-10 h-10 text-white" />
            </motion.div>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground">
            Base SBT Lottery
          </h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            Complete social tasks, mint your Soulbound Token, and enter the lottery to win ETH prizes!
          </p>
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <Badge variant="outline" className="gap-1">
              <div className="w-2 h-2 rounded-full bg-primary" />
              Base Network
            </Badge>
            <Badge variant="outline">
              Fair & Transparent
            </Badge>
          </div>
        </motion.div>

        {/* Lottery Info */}
        {isLoadingStats ? (
          <Card>
            <CardContent className="py-8 flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </CardContent>
          </Card>
        ) : (
          <LotteryInfo
            participantCount={stats.participantCount}
            prizePoolEth={stats.prizePoolEth}
            endTime={new Date(stats.endTime)}
            isActive={stats.isActive}
          />
        )}

        {/* Tasks Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-semibold text-foreground">
              Complete Tasks
            </h2>
            <Button
              variant="outline"
              size="sm"
              onClick={handleVerifyAll}
              disabled={verifyTasksMutation.isPending || !isConnected}
              className="gap-2"
              data-testid="button-verify-all"
            >
              {verifyTasksMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              Verify All
            </Button>
          </div>

          {!isConnected && (
            <Card className="border-warning/30 bg-warning/5">
              <CardContent className="py-4 flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-warning flex-shrink-0" />
                <p className="text-sm text-muted-foreground">
                  Connect your wallet to verify tasks and mint your SBT
                </p>
              </CardContent>
            </Card>
          )}

          <div className="space-y-3">
            <TaskCard
              type="like"
              isCompleted={tasks.liked}
              isLoading={isLoadingUser}
              isVerifying={verifyingTask === 'like'}
              targetUrl={targetCastUrl}
              onVerify={() => handleVerifyTask('like')}
            />
            <TaskCard
              type="recast"
              isCompleted={tasks.recasted}
              isLoading={isLoadingUser}
              isVerifying={verifyingTask === 'recast'}
              targetUrl={targetCastUrl}
              onVerify={() => handleVerifyTask('recast')}
            />
            <TaskCard
              type="follow"
              isCompleted={tasks.followed}
              isLoading={isLoadingUser}
              isVerifying={verifyingTask === 'follow'}
              targetUrl={targetUserUrl}
              onVerify={() => handleVerifyTask('follow')}
            />
          </div>
        </div>

        {/* Mint Section */}
        <MintSection
          tasks={tasks}
          hasMinted={userStatus?.hasMinted || false}
          isMinting={mintMutation.isPending}
          mintTxHash={userStatus?.mintTxHash}
          onMint={() => mintMutation.mutate()}
          isWalletConnected={isConnected}
        />

        {/* Footer Info */}
        <div className="text-center text-xs text-muted-foreground pt-4 space-y-1">
          <p>Powered by Farcaster & Base Network</p>
          <p>Smart contract verified on BaseScan</p>
        </div>
      </div>
    </div>
  );
}
