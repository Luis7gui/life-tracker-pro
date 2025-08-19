/**
 * Pomodoro Timer Component
 * Simple Pomodoro timer for user focus sessions
 */

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Clock, 
  Coffee,
  Target,
  Volume2,
  VolumeX
} from 'lucide-react';

interface PomodoroTimerProps {
  compact?: boolean;
}

const PomodoroTimer: React.FC<PomodoroTimerProps> = ({ compact = false }) => {
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes in seconds
  const [isRunning, setIsRunning] = useState(false);
  const [sessionType, setSessionType] = useState<'work' | 'shortBreak' | 'longBreak'>('work');
  const [cycles, setCycles] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const presets = {
    work: 25 * 60,       // 25 minutes
    shortBreak: 5 * 60,  // 5 minutes
    longBreak: 15 * 60   // 15 minutes
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const playNotificationSound = () => {
    if (!soundEnabled) return;
    
    // Create a simple beep sound using Web Audio API
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  };

  const sendNotification = (type: 'work' | 'shortBreak' | 'longBreak') => {
    const messages = {
      work: {
        title: '⏰ Sessão de Foco Finalizada!',
        body: 'Parabéns! Você completou 25 minutos de foco. Hora de uma pausa!'
      },
      shortBreak: {
        title: '☕ Pausa Curta Finalizada!', 
        body: 'Que bom descanso! Está pronto para mais uma sessão de foco?'
      },
      longBreak: {
        title: '🎉 Pausa Longa Finalizada!',
        body: 'Excelente descanso! Você completou um ciclo completo de Pomodoro!'
      }
    };

    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(messages[type].title, {
        body: messages[type].body,
        icon: '/favicon.ico',
        requireInteraction: true
      });
    }
  };

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setIsRunning(false);
            playNotificationSound();
            sendNotification(sessionType);
            
            // Auto-cycle logic
            if (sessionType === 'work') {
              setCycles(prev => prev + 1);
              const newCycles = cycles + 1;
              if (newCycles % 4 === 0) {
                setSessionType('longBreak');
                return presets.longBreak;
              } else {
                setSessionType('shortBreak');
                return presets.shortBreak;
              }
            } else {
              setSessionType('work');
              return presets.work;
            }
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, timeLeft, sessionType, cycles, soundEnabled]);

  const handleStart = () => {
    setIsRunning(true);
  };

  const handlePause = () => {
    setIsRunning(false);
  };

  const handleReset = () => {
    setIsRunning(false);
    setTimeLeft(presets[sessionType]);
  };

  const handleTypeChange = (type: 'work' | 'shortBreak' | 'longBreak') => {
    setSessionType(type);
    setTimeLeft(presets[type]);
    setIsRunning(false);
  };

  const totalTime = presets[sessionType];
  const progress = ((totalTime - timeLeft) / totalTime) * 100;

  const getSessionIcon = () => {
    switch (sessionType) {
      case 'work':
        return <Target className="h-5 w-5" />;
      case 'shortBreak':
        return <Coffee className="h-5 w-5" />;
      case 'longBreak':
        return <Coffee className="h-5 w-5" />;
    }
  };

  const getSessionLabel = () => {
    switch (sessionType) {
      case 'work':
        return 'Foco';
      case 'shortBreak':
        return 'Pausa Curta';
      case 'longBreak':
        return 'Pausa Longa';
    }
  };

  const getSessionColor = () => {
    switch (sessionType) {
      case 'work':
        return 'text-blue-500';
      case 'shortBreak':
        return 'text-green-500';
      case 'longBreak':
        return 'text-purple-500';
    }
  };

  if (compact) {
    return (
      <Card className="w-full">
        <CardContent className="p-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-accent-primary" />
                <span className="font-semibold">Pomodoro</span>
              </div>
              <div className={`flex items-center gap-1 ${getSessionColor()}`}>
                {getSessionIcon()}
                <span className="text-sm">{getSessionLabel()}</span>
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-mono font-bold">
                {formatTime(timeLeft)}
              </div>
              <Progress value={progress} className="h-2 mt-2" />
            </div>
            
            <div className="flex justify-center gap-2">
              {!isRunning ? (
                <Button onClick={handleStart} size="sm" variant="default">
                  <Play className="h-4 w-4" />
                </Button>
              ) : (
                <Button onClick={handlePause} size="sm" variant="secondary">
                  <Pause className="h-4 w-4" />
                </Button>
              )}
              <Button onClick={handleReset} size="sm" variant="outline">
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Session Type Selector */}
      <div className="space-y-2">
        <label className="text-sm font-bold text-white">TIPO DE SESSÃO</label>
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => handleTypeChange('work')}
            disabled={isRunning}
            className={`p-3 border-2 font-bold text-sm ${
              sessionType === 'work' 
                ? 'bg-red-600 border-white text-white' 
                : 'bg-gray-700 border-gray-500 text-gray-300 hover:bg-gray-600'
            } ${isRunning ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            🎯 FOCO<br/>25min
          </button>
          <button
            onClick={() => handleTypeChange('shortBreak')}
            disabled={isRunning}
            className={`p-3 border-2 font-bold text-sm ${
              sessionType === 'shortBreak' 
                ? 'bg-red-600 border-white text-white' 
                : 'bg-gray-700 border-gray-500 text-gray-300 hover:bg-gray-600'
            } ${isRunning ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            ☕ PAUSA<br/>5min
          </button>
          <button
            onClick={() => handleTypeChange('longBreak')}
            disabled={isRunning}
            className={`p-3 border-2 font-bold text-sm ${
              sessionType === 'longBreak' 
                ? 'bg-red-600 border-white text-white' 
                : 'bg-gray-700 border-gray-500 text-gray-300 hover:bg-gray-600'
            } ${isRunning ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            🌙 LONGA<br/>15min
          </button>
        </div>
      </div>

      {/* Timer Display */}
      <div className="text-center space-y-4 bg-gray-900 border-2 border-white p-8">
        <div className="text-6xl font-mono font-bold text-white">
          {formatTime(timeLeft)}
        </div>
        
        <div className="flex items-center justify-center gap-2 text-red-400">
          {getSessionIcon()}
          <span className="text-lg font-bold">{getSessionLabel().toUpperCase()}</span>
        </div>
        
        <div className="w-full bg-black border border-gray-600 h-4">
          <div 
            className="h-full bg-red-600"
            style={{width: `${progress}%`}}
          />
        </div>
      </div>

      {/* Controls */}
      <div className="flex justify-center gap-4">
        {!isRunning ? (
          <button
            onClick={handleStart}
            className="px-8 py-3 bg-red-600 text-white border-2 border-white font-bold hover:bg-red-500"
          >
            ▶ INICIAR
          </button>
        ) : (
          <button
            onClick={handlePause}
            className="px-8 py-3 bg-gray-600 text-white border-2 border-white font-bold hover:bg-gray-500"
          >
            ⏸ PAUSAR
          </button>
        )}
        
        <button
          onClick={handleReset}
          className="px-8 py-3 bg-gray-700 text-white border-2 border-gray-500 font-bold hover:bg-gray-600"
        >
          🔄 RESETAR
        </button>
      </div>

      {/* Stats and Settings */}
      <div className="flex items-center justify-between pt-4 border-t-2 border-gray-600">
        <div className="text-center">
          <div className="text-2xl font-bold text-white">{cycles}</div>
          <div className="text-sm text-gray-400 font-bold">CICLOS COMPLETOS</div>
        </div>
        
        <button 
          onClick={() => setSoundEnabled(!soundEnabled)}
          className="p-2 bg-gray-700 border-2 border-gray-500 text-gray-300 hover:bg-gray-600"
        >
          {soundEnabled ? '🔊' : '🔇'}
        </button>
      </div>
    </div>
  );
};

export default PomodoroTimer;