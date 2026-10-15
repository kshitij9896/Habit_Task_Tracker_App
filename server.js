const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// In-memory data store for tasks & habits
let tasks = [
  {
    id: "1",
    title: "Morning meditation (10 mins)",
    completed: true,
    category: "habit",
    createdAt: new Date().toISOString()
  },
  {
    id: "2",
    title: "Drink 2L water throughout the day",
    completed: false,
    category: "habit",
    createdAt: new Date().toISOString()
  },
  {
    id: "3",
    title: "Review daily schedule and priority goals",
    completed: false,
    category: "task",
    createdAt: new Date().toISOString()
  }
];

// Routes

// 1. Get all tasks
app.get('/api/tasks', (req, res) => {
  res.json(tasks);
});

// 2. Add a new task / habit
app.post('/api/tasks', (req, res) => {
  const { title, category } = req.body;

  if (!title || typeof title !== 'string' || !title.trim()) {
    return res.status(400).json({ error: 'Title is required and must not be empty.' });
  }

  const validCategory = (category === 'habit' || category === 'task') ? category : 'task';

  const newTask = {
    id: Date.now().toString(),
    title: title.trim(),
    completed: false,
    category: validCategory,
    createdAt: new Date().toISOString()
  };

  tasks.push(newTask);
  res.status(201).json(newTask);
});

// 3. Toggle task completion
app.patch('/api/tasks/:id/toggle', (req, res) => {
  const { id } = req.params;
  const task = tasks.find(t => t.id === id);

  if (!task) {
    return res.status(404).json({ error: 'Task not found.' });
  }

  task.completed = !task.completed;
  res.json(task);
});

// 4. Delete a task
app.delete('/api/tasks/:id', (req, res) => {
  const { id } = req.params;
  const index = tasks.findIndex(t => t.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Task not found.' });
  }

  const [deletedTask] = tasks.splice(index, 1);
  res.json({ message: 'Task deleted successfully', task: deletedTask });
});

// Start the server if run directly
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
  });
}

module.exports = app;
