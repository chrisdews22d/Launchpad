import { isTauri } from '@tauri-apps/api/core';
import Database from '@tauri-apps/plugin-sql';
import { defaultPreferences, demoTasks } from './data';
import type { Preferences, Task } from './data';

interface Storage {
  tasks(): Promise<Task[]>;
  saveTask(task: Task): Promise<void>;
  removeTask(id: string): Promise<void>;
  removeDemoTasks(): Promise<void>;
  preferences(): Promise<Preferences>;
  savePreferences(preferences: Preferences): Promise<void>;
}

type TaskRow = Omit<Task, 'completed' | 'myDay' | 'demo'> & {
  completed: number;
  myDay: number;
  demo: number;
};

let database: Promise<Database> | undefined;

function db() {
  database ??= Database.load('sqlite:launchpad.db').catch((error: unknown) => {
    database = undefined;
    throw error;
  });
  return database;
}

const sqlite: Storage = {
  async tasks() {
    const rows = await (await db()).select<TaskRow[]>('SELECT * FROM tasks');
    return rows.map((row) => ({
      ...row,
      completed: row.completed === 1,
      myDay: row.myDay === 1,
      demo: row.demo === 1,
    }));
  },
  async saveTask(task) {
    await (await db()).execute(
      `INSERT INTO tasks (id, title, priority, completed, myDay, demo, createdAt)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT(id) DO UPDATE SET title = excluded.title, priority = excluded.priority,
       completed = excluded.completed, myDay = excluded.myDay, demo = excluded.demo`,
      [task.id, task.title, task.priority, Number(task.completed), Number(task.myDay), Number(task.demo), task.createdAt],
    );
  },
  async removeTask(id) {
    await (await db()).execute('DELETE FROM tasks WHERE id = $1', [id]);
  },
  async removeDemoTasks() {
    await (await db()).execute('DELETE FROM tasks WHERE demo = 1');
  },
  async preferences() {
    const [row] = await (await db()).select<{ value: string }[]>('SELECT value FROM settings WHERE key = $1', ['preferences']);
    return row ? { ...defaultPreferences, ...JSON.parse(row.value) } : defaultPreferences;
  },
  async savePreferences(preferences) {
    await (await db()).execute(
      'INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
      ['preferences', JSON.stringify(preferences)],
    );
  },
};

const tasksKey = 'launchpad.preview.tasks';
const preferencesKey = 'launchpad.preview.preferences';

const preview: Storage = {
  async tasks() {
    const tasks = localStorage.getItem(tasksKey);
    return tasks === null ? demoTasks : JSON.parse(tasks);
  },
  async saveTask(task) {
    const tasks = (await preview.tasks()).filter(({ id }) => id !== task.id);
    localStorage.setItem(tasksKey, JSON.stringify([...tasks, task]));
  },
  async removeTask(id) {
    localStorage.setItem(tasksKey, JSON.stringify((await preview.tasks()).filter((task) => task.id !== id)));
  },
  async removeDemoTasks() {
    localStorage.setItem(tasksKey, JSON.stringify((await preview.tasks()).filter((task) => !task.demo)));
  },
  async preferences() {
    return { ...defaultPreferences, ...JSON.parse(localStorage.getItem(preferencesKey) ?? '{}') };
  },
  async savePreferences(preferences) {
    localStorage.setItem(preferencesKey, JSON.stringify(preferences));
  },
};

export const storage = isTauri() ? sqlite : preview;
