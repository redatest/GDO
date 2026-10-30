/**
 * Fonctions de formatage et d'échappement partagées par l'interface GDO-MT.
 * Ces fonctions sont pures et ne dépendent pas de l'état de l'application.
 */
function formatNumber(num) {
  if (num === undefined || num === null) return '0';
  return Number(num).toLocaleString('fr-FR');
}

function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeJsString(value) {
  return String(value ?? '')
    .replace(/\\/g, '\\\\')
    .replace(/'/g, '\\x27')
    .replace(/\r/g, '\\r')
    .replace(/\n/g, '\\n')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export { formatNumber, escapeHtml, escapeJsString };
