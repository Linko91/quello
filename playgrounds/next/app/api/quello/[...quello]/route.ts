// Added by quello (@quello/next). Dev-only: a production build answers 404.
import { quelloRoute } from '@quello/next/route'

export const dynamic = 'force-dynamic'

export const { GET, HEAD, POST, PUT, DELETE, OPTIONS } = quelloRoute()
