export function envStatus() {
  return {
    gemini: Boolean(getGeminiApiKey()),
    everos: Boolean(process.env.EVEROS_API_KEY),
    butterbase: Boolean(process.env.BUTTERBASE_API_KEY && (process.env.BUTTERBASE_APP_ID || process.env.BUTTERBASE_PROJECT_ID))
  };
}

export function isDemoMode() {
  const status = envStatus();
  return !status.gemini || !status.everos || !status.butterbase;
}

export function hasGemini() {
  return Boolean(getGeminiApiKey());
}

export function getGeminiApiKey() {
  return process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY || "";
}

export function hasEverOS() {
  return Boolean(process.env.EVEROS_API_KEY);
}

export function hasButterbase() {
  return Boolean(process.env.BUTTERBASE_API_KEY && (process.env.BUTTERBASE_APP_ID || process.env.BUTTERBASE_PROJECT_ID));
}
