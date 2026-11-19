import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { chatUrl, startup, windowsDesktop } from './platform';
import type { Preferences } from './data';

export function Settings({
  preferences, busy, hasDemoTasks, onSave, onRemoveDemo,
}: {
  preferences: Preferences;
  busy: boolean;
  hasDemoTasks: boolean;
  onSave: (preferences: Preferences) => void;
  onRemoveDemo: () => void;
}) {
  const [draft, setDraft] = useState(preferences);
  const [startsAtLogin, setStartsAtLogin] = useState<boolean>();
  const [updatingStartup, setUpdatingStartup] = useState(false);
  const [error, setError] = useState('');
  const [confirmRemoval, setConfirmRemoval] = useState(false);

  useEffect(() => {
    if (windowsDesktop) {
      startup.read().then(setStartsAtLogin).catch(() => setError('Could not read the Windows startup setting.'));
    }
  }, []);

  async function changeStartup(enabled: boolean) {
    setUpdatingStartup(true);
    setError('');
    try {
      await startup.write(enabled);
      setStartsAtLogin(enabled);
    } catch {
      setError('Windows could not update the startup setting.');
    } finally {
      setUpdatingStartup(false);
    }
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    setError('');
    try {
      onSave({
        ...draft,
        name: draft.name.trim(),
        staffUrl: draft.staffUrl.trim() ? chatUrl(draft.staffUrl.trim()) : '',
        newsUrl: draft.newsUrl.trim() ? chatUrl(draft.newsUrl.trim()) : '',
      });
    } catch {
      setError('Use a valid HTTPS link to chatgpt.com for each briefing.');
    }
  }

  return (
    <form className="form" onSubmit={submit}>
      <label>Display name<input value={draft.name} maxLength={45} onChange={(event) => setDraft({ ...draft, name: event.target.value })} /></label>
      <label>Chief of Staff conversation<input type="url" value={draft.staffUrl} placeholder="https://chatgpt.com/…" onChange={(event) => setDraft({ ...draft, staffUrl: event.target.value })} /></label>
      <label>Daily News conversation<input type="url" value={draft.newsUrl} placeholder="https://chatgpt.com/…" onChange={(event) => setDraft({ ...draft, newsUrl: event.target.value })} /></label>
      <label className="check-label"><input type="checkbox" checked={draft.solidPanels} onChange={(event) => setDraft({ ...draft, solidPanels: event.target.checked })} /> Use more opaque panels</label>
      <label className="check-label"><input type="checkbox" checked={draft.showDemoContent ?? !(draft.staffUrl || draft.newsUrl)} onChange={(event) => setDraft({ ...draft, showDemoContent: event.target.checked })} /> Show demo content</label>
      <label className="check-label"><input type="checkbox" checked={startsAtLogin ?? false} disabled={startsAtLogin === undefined || updatingStartup} onChange={(event) => void changeStartup(event.target.checked)} /> Launch at Windows login</label>
      {!windowsDesktop && <p className="muted text-sm">Launch at login is available in the Windows app.</p>}
      {error && <p className="error" role="alert">{error}</p>}
      <div className="form-actions">
        {hasDemoTasks && <button type="button" className="danger mr-auto" disabled={busy} onClick={() => {
          if (confirmRemoval) onRemoveDemo();
          else setConfirmRemoval(true);
        }}>{confirmRemoval ? 'Confirm removal' : 'Remove demo tasks'}</button>}
        <button className="primary" disabled={busy}>Save settings</button>
      </div>
    </form>
  );
}
