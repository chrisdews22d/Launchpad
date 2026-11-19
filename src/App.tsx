import {
  ArrowUpRight, BriefcaseBusiness, CalendarDays, CloudSun, Home, Layers3, MessageCircle,
  MessagesSquare, Minus, Newspaper, Plus, Search, Settings2, Square, SquareCheckBig, X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { defaultPreferences, meetings, news, staffBrief } from './data';
import type { Preferences, Task } from './data';
import { desktopWindow, openChat } from './platform';
import { Settings } from './Settings';
import { storage } from './storage';
import { TaskEditor, Tasks } from './Tasks';

const tabs = [
  { label: 'Today', icon: Home },
  { label: 'Chat', icon: MessagesSquare },
  { label: 'Tasks', icon: SquareCheckBig },
  { label: 'Calendar', icon: CalendarDays },
] as const;
type Tab = typeof tabs[number]['label'];
type Overlay = { type: 'settings' | 'search' | 'staff' | 'news' }
  | { type: 'article'; index: number }
  | { type: 'task'; task?: Task };

const timeZone = 'Pacific/Auckland';
const dateFormat = new Intl.DateTimeFormat('en-NZ', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone });
const shortDate = new Intl.DateTimeFormat('en-NZ', { weekday: 'short', day: 'numeric', month: 'short', timeZone });
const hourFormat = new Intl.DateTimeFormat('en-NZ', { hour: 'numeric', hourCycle: 'h23', timeZone });
const resizeEdges = ['North', 'NorthEast', 'East', 'SouthEast', 'South', 'SouthWest', 'West', 'NorthWest'] as const;

function Modal({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    dialog.current?.showModal();
  }, []);
  return (
    <dialog ref={dialog} className="modal" aria-labelledby="modal-title" onCancel={(event) => {
      event.preventDefault();
      onClose();
    }}>
      <header className="flex items-start justify-between gap-4">
        <h2 id="modal-title">{title}</h2>
        <button className="icon-button" aria-label="Close dialog" onClick={onClose}><X size={19} /></button>
      </header>
      {children}
    </dialog>
  );
}

function Calendar({ date, showDemoContent }: { date: Date; showDemoContent: boolean }) {
  return (
    <section className="panel calendar-panel">
      <header className="panel-header calendar-header">
        <CalendarDays className="panel-icon blue" />
        <h2>Today’s Calendar</h2>
        <time className="panel-meta">{shortDate.format(date)}</time>
      </header>
      {showDemoContent ? <ol className="agenda">
        {meetings.map((meeting) => (
          <li key={meeting.time}>
            <span className="meeting-time">{meeting.time}</span>
            <div className={`meeting-marker ${meeting.colour}`} />
            <div><p>{meeting.title}</p>{meeting.detail && <p className="muted">{meeting.detail}</p>}</div>
          </li>
        ))}
      </ol> : <p className="empty-state">Outlook isn’t connected yet.</p>}
    </section>
  );
}

function NewsPhoto({ index }: { index: number }) {
  return <div className={`news-photo photo-${index}`} aria-hidden />;
}

function NewsFeed({ onArticle }: { onArticle: (index: number) => void }) {
  return (
    <div className="news-grid">
      {news.map((article, index) => (
        <button key={article.title} className="news-tile" onClick={() => onArticle(index)}>
          <NewsPhoto index={index} />
          <span>{article.title}</span>
        </button>
      ))}
    </div>
  );
}

function ChatPanel({ onOpen }: { onOpen: () => void }) {
  return (
    <section className="panel chat-panel">
      <header className="panel-header">
        <MessageCircle className="panel-icon mint" />
        <div><h2>Start a new chat</h2><p>Get advice, solve a problem, or explore an idea.</p></div>
      </header>
      <button className="new-chat" onClick={onOpen}><Plus size={20} /> New Chat</button>
    </section>
  );
}

