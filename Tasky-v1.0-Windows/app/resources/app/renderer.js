const { ipcRenderer } = require('electron');

class TodoApp {
    constructor() {
        this.tasks = [];
        this.currentFilter = 'all';
        this.modalCallback = null;
        this.initializeElements();
        this.bindEvents();
        this.initializeModal();
        this.loadTasks();
    }

    initializeElements() {
        this.taskInput = document.getElementById('taskInput');
        this.addBtn = document.getElementById('addBtn');
        this.taskList = document.getElementById('taskList');
        this.totalTasks = document.getElementById('totalTasks');
        this.completedTasks = document.getElementById('completedTasks');
        this.clearCompleted = document.getElementById('clearCompleted');
        this.clearAll = document.getElementById('clearAll');
        this.filterButtons = document.querySelectorAll('.filter-btn');
    }

    bindEvents() {
        this.addBtn.addEventListener('click', () => this.addTask());
        this.taskInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addTask();
        });

        this.filterButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setFilter(e.target.dataset.filter);
            });
        });

        this.clearCompleted.addEventListener('click', () => this.clearCompletedTasks());
        this.clearAll.addEventListener('click', () => this.clearAllTasks());
    }

    initializeModal() {
        const modal = document.getElementById('customModal');
        const cancelBtn = document.getElementById('modalCancel');
        const confirmBtn = document.getElementById('modalConfirm');

        if (!modal || !cancelBtn || !confirmBtn) {
            console.error('Modal elements not found!');
            return;
        }

        // Set up permanent event listeners
        cancelBtn.addEventListener('click', () => {
            this.closeModal();
        });

        confirmBtn.addEventListener('click', () => {
            if (this.modalCallback) {
                this.modalCallback();
                this.modalCallback = null;
            }
            this.closeModal();
        });

        // Close on backdrop click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeModal();
            }
        });
    }

    closeModal() {
        const modal = document.getElementById('customModal');
        const confirmBtn = document.getElementById('modalConfirm');
        const cancelBtn = document.getElementById('modalCancel');
        
        modal.style.display = 'none';
        confirmBtn.style.display = 'block';
        cancelBtn.textContent = 'Cancel';
        this.modalCallback = null;
        this.taskInput.focus();
    }

    async loadTasks() {
        try {
            const taskStrings = await ipcRenderer.invoke('load-tasks');
            this.tasks = taskStrings.map((taskString, index) => {
                const isCompleted = taskString.startsWith('[DONE] ');
                const text = isCompleted ? taskString.substring(7) : taskString;
                return {
                    id: index,
                    text: text,
                    completed: isCompleted
                };
            });
            this.renderTasks();
            this.updateStats();
        } catch (error) {
            console.error('Error loading tasks:', error);
        }
    }

    async saveTasks() {
        try {
            const taskStrings = this.tasks.map(task => 
                task.completed ? `[DONE] ${task.text}` : task.text
            );
            await ipcRenderer.invoke('save-tasks', taskStrings);
        } catch (error) {
            console.error('Error saving tasks:', error);
        }
    }

    addTask() {
        const text = this.taskInput.value.trim();
        if (!text) return;

        const newTask = {
            id: Date.now(),
            text: text,
            completed: false
        };

        this.tasks.push(newTask);
        this.taskInput.value = '';
        this.taskInput.focus(); // Automatically refocus for continuous task entry
        this.renderTasks();
        this.updateStats();
        this.saveTasks();
    }

    toggleTask(id) {
        const task = this.tasks.find(t => t.id === id);
        if (task) {
            task.completed = !task.completed;
            this.renderTasks();
            this.updateStats();
            this.saveTasks();
        }
    }

    deleteTask(id) {
        this.tasks = this.tasks.filter(t => t.id !== id);
        this.renderTasks();
        this.updateStats();
        this.saveTasks();
    }

    setFilter(filter) {
        this.currentFilter = filter;
        
        this.filterButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === filter);
        });

        this.renderTasks();
    }

    getFilteredTasks() {
        switch (this.currentFilter) {
            case 'active':
                return this.tasks.filter(task => !task.completed);
            case 'completed':
                return this.tasks.filter(task => task.completed);
            default:
                return this.tasks;
        }
    }

    renderTasks() {
        const filteredTasks = this.getFilteredTasks();
        
        this.taskList.innerHTML = '';

        if (filteredTasks.length === 0) {
            const emptyMessage = document.createElement('li');
            emptyMessage.className = 'task-item';
            emptyMessage.innerHTML = `
                <div class="task-text" style="text-align: center; color: #999;">
                    ${this.currentFilter === 'completed' ? 'No completed tasks' : 
                      this.currentFilter === 'active' ? 'No active tasks' : 'No tasks yet. Add one above!'}
                </div>
            `;
            this.taskList.appendChild(emptyMessage);
            return;
        }

        filteredTasks.forEach(task => {
            const taskElement = document.createElement('li');
            taskElement.className = `task-item ${task.completed ? 'completed' : ''}`;
            taskElement.innerHTML = `
                <div class="task-checkbox ${task.completed ? 'checked' : ''}" 
                     onclick="app.toggleTask(${task.id})"></div>
                <div class="task-text">${this.escapeHtml(task.text)}</div>
                <button class="task-delete" onclick="app.deleteTask(${task.id})">×</button>
            `;
            this.taskList.appendChild(taskElement);
        });
    }

    updateStats() {
        const total = this.tasks.length;
        const completed = this.tasks.filter(task => task.completed).length;
        
        this.totalTasks.textContent = `${total} ${total === 1 ? 'task' : 'tasks'}`;
        this.completedTasks.textContent = `${completed} completed`;
    }

    clearCompletedTasks() {
        const completedCount = this.tasks.filter(task => task.completed).length;
        
        if (completedCount === 0) {
            this.showCustomAlert('INFO', 'No Tasks', 'No completed tasks to clear!');
            return;
        }

        this.showCustomConfirm(
            'WARNING',
            'Clear Completed Tasks',
            `Are you sure you want to clear ${completedCount} completed ${completedCount === 1 ? 'task' : 'tasks'}?\n\nThis action cannot be undone.`,
            () => {
                this.tasks = this.tasks.filter(task => !task.completed);
                this.renderTasks();
                this.updateStats();
                this.saveTasks();
                this.taskInput.focus(); // Maintain focus
            }
        );
    }

    clearAllTasks() {
        const totalCount = this.tasks.length;
        
        if (totalCount === 0) {
            this.showCustomAlert('INFO', 'No Tasks', 'No tasks to clear!');
            return;
        }

        this.showCustomConfirm(
            'WARNING',
            'Delete All Tasks',
            `This will delete ALL ${totalCount} ${totalCount === 1 ? 'task' : 'tasks'}!\n\nAre you absolutely sure? This action cannot be undone.`,
            () => {
                this.tasks = [];
                this.renderTasks();
                this.updateStats();
                this.saveTasks();
                this.taskInput.focus(); // Maintain focus
            }
        );
    }

    showCustomAlert(icon, title, message) {
        const modal = document.getElementById('customModal');
        
        if (!modal) {
            alert(message);
            return;
        }
        
        const modalIcon = modal.querySelector('.modal-icon');
        const modalTitle = document.getElementById('modalTitle');
        const modalMessage = document.getElementById('modalMessage');
        const cancelBtn = document.getElementById('modalCancel');
        const confirmBtn = document.getElementById('modalConfirm');

        modalIcon.textContent = icon;
        modalTitle.textContent = title;
        modalMessage.textContent = message;
        
        // Hide confirm button for alerts
        confirmBtn.style.display = 'none';
        cancelBtn.textContent = 'OK';
        
        // Clear any previous callback
        this.modalCallback = null;
        
        modal.style.display = 'flex';
    }

    showCustomConfirm(icon, title, message, onConfirm) {
        const modal = document.getElementById('customModal');
        
        if (!modal) {
            if (confirm(message)) {
                onConfirm();
            }
            return;
        }
        
        const modalIcon = modal.querySelector('.modal-icon');
        const modalTitle = document.getElementById('modalTitle');
        const modalMessage = document.getElementById('modalMessage');

        if (!modalIcon || !modalTitle || !modalMessage) {
            if (confirm(message)) {
                onConfirm();
            }
            return;
        }

        modalIcon.textContent = icon;
        modalTitle.textContent = title;
        modalMessage.textContent = message;
        
        // Set the callback for the confirm button
        this.modalCallback = onConfirm;
        
        modal.style.display = 'flex';
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.app = new TodoApp();
});