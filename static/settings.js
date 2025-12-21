// =============== Переменные ===============
const title = document.getElementById('title');
const settingsButton = document.getElementById('settings-btn');
const addTagButton = document.getElementById('add-tag-btn');
const settingsMain = document.getElementById('settings-main');

let isSettingsOpen = false;
const generalSettings = document.getElementById('general-settings');
let currentContainer = generalSettings;

// =============== Действия ===============
async function resetData() {
    console.log("Очистка данных e621Enhancer...");

    // Очищаем storage браузера
    await browser.storage.local.clear();
    
    // Загружаем данные по умолчанию
    await e621Utils.loadJsonData();
    e621Utils.saveAllData();
    
    console.log("✅ Все данные очищены. Обновите страницу e621.net");
    window.close();
}

function showData() {
    console.log("======= AppData =======");
    console.log(JSON.stringify(window.e621Utils.appData, null, 2));
    
    console.log("======= Browser Storage =======");
    browser.storage.local.get().then(data => {
        console.log(JSON.stringify(data, null, 2));
    });
}

// =============== Элементы ===============
function createButton(settingName, buttonText, action, tooltip = null) {
    const settingItem = document.createElement('div');
    settingItem.className = 'setting-item';
    settingItem.title = tooltip;
    settingItem.textContent = settingName;
    
    const button = document.createElement('button');
    button.className = 'setting-btn';
    button.textContent = buttonText;
    button.addEventListener('click', action);
    
    settingItem.appendChild(button);
    currentContainer.appendChild(settingItem);
    
    return button;
}

function createToggle(settingName, jsonKey, tooltip = null, requirements = null) {
    const settings = e621Utils.getSettings();

    const settingItem = document.createElement('label');
    settingItem.className = 'switch setting-item';
    if (tooltip !== null)
        settingItem.title = tooltip;
    settingItem.textContent = settingName;
    
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = jsonKey;
    
    checkbox.checked = settings[jsonKey];
    checkbox.addEventListener('change', function() {
        settings[jsonKey] = this.checked;
        e621Utils.saveAllData();
        updateSettings();
    });
    
    const slider = document.createElement('span');
    slider.className = 'slider';

    settingItem.appendChild(checkbox);
    settingItem.appendChild(slider);
    currentContainer.appendChild(settingItem);
    
    if (requirements) {
        settingItem.dataset.requirements = JSON.stringify(requirements);
        settingItem.dataset.settingKey = jsonKey;
    }
}

function createSeparator(name) {
    const separator = document.createElement('div');
    separator.className = "settings-section-separator";
    separator.innerHTML = `
        <span class="line"></span>
        <span class="text">${name}</span>
        <span class="line"></span>
    `
    currentContainer.appendChild(separator);
}

function updateSettings() {
    const settings = e621Utils.getSettings();
    const allSettings = document.querySelectorAll('.setting-item[data-requirements]');
    
    allSettings.forEach(settingItem => {
        const requirements = JSON.parse(settingItem.dataset.requirements);
        const shouldShow = settings[requirements];
        
        // Показываем/скрываем элемент
        settingItem.style.display = shouldShow ? '' : 'none';
        
        // Также управляем состоянием чекбокса
        const checkbox = settingItem.querySelector('input[type="checkbox"]');
        
        if (checkbox && !shouldShow) {
            checkbox.click();
        }
    });
}

// =============== Основа ===============
function setupSettingsUI() {
    createToggle("Enable tags on site", "tags_in_e621", "Saved tags will be instead of the usual ones on the site");
    createToggle("Hide original tags", "hide_original_tags", "Hides original tags in sidebar", "tags_in_e621");
    createSeparator("data");
    createButton("Reset all data", "reset", () => { resetData(); }, "Delete all saved tags and satting");
    createButton("Show data", "show", () => { showData(); }, "Print data in console");
    updateSettings();
}

function toggleSettings() {
        isSettingsOpen = !isSettingsOpen;
        
        settingsButton.style.transform = isSettingsOpen ? 'rotate(45deg)' : 'rotate(0deg)';
        addTagButton.style.display = isSettingsOpen ? 'none' : 'inline-block';
        addFolderButton.style.display = isSettingsOpen ? 'none' : 'inline-block';
        main.style.display = isSettingsOpen ? 'none' : 'block';
        settingsMain.style.display = isSettingsOpen ? 'flex' : 'none';
        title.textContent = isSettingsOpen ? 'Settings' : 'Saved tags';
}

async function init() {
    await e621Utils.initData();
    
    settingsButton.addEventListener('click', function () {
        toggleSettings();
    });

    setupSettingsUI();
    // settingsButton.click();
}

init();
