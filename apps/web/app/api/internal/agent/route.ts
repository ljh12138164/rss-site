import { internalService } from '@/lib/internal-service'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const POST = (request: Request) => internalService().fetch(request)
