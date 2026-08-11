'use client';

import { Info, Pause, Play } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

type ArticleAudioPlayerProps = {
  audioSrc?: string;
  variant?: 'summary' | 'deep-dive';
  title?: string;
  description?: string;
  durationLabel?: string;
  disclosure?: string;
};

const speedOptions = [1, 1.5, 2];

function formatTime(time: number) {
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export default function ArticleAudioPlayer({
  audioSrc,
  variant = 'summary',
  title,
  description,
  durationLabel,
  disclosure,
}: ArticleAudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [playbackError, setPlaybackError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const formatLabel = variant === 'deep-dive' ? 'Audio deep dive' : 'Audio summary';
  const accessibleTitle = title ? `${formatLabel}: ${title}` : formatLabel;

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => setDuration(audio.duration);
    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handlePlay = () => {
      setIsPlaying(true);
      setPlaybackError(null);
    };
    const handlePause = () => setIsPlaying(false);
    const handleError = () => {
      setIsPlaying(false);
      setPlaybackError('This recording could not be loaded. Please try again or read the written guide below.');
    };
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    if (audio.readyState >= HTMLMediaElement.HAVE_METADATA) {
      handleLoadedMetadata();
    }

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
    };
  }, [audioSrc]);

  const togglePlay = async () => {
    const audio = audioRef.current;
    if (!audioSrc || !audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      try {
        await audio.play();
      } catch {
        setPlaybackError('Playback could not start. Please try again or read the written guide below.');
      }
    }
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

      <div className="mb-4 border-b border-white/10 pb-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-orange-500">
            {formatLabel}
          </p>
          {!audioSrc ? (
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Coming soon
            </span>
          ) : durationLabel ? (
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300">
              {durationLabel}
            </span>
          ) : null}
        </div>

        {title && <h2 className="mt-3 text-lg font-black leading-tight text-white sm:text-xl">{title}</h2>}
        {description && <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-300">{description}</p>}
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <button
          type="button"
          onClick={togglePlay}
          disabled={!audioSrc}
          aria-label={audioSrc ? (isPlaying ? `Pause ${accessibleTitle}` : `Play ${accessibleTitle}`) : `${accessibleTitle} coming soon`}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange-500 text-white transition-colors enabled:hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-slate-600 disabled:text-slate-400"
        >
          {isPlaying ? <Pause size={18} aria-hidden="true" /> : <Play size={18} aria-hidden="true" className="ml-0.5" />}
        </button>

        <div className="min-w-0 flex-1">
          <input
            type="range"
            min={0}
            max={duration || 100}
            value={currentTime}
            onChange={handleSeek}
            disabled={!audioSrc}
            aria-label={`${accessibleTitle} progress`}
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
              aria-label={`Play ${accessibleTitle} at ${speed} times speed`}
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

      {playbackError && (
        <p role="alert" className="mt-3 text-xs font-semibold text-orange-200">
          {playbackError}
        </p>
      )}

      {disclosure && (
        <div className="mt-4 flex items-start gap-3 border-t border-white/10 pt-4">
          <Info size={16} aria-hidden="true" className="mt-0.5 shrink-0 text-orange-400" />
          <p className="text-xs leading-relaxed text-slate-400">
            <span className="font-bold text-slate-300">Editorial note:</span> {disclosure}
          </p>
        </div>
      )}

      {!audioSrc && !description && (
        <p className="mt-4 text-xs leading-relaxed text-slate-400">
          A concise narrated summary of this guide will be added here.
        </p>
      )}
    </div>
  );
}
