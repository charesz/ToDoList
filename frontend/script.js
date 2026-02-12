// -------------------- INDEX (PROJECT PAGE) --------------------

document.addEventListener('DOMContentLoaded', () => {
    loadInitialTasks();
    setupDragAndDrop();
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.menu-container')) {
            document.querySelectorAll('.dropdown-menu').forEach(menu => {
                menu.classList.remove('show');
            });
        }
    });
});

let currentColumnId = null;

function saveToBackend(taskData) {
    console.log("SENDING TO BACKEND:", JSON.stringify(taskData, null, 2));
    createTaskCard(taskData);
    closeModal();
    updateCounts();
}

function loadInitialTasks() {
    const starterTasks = [
        { id: 'task-1', title: 'Search inspirations for upcoming project', tag: 'website', status: 'todo' },
        { id: 'task-2', title: 'Ginko mobile app design', tag: 'mobile', status: 'todo' },
        { id: 'task-3', title: 'Weihu product task and process', tag: 'product', status: 'doing' },
        { id: 'task-4', title: 'Affitto product full service', tag: 'marketing', status: 'done' }
    ];
    starterTasks.forEach(task => createTaskCard(task));
    updateCounts();
}

function createTaskCard(task) {
    const list = document.getElementById(`${task.status}-list`);
    const menuId = `menu-${task.id}`;
    
    // UPDATED HTML STRUCTURE WITH IMAGES
    const cardHTML = `
        <div class="task-card" draggable="true" id="${task.id}" data-status="${task.status}">
            <div class="card-header">
                <span class="tag ${task.tag}">#${task.tag}</span>
                <div class="menu-container">
                    <button class="menu-btn" onclick="toggleMenu('${menuId}')">&#8942;</button>
                    <div class="dropdown-menu" id="${menuId}">
                        <button onclick="editTask('${task.id}')">Edit</button>
                        <button onclick="deleteTask('${task.id}')" class="delete-btn">Delete</button>
                    </div>
                </div>
            </div>
            <p class="task-text">${task.title}</p>
            
            <div class="card-footer" style="margin-top: 12px; display: flex; align-items: center;">
                <img src="https://i.pravatar.cc/150?u=${task.id}1" class="avatar" alt="User">
                <img src="https://i.pravatar.cc/150?u=${task.id}2" class="avatar" style="margin-left: -10px;" alt="User">
                <img src="https://i.pravatar.cc/150?u=${task.id}3" class="avatar" style="margin-left: -10px;" alt="User">
            </div>
        </div>
    `;

    list.insertAdjacentHTML('beforeend', cardHTML);
    const newCard = document.getElementById(task.id);
    addDragEvents(newCard);
}

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

    if (!title || !currentColumnId) return;

    const newTask = {
        id: 'task-' + Date.now(),
        title: title,
        tag: tag,
        status: currentColumnId
    };
    saveToBackend(newTask);
}

function deleteTask(taskId) {
    if (confirm('Are you sure you want to delete this task?')) {
        document.getElementById(taskId).remove();
        updateCounts();
    }
}

function editTask(taskId) {
    const card = document.getElementById(taskId);
    const textElement = card.querySelector('.task-text');
    const newText = prompt("Edit task:", textElement.innerText);
    if (newText) {
        textElement.innerText = newText;
    }
    toggleMenu(`menu-${taskId}`);
}

function toggleMenu(menuId) {
    document.querySelectorAll('.dropdown-menu').forEach(m => {
        if(m.id !== menuId) m.classList.remove('show');
    });
    const menu = document.getElementById(menuId);
    if(menu) menu.classList.toggle('show');
}

function updateCounts() {
    document.querySelectorAll('.column').forEach(col => {
        const countSpan = col.querySelector('.count');
        const count = col.querySelectorAll('.task-card').length;
        countSpan.innerText = count;
    });
}

function setupDragAndDrop() {
    const droppables = document.querySelectorAll('.task-list');
    droppables.forEach(zone => {
        zone.addEventListener('dragover', (e) => {
            e.preventDefault();
            const afterElement = getDragAfterElement(zone, e.clientY);
            const draggable = document.querySelector('.dragging');
            zone.parentElement.classList.add('drag-over');
            if (afterElement == null) {
                zone.appendChild(draggable);
            } else {
                zone.insertBefore(draggable, afterElement);
            }
        });
        zone.addEventListener('dragleave', () => zone.parentElement.classList.remove('drag-over'));
        zone.addEventListener('drop', (e) => {
            zone.parentElement.classList.remove('drag-over');
            const draggable = document.querySelector('.dragging');
            const newStatus = zone.id.replace('-list', '');
            const oldStatus = draggable.getAttribute('data-status');
            if (newStatus !== oldStatus) {
                draggable.setAttribute('data-status', newStatus);
            }
            updateCounts();
        });
    });
}

function addDragEvents(card) {
    card.addEventListener('dragstart', () => card.classList.add('dragging'));
    card.addEventListener('dragend', () => {
        card.classList.remove('dragging');
        updateCounts();
    });
}

function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.task-card:not(.dragging)')];
    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        return (offset < 0 && offset > closest.offset) ? { offset: offset, element: child } : closest;
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

// -------------------- AUTHENTICATION --------------------

// Detect current page
const path = window.location.pathname;

// -------- LOGIN PAGE --------
if (path.includes('login.html')) {
    const loginForm = document.querySelector('form');
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();

        const email = document.querySelector('input[type="email"]').value;
        const password = document.querySelector('input[type="password"]').value;

        const users = JSON.parse(localStorage.getItem('users')) || [];
        const user = users.find(u => u.email === email && u.password === password);

        if (user) {
            alert("Login successful! Redirecting...");
            localStorage.setItem('loggedInUser', JSON.stringify(user)); // Save session
            window.location.href = "../index.html";
        } else {
            alert("Incorrect login details. Sign up if you're new!");
        }
    });
}

// -------- SIGNUP PAGE --------
if (path.includes('signup.html')) {
    const signupForm = document.querySelector('form');
    signupForm.addEventListener('submit', function(e) {
        e.preventDefault();

        const name = document.querySelector('input[type="text"]').value;
        const email = document.querySelector('input[type="email"]').value;
        const password = document.querySelectorAll('input[type="password"]')[0].value;
        const confirmPassword = document.querySelectorAll('input[type="password"]')[1].value;

        if (password !== confirmPassword) {
            alert("Passwords do not match!");
            return;
        }

        const users = JSON.parse(localStorage.getItem('users')) || [];
        if (users.some(u => u.email === email)) {
            alert("This email is already registered. Please login.");
            return;
        }

        const newUser = { name, email, password };
        users.push(newUser);
        localStorage.setItem('users', JSON.stringify(users));

        alert("Account created successfully! Redirecting to login...");
        window.location.href = "login.html";
    });
}

// -------- INDEX PAGE --------
if (path.includes('index.html')) {
    const loggedIn = JSON.parse(localStorage.getItem('loggedInUser'));
    if (!loggedIn) {
        alert("You must login first!");
        window.location.href = "pages/login.html";
    }
}
