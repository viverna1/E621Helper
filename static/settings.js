// =============== Переменные ===============
const settingsButton = document.getElementById('settings-btn');
const settingsMain = document.getElementById('settings-main');

let isSettingsOpen = false;
const generalSettings = document.getElementById('general-settings');
let currentContainer = generalSettings;

// =============== Действия ===============
function collapseAllFolders() {
    const folders = e621Utils.getFolders();
    folders.forEach(folder => {
        folder.collapsed = true;
    });

    e621Utils.saveAllData();
    // Функция из script.js
    reloadTags();
}

function applyTheme(bgColor, secondColor) {
    document.documentElement.style.setProperty('--backgroundСolor', bgColor);
    document.documentElement.style.setProperty('--secondColor', secondColor);
}

function updateTheme() {
    const settings = e621Utils.getSettings();
    if (settings["original_theme"])
        applyTheme("#152f56", "#1f3c67");
    else
        applyTheme("#222222", "#404040");
}

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
    if (tooltip)
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

function createToggle(settingName, jsonKey, tooltip = null, requirements = null, action = null) {
    const settings = e621Utils.getSettings();

    const settingItem = document.createElement('label');
    settingItem.className = 'switch setting-item';
    if (tooltip)
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
        if (action)
            action();
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

function createNumber(settingName, jsonKey, tooltip = null, min = 1, max = 100, requirements = null) {
    const settings = e621Utils.getSettings();
    let step = 1;

    const settingItem = document.createElement('div');
    settingItem.className = 'setting-item';
    if (tooltip)
        settingItem.title = tooltip;
    settingItem.textContent = settingName;
    
    const numberControl = document.createElement('div');
    numberControl.className = 'number-control';
    
    const decrementBtn = document.createElement('button');
    decrementBtn.className = 'number-btn decrement';
    decrementBtn.textContent = '-';
    decrementBtn.type = 'button';
    
    const numberInput = document.createElement('input');
    numberInput.type = 'number';
    numberInput.className = 'number-input';
    numberInput.value = settings[jsonKey] || min;
    numberInput.min = min;
    numberInput.max = max;
    numberInput.step = step;
    
    const incrementBtn = document.createElement('button');
    incrementBtn.className = 'number-btn increment';
    incrementBtn.textContent = '+';
    incrementBtn.type = 'button';
    
    // Обновление значения
    const updateValue = function(newValue) {
        let value = parseInt(newValue, 10);
        if (isNaN(value)) value = min;
        if (value < min) value = min;
        if (value > max) value = max;
        
        numberInput.value = value;
        settings[jsonKey] = value;
        e621Utils.saveAllData();
        updateSettings();
    };
    
    // Обработчики для кнопок
    decrementBtn.addEventListener('click', function() {
        const currentValue = parseInt(numberInput.value, 10);
        const newValue = Math.max(min, currentValue - step);
        updateValue(newValue);
    });
    
    incrementBtn.addEventListener('click', function() {
        const currentValue = parseInt(numberInput.value, 10);
        const newValue = Math.min(max, currentValue + step);
        updateValue(newValue);
    });
    
    // Обработчик для прямого ввода
    numberInput.addEventListener('change', function() {
        updateValue(this.value);
    });
    
    // Обработчик для клавиш
    numberInput.addEventListener('keydown', function(e) {
        if (e.key === 'ArrowUp') {
            e.preventDefault();
            incrementBtn.click();
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            decrementBtn.click();
        } else if (e.key === 'enter') {
            e.preventDefault();
            numberInput.blur();
        }
    });
    
    // Обработчик для прокрутки колесика мыши
    numberInput.addEventListener('wheel', function(e) {
        e.preventDefault();
        if (e.deltaY < 0) {
            incrementBtn.click();
        } else {
            decrementBtn.click();
        }
    });
    
    // Собираем элементы
    numberControl.appendChild(decrementBtn);
    numberControl.appendChild(numberInput);
    numberControl.appendChild(incrementBtn);
    settingItem.appendChild(numberControl);
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

function createSpace(requirements = null) {
    const space = document.createElement('div');
    space.className = "setting-space";
    currentContainer.appendChild(space);
    
    if (requirements) {
        space.dataset.requirements = JSON.stringify(requirements);
    }
}

function updateSettings() {
    const settings = e621Utils.getSettings();
    const allSettings = document.querySelectorAll('.setting-item[data-requirements], .setting-space[data-requirements]');
    
    allSettings.forEach(settingItem => {
        const requirements = JSON.parse(settingItem.dataset.requirements);
        const shouldShow = settings[requirements];
        
        // Показываем/скрываем элемент
        settingItem.style.display = shouldShow ? '' : 'none';
        
        // Также управляем состоянием чекбокса
        const checkbox = settingItem.querySelector('input[type="checkbox"]');
        
        if (checkbox && checkbox.checked && !shouldShow) {
            checkbox.click();
        }
    });
}

// =============== Основа ===============
function setupSettingsUI() {
    if (0) {
        createSeparator("templates");
        createToggle("Toggle name", "json_setting", "tooltip", "requirements", () => { "action" });
        createSpace("requirements");
        createButton("Name", "button text", () => { "action" }, "tooltip");
        createNumber("Number name", "json_setting", "tooltip", 1, 100, "requirements");
    }
    
    createSeparator("visual");
    createToggle("Enable e621 theme", "original_theme", null, null, updateTheme);
    createToggle("Tags color", "tags_color", null, null, reloadTags);

    createSeparator("extension");  // Было "exteition" (орфографическая ошибка)
    createButton("Collapse all folders", "collapse", collapseAllFolders);
    createToggle("Auto collapse folders", "auto_collapse", "Collapses folders when opening the extension");  // Было "an extension"
    createToggle("Close after copying", "copy_close", "Closes the extension after copying the tag");  // Было "Сlose" (русская буква С)
    
    createSeparator("e621");
    createToggle("Enable tags on site", "tags_in_e621", "Add saved tags to the default tag list on the site");  // Улучшенная формулировка
    createToggle("Hide original tags", "hide_original_tags", "Hides original tags in sidebar", "tags_in_e621");
    createToggle("Remove unnecessary tabs", "hide_e621_tabs", 'Removes tabs at the top of the site, such as "Blips", "Wiki", "Changes"');
    createToggle("Increase art on hover (beta)", "hover_art_increase", "Make art bigger when mouse over");
    createToggle("Max art height", "max_art_height", "Large art will fit screen height");
    
    createSeparator("data");
    createButton("Export all", "export", e621Utils.exportAll);
    createButton("Export tags", "export", e621Utils.exportTags, "Export tags and folders");
    createButton("Import data", "import", () => { 
        browser.tabs.create({ 
            url: browser.runtime.getURL('import.html') 
        }); 
        updateSettings(); 
        reloadTags();
    });
    createSpace();
    createButton("Reset all data", "reset", resetData, "Delete all saved tags and settings");  // Было "satting"
    createButton("Show data", "show", showData, "Print data in console");
    
    createSeparator("Work in progress");
    createSpace("recent_tags");
    createToggle("Recent tags", "recent_tags", "Adds a folder where your recent tags will be stored");
    createNumber("Recent tags count", "recent_count", null, 1, 100, "recent_tags");
    createToggle("Ignore existing tags", "recent_no_duplicates", "Does not add to recent tags that you already have saved", "recent_tags");
    createToggle("Enable recent tags on the site", "recent_on_site", null, "recent_tags");
    
    updateSettings();
}

function toggleSettings() {
    isSettingsOpen = !isSettingsOpen;
    
    settingsButton.style.transform = isSettingsOpen ? 'rotate(45deg)' : 'rotate(0deg)';
    main.style.display = isSettingsOpen ? 'none' : 'block';
    settingsMain.style.display = isSettingsOpen ? 'block' : 'none';
}

async function init() {
    await e621Utils.initData();
    const settings = e621Utils.getSettings();
    
    settingsButton.addEventListener('click', toggleSettings);

    setupSettingsUI();
    
    // применяем тему
    updateTheme();
    
    if (settings["auto_collapse"])
        collapseAllFolders();

    // settingsButton.click();
}

init();
