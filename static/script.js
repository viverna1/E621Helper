// Глобальная функция для очистки данных через консоль
window.clear = async function() {
    console.log("Очистка данных e621Enhancer...");
    
    // Очищаем локальные данные
    window.e621Utils.appData = {
        internal: {},
        options: {},
        tags: [],
        folders: [],
        items: [],
        recentTags: []
    };
    
    // Очищаем storage браузера
    try {
        await browser.storage.local.clear();
        console.log("✓ Storage очищен");
    } catch (error) {
        console.error("Ошибка при очистке storage:", error);
    }
    
    // Загружаем данные по умолчанию
    try {
        await window.e621Utils.loadJsonData();
        window.e621Utils.saveAllData();
        console.log("✓ Загружены данные по умолчанию");
    } catch (error) {
        console.error("Ошибка при загрузке данных по умолчанию:", error);
    }
    
    console.log("✅ Все данные очищены. Обновите страницу e621.net");
    
    return "Готово. Обновите страницу.";
};

// Добавим также функцию для просмотра текущих данных
window.showData = function() {
    console.log("Текущие данные e621Enhancer:");
    console.log("Опции:", window.e621Utils.getOptions());
    console.log("Теги:", window.e621Utils.getTags());
    console.log("Все данные:", window.e621Utils.appData);
};

// И функцию для сброса к настройкам по умолчанию (без очистки тегов)
window.resetSettings = async function() {
    console.log("Сброс настроек...");
    
    // Сохраняем текущие теги
    const currentTags = window.e621Utils.appData.tags || [];
    const currentFolders = window.e621Utils.appData.folders || [];
    const currentItems = window.e621Utils.appData.items || [];
    
    // Загружаем данные по умолчанию
    await window.e621Utils.loadJsonData();
    
    // Восстанавливаем пользовательские данные
    window.e621Utils.appData.tags = currentTags;
    window.e621Utils.appData.folders = currentFolders;
    window.e621Utils.appData.items = currentItems;
    
    window.e621Utils.saveAllData();
    console.log("✅ Настройки сброшены, теги сохранены");
};

window.test = async function() {
    console.log(123);
    
}

// ============= Глобальные переменные =============
const tagsContainer = document.getElementById('tags-list');
const title = document.getElementById('title');
const addButton = document.getElementById('add-tag-btn');
const settingsSection = document.getElementById('settings');
const settingsIcon = document.getElementById('settings-btn');
const main = document.querySelector('main');

// ============= Работа с тегами =============
function createTagElement(tagName, tagId) {
    const tagItem = document.createElement('li');
    tagItem.className = 'tag-item';
    tagItem.id = "tag-item-" + tagId;
    tagItem.dataset.tag = tagName;

    tagItem.innerHTML = `
        <input type="text" class="tag-name" value="${tagName}">
        <div class="tag-actions">
            <button class="submit-btn" title="Submit changes" style="display: none;">
                <i class="fas fa-check"></i>
            </button>
            <a href="${formatLink(tagName)}" target="_blank" class="link-btn" title="Follow the link">
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

    setupTagEventHandlers(tagItem, tagId);
    tagsContainer.prepend(tagItem);
    return tagItem.querySelector('.tag-name');
}

function setupTagEventHandlers(tagItem, tagId) {
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
        e621Utils.updateTagInData(tagId, tagInput.value);
        updateTag(tagId, tagInput.value);
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
        e621Utils.removeTagFromData(tagId);
        deleteTag(tagItem);
    });
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

function deleteTag(tagItem) {
    tagItem.remove();
}

function formatLink(target) {
    return "https://e621.net/posts?tags=" + target.replace(/\s+/g, '+');
}

async function updateTag(tagId, newName) {
    const element = document.getElementById(`tag-item-${tagId}`)

    // пустое имя — удалить
    if (newName === '') {
        deleteTag(element);
        return;
    }

    // обновляем ссылку
    const link = element.querySelector('.link-btn');
    link.href = formatLink(newName);
}

// ============= Интерфейс =============
async function addNewTag() {
    await e621Utils.addTagToData('');
    const input = createTagElement('', e621Utils.getNextTagId() - 1);
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
    const options = e621Utils.getOptions();
    Object.keys(options).forEach(option => {
        document.getElementById(option).checked = options[option];
    });
}

function initSettingsUI() {
    const options = e621Utils.getOptions();
    
    Object.keys(options).forEach(key => {
        const element = document.getElementById(key);
        element.addEventListener('change', function() {
            options[key] = this.checked;
            e621Utils.saveAllData();
        });
    });
}

function applyTheme(bgColor, secondColor) {
    document.documentElement.style.setProperty('--backgroundСolor', bgColor);
    document.documentElement.style.setProperty('--secondColor', secondColor);
}

// ============= Запуск приложения =============
async function initializeApp() {
    // загружаем данные из расширения
    await e621Utils.initData()

    // применяем тему
    const internal = e621Utils.getInternal();
    applyTheme(internal.background_color, internal.second_color);

    // создаём элементы с учётом нового формата
    const items = e621Utils.getItems().sort((a, b) => a.order - b.order);
    items.forEach(item => {
        if (item.type === "tag") {
            const tag = e621Utils.getTagById(item.id);
            createTagElement(tag.name.trim(), tag.id);
        }
    });

    addButton.addEventListener('click', addNewTag);
    initSettings();
}

initializeApp();
