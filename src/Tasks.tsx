import { CheckCircle2, Flag, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import type { FormEvent } from 'react';
import type { Task } from './data';

type Filter = 'My Day' | 'All tasks' | 'Completed';

export function Tasks({
  tasks, busy, onToggle, onEdit, onAdd,
}: {
  tasks: Task[];
  busy: boolean;
  onToggle: (task: Task) => void;
  onEdit: (task: Task) => void;
  onAdd: () => void;
}) {
  const [filter, setFilter] = useState<Filter>('My Day');
  const visible = tasks
    .filter((task) => filter === 'Completed' ? task.completed : filter !== 'My Day' || task.myDay)
    .sort((first, second) => Number(first.completed) - Number(second.completed)
      || Number(second.priority === 'high') - Number(first.priority === 'high')
      || first.createdAt - second.createdAt);

  return (
    <section className="panel tasks-panel" aria-label="Tasks">
      <header className="panel-header">
        <CheckCircle2 className="panel-icon mint" />
        <h2>Tasks</h2>
        <select className="task-filter" aria-label="Filter tasks" value={filter} onChange={(event) => setFilter(event.target.value as Filter)}>
          <option>My Day</option>
          <option>All tasks</option>
          <option>Completed</option>
        </select>
      </header>
      {visible.length === 0 && <p className="empty-state">{filter === 'Completed' ? 'No completed tasks yet.' : 'No tasks here yet.'}</p>}
      <ul className="task-list">
        {visible.map((task) => (
          <li key={task.id} className={task.completed ? 'task completed' : 'task'}>
            <input type="checkbox" aria-label={`Complete ${task.title}`} checked={task.completed} disabled={busy} onChange={() => onToggle(task)} />
            <button className="task-title" onClick={() => onEdit(task)} disabled={busy}>
              {task.priority === 'high' && <Flag size={14} className="gold shrink-0" aria-label="High priority" />}
              <span>{task.title}</span>
              <Pencil size={14} className="edit-icon" aria-hidden />
            </button>
          </li>
        ))}
      </ul>
      <button className="add-task" disabled={busy} onClick={() => {
        if (filter === 'Completed') setFilter('My Day');
        onAdd();
      }}><Plus size={19} /> Add a task</button>
    </section>
  );
}

export function TaskEditor({
  task, busy, onSave, onDelete, onClose,
}: {
  task?: Task;
  busy: boolean;
  onSave: (task: Task) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}) {
  const [title, setTitle] = useState(task?.title ?? '');
  const [priority, setPriority] = useState(task?.priority ?? 'normal');
  const [myDay, setMyDay] = useState(task?.myDay ?? true);
  const [confirmDelete, setConfirmDelete] = useState(false);

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!title.trim()) return;
    onSave({
      id: task?.id ?? crypto.randomUUID(),
      title: title.trim(),
      priority,
      completed: task?.completed ?? false,
      myDay,
      demo: task?.demo === true && task.title === title.trim(),
      createdAt: task?.createdAt ?? Date.now(),
    });
  }

  return (
    <form className="form" onSubmit={submit}>
      <label>Task name<input autoFocus required maxLength={180} value={title} onChange={(event) => setTitle(event.target.value)} /></label>
      <label>Priority<select value={priority} onChange={(event) => setPriority(event.target.value === 'high' ? 'high' : 'normal')}>
        <option value="normal">Normal</option><option value="high">High</option>
      </select></label>
      <label className="check-label"><input type="checkbox" checked={myDay} onChange={(event) => setMyDay(event.target.checked)} /> Show in My Day</label>
      <div className="form-actions">
        {task && <button type="button" className="danger mr-auto" disabled={busy} onClick={() => {
          if (confirmDelete) onDelete(task.id);
          else setConfirmDelete(true);
        }}><Trash2 size={16} /> {confirmDelete ? 'Confirm deletion' : 'Delete'}</button>}
        <button type="button" onClick={onClose}>Cancel</button>
        <button className="primary" disabled={busy || !title.trim()}>{task ? 'Save task' : 'Add task'}</button>
      </div>
    </form>
  );
}
