// Temporary debug overlay — remove after diagnosis
const _msgs = [];

export function dbg(msg) {
  const ts = new Date().toISOString().slice(11, 23);
  const line = `${ts} ${msg}`;
  _msgs.push(line);
  if (_msgs.length > 30) _msgs.shift();
  console.log(line);
  window.dispatchEvent(new Event('cm-dbg-update'));
}

export function getDbgMsgs() {
  return [..._msgs];
}
