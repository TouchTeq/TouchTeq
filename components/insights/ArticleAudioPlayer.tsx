'use client';

import { Pause, Play } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

type ArticleAudioPlayerProps = {
  audioSrc?: string;
};

const speedOptions = [1, 1.5, 2];

function formatTime(time: number) {
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export default function ArticleAudioPlayer({ audioSrc }: ArticleAudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => setDuration(audio.duration);
    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [audioSrc]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audioSrc || !audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      void audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (event: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audioSrc || !audio) return;

    const newTime = Number(event.target.value);
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const changeSpeed = (speed: number) => {
    const audio = audioRef.current;
    if (!audioSrc || !audio) return;

    audio.playbackRate = speed;
    setPlaybackSpeed(speed);
  };

  return (
    <div className="mb-8 rounded-lg bg-[#1A2B4C] p-4">
      {audioSrc && <audio ref={audioRef} src={audioSrc} preload="metadata" />}

      <div className="mb-4 flex items-center justify-between gap-4 border-b border-white/10 pb-3">
        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-orange-500">
          Audio summary
        </p>
        {!audioSrc && (
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Coming soon
          </span>
        )}
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <button
          type="button"
          onClick={togglePlay}
          disabled={!audioSrc}
          aria-label={audioSrc ? (isPlaying ? 'Pause audio summary' : 'Play audio summary') : 'Audio summary coming soon'}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange-500 text-white transition-colors enabled:hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-slate-600 disabled:text-slate-400"
        >
          {isPlaying ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
        </button>

        <div className="min-w-0 flex-1">
          <input
            type="range"
            min={0}
            max={duration || 100}
            value={currentTime}
            onChange={handleSeek}
            disabled={!audioSrc}
            aria-label="Audio summary progress"
            className="h-1 w-full appearance-none rounded-full bg-slate-600 accent-orange-500 enabled:cursor-pointer disabled:cursor-not-allowed"
          />
          <div className="mt-1 flex justify-between">
            <span className="text-xs text-slate-400">{formatTime(currentTime)}</span>
            <span className="text-xs text-slate-400">{audioSrc ? formatTime(duration) : '--:--'}</span>
          </div>
        </div>

        <div className="flex items-center gap-1 sm:ml-2">
          {speedOptions.map((speed) => (
            <button
              key={speed}
              type="button"
              onClick={() => changeSpeed(speed)}
              disabled={!audioSrc}
              className={`rounded px-2 py-1 text-xs transition-colors ${
                playbackSpeed === speed && audioSrc
                  ? 'bg-orange-500 text-white'
                  : 'bg-slate-600 text-slate-300 enabled:hover:bg-slate-500 disabled:cursor-not-allowed disabled:text-slate-500'
              }`}
            >
              {speed}x
            </button>
          ))}
        </div>
      </div>

      {!audioSrc && (
        <p className="mt-4 text-xs leading-relaxed text-slate-400">
          A concise narrated summary of this guide will be added here.
        </p>
      )}
    </div>
  );
}
