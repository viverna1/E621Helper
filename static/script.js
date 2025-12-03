const title = document.getElementById('title');

const tagsSection = document.getElementById('tags');
const settingsSection = document.getElementById('settings');

const settingsIcon = document.querySelector('.settings-icon');

document.addEventListener('DOMContentLoaded', Main);   

// ============= Работа с тегами =============
function createTagItem(tagName) {
    const article = document.createElement('article');
    article.className = 'tag-item';
    article.dataset.tag = tagName; // добавляем атрибут с именем тега
    
    article.innerHTML = `
        <h2 class="tag-name">${tagName}</h2>
        <div class="tag-actions">
            <button class="copy-btn" title="Copy Tag">
                <i class="fas fa-copy"></i>
            </button>
            <button class="edit-btn" title="Edit Tag">
                <i class="fas fa-edit"></i>
            </button>
            <button class="delete-btn" title="Delete Tag">
                <i class="fas fa-trash-alt"></i>
            </button>
        </div>
    `;
    
    // Находим кнопки внутри этого конкретного article
    const copyBtn = article.querySelector('.copy-btn');
    const editBtn = article.querySelector('.edit-btn');
    const deleteBtn = article.querySelector('.delete-btn');
    
    // Обработчик копирования
    copyBtn.addEventListener('click', async () => {
        await copyTag(tagName);
    });
    
    // Обработчик редактирования
    editBtn.addEventListener('click', () => {
        editTag(article, tagName);
    });
    
    // Обработчик удаления
    deleteBtn.addEventListener('click', () => {
        deleteTag(article);
    });
    
    tagsSection.appendChild(article);
}

// Функция копирования тега
async function copyTag(tagName) {
    await navigator.clipboard.writeText(tagName);
}

// Функция редактирования тега
function editTag(article, currentName) {
    const newName = prompt('Введите новое имя тега:', currentName);
    
    if (newName && newName.trim() && newName !== currentName) {
        // Обновляем текст
        article.querySelector('.tag-name').textContent = newName;
        // Обновляем атрибут
        article.dataset.tag = newName;
    }
}

// Функция удаления тега
function deleteTag(article) {
    article.remove();
}


function InitSettings(debug = false) {
    let isSettingsOpen = false;
    settingsIcon.addEventListener('click', function() {
        isSettingsOpen = !isSettingsOpen;
        settingsIcon.style.transform = isSettingsOpen ? 'rotate(45deg)' : 'rotate(0deg)';
        tagsSection.style.display = isSettingsOpen ? 'none' : 'flex';
        settingsSection.style.display = isSettingsOpen ? 'flex' : 'none';

        title.textContent = isSettingsOpen ? 'Settings' : 'Saved tags';
    }); 
    if (debug) {
        settingsIcon.click();
    }
}

function Main() {
    createTagItem("12");
    createTagItem("45");

    InitSettings();
}
