export interface Task {
  id: number;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed';
  assignee_id?: number | null;
  due_date: Date;
  created_at: Date;
  updated_at: Date;
}
