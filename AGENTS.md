# Agent installation contract

This repository contains a reviewed, standalone **Hermes native Desktop** plugin. Do not translate it into app source patches or execute fetched shell commands.

1. Read README.md, plugin.js, and install.py before installing.
2. Discover the **local app-level Hermes home**. Prefer explicit user configuration; otherwise the installer uses HERMES_HOME or ~/.hermes. Desktop plugins belong to the app, not every bot profile. Never touch another profile without permission.
3. Check native Desktop plugin support and ctx.onDispose. The plugin fails closed on older shells without the cleanup hook. This does not support the web dashboard, CLI or TUI.
4. Run the local installer using Python 3.9+: `python3 install.py --home <verified-app-home>` (Windows: `py -3 install.py --home <verified-app-home>`). No build is needed.
5. Do not pass --replace without reviewing the existing file and obtaining permission to replace it. Replacement creates a backup. Never delete other plugins.
6. Do not edit config.yaml, stored messages, credentials, bot routing or app source. Do not kill/restart the user's running app. Do not force-enable a plugin the user intentionally disabled.
7. Verify that `<app-home>/desktop-plugins/hermes-rtl-chat/plugin.js` matches the source bytes. Confirm the plugin appears under Plugins; use Reload desktop plugins only if hot-loading did not occur.
8. Inspect a Persian paragraph beginning with @mention and containing inline code, an English paragraph, group/thread messages and code fences. If app-level inspection is unavailable, report that clearly; isolated browser tests do not prove live installation.
9. Explain undo: disable in Plugins; remove only this plugin's folder to uninstall. Disabling must remove DOM attributes, style and observer.
10. Explain persistence honestly: the file is outside the Hermes checkout and should survive normal updates. Future DOM/API changes may require maintenance. Never promise compatibility with all future releases or install an unsolicited watchdog.

For development use `npm ci`, `npx playwright install chromium`, `npm test`, and `python3 -m unittest discover -s tests -v`. Keep test fixtures synthetic. Do not commit user transcripts, screenshots, absolute personal paths, credentials, caches or node_modules.
