import React from 'react';
import { AvatarState } from '../types';

interface AvatarProps {
  state: AvatarState;
  size?: number;
}

export const Avatar: React.FC<AvatarProps> = ({ state, size = 128 }) => {
  const getAnimationClasses = () => {
    switch (state) {
      case 'processing':
        return {
          core: 'animate-[avatar-processing-pulse_1s_ease-in-out_infinite]',
          ring1: 'animate-[avatar-processing-spin_4s_linear_infinite]',
          ring2: 'animate-[avatar-processing-spin_6s_linear_infinite_reverse]',
        };
      case 'listening':
        return {
          core: 'animate-[avatar-listening-pulse_1.5s_ease-in-out_infinite]',
          ring1: '',
          ring2: '',
        };
      case 'speaking':
        return {
          core: 'animate-avatar-speaking-pulse',
          ring1: 'animate-avatar-speaking-ring-expand',
          ring2: 'animate-avatar-speaking-ring-expand',
        };
      case 'idle':
      default:
        return {
          core: 'animate-[avatar-idle-pulse_4s_ease-in-out_infinite]',
          ring1: 'animate-[avatar-processing-spin_40s_linear_infinite]',
          ring2: 'animate-[avatar-processing-spin_60s_linear_infinite_reverse]',
        };
    }
  };

  const animationClasses = getAnimationClasses();
  const ring2Style = state === 'speaking' ? { animationDelay: '1s' } : {};

  return (
    <div className="flex justify-center items-center pointer-events-none" style={{ width: size, height: size }}>
      <div className="relative w-full h-full">
        <svg className="absolute inset-0 w-full h-full text-cyan-400" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Outer Ring */}
          <g className={animationClasses.ring2} style={{ transformOrigin: '50% 50%', ...ring2Style }}>
            <circle cx="50" cy="50" r="48" stroke="currentColor" strokeWidth="1" strokeOpacity={state === 'speaking' ? 1 : 0.3} />
          </g>
          {/* Middle Ring */}
          <g className={animationClasses.ring1} style={{ transformOrigin: '50% 50%' }}>
            <circle cx="50" cy="50" r="38" stroke="currentColor" strokeWidth="1.5" strokeOpacity={state === 'speaking' ? 1 : 0.6} />
          </g>
          {/* Core */}
          <g className={animationClasses.core} style={{ transformOrigin: '50% 50%' }}>
            <circle cx="50" cy="50" r="25" fill="currentColor" fillOpacity="0.2" />
            <circle cx="50" cy="50" r="15" fill="currentColor" />
          </g>
        </svg>
      </div>
    </div>
  );
};