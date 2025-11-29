import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAccount } from 'wagmi';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Settings, 
  Users, 
  Trophy, 
  Clock, 
  Coins,
  AlertTriangle,
  Loader2,
  Play,
  CheckCircle2,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import type { LotteryConfig, LotteryStats, Winner } from '@shared/schema';
import { format } from 'date-fns';
import { motion } from 'framer-motion';

export default function Admin() {
  const { address, isConnected } = useAccount();
  const { toast } = useToast();
  const [castHash, setCastHash] = useState('');
  const [userFid, setUserFid] = useState('');
  const [endDate, setEndDate] = useState('');

  // Fetch lottery config
  const { data: config, isLoading: isLoadingConfig } = useQuery<LotteryConfig>({
    queryKey: ['/api/admin/config'],
  });

  // Fetch lottery stats
  const { data: stats, isLoading: isLoadingStats } = useQuery<LotteryStats>({
    queryKey: ['/api/lottery/stats'],
  });

  // Fetch winners
  const { data: winners, isLoading: isLoadingWinners } = useQuery<Winner[]>({
    queryKey: ['/api/admin/winners'],
  });

  // Fetch participants
  const { data: participants, isLoading: isLoadingParticipants } = useQuery<{ count: number; recent: any[] }>({
    queryKey: ['/api/admin/participants'],
  });

  // Update config mutation
  const updateConfigMutation = useMutation({
    mutationFn: async (data: Partial<LotteryConfig>) => {
      const response = await apiRequest('PATCH', '/api/admin/config', data);
      return response;
    },
    onSuccess: () => {
      toast({
        title: 'Configuration Updated',
        description: 'Lottery settings have been saved.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/config'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Update Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Draw winners mutation
  const drawWinnersMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/admin/draw');
      return response;
    },
    onSuccess: (data: any) => {
      toast({
        title: 'Winners Drawn!',
        description: `${data.winnersCount} winner(s) have been selected.`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/winners'] });
      queryClient.invalidateQueries({ queryKey: ['/api/lottery/stats'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Draw Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleUpdateConfig = () => {
    const updates: Partial<LotteryConfig> = {};
    if (castHash) updates.targetCastHash = castHash;
    if (userFid) updates.targetUserFid = parseInt(userFid);
    if (endDate) updates.endTime = new Date(endDate);
    
    if (Object.keys(updates).length > 0) {
      updateConfigMutation.mutate(updates);
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="py-8 text-center space-y-4">
            <AlertTriangle className="w-12 h-12 text-warning mx-auto" />
            <h2 className="text-xl font-semibold">Connect Wallet</h2>
            <p className="text-muted-foreground">
              Please connect your wallet to access the admin panel.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-3.5rem)] py-6 px-4">
      <div className="container max-w-screen-lg mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-2"
        >
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Settings className="w-6 h-6" />
            Admin Panel
          </h1>
          <p className="text-muted-foreground">
            Manage lottery settings and draw winners
          </p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Users className="w-4 h-4" />
                Participants
              </div>
              <p className="text-2xl font-bold mt-1" data-testid="admin-participant-count">
                {isLoadingStats ? '...' : stats?.participantCount || 0}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Coins className="w-4 h-4" />
                Prize Pool
              </div>
              <p className="text-2xl font-bold mt-1 font-mono" data-testid="admin-prize-pool">
                {isLoadingStats ? '...' : `${stats?.prizePoolEth || '0'} ETH`}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Trophy className="w-4 h-4" />
                Winners
              </div>
              <p className="text-2xl font-bold mt-1" data-testid="admin-winners-count">
                {isLoadingStats ? '...' : stats?.winnersCount || 0}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Clock className="w-4 h-4" />
                Status
              </div>
              <div className="mt-1">
                <Badge variant={stats?.isActive ? 'default' : 'secondary'}>
                  {stats?.isActive ? 'Active' : 'Ended'}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Lottery Configuration</CardTitle>
              <CardDescription>
                Update target cast and user for tasks
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="castHash">Target Cast Hash</Label>
                <Input
                  id="castHash"
                  placeholder="0x7d607440"
                  value={castHash}
                  onChange={(e) => setCastHash(e.target.value)}
                  data-testid="input-cast-hash"
                />
                <p className="text-xs text-muted-foreground">
                  Current: {config?.targetCastHash || 'Not set'}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="userFid">Target User FID</Label>
                <Input
                  id="userFid"
                  type="number"
                  placeholder="12345"
                  value={userFid}
                  onChange={(e) => setUserFid(e.target.value)}
                  data-testid="input-user-fid"
                />
                <p className="text-xs text-muted-foreground">
                  Current: {config?.targetUserFid || 'Not set'} ({config?.targetUsername || 'Unknown'})
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate">End Date & Time</Label>
                <Input
                  id="endDate"
                  type="datetime-local"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  data-testid="input-end-date"
                />
                <p className="text-xs text-muted-foreground">
                  Current: {config?.endTime ? format(new Date(config.endTime), 'PPpp') : 'Not set'}
                </p>
              </div>

              <Button
                className="w-full gap-2"
                onClick={handleUpdateConfig}
                disabled={updateConfigMutation.isPending}
                data-testid="button-update-config"
              >
                {updateConfigMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                Update Configuration
              </Button>
            </CardContent>
          </Card>

          {/* Draw Winners */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Draw Winners</CardTitle>
              <CardDescription>
                Execute the lottery and select winners
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-lg bg-muted/50 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Eligible Participants</span>
                  <span className="font-medium">{stats?.participantCount || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Winners to Draw</span>
                  <span className="font-medium">{stats?.winnersCount || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Prize per Winner</span>
                  <span className="font-medium font-mono">~0.002 ETH</span>
                </div>
              </div>

              {config?.winnersDrawn ? (
                <div className="text-center py-4 space-y-2">
                  <CheckCircle2 className="w-10 h-10 text-success mx-auto" />
                  <p className="font-medium text-success">Winners Already Drawn</p>
                </div>
              ) : (
                <Button
                  className="w-full gap-2 base-gradient text-white"
                  onClick={() => drawWinnersMutation.mutate()}
                  disabled={drawWinnersMutation.isPending || !stats?.isActive || (stats?.participantCount || 0) < 100}
                  data-testid="button-draw-winners"
                >
                  {drawWinnersMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                  Draw Winners
                </Button>
              )}

              {(stats?.participantCount || 0) < 100 && (
                <p className="text-xs text-center text-muted-foreground">
                  Minimum 100 participants required to draw winners
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Winners List */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              Winners
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingWinners ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : winners && winners.length > 0 ? (
              <div className="space-y-2">
                {winners.map((winner, index) => (
                  <div 
                    key={winner.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-mono text-sm">{winner.walletAddress}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(winner.drawnAt), 'PPp')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-mono font-medium">{winner.prizeAmount} ETH</p>
                      {winner.claimTxHash && (
                        <a
                          href={`https://basescan.org/tx/${winner.claimTxHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline inline-flex items-center gap-1"
                        >
                          <ExternalLink className="w-3 h-3" />
                          View TX
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                No winners yet
              </p>
            )}
          </CardContent>
        </Card>

        {/* Recent Participants */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="w-5 h-5" />
              Recent Participants
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingParticipants ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : participants?.recent && participants.recent.length > 0 ? (
              <div className="space-y-2">
                {participants.recent.map((participant: any) => (
                  <div 
                    key={participant.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                  >
                    <div>
                      <p className="font-mono text-sm">{participant.walletAddress}</p>
                      <p className="text-xs text-muted-foreground">
                        @{participant.farcasterUsername || participant.farcasterFid}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={participant.hasMinted ? 'default' : 'secondary'} className="text-xs">
                        {participant.hasMinted ? 'Minted' : 'Pending'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                No participants yet
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
