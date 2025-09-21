import React from 'react';

interface RadarWaypointProps {
  size?: 'small' | 'medium' | 'large';
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'purple';
  intensity?: 'low' | 'medium' | 'high';
}

export function RadarWaypoint({ 
  size = 'medium', 
  color = 'blue', 
  intensity = 'medium' 
}: RadarWaypointProps) {
  const sizeClasses = {
    small: 'w-16 h-16',
    medium: 'w-24 h-24',
    large: 'w-32 h-32'
  };

  const colorClasses = {
    blue: 'border-blue-400',
    green: 'border-green-400',
    red: 'border-red-400',
    yellow: 'border-yellow-400',
    purple: 'border-purple-400'
  };

  const intensityClasses = {
    low: 'opacity-40',
    medium: 'opacity-60',
    high: 'opacity-80'
  };

  return (
    <div className={`relative ${sizeClasses[size]} flex items-center justify-center`}>
      {/* Outer pulsing ring - border ring with good spacing */}
      <div 
        className={`absolute inset-0 rounded-full border-2 ${colorClasses[color]} ${intensityClasses[intensity]} blur-sm animate-ping`}
        style={{
          animationDuration: '4s',
          animationDelay: '0s'
        }}
      />
      
      {/* Middle pulsing ring - border ring with more spacing */}
      <div 
        className={`absolute inset-4 rounded-full border-2 ${colorClasses[color]} ${intensityClasses[intensity]} blur-sm animate-ping`}
        style={{
          animationDuration: '4s',
          animationDelay: '1.2s'
        }}
      />
      
      {/* Inner pulsing ring - border ring with even more spacing */}
      <div 
        className={`absolute inset-7 rounded-full border-2 ${colorClasses[color]} ${intensityClasses[intensity]} blur-sm animate-ping`}
        style={{
          animationDuration: '4s',
          animationDelay: '2.4s'
        }}
      />
      
      {/* Central white dot - prominent and always white */}
      <div 
        className="w-4 h-4 rounded-full bg-white shadow-lg z-10 relative"
      />
      
      {/* Subtle background sweep effect */}
      <div 
        className={`absolute inset-2 rounded-full border ${colorClasses[color]} opacity-15 blur-md animate-pulse`}
        style={{
          animationDuration: '6s'
        }}
      />
    </div>
  );
}