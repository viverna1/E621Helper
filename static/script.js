

 



// ============= Работа с тегами =============
const tagsSection = document.getElementById('tags');

// Создение элемента тега
function CreateTagItem(tagName) {
    const article = document.createElement('article');
    article.className = 'tag-item';
    article.dataset.tag = tagName; // добавляем атрибут с именем тега
    
    article.innerHTML = `
        <textarea class="tag-name">${tagName}</textarea>
        <div class="tag-actions">
            <a href="https://e621.net/posts?tags=${tagName}" target="_blank" class="link-btn" title="follow the link">
                <i class="fas fa-external-link-alt"></i>
            </a>
            <button class="copy-btn" title="Copy Tag">
                <i class="fas fa-copy"></i>
            </button>
            <button class="delete-btn" title="Delete Tag">
                <i class="fas fa-trash-alt"></i>
            </button>
        </div>
    `;
    
    // Находим кнопки внутри этого конкретного article
    const link = article.querySelector('.tag-name');
    const copyBtn = article.querySelector('.copy-btn');
    const deleteBtn = article.querySelector('.delete-btn');
    

    // Обработчик редактирования
    link.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            this.blur();
        }
    });
    
    // Удаляем уже существующие переносы строк
    link.addEventListener('input', function() {
        this.value = this.value.replace(/\n/g, ' ');
    });


    // Обработчик копирования
    copyBtn.addEventListener('click', async () => {
        await CopyTag(tagName, article);
    });
    
    // Обработчик удаления
    deleteBtn.addEventListener('click', () => {
        DeleteTag(article);
    });
    
    tagsSection.prepend(article);
    return link;
}

// Копирование тега
async function CopyTag(tagName, article) {
    await navigator.clipboard.writeText(tagName);
    const icon = article.querySelector('.copy-btn').querySelector('i');
    icon.className = 'fas fa-check';
    setTimeout(() => {
        icon.className = 'fas fa-copy';
    }, 1000);
}

// Редактирование тега
function EditTag(article, currentName) {
    const newName = prompt('Введите новое имя тега:', currentName);
    
    if (newName && newName.trim() && newName !== currentName) {
        // Обновляем текст
        article.querySelector('.tag-name').textContent = newName;
        // Обновляем атрибут
        article.dataset.tag = newName;
    }
}

// Удаление тега
function DeleteTag(article) {
    article.remove();
}



// ============= Основное =============
const title = document.getElementById('title');
const addButton = document.querySelector('.add-tag-btn');

function AddTag(){
    CreateTagItem("").select();
}

addButton.addEventListener('click', AddTag);



// ============= Настройки =============
const settingsSection = document.getElementById('settings');
const settingsIcon = document.querySelector('.settings-icon');

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


// ============= Запуск =============
document.addEventListener('DOMContentLoaded', Main);

function Main() {
    CreateTagItem("12");
    CreateTagItem("45");

    InitSettings();
}
