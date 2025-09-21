import { motion } from 'framer-motion'
import React from 'react'

interface CircularProgressProps {
  progress: number
  size: number
  strokeWidth: number
  color: string
  glowColor: string
  delay?: number
}

export function CircularProgress({
  progress,
  size,
  strokeWidth,
  color,
  glowColor,
  delay = 0,
}: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const strokeDasharray = circumference
  const safeProgress = Math.max(0, Math.min(100, progress))
  const strokeDashoffset = circumference - (safeProgress / 100) * circumference

  const filterId = `glow-${size}`

  return (
    <svg
      width={size}
      height={size}
      style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', overflow: 'visible' }}
      overflow="visible"
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="rgba(255,255,255,0.1)"
        strokeWidth={strokeWidth}
      />

      <defs>
        <filter id={filterId} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <motion.circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={strokeDasharray}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        filter={`url(#${filterId})`}
        style={{ filter: `drop-shadow(0 0 8px ${glowColor})` }}
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset }}
        transition={{ duration: 1.6, delay, ease: 'easeInOut' }}
      />
    </svg>
  )
}
