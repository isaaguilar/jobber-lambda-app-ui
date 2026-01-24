// Root shim so Tailwind finds the real config when process.cwd() is the repo root.
module.exports = require('./web/tailwind.config.cjs');
