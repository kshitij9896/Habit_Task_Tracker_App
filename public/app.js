// State
let tasks = [];
let currentFilter = 'all';
let selectedCategory = 'habit';

// DOM Elements
const taskList = document.getElementById('task-list');
const taskForm = document.getElementById('task-form');
const taskTitleInput = document.getElementById('task-title');
const formError = document.getElementById('form-error');
const progressBarFill = document.getElementById('progress-bar-fill');
const progressText = document.getElementById('progress-text');
const progressPercent = document.getElementById('progress-percent');
const motivationalMessage = document.getElementById('motivational-message');
const statHabits = document.getElementById('stat-habits');
const statTasks = document.getElementById('stat-tasks');
const countAll = document.getElementById('count-all');
const countActive = document.getElementById('count-active');
const countCompleted = document.getElementById('count-completed');
const currentDateEl = document.getElementById('current-date');
const typeHabitBtn = document.getElementById('type-habit-btn');
const typeTaskBtn = document.getElementById('type-task-btn');
const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toast-message');
const toastIcon = document.getElementById('toast-icon');

// Initialize Current Date
function initDate() {
  const options = { weekday: 'short', month: 'short', day: 'numeric' };
  currentDateEl.textContent = new Date().toLocaleDateString(undefined, options);
}

// Category selection toggle
function setCategory(category) {
  selectedCategory = category;
  if (category === 'habit') {
    typeHabitBtn.className = 'category-toggle-btn px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition bg-indigo-600 text-white shadow-sm';
    typeTaskBtn.className = 'category-toggle-btn px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition text-slate-400 hover:text-slate-200';
  } else {
    typeTaskBtn.className = 'category-toggle-btn px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition bg-purple-600 text-white shadow-sm';
    typeHabitBtn.className = 'category-toggle-btn px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition text-slate-400 hover:text-slate-200';
  }
}

// Toast notification
let toastTimer = null;
function showToast(message, icon = '✓') {
  if (toastTimer) clearTimeout(toastTimer);
  toastMessage.textContent = message;
  toastIcon.textContent = icon;
  toast.classList.remove('opacity-0', 'translate-y-16');
  toast.classList.add('opacity-100', 'translate-y-0');

  toastTimer = setTimeout(() => {
    toast.classList.remove('opacity-100', 'translate-y-0');
    toast.classList.add('opacity-0', 'translate-y-16');
  }, 2200);
}

// Fetch all tasks from server
async function fetchTasks() {
  try {
    const res = await fetch('/api/tasks');
    if (!res.ok) throw new Error('Failed to fetch tasks');
    tasks = await res.json();
    render();
  } catch (err) {
    console.error('Error fetching tasks:', err);
    taskList.innerHTML = `
      <div class="p-6 text-center text-rose-400 bg-rose-950/30 rounded-xl border border-rose-900/50">
        <p class="font-medium text-sm">Failed to connect to the server.</p>
        <button onclick="fetchTasks()" class="mt-2 text-xs bg-rose-600 text-white px-3 py-1 rounded-lg hover:bg-rose-500">Retry</button>
      </div>
    `;
  }
}

// Add task
async function addTask(title, category) {
  try {
    const res = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, category })
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || 'Failed to add task');
    }

    const newTask = await res.json();
    tasks.unshift(newTask);
    render();
    showToast(`Added: ${newTask.title}`, '＋');
  } catch (err) {
    showError(err.message);
  }
}

// Toggle completion
async function toggleTask(id) {
  try {
    const res = await fetch(`/api/tasks/${id}/toggle`, {
      method: 'PATCH'
    });

    if (!res.ok) throw new Error('Failed to update task');

    const updatedTask = await res.json();
    const index = tasks.findIndex(t => t.id === id);
    if (index !== -1) {
      tasks[index] = updatedTask;
    }
    render();
    showToast(
      updatedTask.completed ? 'Marked as completed! 🎉' : 'Marked as active',
      updatedTask.completed ? '✓' : '↺'
    );
  } catch (err) {
    showToast(err.message, '⚠️');
  }
}

// Delete task
async function deleteTask(id) {
  try {
    const res = await fetch(`/api/tasks/${id}`, {
      method: 'DELETE'
    });

    if (!res.ok) throw new Error('Failed to delete task');

    tasks = tasks.filter(t => t.id !== id);
    render();
    showToast('Task deleted', '🗑️');
  } catch (err) {
    showToast(err.message, '⚠️');
  }
}

// Error presentation in form
function showError(msg) {
  formError.textContent = msg;
  formError.classList.remove('hidden');
}

function clearError() {
  formError.textContent = '';
  formError.classList.add('hidden');
}

// Calculate and render progress bar & statistics
function updateProgress() {
  const total = tasks.length;
  const completed = tasks.filter(t => t.completed).length;
  const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);

  // Update progress bar
  progressBarFill.style.width = `${percentage}%`;
  progressText.textContent = `${completed} of ${total} Completed`;
  progressPercent.textContent = `${percentage}%`;

  // Update counts
  const habitCount = tasks.filter(t => t.category === 'habit').length;
  const taskCount = tasks.filter(t => t.category === 'task').length;
  const activeCount = total - completed;

  statHabits.textContent = habitCount;
  statTasks.textContent = taskCount;
  countAll.textContent = total;
  countActive.textContent = activeCount;
  countCompleted.textContent = completed;

  // Motivational message
  if (total === 0) {
    motivationalMessage.innerHTML = '<span>🌱</span> Add habits or tasks above to begin your day!';
  } else if (percentage === 100) {
    motivationalMessage.innerHTML = '<span>🏆</span> Incredible work! You crushed every single goal!';
  } else if (percentage >= 70) {
    motivationalMessage.innerHTML = '<span>🔥</span> Almost there! Outstanding momentum today!';
  } else if (percentage >= 30) {
    motivationalMessage.innerHTML = '<span>⚡</span> Great rhythm! Keep making consistent progress.';
  } else {
    motivationalMessage.innerHTML = '<span>✨</span> Small daily habits lead to monumental results!';
  }
}

