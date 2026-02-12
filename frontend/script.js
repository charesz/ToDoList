// -------------------- CONFIG --------------------
const API_URL = "http://127.0.0.1:8000";

// -------------------- GLOBAL --------------------
let currentColumnId = null;

// -------------------- DOM CONTENT LOADED --------------------
document.addEventListener('DOMContentLoaded', () => {
    // -------------------- AUTH CHECK --------------------
    const path = window.location.pathname;
    if (path.includes('index.html')) {
        const loggedIn = JSON.parse(localStorage.getItem('loggedInUser'));
        if (!loggedIn) {
            alert("You must login first!");
            window.location.href = "pages/login.html";
            return; // stop further execution
        }
    }

    // -------------------- ADD NEW TASK BUTTONS --------------------
    // Use event delegation to ensure it works reliably
    document.body.addEventListener('click', (e) => {
        if (e.target.classList.contains('add-task-btn')) {
            const columnId = e.target.dataset.column;
            openModal(columnId);
        }
    });

    // -------------------- LOAD TASKS --------------------
    loadTasksFromBackend();

    // -------------------- DRAG & DROP --------------------
    setupDragAndDrop();

    // -------------------- CLOSE DROPDOWNS --------------------
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.menu-container')) {
            document.querySelectorAll('.dropdown-menu')
                .forEach(menu => menu.classList.remove('show'));
        }
    });

    // -------------------- LOGIN / SIGNUP FORMS --------------------
    setupAuthForms(path);
});


// -------------------- BACKEND INTERACTION --------------------
async function saveToBackend(taskData) {
    try {
        const response = await axios.post(`${API_URL}/tasks`, taskData);
        createTaskCard(response.data);
        closeModal();
        updateCounts();
    } catch (error) {
        console.error("Error saving task:", error);
        alert("Failed to create task. Check console.");
    }
}

async function loadTasksFromBackend() {
    try {
        const response = await axios.get(`${API_URL}/tasks`);
        const tasks = response.data;
        tasks.forEach(task => createTaskCard(task));
        updateCounts();
    } catch (error) {
        console.error("Error loading tasks:", error);
        alert("Failed to load tasks from backend.");
    }
}

async function deleteTask(taskId) {
    if (!confirm('Are you sure you want to delete this task?')) return;
    try {
        await axios.delete(`${API_URL}/tasks/${taskId}`);
        document.getElementById(taskId).remove();
        updateCounts();
    } catch (error) {
        console.error("Delete failed:", error);
        alert("Failed to delete task.");
    }
}

async function editTask(taskId) {
    const card = document.getElementById(taskId);
    const textElement = card.querySelector('.task-text');
    const newText = prompt("Edit task:", textElement.innerText);
    if (!newText) return;

    try {
        const response = await axios.put(`${API_URL}/tasks/${taskId}`, { title: newText });
        textElement.innerText = response.data.title;
    } catch (error) {
        console.error("Edit failed:", error);
        alert("Failed to edit task.");
    }
    toggleMenu(`menu-${taskId}`);
}

// -------------------- TASK CARD --------------------
function createTaskCard(task) {
    const list = document.getElementById(`${task.status}-list`);
    const menuId = `menu-${task.id}`;

    const cardHTML = `
        <div class="task-card" draggable="true" id="${task.id}" data-status="${task.status}">
            <div class="card-header">
                <span class="tag ${task.tag}">#${task.tag || 'general'}</span>
                <div class="menu-container">
                    <button class="menu-btn" onclick="toggleMenu('${menuId}')">&#8942;</button>
                    <div class="dropdown-menu" id="${menuId}">
                        <button onclick="editTask('${task.id}')">Edit</button>
                        <button onclick="deleteTask('${task.id}')" class="delete-btn">Delete</button>
                    </div>
                </div>
            </div>
            <p class="task-text">${task.title}</p>
        </div>
    `;
    list.insertAdjacentHTML('beforeend', cardHTML);
    addDragEvents(document.getElementById(task.id));
}

// -------------------- MODAL --------------------
function openModal(columnId) {
    currentColumnId = columnId;
    document.getElementById('newTaskInput').value = '';
    document.getElementById('taskModal').classList.add('active');
    document.getElementById('newTaskInput').focus();
}

function closeModal() {
    document.getElementById('taskModal').classList.remove('active');
    currentColumnId = null;
}

function confirmAddTask() {
    const title = document.getElementById('newTaskInput').value.trim();
    const tag = document.getElementById('newTagInput').value;

    if (!title || !currentColumnId) {
        alert("Please enter a task title.");
        return;
    }

    saveToBackend({ title, tag, status: currentColumnId });
}

// -------------------- DROPDOWN & COUNTS --------------------
function toggleMenu(menuId) {
    document.querySelectorAll('.dropdown-menu').forEach(m => {
        if (m.id !== menuId) m.classList.remove('show');
    });
    const menu = document.getElementById(menuId);
    if (menu) menu.classList.toggle('show');
}

function updateCounts() {
    document.querySelectorAll('.column').forEach(col => {
        const countSpan = col.querySelector('.count');
        const count = col.querySelectorAll('.task-card').length;
        countSpan.innerText = count;
    });
}

// -------------------- DRAG & DROP --------------------
function setupDragAndDrop() {
    const droppables = document.querySelectorAll('.task-list');
    droppables.forEach(zone => {
        zone.addEventListener('dragover', (e) => {
            e.preventDefault();
            const afterElement = getDragAfterElement(zone, e.clientY);
            const draggable = document.querySelector('.dragging');
            if (!afterElement) zone.appendChild(draggable);
            else zone.insertBefore(draggable, afterElement);
        });
        zone.addEventListener('drop', () => updateCounts());
    });
}

function addDragEvents(card) {
    card.addEventListener('dragstart', () => card.classList.add('dragging'));
    card.addEventListener('dragend', () => card.classList.remove('dragging'));
}

function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.task-card:not(.dragging)')];
    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        return (offset < 0 && offset > closest.offset) ? { offset, element: child } : closest;
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

// -------------------- AUTHENTICATION --------------------
function setupAuthForms(path) {
    if (path.includes('login.html')) {
        const loginForm = document.getElementById('loginForm');
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value;

            try {
                const response = await axios.post(`${API_URL}/tasks/login`, { email, password });
                localStorage.setItem('loggedInUser', JSON.stringify(response.data));
                alert("Login successful!");
                window.location.href = "../index.html";
            } catch (error) {
                alert(error.response?.data?.detail || "Login failed");
            }
        });
    }

    if (path.includes('signup.html')) {
        const signupForm = document.getElementById('signupForm');
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('fullName').value.trim();
            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirmPassword').value;

            if (password !== confirmPassword) {
                alert("Passwords do not match!");
                return;
            }

            try {
                await axios.post(`${API_URL}/tasks/signup`, { name, email, password });
                alert("Account created successfully!");
                window.location.href = "login.html";
            } catch (error) {
                alert(error.response?.data?.detail || "Signup failed");
            }
        });
    }
}
