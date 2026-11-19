CREATE TABLE tasks (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    priority TEXT NOT NULL CHECK (priority IN ('normal', 'high')),
    completed INTEGER NOT NULL CHECK (completed IN (0, 1)),
    myDay INTEGER NOT NULL CHECK (myDay IN (0, 1)),
    demo INTEGER NOT NULL CHECK (demo IN (0, 1)),
    createdAt INTEGER NOT NULL
);

CREATE TABLE settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);

INSERT INTO tasks VALUES
    ('demo-1', 'Finish AI board brief (v2)', 'normal', 0, 1, 1, 1),
    ('demo-2', 'Approve design coordination notes', 'normal', 0, 1, 1, 2),
    ('demo-3', 'Progress model setup', 'normal', 0, 1, 1, 3),
    ('demo-4', 'Follow up project actions', 'normal', 0, 1, 1, 4),
    ('demo-5', 'Check household budget (fortnight)', 'normal', 0, 1, 1, 5);
