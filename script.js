// App State variables
let todos = [];
let currentFilter = 'all';
let currentSearchQuery = '';

// Edit Mode tracking variables
let isEditingMode = false;
let editTargetId = null;

// DOM Element Selectors
const todoForm = document.getElementById('todoForm');
const taskInput = document.getElementById('taskInput');
const submitBtn = document.getElementById('submitBtn');
const todoList = document.getElementById('todoList');
const emptyView = document.getElementById('emptyView');
const validationAlert = document.getElementById('validationAlert');
const alertText = document.getElementById('alertText');
const searchInput = document.getElementById('searchInput');

// Load initial tasks from localStorage on page load
document.addEventListener('DOMContentLoaded', () => {
    const storedData = localStorage.getItem('jsTodoAppEngineData');
    if (storedData) {
        todos = JSON.parse(storedData);
    }
    renderTodoListPipeline();
});

todoForm.addEventListener('submit', (event) => {
    event.preventDefault();
    handleFormSubmission();
});

// Form submission logic (Handles both adding and updating tasks)
function handleFormSubmission() {
    const textValue = taskInput.value.trim();

    if (textValue === "") {
        displayValidationError("Task details cannot be empty. Please enter a valid description.");
        return;
    }

    closeAlert();

    if (isEditingMode) {
        // Update operational step
        const targetedIndex = todos.findIndex(item => item.id === editTargetId);
        if (targetedIndex !== -1) {
            todos[targetedIndex].taskName = textValue;
            commitDatabaseState();
            exitEditingMode();
        }
    } else {
        // Create operational step
        const newTodoItem = {
            id: Date.now(), // Unique ID using timestamp
            taskName: textValue,
            isCompleted: false
        };

        todos.push(newTodoItem);
        commitDatabaseState();
        taskInput.value = "";
    }

    renderTodoListPipeline();
}

// Toggle checkbox status
function toggleTaskStatus(id) {
    const targetedIndex = todos.findIndex(item => item.id === id);
    if (targetedIndex !== -1) {
        todos[targetedIndex].isCompleted = !todos[targetedIndex].isCompleted;
        commitDatabaseState();
        renderTodoListPipeline();
    }
}

// Populate input field for editing
function enterEditingMode(id) {
    const targetItem = todos.find(item => item.id === id);
    if (!targetItem) return;

    isEditingMode = true;
    editTargetId = id;

    taskInput.value = targetItem.taskName;
    taskInput.focus();
    submitBtn.innerHTML = `<i class="bi bi-pencil-square me-1"></i>Update`;
    submitBtn.className = "btn btn-warning btn-lg w-100 fw-bold";
}

function exitEditingMode() {
    isEditingMode = false;
    editTargetId = null;
    taskInput.value = "";
    submitBtn.innerHTML = `<i class="bi bi-plus-circle-fill me-1"></i>Add`;
    submitBtn.className = "btn btn-dark btn-lg w-100 fw-bold";
}

// Remove a specific task
function deleteTaskRecord(id) {
    if (confirm("Are you sure you want to delete this task?")) {
        const targetedIndex = todos.findIndex(item => item.id === id);
        if (targetedIndex !== -1) {
            todos.splice(targetedIndex, 1);
            commitDatabaseState();

            if (isEditingMode && editTargetId === id) {
                exitEditingMode();
            }

            renderTodoListPipeline();
        }
    }
}

// Switch filtering states (All, Pending, Completed)
function setFilter(statusType) {
    currentFilter = statusType;

    document.querySelectorAll('.btn-group .btn').forEach(btn => btn.classList.remove('active'));

    if (statusType === 'all') document.getElementById('filterAll').classList.add('active');
    if (statusType === 'pending') document.getElementById('filterPending').classList.add('active');
    if (statusType === 'completed') document.getElementById('filterCompleted').classList.add('active');

    renderTodoListPipeline();
}

function handleSearch() {
    currentSearchQuery = searchInput.value.toLowerCase().trim();
    renderTodoListPipeline();
}

// Render filtered tasks list into DOM elements
function renderTodoListPipeline() {
    todoList.innerHTML = "";

    // Apply active filter tab rules
    let processArray = todos.filter(item => {
        if (currentFilter === 'pending') return !item.isCompleted;
        if (currentFilter === 'completed') return item.isCompleted;
        return true;
    });

    // Apply search string filter matches
    if (currentSearchQuery !== "") {
        processArray = processArray.filter(item =>
            item.taskName.toLowerCase().includes(currentSearchQuery)
        );
    }

    // Toggle default visual helper state
    if (processArray.length === 0) {
        emptyView.classList.remove('d-none');
    } else {
        emptyView.classList.add('d-none');
    }

    // Build lists dynamically
    processArray.forEach(item => {
        const liElement = document.createElement('li');
        liElement.className = `list-group-item d-flex align-items-center justify-content-between p-3 rounded-3 shadow-sm todo-item animate-item ${item.isCompleted ? 'completed-task' : ''}`;

        liElement.innerHTML = `
            <div class="d-flex align-items-center flex-grow-1 me-3">
                <input class="form-check-input me-3 border-secondary flex-shrink-0" type="checkbox" style="width: 1.3rem; height: 1.3rem; cursor: pointer;" 
                    ${item.isCompleted ? 'checked' : ''} onchange="toggleTaskStatus(${item.id})">
                <span class="todo-text text-dark">${escapeHtmlChars(item.taskName)}</span>
            </div>
            <div class="d-flex gap-1 flex-shrink-0">
                <button class="btn btn-outline-secondary btn-sm border-0 px-2" title="Edit Task" onclick="enterEditingMode(${item.id})" ${item.isCompleted ? 'disabled' : ''}>
                    <i class="bi bi-pencil-fill"></i>
                </button>
                <button class="btn btn-outline-danger btn-sm border-0 px-2" title="Delete Task" onclick="deleteTaskRecord(${item.id})">
                    <i class="bi bi-trash3-fill"></i>
                </button>
            </div>
        `;

        todoList.appendChild(liElement);
    });
}

function commitDatabaseState() {
    localStorage.setItem('jsTodoAppEngineData', JSON.stringify(todos));
}

function displayValidationError(messageText) {
    alertText.innerText = messageText;
    validationAlert.classList.remove('d-none');
}

function closeAlert() {
    validationAlert.classList.add('d-none');
}

// Neutralize HTML formatting markup to prevent input text styling vulnerabilities
function escapeHtmlChars(textString) {
    const mapObject = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
    return textString.replace(/[&<>"']/g, (m) => mapObject[m]);
}