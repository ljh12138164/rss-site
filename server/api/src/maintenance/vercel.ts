import { RefreshError, type Request, requestJson } from './zhihu'

export interface VercelConfig {
  token: string
  projectId: string
  teamId?: string
}

export function vercelClient(config: VercelConfig, request: Request = fetch) {
  async function api(path: string, init: RequestInit = {}) {
    const url = new URL(path, 'https://api.vercel.com')
    if (config.teamId) url.searchParams.set('teamId', config.teamId)
    return requestJson(request, url.toString(), {
      ...init,
      headers: { Authorization: `Bearer ${config.token}`, 'Content-Type': 'application/json' }
    })
  }
  const project = encodeURIComponent(config.projectId)
  return {
    async publish(cookie: string): Promise<string> {
      const response = await api(`/v9/projects/${project}/env`)
      const { envs } = (await response.json()) as {
        envs: Array<{ id: string; key: string; target: string[]; gitBranch?: string }>
      }
      const variable = envs.find(
        (env) => env.key === 'ZHIHU_COOKIES' && env.target.includes('production') && !env.gitBranch
      )
      if (!variable || variable.target.some((target) => target !== 'production')) {
        throw new RefreshError('production_cookie_variable_required')
      }
      const updated = await api(`/v9/projects/${project}/env/${encodeURIComponent(variable.id)}`, {
        method: 'PATCH',
        body: JSON.stringify({ value: cookie })
      })
      await updated.body?.cancel()
      const deploymentsResponse = await api(
        `/v6/deployments?projectId=${project}&target=production&state=READY&limit=1`
      )
      const { deployments } = (await deploymentsResponse.json()) as {
        deployments: Array<{ uid: string; name: string }>
      }
      if (!deployments[0]?.uid || !deployments[0]?.name)
        throw new RefreshError('production_deployment_required')
      const created = await api('/v13/deployments', {
        method: 'POST',
        body: JSON.stringify({
          name: deployments[0].name,
          project: config.projectId,
          deploymentId: deployments[0].uid,
          target: 'production',
          withLatestCommit: false
        })
      })
      const deployment = (await created.json()) as { id?: unknown }
      if (typeof deployment.id !== 'string' || !deployment.id)
        throw new RefreshError('invalid_deployment')
      return deployment.id
    },
    async status(id: string): Promise<string> {
      const response = await api(`/v13/deployments/${encodeURIComponent(id)}`)
      const data = (await response.json()) as {
        readyState?: unknown
        projectId?: unknown
        target?: unknown
      }
      if (
        data.projectId !== config.projectId ||
        data.target !== 'production' ||
        typeof data.readyState !== 'string'
      ) {
        throw new RefreshError('invalid_deployment')
      }
      return data.readyState
    }
  }
}
