export type Task = {
  id: string;
  title: string;
  priority: 'normal' | 'high';
  completed: boolean;
  myDay: boolean;
  demo: boolean;
  createdAt: number;
};

export type Preferences = {
  name: string;
  solidPanels: boolean;
  showDemoContent?: boolean;
  staffUrl: string;
  newsUrl: string;
};

export const defaultPreferences: Preferences = {
  name: 'Chris',
  solidPanels: false,
  staffUrl: '',
  newsUrl: '',
};

export const demoTasks: Task[] = [
  'Finish AI board brief (v2)',
  'Approve design coordination notes',
  'Progress model setup',
  'Follow up project actions',
  'Check household budget (fortnight)',
].map((title, index) => ({
  id: `demo-${index + 1}`,
  title,
  priority: 'normal',
  completed: false,
  myDay: true,
  demo: true,
  createdAt: index + 1,
}));

export const staffBrief = [
  'Finalise AI board brief and send for Monday.',
  'Review and approve the design coordination notes.',
  'Progress the model setup and complete the QA checks.',
  'Confirm next steps with the project team.',
  'Budget check – track week-to-date spend.',
];

export const news = [
  {
    title: 'BIM automation trends for 2027',
    topic: 'BIM',
    description: 'A sample briefing on using repeatable model checks and structured data to make handovers easier to verify.',
  },
  {
    title: 'MEP design efficiency with AI',
    topic: 'MEP',
    description: 'A sample briefing on where AI could help review design options, surface coordination issues and prepare documentation for engineers to check.',
  },
  {
    title: 'New coding tools worth a look',
    topic: 'AI & automation',
    description: 'A sample briefing on using coding assistants to draft scripts, document workflows and test changes before adopting them in production.',
  },
];

export const meetings = [
  { time: '8:30 AM', title: 'Management sync', detail: '30 min · Teams', colour: 'lavender' },
  { time: '10:00 AM', title: 'Design coordination', detail: '1 hr · Project channel', colour: 'mint' },
  { time: '12:00 PM', title: 'Lunch', detail: '', colour: 'gold' },
  { time: '1:00 PM', title: 'Model review', detail: '1 hr', colour: 'blue' },
  { time: '3:30 PM', title: 'AI / Automation check-in', detail: '30 min', colour: 'mint' },
];
