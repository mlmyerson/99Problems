const requiredServerSecrets = ['OPENAI_API_KEY']

const missingSecrets = requiredServerSecrets.filter((name) => {
  const value = process.env[name]
  return typeof value !== 'string' || value.trim() === ''
})

if (missingSecrets.length > 0) {
  console.error(`Missing required server-side secret(s): ${missingSecrets.join(', ')}`)
  console.error('Set them in GitHub Actions secrets or your local shell before running server-side integrations.')
  process.exit(1)
}

console.log('Server-side secret wiring is configured. Secret values were not printed.')
