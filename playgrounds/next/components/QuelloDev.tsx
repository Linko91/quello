'use client'

import { useEffect } from 'react'

/**
 * Next does not build on Vite, so `vite-plugin-quello` cannot inject anything here.
 * The runtime itself is framework-agnostic, so it is imported directly and pointed
 * at the route handler below `app/api/quello/picks`, which does what the plugin's
 * dev-server middleware does elsewhere.
 *
 * This is the shape a `@quello/next` package would formalise.
 */
export function QuelloDev() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return
    let stop: (() => void) | undefined
    void import('@quello/core').then(({ createQuello }) => {
      const instance = createQuello({ endpoint: '/api/quello/picks' })
      stop = () => instance.destroy()
    })
    return () => stop?.()
  }, [])

  return null
}
