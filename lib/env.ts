export function envStatus() {
  return {
    openai: Boolean(process.env.openaiapikey || process.env.OPENAI_API_KEY),
    everos: Boolean(process.env.EVEROS_API_KEY),
    butterbase: Boolean(process.env.BUTTERBASE_API_KEY && (process.env.BUTTERBASE_APP_ID || process.env.BUTTERBASE_PROJECT_ID))
  };
}

export function isDemoMode() {
  const status = envStatus();
  return !status.openai || !status.everos || !status.butterbase;
}

export function hasOpenAI() {
  return Boolean(process.env.openaiapikey || process.env.OPENAI_API_KEY);
}

export function hasEverOS() {
  return Boolean(process.env.EVEROS_API_KEY);
}

export function hasButterbase() {
  return Boolean(process.env.BUTTERBASE_API_KEY && (process.env.BUTTERBASE_APP_ID || process.env.BUTTERBASE_PROJECT_ID));
}
