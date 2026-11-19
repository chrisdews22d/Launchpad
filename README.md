# Launchpad

Launchpad is a Windows dashboard with a responsive React and TypeScript interface, Tailwind CSS, and a Tauri 2 desktop shell.

## Use Launchpad

- **Today** shows the Chief of Staff Brief, Daily News Brief, calendar, chat shortcut, and My Day tasks. Demo weather and other samples appear until a briefing link is added. You can show them again in Settings.
- **Tasks** supports creating, editing, prioritising, completing, and deleting tasks. Select a task name to edit it. Use **My Day**, **All tasks**, or **Completed** to change the view.
- **Settings** lets you set your display name, adjust panel opacity, and hide or remove sample tasks. Paste your existing ChatGPT links to open them from the two brief cards. A linked card displays the ChatGPT shortcut in place of its sample.
- **New Chat** opens ChatGPT in your default browser. In the installed Windows app, switch on **Launch at Windows login** in Settings to register Launchpad with Windows startup.

The desktop app saves tasks and preferences in a local SQLite database. Outlook, live news and weather, automatic brief generation, and cloud sync are future integrations. The initial release needs no API credentials.

## Current milestone

Version 0.1.1 includes the Windows dashboard, local tasks, launch at login, and configurable ChatGPT shortcuts. On a new PC, add your briefing links in Settings and enable launch at login there. Tasks and preferences are specific to each installation.

The next checkpoint is to display one automatically delivered Chief of Staff brief in Launchpad. First verify that the existing scheduled agent can write its finished Markdown brief to a private work OneDrive or SharePoint folder without manual approval on each run. Then have the Windows app read the synced file, retain the last good copy, and display the briefing date and source links. Use the same delivery path for Daily News once the first brief works.

## Develop

Install Node.js, Rust with the Windows MSVC toolchain, Visual Studio C++ Build Tools, and WebView2. Run these commands from the project directory.

```powershell
npm ci
npm run tauri -- dev
```

Run `npm run build` to type-check and build the frontend. `npm run dev` opens a browser preview with local browser storage and no native window controls. Use `npm run tauri -- build --bundles nsis` to build the Windows installer. Tauri writes it under `src-tauri/target/release/bundle/nsis`.

The shared UI reflows at phone widths. Windows window controls and startup registration are isolated in `src/platform.ts` and the Windows-specific Tauri configuration. The storage interface in `src/storage.ts` keeps persistence out of the UI and provides a boundary for adding sync later. Future API credentials belong in OS credential storage or a backend, outside the frontend bundle and local preferences.
