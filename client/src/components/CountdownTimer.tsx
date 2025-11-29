import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface CountdownTimerProps {
  endTime: Date;
  onComplete?: () => void;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
}

function calculateTimeLeft(endTime: Date): TimeLeft {
  const difference = endTime.getTime() - new Date().getTime();
  
  if (difference <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 };
  }

  return {
    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((difference / 1000 / 60) % 60),
    seconds: Math.floor((difference / 1000) % 60),
    total: difference,
  };
}

interface TimeUnitProps {
  value: number;
  label: string;
  isLast?: boolean;
}

function TimeUnit({ value, label, isLast = false }: TimeUnitProps) {
  return (
    <div className="flex flex-col items-center">
      <motion.div
        key={value}
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className={cn(
          'relative w-14 h-14 rounded-lg flex items-center justify-center',
          'bg-card border border-border'
        )}
      >
        <span className="text-2xl font-bold font-mono text-foreground">
          {value.toString().padStart(2, '0')}
        </span>
      </motion.div>
      <span className="text-xs text-muted-foreground mt-1 uppercase tracking-wider">
        {label}
      </span>
    </div>
  );
}

export function CountdownTimer({ endTime, onComplete }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(calculateTimeLeft(endTime));

  useEffect(() => {
    const timer = setInterval(() => {
      const newTimeLeft = calculateTimeLeft(endTime);
      setTimeLeft(newTimeLeft);

      if (newTimeLeft.total <= 0) {
        clearInterval(timer);
        onComplete?.();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [endTime, onComplete]);

  const isExpired = timeLeft.total <= 0;
  const isUrgent = timeLeft.total > 0 && timeLeft.days === 0 && timeLeft.hours < 6;

  if (isExpired) {
    return (
      <div 
        className="text-center py-4"
        data-testid="countdown-expired"
      >
        <p className="text-lg font-semibold text-muted-foreground">
          Lottery Ended
        </p>
      </div>
    );
  }

  return (
    <div 
      className={cn(
        'flex items-center justify-center gap-2',
        isUrgent && 'animate-pulse'
      )}
      data-testid="countdown-timer"
    >
      <TimeUnit value={timeLeft.days} label="Days" />
      <span className="text-2xl font-bold text-muted-foreground self-start mt-3">:</span>
      <TimeUnit value={timeLeft.hours} label="Hours" />
      <span className="text-2xl font-bold text-muted-foreground self-start mt-3">:</span>
      <TimeUnit value={timeLeft.minutes} label="Mins" />
      <span className="text-2xl font-bold text-muted-foreground self-start mt-3">:</span>
      <TimeUnit value={timeLeft.seconds} label="Secs" isLast />
    </div>
  );
}
