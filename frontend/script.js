document.addEventListener('DOMContentLoaded', () => {
    const draggables = document.querySelectorAll('.task-card');
    const droppables = document.querySelectorAll('.task-list');

    // Add event listeners to draggable items (the cards)
    draggables.forEach(draggable => {
        draggable.addEventListener('dragstart', () => {
            draggable.classList.add('dragging');
        });

        draggable.addEventListener('dragend', async () => {
    draggable.classList.remove('dragging');
    updateCounts();

    const taskId = draggable.dataset.taskId;
    const column = draggable.closest('.task-list');
    const columnId = column.dataset.columnId;

    const order = [...column.querySelectorAll('.task-card')]
        .indexOf(draggable);

    try {
        await axios.put(`http://localhost:8000/tasks/${taskId}/move`, null, {
            params: {
                column_id: columnId,
                order: order
            }
        });

        console.log("Task updated");
    } catch (error) {
        console.error("Update failed", error);
    }
});

    });

    // Add event listeners to drop zones (the columns)
    droppables.forEach(zone => {
        zone.addEventListener('dragover', (e) => {
            e.preventDefault(); // Essential to allow dropping
            
            const afterElement = getDragAfterElement(zone, e.clientY);
            const draggable = document.querySelector('.dragging');
            
            // Visual feedback for the zone
            zone.parentElement.classList.add('drag-over');

            if (afterElement == null) {
                zone.appendChild(draggable);
            } else {
                zone.insertBefore(draggable, afterElement);
            }
        });

        // Clean up visual feedback
        zone.addEventListener('dragleave', () => {
            zone.parentElement.classList.remove('drag-over');
        });

        zone.addEventListener('drop', () => {
            zone.parentElement.classList.remove('drag-over');
        });
    });

    // Helper function to determine where to place the card (above/below others)
    function getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll('.task-card:not(.dragging)')];

        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }

    // Optional: Update the task counters in the headers
    function updateCounts() {
        const columns = document.querySelectorAll('.column');
        columns.forEach(col => {
            const countSpan = col.querySelector('.count');
            const taskCount = col.querySelectorAll('.task-card').length;
            countSpan.innerText = taskCount;
        });
    }
});