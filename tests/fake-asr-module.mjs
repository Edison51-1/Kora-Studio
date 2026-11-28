// Faux moteur de reconnaissance pour les tests (aucun téléchargement)
export const env = {};
export async function pipeline(task, model, o) {
  const bad = host => { const e = new TypeError('fetch failed'); e.cause = { code: 'ENOTFOUND', message: 'getaddrinfo ENOTFOUND ' + host }; return e; };
  if (process.env.FAKE_ASR_ALL_FAIL || /huggingface\.co/.test(env.remoteHost)) throw bad(new URL(env.remoteHost).hostname);
  return async () => ({ chunks: [{ text: ' Bonjour du miroir', timestamp: [0.5, 2] }] });
}
