// Explications claires des erreurs de sous-titres (fonctions pures, testées)
const HF = 'https://huggingface.co/', MIRROR = 'https://hf-mirror.com/';
const hostsFor = mode => ({ hf: [HF], mirror: [MIRROR] }[mode] || [HF, MIRROR]);
const NET = [
  'Vérifie que ton ordinateur est connecté à Internet.',
  'Si le site des modèles est bloqué dans ton pays ou sur ton réseau, essaie avec un VPN, ou choisis « Miroir » dans Paramètres › Performance › Serveur des modèles.',
  'Tu peux aussi installer le modèle à la main : clique sur « Ouvrir le dossier des modèles » et suis le fichier LISEZ-MOI qui s\'y trouve.'
];
function classify({ stage = '', message = '', code = '' } = {}) {
  const t = `${message} ${code}`;
  if (/Aucune vidéo avec du son/i.test(t)) return { code: 'noaudio', title: 'Aucune vidéo avec du son', advice: ['Ajoute sur la timeline une vidéo qui contient du son (pas seulement des images ou de la musique).'] };
  if (stage === 'audio') return { code: 'audio', title: 'Le son de la vidéo n\'a pas pu être préparé', advice: ['Vérifie que le fichier vidéo est lisible et qu\'il n\'a pas été déplacé.', 'Ouvre le journal des erreurs et envoie-le moi si le problème continue.'] };
  if (/ENOTFOUND|EAI_AGAIN|getaddrinfo|ENETUNREACH|EHOSTUNREACH/i.test(t)) return { code: 'dns', title: 'Impossible de joindre le site des modèles', advice: NET };
  if (/CERT|SSL|TLS|self.signed|UNABLE_TO_VERIFY/i.test(t)) return { code: 'cert', title: 'Connexion sécurisée refusée', advice: ['Vérifie la date et l\'heure de ton ordinateur.', 'Un antivirus ou un proxy peut bloquer la connexion : désactive-le un instant puis réessaie.', NET[1]] };
  if (/ETIMEDOUT|ECONNRESET|ECONNREFUSED|UND_ERR|timeout|Aucune réponse|socket/i.test(t)) return { code: 'timeout', title: 'Connexion trop lente ou interrompue', advice: ['Réessaie : les fichiers déjà téléchargés sont conservés.', ...NET] };
  if (/\b(401|403|404)\b|Unauthorized|Forbidden|Not Found/i.test(t)) return { code: 'http', title: 'Le serveur refuse ou ne trouve pas le modèle', advice: ['Change de serveur dans Paramètres › Performance › Serveur des modèles, puis réessaie.', NET[2]] };
  if (stage === 'module' || /Cannot find module|ERR_MODULE_NOT_FOUND|sharp|onnxruntime|\.node\b/i.test(t)) return { code: 'module', title: 'Le moteur de reconnaissance n\'a pas pu démarrer', advice: ['Réinstalle KORA Studio (ou lance « npm install » dans le dossier du projet).', 'Si tu utilises l\'AppImage, télécharge la dernière version.'] };
  if (/out of memory|ENOMEM|bad_alloc|allocation failed/i.test(t)) return { code: 'memory', title: 'Mémoire insuffisante', advice: ['Choisis la précision « Rapide » (modèle plus léger).', 'Ferme les autres programmes puis réessaie.'] };
  if (/fetch failed/i.test(t)) return { code: 'dns', title: 'Téléchargement du modèle impossible', advice: NET };
  return { code: 'unknown', title: 'Erreur inattendue', advice: ['Clique sur « Copier les détails » et envoie-les moi pour que je corrige.'] };
}
module.exports = { classify, hostsFor, HF, MIRROR };
