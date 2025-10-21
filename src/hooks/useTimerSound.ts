'use client';

import { useEffect, useRef } from 'react';
import { Howl } from 'howler';

export function useTimerSound() {
  const soundRef = useRef<Howl | null>(null);

  useEffect(() => {
    // Son d'alerte avec une frequence plus haute pour attirer l'attention
    soundRef.current = new Howl({
      src: ['data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAA=='],
      volume: 0.5,
      onload: () => {
        // Creer un son beep synthetique
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        
        const playBeep = () => {
          // Créer un son plus musical avec plusieurs notes
          const notes = [523.25, 659.25, 783.99]; // Do, Mi, Sol
          const duration = 0.15;
          
          notes.forEach((frequency, index) => {
            const osc = audioContext.createOscillator();
            const gain = audioContext.createGain();
            
            osc.connect(gain);
            gain.connect(audioContext.destination);
            
            osc.frequency.value = frequency;
            osc.type = 'triangle'; // Son plus doux que 'sine'
            
            const startTime = audioContext.currentTime + (index * 0.1);
            gain.gain.setValueAtTime(0, startTime);
            gain.gain.linearRampToValueAtTime(0.2, startTime + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
            
            osc.start(startTime);
            osc.stop(startTime + duration);
          });
        };
        
        // Remplacer la fonction play de Howl
        (soundRef.current as any).playOriginal = soundRef.current?.play;
        soundRef.current!.play = () => {
          playBeep();
          return 0;
        };
      }
    });

    return () => {
      soundRef.current?.unload();
    };
  }, []);

  const playWarning = () => {
    soundRef.current?.play();
  };

  return { playWarning };
}


