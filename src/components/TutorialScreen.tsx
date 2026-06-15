import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Play, SkipForward, Sparkles, Film, CheckCircle2, Volume2, VolumeX } from 'lucide-react';

interface TutorialScreenProps {
  onSkip: () => void;
}

// Editable configuration for the tutorial video path
// Uses a gorgeous high-fidelity digital sketch stock video representing canvas spaces
const TUTORIAL_VIDEO_URL = "https://assets.mixkit.co/videos/preview/mixkit-drawing-on-a-digital-drawing-tablet-41925-large.mp4";

export function TutorialScreen({ onSkip }: TutorialScreenProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  return (
    <div id="tutorial-screen-container" className="flex flex-col items-center justify-center min-h-[100dvh] bg-[#070708] text-[#E0E0E0] p-4 sm:p-6 md:p-8 relative overflow-y-auto select-none">
      {/* Subtle ambient lighting */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.015),transparent)] pointer-events-none" />
      
      {/* Floating High-Contrast Skip Button in Upper-Right Corner */}
      <motion.button
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        onClick={onSkip}
        className="absolute top-4 right-4 sm:top-6 sm:right-6 z-50 px-4 py-2 sm:px-5 sm:py-2.5 bg-white/10 hover:bg-white text-white hover:text-black font-sans text-[11px] sm:text-xs font-medium border border-white/20 transition-all active:scale-95 flex items-center gap-1.5 backdrop-blur-md rounded-none shadow-lg cursor-pointer animate-fade-in"
        id="top-direct-skip-btn"
      >
        Skip and Proceed
        <SkipForward size={12} />
      </motion.button>
      
      {/* Decorative cyber grids or ambient accents */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-white/5 blur-[120px] rounded-full pointer-events-none opacity-30" />

      {/* Main Responsive wrapper */}
      <div className="w-full max-w-4xl min-h-0 relative z-10 flex flex-col items-center justify-center my-auto py-4 sm:py-6 md:py-8">
        
        {/* Onboarding Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-6 md:mb-8"
        >
          <h1 className="text-2xl sm:text-3xl md:text-5xl font-bold tracking-tight text-white leading-tight">
            Welcome to InkwellOS
          </h1>
          <p className="text-[11px] sm:text-xs md:text-sm text-white/50 mt-1 sm:mt-2 font-sans max-w-xl mx-auto">
            OS = organised space &bull; Quick Tutorial Guide
          </p>
        </motion.div>

        {/* Video Frame Card with strictly controlled relative container aspects */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="w-full aspect-video max-h-[40vh] sm:max-h-[48vh] md:max-h-[55vh] bg-black/80 border border-white/10 shadow-2xl relative group overflow-hidden rounded-sm"
        >
          {!isPlaying ? (
            /* Custom-recreated Premium Tutorial Thumbnail Preview */
            <div 
              onClick={() => setIsPlaying(true)}
              className="absolute inset-0 bg-gradient-to-tr from-[#0F0F10] from-[42%] to-[#F3F4F6] to-[42%] flex flex-col items-center justify-between p-4 sm:p-6 md:p-8 cursor-pointer select-none group transition-all duration-500 hover:brightness-105"
            >
              {/* Dynamic hover-to-play prompt overlay */}
              <div className="absolute inset-0 bg-black/15 group-hover:bg-transparent transition-all duration-300 pointer-events-none z-[5]" />
              
              {/* Modern Logo Icon Top Card */}
              <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 bg-white shadow-2xl flex items-center justify-center rounded-2xl md:mt-2 z-10 group-hover:scale-105 transition-all duration-500">
                <div className="w-9 h-9 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-[#111111] rounded-xl sm:rounded-2xl flex items-center justify-center -rotate-12 shadow-inner">
                  <div className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 bg-white rounded-md shadow" />
                </div>
              </div>

              {/* Central Minimalist Interactive Drawing Canvas & Vector Hand Illustration */}
              <div className="relative w-full max-w-[280px] sm:max-w-[340px] md:max-w-[420px] h-20 sm:h-28 md:h-36 flex items-center justify-center z-10 overflow-hidden sm:overflow-visible">
                {/* Paper Canvas Shape */}
                <div className="absolute w-[200px] sm:w-[240px] md:w-[290px] h-[70px] sm:h-[80px] md:h-[95px] bg-white border border-neutral-200/80 rounded-xl shadow-[0_15px_30px_rgba(0,0,0,0.08)] -rotate-3 flex flex-col p-2 sm:p-2.5">
                  <div className="flex items-center justify-between border-b border-neutral-100 pb-1 mb-1">
                    <div className="flex gap-1">
                      <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-neutral-300" />
                      <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-neutral-300" />
                      <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-neutral-300" />
                    </div>
                    <div className="w-10 sm:w-12 h-1 sm:h-1.5 bg-neutral-100 rounded" />
                  </div>
                  <div className="flex justify-end gap-1 mt-auto">
                    <div className="w-6 h-4 sm:w-8 sm:h-5 bg-neutral-50 border border-neutral-150 rounded flex items-center justify-center">
                      <div className="w-3 h-1.5 sm:w-4 sm:h-2 bg-neutral-200 rounded-sm" />
                    </div>
                    <div className="w-6 h-4 sm:w-8 sm:h-5 bg-zinc-800 rounded flex items-center justify-center">
                      <div className="w-3 h-1.5 sm:w-4 sm:h-2 bg-white/25 rounded-sm" />
                    </div>
                  </div>
                </div>
                
                {/* Hand and Pen Stroke Vectors */}
                <svg className="absolute w-[260px] sm:w-[300px] md:w-[340px] h-[90px] sm:h-[110px] overflow-visible pointer-events-none drop-shadow-sm" viewBox="0 0 320 120" fill="none">
                  {/* Dotted vector trace with arrow */}
                  <path d="M110,65 C140,55 170,45 205,58" stroke="#737373" strokeWidth="2.5" strokeDasharray="5 5" strokeLinecap="round" />
                  <path d="M205,58 L197,54 M205,58 L201,65" stroke="#737373" strokeWidth="2.5" strokeLinecap="round" />
                  
                  {/* Pen and Hand Illustration */}
                  <g className="translate-x-[25px] translate-y-[28px]">
                    {/* Stylus Pen */}
                    <line x1="55" y1="45" x2="110" y2="10" stroke="#18181B" strokeWidth="8" strokeLinecap="round" />
                    <path d="M55,45 L47,50" stroke="#18181B" strokeWidth="4" strokeLinecap="round" />
                    {/* Hand outline */}
                    <path d="M10,75 C25,68 45,52 65,52 C70,52 80,56 83,61 C85,66 78,71 72,72 C62,73 52,79 47,84 C38,90 20,100 10,75 Z" fill="#FFFFFF" stroke="#18181B" strokeWidth="2.5" strokeLinejoin="round" />
                  </g>
                </svg>
              </div>

              {/* Lower Text Banner Header Pairings */}
              <div className="flex flex-col items-center justify-center text-center z-10 sm:mb-2">
                <span className="text-[9px] sm:text-[11px] md:text-xs font-sans font-medium text-neutral-500 tracking-wider">
                  how to use
                </span>
                
                <h2 className="text-2xl sm:text-3xl md:text-[42px] font-black tracking-tight text-[#111111] font-sans -mt-1 leading-tight">
                  InkwellOS
                </h2>
                
                <p className="text-[10px] sm:text-xs md:text-sm text-neutral-700 font-normal font-sans tracking-wide mt-0.5">
                  os = organized space
                </p>
              </div>

              {/* Dynamic hover-activated play button bubble */}
              <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
                <motion.div 
                  whileHover={{ scale: 1.1 }}
                  className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-white/95 text-black flex items-center justify-center shadow-2xl transition-all border border-neutral-200/50 group-hover:scale-110 pointer-events-auto"
                >
                  <Play className="w-5 h-5 sm:w-6 sm:h-6 fill-black translate-x-0.5 text-black" />
                </motion.div>
              </div>

              {/* Micro-indicator watermark */}
              <div className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 flex items-center gap-1 text-[9px] sm:text-[10px] font-sans text-neutral-500 z-10 bg-white/40 px-2 py-1 backdrop-blur-sm">
                <Film className="w-3.5 h-3.5 text-red-600" /> Stock Tutorial
              </div>
            </div>
          ) : (
            /* High Definition Native MP4 Video Player with custom controls */
            <div className="relative w-full h-full bg-black">
              <video
                className="absolute inset-0 w-full h-full object-contain"
                src={TUTORIAL_VIDEO_URL}
                autoPlay
                loop
                muted={isMuted}
                controls
                playsInline
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMuted(!isMuted);
                }}
                className="absolute bottom-4 left-4 z-20 p-2.5 bg-black/60 hover:bg-black/80 text-white rounded-full transition-all border border-white/10 shadow-lg cursor-pointer"
                title={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
              </button>
            </div>
          )}
        </motion.div>

        {/* Bottom Actions Row */}
        <div className="w-full flex justify-center mt-6 md:mt-8">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="flex flex-row items-center gap-3 sm:gap-4 justify-center w-full max-w-sm"
          >
            <button
              onClick={onSkip}
              className="px-5 py-3 text-xs font-sans font-medium text-[#E0E0E0]/80 bg-white/5 border border-white/15 hover:border-white/30 hover:bg-white/10 hover:text-white transition-all flex items-center gap-2 cursor-pointer w-1/2 justify-center"
              id="bottom-direct-skip-btn"
            >
              Skip Tutorial
              <SkipForward size={14} />
            </button>

            <button
              onClick={onSkip}
              className="px-5 py-3 bg-white text-black hover:bg-white/90 font-sans font-medium text-xs transition-all active:scale-[0.98] flex items-center gap-2.5 shadow-2xl cursor-pointer w-1/2 justify-center"
              id="bottom-start-btn"
            >
              Get Started
              <CheckCircle2 size={15} />
            </button>
          </motion.div>
        </div>

      </div>
    </div>
  );
}
