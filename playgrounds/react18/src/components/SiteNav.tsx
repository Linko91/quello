import { NavLink } from 'react-router-dom'

const linkClass = ({ isActive }: { isActive: boolean }) => (isActive ? 'active' : '')

export function SiteNav() {
  return (
    <nav className="site-nav">
      <span className="brand">quello</span>
      <NavLink to="/" className={linkClass} end>
        Overview
      </NavLink>
      <NavLink to="/gallery" className={linkClass}>
        Gallery
      </NavLink>
      <NavLink to="/article" className={linkClass}>
        Article
      </NavLink>
      <span className="spacer" />
      <span className="hint">Alt+Q to pick</span>
    </nav>
  )
}
