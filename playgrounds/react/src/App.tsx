import { useState } from 'react'
import { CardList } from './components/CardList'

export function App() {
  const [clicks, setClicks] = useState(0)
  return (
    <main className="page">
      <h1>quello · React playground</h1>
      <p className="hint">
        Hit <strong>Alt+Q</strong> (or the button, bottom right) to start picking, then click any
        element. Picks land in <code>.quello/picks.json</code>.
      </p>
      <CardList />
      <button className="cta" onClick={() => setClicks((n) => n + 1)}>
        Clicked {clicks} times
      </button>
    </main>
  )
}
