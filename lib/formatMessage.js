const PLACEHOLDER_RE = /\{(\w+)\}/g;

export function formatMessage(template = '', values = {}) {
  return String(template).replace(PLACEHOLDER_RE, (placeholder, name) =>
    values[name] === undefined || values[name] === null ? '' : String(values[name]),
  );
}
