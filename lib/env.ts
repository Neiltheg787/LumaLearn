export function envStatus() {
  return {
    gemini: Boolean(process.env.GEMINI_API_KEY),
    everos: Boolean(process.env.EVEROS_API_KEY),
    butterbase: Boolean(process.env.BUTTERBASE_API_KEY && process.env.BUTTERBASE_PROJECT_ID)
  };
}

export function isDemoMode() {
  const status = envStatus();
  return !status.gemini || !status.everos || !status.butterbase;
}

export function hasGemini() {
  return Boolean(process.env.GEMINI_API_KEY);
}

export function hasEverOS() {
  return Boolean(process.env.EVEROS_API_KEY);
}

export function hasButterbase() {
  return Boolean(process.env.BUTTERBASE_API_KEY && process.env.BUTTERBASE_PROJECT_ID);
}
