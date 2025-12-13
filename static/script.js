// ============= Глобальные переменные =============
let appData = {
    internal: {},
    options: {},
    tags: []
};
const tagsContainer = document.getElementById('tags-list');
const title = document.getElementById('title');
const addButton = document.querySelector('.add-tag-btn');
const settingsSection = document.getElementById('settings');
const settingsIcon = document.querySelector('.settings-btn');
const main = document.querySelector('main');

// ============= Работа с тегами =============
function createTagElement(tagName) {
    const tagItem = document.createElement('li');
    tagItem.className = 'tag-item';
    tagItem.dataset.tag = tagName;

    tagItem.innerHTML = `
        <input type="text" class="tag-name" value="${tagName}">
        <div class="tag-actions">
            <button class="submit-btn" title="Submit changes" style="display: none;">
                <i class="fas fa-check"></i>
            </button>
            <a href="https://e621.net/posts?tags=${tagName}" target="_blank" class="link-btn" title="Follow the link">
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

    setupTagEventHandlers(tagItem);
    
    tagsContainer.prepend(tagItem);
    return tagItem.querySelector('.tag-name');
}

function setupTagEventHandlers(tagItem) {
    const submitBtn = tagItem.querySelector('.submit-btn');
    const tagInput = tagItem.querySelector('.tag-name');
    const copyBtn = tagItem.querySelector('.copy-btn');
    const deleteBtn = tagItem.querySelector('.delete-btn');
    const linkBtn = tagItem.querySelector('.link-btn');

    // Переход по ссылке
    linkBtn.addEventListener('click', () => {
        setTimeout(window.close, 50);
    });

    // Редактирование тега
    tagInput.addEventListener('focus', () => {
        submitBtn.style.display = 'inline-block';
    });

    tagInput.addEventListener('blur', () => {
        updateTagInData(tagItem);
        submitBtn.style.display = 'none';
    });

    tagInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            tagInput.blur();
        }
        // Убираем переносы строк
        if (e.key === 'Enter' || e.key === 'Escape') {
            tagInput.value = tagInput.value.replace(/\n/g, ' ');
        }
    });

    tagInput.addEventListener('input', () => {
        tagInput.value = tagInput.value.replace(/\n/g, ' ');
    });

    // Кнопка подтверждения
    submitBtn.addEventListener('click', () => {
        tagInput.blur();
    });

    // Копирование
    copyBtn.addEventListener('click', async () => {
        await copyTagToClipboard(tagItem);
    });

    // Удаление
    deleteBtn.addEventListener('click', () => {
        removeTagFromData(tagItem);
    });
}

function addTagToData(tagName, onTop = false) {
    if (!tagName || tagName.trim() === '') return null;
    
    // Проверяем, нет ли уже такого тега
    if (appData.tags.includes(tagName.trim())) {
        return null;
    }
    
    appData.tags.push(tagName.trim());
    saveAllData();
    return createTagElement(tagName.trim(), onTop);
}

function updateTagInData(tagItem) {
    const tagInput = tagItem.querySelector('.tag-name');
    const oldName = tagItem.dataset.tag;
    const newName = tagInput.value.trim();
    
    // Если поле пустое - удаляем тег
    if (newName === '') {
        removeTagFromData(tagItem);
        return;
    }
    
    // Если имя не изменилось
    if (oldName === newName) return;
    
    // Обновляем в массиве
    const index = appData.tags.indexOf(oldName);
    if (index !== -1) {
        appData.tags[index] = newName;
    } else {
        appData.tags.push(newName);
    }
    
    // Обновляем DOM
    tagItem.dataset.tag = newName;
    tagItem.querySelector('.link-btn').href = `https://e621.net/posts?tags=${newName}`;
    
    saveAllData();
}

function removeTagFromData(tagItem) {
    const tagName = tagItem.dataset.tag;
    const index = appData.tags.indexOf(tagName);
    
    if (index !== -1) {
        appData.tags.splice(index, 1);
        saveAllData();
    }
    
    tagItem.remove();
}

async function copyTagToClipboard(tagItem) {
    const tagName = tagItem.querySelector('.tag-name').value;
    await navigator.clipboard.writeText(tagName);
    
    const icon = tagItem.querySelector('.copy-btn i');
    icon.className = 'fas fa-check';
    
    setTimeout(() => {
        icon.className = 'fas fa-copy';
    }, 1000);
}

// ============= Управление данными =============
async function loadJsonData() {
    try {
        const response = await fetch('data.json');
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Ошибка загрузки данных:', error);
        return { internal: {}, options: {}, tags: [] };
    }
}

function loadAllData() {
    const saved = localStorage.getItem('appData');
    if (saved) {
        appData = JSON.parse(saved);
        return true;
    }
    return false;
}

function saveAllData() {
    localStorage.setItem('appData', JSON.stringify(appData));
}

// ============= Интерфейс =============
function addNewTag() {
    const input = createTagElement('');
    input.select();
}

function initSettings(debug = false) {
    let isSettingsOpen = false;
    
    settingsIcon.addEventListener('click', function () {
        isSettingsOpen = !isSettingsOpen;
        
        settingsIcon.style.transform = isSettingsOpen ? 'rotate(45deg)' : 'rotate(0deg)';
        addButton.style.display = isSettingsOpen ? 'none' : 'inline-block';
        main.style.display = isSettingsOpen ? 'none' : 'block';
        settingsSection.style.display = isSettingsOpen ? 'flex' : 'none';
        title.textContent = isSettingsOpen ? 'Settings' : 'Saved tags';
        if (isSettingsOpen) setSettingsUI();
    });
    
    if (debug) {
        settingsIcon.click();
    }

    initSettingsUI();
}

function setSettingsUI() {
    const options = appData.options;
    Object.keys(options).forEach(option => {
        document.getElementById(option).checked = options[option];
    });
}

function initSettingsUI() {
    const options = appData.options;
    
    Object.keys(options).forEach(key => {
        const element = document.getElementById(key);
        element.addEventListener('change', function() {
            appData.options[key] = this.checked;
            saveAllData();
        });
    });
}

function applyTheme(bgColor, secondColor) {
    document.documentElement.style.setProperty('--backgroundСolor', bgColor);
    document.documentElement.style.setProperty('--secondColor', secondColor);
}

// ============= Запуск приложения =============
async function initializeApp() {
    // Пытаемся загрузить из localStorage
    const hasSavedData = loadAllData();
    
    // Если нет сохраненных данных, загружаем из JSON
    if (!hasSavedData) {
        const jsonData = await loadJsonData();
        appData = jsonData;
        saveAllData(); // Сохраняем для будущего использования
    }
    
    // Применяем тему
    if (appData.internal) {
        applyTheme(appData.internal.background_color, appData.internal.second_color);
    }
    
    // Загружаем теги
    if (appData.tags && Array.isArray(appData.tags)) {
        appData.tags.forEach(tag => {
            if (tag && tag.trim() !== '') {
                createTagElement(tag.trim());
            }
        });
    }
    
    // Инициализируем интерфейс
    addButton.addEventListener('click', addNewTag);
    initSettings();
}

initializeApp();
