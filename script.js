// script.js - single script for index.html and edit.html
const STORAGE_KEY = 'tasks';

function loadTasks(){ try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch(e){ return []; } }
function saveTasks(tasks){ localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks)); }

function getQueryParams(){ return new URLSearchParams(window.location.search); }

// Helpers
function uniqueSorted(arr){ return Array.from(new Set(arr.filter(x=>x!==undefined && x!==null && x!==''))).sort(); }

// INDEX PAGE LOGIC
function initIndex(){
    const tasks = loadTasks();
    const params = getQueryParams();
    const filterName = params.get('filter_name') || '';
    const filterDeadline = params.get('filter_deadline') || '';
    const filterStatus = params.get('filter_status') || '';

    // populate filter dropdowns based on existing tasks
    const names = uniqueSorted(tasks.map(t=>t.name));
    const deadlines = uniqueSorted(tasks.map(t=>t.deadline));
    const statuses = uniqueSorted(tasks.map(t=>t.status));

    const namesContainer = document.getElementById('filterNames');
    const deadlinesContainer = document.getElementById('filterDeadlines');
    const statusesContainer = document.getElementById('filterStatuses');
    namesContainer.innerHTML = '';
    deadlinesContainer.innerHTML = '';
    statusesContainer.innerHTML = '';

    names.forEach(n => {
        const a = document.createElement('a');
        a.href = '?filter_name=' + encodeURIComponent(n);
        a.textContent = n;
        if(filterName === n) a.style.fontWeight = '700';
        namesContainer.appendChild(a);
    });
    deadlines.forEach(d => {
        const a = document.createElement('a');
        a.href = '?filter_deadline=' + encodeURIComponent(d);
        a.textContent = d;
        if(filterDeadline === d) a.style.fontWeight = '700';
        deadlinesContainer.appendChild(a);
    });
    statuses.forEach(s => {
        const a = document.createElement('a');
        a.href = '?filter_status=' + encodeURIComponent(s);
        a.textContent = s;
        if(filterStatus === s) a.style.fontWeight = '700';
        statusesContainer.appendChild(a);
    });

    // render table rows using original indices to match PHP behavior
    const tbody = document.getElementById('tasksBody');
    tbody.innerHTML = '';
    let visibleCount = 0;
    for(let i=0;i<tasks.length;i++){
        const task = tasks[i];
        if(filterName && task.name !== filterName) continue;
        if(filterDeadline && task.deadline !== filterDeadline) continue;
        if(filterStatus && task.status !== filterStatus) continue;
        visibleCount++;
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${visibleCount}</td>
            <td>${escapeHtml(task.name)}</td>
            <td>${escapeHtml(task.description)}</td>
            <td>${escapeHtml(task.deadline)}</td>
            <td>${escapeHtml(task.status || 'Non défini')}</td>
            <td class="actions">
                <a href="edit.html?id=${i}" class="edit">Modifier</a>
                <a href="#" data-delete="${i}" class="delete">Supprimer</a>
            </td>
        `;
        tbody.appendChild(tr);
    }

    const table = document.getElementById('tasksTable');
    const noTasks = document.getElementById('noTasks');
    if(visibleCount === 0){
        table.style.display = 'none';
        noTasks.style.display = 'block';
    } else {
        table.style.display = '';
        noTasks.style.display = 'none';
    }

    // add form handling
    const addForm = document.getElementById('addForm');
    addForm.addEventListener('submit', function(e){
        e.preventDefault();
        const name = document.getElementById('name').value.trim();
        const description = document.getElementById('description').value.trim();
        const deadline = document.getElementById('deadline').value;
        const status = document.getElementById('status').value;
        const newTask = { name, description, deadline, status };
        tasks.push(newTask);
        saveTasks(tasks);
        // mimic PHP redirect to index.php -> reload page without query params
        window.location.href = 'index.html';
    });

    // delete handler (delegated)
    tbody.addEventListener('click', function(e){
        const del = e.target.closest('[data-delete]');
        if(del){
            const idx = Number(del.getAttribute('data-delete'));
            if(confirm('Supprimer cette tâche ?')){
                tasks.splice(idx,1);
                saveTasks(tasks);
                // reload keeping current filters cleared similar to PHP header redirect
                window.location.href = 'index.html';
            }
        }
    });
}

// EDIT PAGE LOGIC
function initEdit(){
    const params = getQueryParams();
    const id = params.get('id');
    const tasks = loadTasks();
    if(id === null || tasks[id] === undefined){
        document.body.innerHTML = '<p style="text-align:center;color:#900">Tâche introuvable !</p>';
        return;
    }
    const task = tasks[id];
    document.getElementById('editName').value = task.name;
    document.getElementById('editDescription').value = task.description;
    document.getElementById('editDeadline').value = task.deadline;
    document.getElementById('editStatus').value = task.status;

    document.getElementById('editForm').addEventListener('submit', function(e){
        e.preventDefault();
        tasks[id].name = document.getElementById('editName').value.trim();
        tasks[id].description = document.getElementById('editDescription').value.trim();
        tasks[id].deadline = document.getElementById('editDeadline').value;
        tasks[id].status = document.getElementById('editStatus').value;
        saveTasks(tasks);
        // redirect back to index.html
        window.location.href = 'index.html';
    });

    document.getElementById('cancelBtn').addEventListener('click', function(){
        window.location.href = 'index.html';
    });
}

// small helper to escape HTML
function escapeHtml(unsafe){
    if(unsafe === undefined || unsafe === null) return '';
    return String(unsafe)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// On load decide which page to init by checking for element ids
document.addEventListener('DOMContentLoaded', function(){
    if(document.getElementById('tasksBody')){
        initIndex();
    } else if(document.getElementById('editForm')){
        initEdit();
    }
});
