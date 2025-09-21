import React from 'react'
import logo from '../resources/logo/Logo.png'

interface Props { title: string; variant?: 'solid' | 'transparent' | 'glass'; onToggleControls?: () => void; whiteBrand?: boolean }
export default function Navbar({ title, variant = 'glass', onToggleControls, whiteBrand = false }: Props) {
  // Choose bootstrap classes based on variant (native Bootstrap utilities)
  const variantClasses =
    variant === 'transparent'
      ? 'bg-transparent navbar-dark'
      : variant === 'glass'
      ? 'bg-light bg-opacity-75 navbar-light'
      : 'bg-light navbar-light'

  // Full-width fixed navbar with right-aligned content using Bootstrap flex utilities
  // add Bootstrap z-index utility so navbar is above the full-screen map
  const cls = `d-flex p-0 navbar navbar-expand-lg position-fixed top-0 start-0 w-100 z-3 ${variantClasses}`

  // Always use white for brand color
  const brandColor = 'text-white';

  return (
    <nav className={cls}>
      <div className="container-fluid p-0">
        <div className="d-flex justify-content-between align-items-center py-2 px-3 w-100">
          <div className="d-flex align-items-center">
            <a href="/" className="d-flex align-items-center text-decoration-none">
              <img src={logo} alt="logo" style={{ height: 28, marginRight: 8, filter: 'brightness(0) invert(1)' }} />
              <span className={`navbar-brand mb-0 h1 ${brandColor}`}>{title}</span>
            </a>
          </div>
          <div>
            <button type="button" className="btn btn-sm btn-dark d-flex align-items-center" onClick={() => onToggleControls && onToggleControls()}>
              <span className="material-icons" style={{ fontSize: '18px', marginRight: '6px', color: 'white' }} aria-hidden>
                settings_suggest
              </span>
              <span style={{ color: 'white' }}>Controls</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}