function SearchPanel({
  tasks, showDemoContent, preferences, onTask, onArticle, onCalendar, onStaff, onNews,
}: {
  tasks: Task[];
  showDemoContent: boolean;
  preferences: Preferences;
  onTask: (task: Task) => void;
  onArticle: (index: number) => void;
  onCalendar: () => void;
  onStaff: () => void;
  onNews: () => void;
}) {
  const [query, setQuery] = useState('');
  const term = query.trim().toLowerCase();
  const items = [
    ...tasks.map((task) => ({ title: task.title, section: 'Tasks', select: () => onTask(task) })),
    ...(showDemoContent ? meetings.map((meeting) => ({ title: meeting.title, section: 'Calendar · Demo', select: onCalendar })) : []),
    ...(showDemoContent && !preferences.newsUrl ? news.map((article, index) => ({ title: article.title, section: 'News · Demo', select: () => onArticle(index) })) : []),
    ...(preferences.staffUrl || showDemoContent ? [{ title: 'Chief of Staff Brief', section: 'Brief', select: onStaff }] : []),
    ...(preferences.newsUrl ? [{ title: 'Daily News Brief', section: 'Brief', select: onNews }] : []),
  ];
  const results = term ? items.filter((item) => `${item.title} ${item.section}`.toLowerCase().includes(term)) : [];
  return (
    <div className="form">
      <label className="sr-only" htmlFor="search-input">Search Launchpad</label>
      <input id="search-input" type="search" placeholder="Search tasks, meetings and briefs" autoFocus value={query} onChange={(event) => setQuery(event.target.value)} />
      {term && results.length === 0 && <p className="muted">No matching results.</p>}
      <ul className="search-results">
        {results.map((item, index) => <li key={index}><button onClick={item.select}>{item.title}<small>{item.section}</small></button></li>)}
      </ul>
    </div>
  );
}

