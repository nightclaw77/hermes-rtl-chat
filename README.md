# Hermes RTL Chat

**Readable Persian / Arabic and mixed-direction conversations in Hermes Desktop.**

[راهنمای فارسی](README.fa.md) · [Agent installation instructions](AGENTS.md) · [MIT license](LICENSE)

A small, reversible desktop plugin — not an app patch. Persian-dominant paragraphs align right; English-dominant paragraphs align left. Inline code, fenced code and recognized bot mentions stay isolated so paths and handles do not scramble surrounding prose.

## Give this to your agent

> Install the Hermes RTL Chat plugin from this repository. Read AGENTS.md and review plugin.js and install.py first. Discover the local Hermes Desktop app-level home, then use the installer. Do not patch Hermes source, restart my running app, modify credentials/config/messages, or force-overwrite a different existing plugin. Verify mixed Persian/English text and bot-group messages. Explain how to disable it and what compatibility you actually tested.

## Install

Requires a Hermes **native Desktop** version with standalone desktop plugins and `ctx.onDispose`. Python 3.9+ is needed only for the installer. No Node, npm, model API key, or build is needed to use the plugin.

1. Clone or download and extract this repository. Review `plugin.js` and `install.py`.

```sh
git clone https://github.com/nightclaw77/hermes-rtl-chat.git
cd hermes-rtl-chat
```

2. From the repository directory:

```sh
python3 install.py
```

On Windows:

```powershell
py -3 install.py
```

If the app uses a custom home:

```sh
python3 install.py --home /path/to/hermes-home
```

The installer uses `HERMES_HOME` if set, otherwise `~/.hermes`. Desktop plugins are **app-level**: install into the home that owns the local app's desktop plugins, not into every bot profile. For remote gateways, install on the machine running the Desktop window.

Target: `<app-home>/desktop-plugins/hermes-rtl-chat/plugin.js`.

The app normally loads it live. If needed, open the command palette and run **Reload desktop plugins**. If it was previously disabled, enable **RTL Chat — Persian & mixed text** under Settings / Capabilities → Plugins. No restart required.

Manual installation also works: copy only `plugin.js` to the target above. Keep the folder name exactly `hermes-rtl-chat`.

## Safety / undo

- No network requests, credentials, telemetry, storage calls, or message rewriting at plugin runtime.
- Changes only scoped CSS and plugin-owned DOM attributes on rendered chat text.
- Does not flip the whole interface, terminal, editor, composer, or bot configuration.
- New messages and streaming text are handled by a batched `MutationObserver`.
- Disable the plugin in Settings → Plugins to remove styles/attributes and disconnect the observer.
- Uninstall by disabling it, then removing **only** its `hermes-rtl-chat` folder.
- The installer is idempotent and refuses a different existing plugin unless `--replace` is supplied. That option saves the old file in `<app-home>/backups/hermes-rtl-chat/<sha256>.js` before replacement. Symlink destinations are refused.

## Updates and compatibility

This file lives outside the Hermes checkout and packaged app. Normal source/package updates should preserve it; the current local updater works on the application checkout, while desktop reconciliation only prunes package-owned copies carrying `.hermes-package.json` (this standalone plugin has no such marker).

**Persistence is not a promise of indefinite compatibility.** Future Hermes changes to message DOM selectors or plugin APIs may require a plugin update. Deleting/resetting the app home also deletes user plugins. There is no hidden auto-reinstaller or forced re-enable: intentionally disabling it stays respected.

Covered selectors: bot-group message content, normal assistant markdown, and user inline text. Older renderers without these hooks may not be covered. Direction is determined by the dominant Arabic/Hebrew vs other prose letters, excluding code, recognized mentions and URLs; ambiguous or heavily code-mixed paragraphs can still need manual review. Bare unmarked technical text is not rewritten or wrapped.

See the [official Desktop Plugin SDK](https://hermes-agent.nousresearch.com/docs/developer-guide/desktop-plugin-sdk) for plugin loading and lifecycle behavior. This is an independent plugin, not an official Nous Research product. Inspired by the readability problem addressed by [rtl-chat-zcode](https://github.com/the-Ashkanian/rtl-chat-zcode); implementation is independently written for Hermes.

## Development and verification

```sh
npm ci
npx playwright install chromium
npm test
python3 -m unittest discover -s tests -v
```

Use an existing Chromium instead of downloading one:

```sh
CHROMIUM_PATH=/usr/bin/chromium npm test
```

The browser test uses synthetic conversations, never user transcripts. It checks direction, code/mention isolation, live updates, unchanged selected text, scope and cleanup. Installer tests use temporary fake homes, never the real configuration. A GitHub Actions template for both is included in `docs/ci-example.yml`. To enable it, copy it to `.github/workflows/test.yml` using an account or token with workflow permissions. CI is not enabled or claimed green for this release.

Locally verified on Linux with real Chromium and the installed Hermes Desktop; the user confirmed the improved bot-group display. Windows/macOS installation paths are supported by the Python installer but have not been exercised on those operating systems. No real Hermes update or app restart was performed for this release.