// Filter tasks based on current tab
function getFilteredTasks() {
  switch (currentFilter) {
    case 'active':
      return tasks.filter(t => !t.completed);
    case 'completed':
      return tasks.filter(t => t.completed);
    case 'habit':
      return tasks.filter(t => t.category === 'habit');
    case 'task':
      return tasks.filter(t => t.category === 'task');
    case 'all':
    default:
      return tasks;
  }
}

// Render task list
function renderTasks() {
  const filtered = getFilteredTasks();

  if (filtered.length === 0) {
    let emptyMsg = "No tasks yet. Create one to get started!";
    if (currentFilter === 'active') emptyMsg = "No active tasks! You're completely caught up!";
    if (currentFilter === 'completed') emptyMsg = "No tasks completed yet today.";
    if (currentFilter === 'habit') emptyMsg = "No habits tracked yet. Add one above!";
    if (currentFilter === 'task') emptyMsg = "No one-off tasks yet.";

    taskList.innerHTML = `
      <div class="py-12 px-4 text-center bg-slate-900/40 rounded-2xl border border-slate-800/60 border-dashed">
        <div class="w-12 h-12 mx-auto mb-3 rounded-full bg-slate-800/80 flex items-center justify-center text-xl text-slate-400">
          ☕
        </div>
        <p class="text-sm font-medium text-slate-400">${emptyMsg}</p>
      </div>
    `;
    return;
  }

  taskList.innerHTML = filtered.map(task => {
    const isHabit = task.category === 'habit';
    const categoryBadge = isHabit
      ? `<span class="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-950/70 border border-emerald-800/60 px-2 py-0.5 rounded-full">
           <span>🌱</span> Habit
         </span>`
      : `<span class="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-400 bg-indigo-950/70 border border-indigo-800/60 px-2 py-0.5 rounded-full">
           <span>📋</span> Task
         </span>`;

    const titleClass = task.completed
      ? 'line-through text-slate-400 decoration-slate-500'
      : 'text-slate-100 font-medium';

    return `
      <div class="task-item-enter bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-slate-700/80 rounded-xl p-3.5 sm:p-4 transition duration-150 flex items-center justify-between gap-3 shadow-md group">
        <div class="flex items-center gap-3.5 flex-1 min-w-0">
          <!-- Custom Checkbox -->
          <button
            type="button"
            onclick="toggleTask('${task.id}')"
            class="w-6 h-6 rounded-lg flex items-center justify-center transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-indigo-500 flex-shrink-0 ${
              task.completed
                ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30'
                : 'border-2 border-slate-600 hover:border-indigo-400 bg-slate-950/80'
            }"
            aria-label="Toggle ${task.title}"
            aria-checked="${task.completed}"
          >
            ${
              task.completed
                ? `<svg class="w-4 h-4 text-white stroke-[3]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                   </svg>`
                : ''
            }
          </button>

          <!-- Title and Category -->
          <div class="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2.5 min-w-0 flex-1">
            <span class="text-sm sm:text-base break-words ${titleClass}">
              ${escapeHtml(task.title)}
            </span>
            <div class="flex-shrink-0">
              ${categoryBadge}
            </div>
          </div>
        </div>

        <!-- Delete Action -->
        <button
          type="button"
          onclick="deleteTask('${task.id}')"
          class="opacity-70 group-hover:opacity-100 text-slate-400 hover:text-rose-400 p-1.5 rounded-lg hover:bg-slate-800/80 transition duration-150 focus:outline-none focus:ring-2 focus:ring-rose-500/50 flex-shrink-0"
          title="Delete"
          aria-label="Delete ${task.title}"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    `;
  }).join('');
}

// Escape HTML for XSS prevention
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// Main Render
function render() {
  updateProgress();
  renderTasks();
}

// Filter Tab switching
function setupFilters() {
  const tabs = document.querySelectorAll('.filter-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => {
        t.className = 'filter-tab px-3 py-1.5 rounded-lg font-medium transition text-slate-400 hover:text-slate-200';
      });
      tab.className = 'filter-tab active-filter px-3 py-1.5 rounded-lg font-medium transition text-white bg-indigo-600/90 shadow-sm';
      currentFilter = tab.getAttribute('data-filter');
      render();
    });
  });
}

// Event Listeners
function setupEventListeners() {
  // Category selector buttons
  typeHabitBtn.addEventListener('click', () => setCategory('habit'));
  typeTaskBtn.addEventListener('click', () => setCategory('task'));

  // Form submit
  taskForm.addEventListener('submit', (e) => {
    e.preventDefault();
    clearError();
    const title = taskTitleInput.value.trim();
    if (!title) {
      showError('Please enter a title for the habit or task.');
      return;
    }
    addTask(title, selectedCategory);
    taskTitleInput.value = '';
    taskTitleInput.focus();
  });

  taskTitleInput.addEventListener('input', clearError);
}

// Init
window.addEventListener('DOMContentLoaded', () => {
  initDate();
  setupFilters();
  setupEventListeners();
  fetchTasks();
});