export function App() {
  const nativeWindow = desktopWindow;
  const [tab, setTab] = useState<Tab>('Today');
  const [overlay, setOverlay] = useState<Overlay>();
  const [date, setDate] = useState(() => new Date());
  const [tasks, setTasks] = useState<Task[]>([]);
  const [preferences, setPreferences] = useState(defaultPreferences);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const activeWrite = useRef(false);
  const [error, setError] = useState('');
  const main = useRef<HTMLElement>(null);

  useEffect(() => {
    void Promise.all([storage.tasks(), storage.preferences()]).then(([loadedTasks, loadedPreferences]) => {
      setTasks(loadedTasks);
      setPreferences(loadedPreferences);
      setReady(true);
    }).catch(() => setError('Could not load local Launchpad data. Restart Launchpad to try again.'));
    const timer = window.setInterval(() => setDate(new Date()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  function go(next: Tab) {
    setTab(next);
    main.current?.scrollTo(0, 0);
    setOverlay(undefined);
  }

  async function persist(action: () => Promise<void>, onSuccess: () => void) {
    if (!ready || activeWrite.current) return;
    activeWrite.current = true;
    setBusy(true);
    setError('');
    try {
      await action();
      onSuccess();
    } catch {
      setError('Could not save the change. Try again.');
    } finally {
      activeWrite.current = false;
      setBusy(false);
    }
  }

  function saveTask(task: Task, close = false) {
    void persist(() => storage.saveTask(task), () => {
      setTasks((current) => [...current.filter(({ id }) => id !== task.id), task]);
      if (close) setOverlay(undefined);
    });
  }

  function followChat(url?: string) {
    setError('');
    void openChat(url).catch(() => setError('Could not open ChatGPT in your browser.'));
  }

  function openArticle(index: number) {
    setOverlay({ type: 'article', index });
  }

  function openBrief(type: 'staff' | 'news', url: string) {
    if (url) {
      setOverlay(undefined);
      followChat(url);
    } else {
      setOverlay({ type });
    }
  }

  function windowAction(action: () => Promise<void>) {
    void action().catch(() => setError('Windows could not change the application window.'));
  }

  const hours = Number(hourFormat.format(date));
  const greeting = hours < 12 ? 'Good morning' : hours < 18 ? 'Good afternoon' : 'Good evening';
  const showDemoContent = ready && (preferences.showDemoContent ?? !(preferences.staffUrl || preferences.newsUrl));
  const showStaffSample = showDemoContent && !preferences.staffUrl;
  const showNewsSample = showDemoContent && !preferences.newsUrl;
  const visibleTasks = showDemoContent ? tasks : tasks.filter((task) => !task.demo);
  const taskList = <Tasks tasks={visibleTasks} busy={busy || !ready} onToggle={(task) => saveTask({ ...task, completed: !task.completed })}
    onAdd={() => setOverlay({ type: 'task' })} onEdit={(task) => setOverlay({ type: 'task', task })} />;
  const notice = error && <p role="alert" className="notice error">{error}<button onClick={() => setError('')} aria-label="Dismiss error"><X size={16} /></button></p>;
  const overlayTitle = overlay?.type === 'article' ? news[overlay.index].title
    : overlay?.type === 'task' ? (overlay.task ? 'Edit task' : 'Add a task')
    : overlay && { settings: 'Settings', search: 'Search', staff: 'Chief of Staff Brief', news: 'Daily News Brief' }[overlay.type];

  return (
    <div className={`app-shell ${preferences.solidPanels ? 'solid-panels' : ''}`}>
      {nativeWindow && resizeEdges.map((direction) => <div key={direction} className={`resize-edge resize-${direction.toLowerCase()}`}
        onPointerDown={(event) => {
          if (event.button === 0) windowAction(() => nativeWindow.startResizeDragging(direction));
        }} aria-hidden />)}
      <header className="topbar" data-tauri-drag-region>
        <button className="brand" onClick={() => go('Today')} aria-label="Launchpad home">
          <Layers3 size={36} strokeWidth={1.35} /><span>Launchpad</span>
        </button>
        <nav aria-label="Main navigation">
          {tabs.map(({ label, icon: Icon }) => (
            <button key={label} onClick={() => go(label)} aria-current={tab === label ? 'page' : undefined}>
              <Icon size={21} /><span>{label}</span>
            </button>
          ))}
        </nav>
        <div className="header-actions">
          <button className="icon-button" onClick={() => setOverlay({ type: 'search' })} aria-label="Search"><Search size={21} /></button>
          <button className="icon-button" onClick={() => setOverlay({ type: 'settings' })} aria-label="Settings" disabled={!ready}><Settings2 size={21} /></button>
          {nativeWindow && <div className="window-controls">
            <button className="icon-button" aria-label="Minimize" onClick={() => windowAction(() => nativeWindow.minimize())}><Minus size={16} /></button>
            <button className="icon-button" aria-label="Maximize or restore" onClick={() => windowAction(() => nativeWindow.toggleMaximize())}><Square size={13} /></button>
            <button className="icon-button close-window" aria-label="Close window" onClick={() => windowAction(() => nativeWindow.close())}><X size={17} /></button>
          </div>}
        </div>
      </header>
      <main ref={main}>
        {!overlay && notice}
        {tab === 'Today' ? <>
          <div className="welcome">
            <div>
              <h1>{greeting}{preferences.name ? `, ${preferences.name}` : ''}.</h1>
              <time>{dateFormat.format(date)}</time>
            </div>
            {showDemoContent && <div className="weather" aria-label="Demo weather for Auckland, 19 degrees Celsius">
              <CloudSun size={44} strokeWidth={1.35} />
              <div><p>Auckland</p><div className="flex items-baseline gap-4"><strong>19°C</strong><span>H 23° &nbsp; L 15°</span></div></div>
            </div>}
          </div>
          <div className="dashboard">
            <div className="dashboard-stack">
              <section className="panel staff-panel">
                <header className="panel-header">
                  <BriefcaseBusiness className="panel-icon lavender" />
                  <div><h2>Chief of Staff Brief</h2><p>Your priorities, context and opportunities for today.</p></div>
                  {showStaffSample && <button className="panel-link panel-meta" onClick={() => openBrief('staff', '')} aria-label="Open Chief of Staff sample">Today <ArrowUpRight size={16} /></button>}
                </header>
                {showStaffSample ? <ul className="priorities">{staffBrief.map((priority) => <li key={priority}>{priority}</li>)}</ul>
                  : preferences.staffUrl ? <button className="new-chat" onClick={() => openBrief('staff', preferences.staffUrl)}>Open Chief of Staff in ChatGPT <ArrowUpRight size={16} /></button>
                  : <button className="new-chat" onClick={() => setOverlay({ type: 'settings' })}>Add a Chief of Staff link</button>}
              </section>
              <section className="panel news-panel">
                <header className="panel-header">
                  <Newspaper className="panel-icon mint" />
                  <div><h2>Daily News Brief</h2><p>Key updates in MEP, BIM, AI and automation.</p></div>
                  {showNewsSample && <button className="panel-link panel-meta" onClick={() => openBrief('news', '')} aria-label="Open Daily News sample">Today <ArrowUpRight size={16} /></button>}
                </header>
                {showNewsSample ? <NewsFeed onArticle={openArticle} />
                  : preferences.newsUrl ? <button className="new-chat" onClick={() => openBrief('news', preferences.newsUrl)}>Open Daily News in ChatGPT <ArrowUpRight size={16} /></button>
                  : <button className="new-chat" onClick={() => setOverlay({ type: 'settings' })}>Add a Daily News link</button>}
              </section>
            </div>
            <div className="dashboard-stack">
              <Calendar date={date} showDemoContent={showDemoContent} />
              <ChatPanel onOpen={() => followChat()} />
            </div>
            {taskList}
          </div>
        </> : <div className="section-page">
          <h1>{tab}</h1>
          {tab === 'Tasks' && taskList}
          {tab === 'Calendar' && <Calendar date={date} showDemoContent={showDemoContent} />}
          {tab === 'Chat' && <ChatPanel onOpen={() => followChat()} />}
        </div>}
        {showDemoContent && (tab === 'Today' || tab === 'Calendar' || (tab === 'Tasks' && visibleTasks.some((task) => task.demo))) &&
          <footer className="demo-note">{tab === 'Today' ? 'Demo data · Turn off samples in Settings.' :
            tab === 'Calendar' ? 'Demo data · Sample meetings.' : 'Demo tasks are included. Hide or remove them in Settings.'}</footer>}
      </main>
      {overlay && <Modal key={overlay.type} title={overlayTitle ?? ''} onClose={() => {
        setError('');
        setOverlay(undefined);
      }}>
        {notice}
        {overlay.type === 'task' && <TaskEditor task={overlay.task} busy={busy} onSave={(task) => saveTask(task, true)}
          onClose={() => setOverlay(undefined)} onDelete={(id) => void persist(() => storage.removeTask(id), () => {
            setTasks((current) => current.filter((task) => task.id !== id));
            setOverlay(undefined);
          })} />}
        {overlay.type === 'settings' && <Settings preferences={preferences} busy={busy} hasDemoTasks={tasks.some((task) => task.demo)}
          onSave={(value: Preferences) => void persist(() => storage.savePreferences(value), () => {
            setPreferences(value);
            setOverlay(undefined);
          })} onRemoveDemo={() => void persist(storage.removeDemoTasks, () => setTasks((current) => current.filter((task) => !task.demo)))} />}
        {overlay.type === 'search' && <SearchPanel tasks={visibleTasks} showDemoContent={showDemoContent} preferences={preferences}
          onArticle={openArticle} onCalendar={() => go('Calendar')} onTask={(task) => setOverlay({ type: 'task', task })}
          onStaff={() => openBrief('staff', preferences.staffUrl)} onNews={() => openBrief('news', preferences.newsUrl)} />}
        {overlay.type === 'staff' && <div className="modal-content"><p className="muted">Demo briefing</p>
          <ul className="priorities">{staffBrief.map((priority) => <li key={priority}>{priority}</li>)}</ul></div>}
        {overlay.type === 'news' && <div className="modal-content"><p className="muted mb-4">Demo briefing</p><NewsFeed onArticle={openArticle} /></div>}
        {overlay.type === 'article' && <div className="modal-content article"><NewsPhoto index={overlay.index} />
          <p className="muted">Demo article · {news[overlay.index].topic}</p><p>{news[overlay.index].description}</p></div>}
      </Modal>}
    </div>
  );
}
