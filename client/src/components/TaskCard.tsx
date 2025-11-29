import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Heart, 
  Repeat2, 
  UserPlus, 
  CheckCircle2, 
  Loader2, 
  ExternalLink 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export type TaskType = 'like' | 'recast' | 'follow';

interface TaskCardProps {
  type: TaskType;
  isCompleted: boolean;
  isLoading?: boolean;
  isVerifying?: boolean;
  targetUrl?: string;
  onVerify?: () => void;
}

const taskConfig = {
  like: {
    icon: Heart,
    title: 'Like the Cast',
    description: 'Show your support by liking the announcement cast',
    actionText: 'Like on Farcaster',
    completedText: 'Liked',
    color: 'text-rose-500',
    bgColor: 'bg-rose-500/10',
    borderColor: 'border-rose-500/30',
  },
  recast: {
    icon: Repeat2,
    title: 'Recast',
    description: 'Spread the word by recasting to your followers',
    actionText: 'Recast on Farcaster',
    completedText: 'Recasted',
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/30',
  },
  follow: {
    icon: UserPlus,
    title: 'Follow Account',
    description: 'Follow to stay updated with future announcements',
    actionText: 'Follow on Farcaster',
    completedText: 'Following',
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30',
  },
};

export function TaskCard({ 
  type, 
  isCompleted, 
  isLoading = false,
  isVerifying = false,
  targetUrl,
  onVerify 
}: TaskCardProps) {
  const config = taskConfig[type];
  const Icon = config.icon;

  const handleAction = () => {
    if (targetUrl && !isCompleted) {
      window.open(targetUrl, '_blank');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card 
        className={cn(
          'relative overflow-visible transition-all duration-300',
          isCompleted 
            ? `${config.bgColor} ${config.borderColor} border-2` 
            : 'border border-border hover-elevate'
        )}
        data-testid={`card-task-${type}`}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            {/* Icon */}
            <div 
              className={cn(
                'flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center transition-all duration-300',
                isCompleted 
                  ? `${config.bgColor} ${config.color}` 
                  : 'bg-muted text-muted-foreground'
              )}
            >
              <Icon className="w-6 h-6" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-foreground">
                  {config.title}
                </h3>
                <AnimatePresence>
                  {isCompleted && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      className="animate-checkmark"
                    >
                      <CheckCircle2 className={cn('w-5 h-5', config.color)} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                {config.description}
              </p>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 flex-wrap">
                {!isCompleted && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAction}
                    disabled={isLoading}
                    className="gap-2"
                    data-testid={`button-${type}-action`}
                  >
                    <ExternalLink className="w-3 h-3" />
                    {config.actionText}
                  </Button>
                )}
                
                <Button
                  variant={isCompleted ? 'secondary' : 'default'}
                  size="sm"
                  onClick={onVerify}
                  disabled={isCompleted || isLoading || isVerifying}
                  className={cn(
                    'gap-2 min-w-[100px]',
                    isCompleted && `${config.bgColor} ${config.color} border ${config.borderColor}`
                  )}
                  data-testid={`button-${type}-verify`}
                >
                  {isVerifying ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Verifying...
                    </>
                  ) : isCompleted ? (
                    <>
                      <CheckCircle2 className="w-3 h-3" />
                      {config.completedText}
                    </>
                  ) : (
                    'Verify'
                  )}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
