"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, Clock } from 'lucide-react';

interface TimerProps {
  initialDuration: number; // in seconds
  onTimeUp: () => void;
  onAlmostTimeUp?: () => void; // Optional: callback when time is about to run out
  warningThreshold?: number; // in seconds, e.g., 60 for 1 minute warning
}

export default function Timer({ initialDuration, onTimeUp, onAlmostTimeUp, warningThreshold = 60 }: TimerProps) {
  const [remainingTime, setRemainingTime] = useState(initialDuration);
  const [isWarning, setIsWarning] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setRemainingTime(initialDuration); // Reset time if duration changes
  }, [initialDuration]);

  useEffect(() => {
    if (remainingTime <= 0) {
      if (timerRef.current) clearInterval(timerRef.current);
      onTimeUp();
      return;
    }

    if (remainingTime <= warningThreshold && !isWarning) {
      setIsWarning(true);
      if (onAlmostTimeUp) onAlmostTimeUp();
    } else if (remainingTime > warningThreshold && isWarning) {
      setIsWarning(false);
    }
    
    timerRef.current = setInterval(() => {
      setRemainingTime(prevTime => prevTime - 1);
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [remainingTime, onTimeUp, onAlmostTimeUp, warningThreshold, isWarning]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h > 0 ? String(h).padStart(2, '0') + ':' : ''}${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const progressValue = (remainingTime / initialDuration) * 100;

  return (
    <Card className={`w-full max-w-xs sticky top-4 z-20 shadow-lg ${isWarning && remainingTime > 0 ? 'border-destructive animate-pulse' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center text-sm font-medium">
            {isWarning && remainingTime > 0 ? <AlertTriangle className="h-5 w-5 mr-2 text-destructive" /> : <Clock className="h-5 w-5 mr-2 text-primary" />}
            Time Remaining
          </div>
          <div className={`text-xl font-bold font-mono ${isWarning && remainingTime > 0 ? 'text-destructive' : 'text-foreground'}`}>
            {formatTime(remainingTime)}
          </div>
        </div>
        <Progress value={progressValue} className={`h-3 ${isWarning && remainingTime > 0 ? '[&>div]:bg-destructive' : ''}`} />
        {isWarning && remainingTime > 0 && (
          <p className="text-xs text-destructive mt-2 text-center">
            Time is running out! Please submit your test soon.
          </p>
        )}
         {remainingTime <= 0 && (
          <p className="text-xs text-destructive mt-2 text-center font-semibold">
            Time&apos;s up! Your test will be submitted automatically.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
