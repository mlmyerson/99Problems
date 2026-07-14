function readOptionalString(name) {
  const value = import.meta.env[name]
  return typeof value === 'string' ? value.trim() : ''
}

function readOptionalBoolean(name, fallback = false) {
  const value = readOptionalString(name)
  if (!value) return fallback
  return value === 'true'
}

function validateOptionalProxyUrl(url) {
  if (!url) return

  const isRelativePath = url.startsWith('/')
  const isHttpsUrl = url.startsWith('https://')

  if (!isRelativePath && !isHttpsUrl) {
    throw new Error('VITE_OPENAI_PROXY_URL must be an HTTPS URL or relative path.')
  }
}

export const publicClientConfig = Object.freeze({
  openAiProxyUrl: readOptionalString('VITE_OPENAI_PROXY_URL'),
  openAiUiEnabled: readOptionalBoolean('VITE_ENABLE_OPENAI_UI'),
})

export function validatePublicEnv() {
  if (readOptionalString('VITE_OPENAI_API_KEY')) {
    throw new Error(
      'VITE_OPENAI_API_KEY must not be set. OpenAI secrets must stay server-side and never ship in the browser bundle.'
    )
  }

  validateOptionalProxyUrl(publicClientConfig.openAiProxyUrl)
}
