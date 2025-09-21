import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { CircularProgress } from './CircularProgress'
import { BarChart3, Calendar, TrendingUp, CheckCircle } from 'lucide-react'

interface DashboardCircleProps {
  type: 'demand' | 'efficiency'
  value: number
  label: string
  sublabel: string
  color: string
  glowColor: string
  progress: number
}

export function DashboardCircle({ type, value, label, sublabel, color, glowColor, progress }: DashboardCircleProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [animatedValue, setAnimatedValue] = useState(0)

  useEffect(() => {
    const t = setTimeout(() => setAnimatedValue(value), 400)
    return () => clearTimeout(t)
  }, [value])

  const formatValue = (val: number) => (type === 'demand' ? val.toLocaleString() : `${val}%`)

  return (
    <motion.div
      style={{ position: 'relative', width: 320, height: 320, borderRadius: '50%', padding: 24, boxSizing: 'content-box', overflow: 'visible' }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      whileHover={{ scale: 1.03 }}
      transition={{ duration: 0.25 }}
    >
      <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', opacity: 0.12, background: `radial-gradient(circle, ${glowColor}20 0%, transparent 70%)`, pointerEvents: 'none' }} />

      <CircularProgress progress={progress} size={320} strokeWidth={2} color={color} glowColor={glowColor} delay={0} />
      <CircularProgress progress={progress * 0.8} size={280} strokeWidth={1.5} color={color} glowColor={glowColor} delay={0.2} />

      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          {type === 'demand' ? <BarChart3 size={18} color={color} /> : <Calendar size={18} color={color} />}
          <div style={{ fontSize: 12, color: '#d1d5db', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{label}</div>
        </div>

        <motion.div style={{ fontSize: 36, fontWeight: 700 }} initial={{ scale: 0.95 }} animate={{ scale: 1 }} transition={{ duration: 0.8 }}>
          {formatValue(animatedValue)}
        </motion.div>

        <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
          {sublabel}
        </div>
      </div>

      {isHovered && (
        <motion.div
          style={{ position: 'absolute', inset: 6, borderRadius: '50%', border: `2px solid ${color}`, opacity: 0.35 }}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 0.35 }}
          transition={{ duration: 0.8, repeat: Infinity, repeatType: 'reverse' }}
        />
      )}
    </motion.div>
  )
}
