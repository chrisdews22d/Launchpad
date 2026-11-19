import { isTauri } from '@tauri-apps/api/core';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { disable, enable, isEnabled } from '@tauri-apps/plugin-autostart';
import { openUrl } from '@tauri-apps/plugin-opener';

export const windowsDesktop = isTauri() && /Windows/i.test(navigator.userAgent);
export const desktopWindow = windowsDesktop ? getCurrentWindow() : undefined;

export const startup = {
  read: isEnabled,
  write: (enabled: boolean) => enabled ? enable() : disable(),
};

export function chatUrl(value: string) {
  const url = new URL(value);
  if (url.origin !== 'https://chatgpt.com' || url.username || url.password) {
    throw new Error('Enter an HTTPS link to chatgpt.com.');
  }
  return url.href;
}

export async function openChat(value = 'https://chatgpt.com/') {
  const url = chatUrl(value);
  if (isTauri()) {
    await openUrl(url);
  } else {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}
