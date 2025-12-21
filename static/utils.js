// ============= ебучее сука Управление данными =============
window.e621Utils = {

appData: {
    internal: {},
    options: {},
    tags: [],
    folders: [],
    items: [],
    recentTags: []
},
_isInitialized: false,

// ============= Данные =============
fetchTagCategory: async function(tagName) {
    try {
        tagName = tagName.split(':')[0];
        console.log(`fetching tag "${tagName}" category...`);
        
        const url = `https://e621.net/tags.json?search[name]=${encodeURIComponent(tagName)}`;
        const response = await fetch(url, {
            headers: {
                "Accept": "application/json",
                "User-Agent": "e621Enhancer/1.0"
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const data = await response.json();
    
        if (!data || data.length === 0) {
            console.log("category: none");
            return "none";
        }

        const categoryId = data[0].category;

        const categoryMap = {
            0: "general",
            1: "artist",
            2: "contributor",
            3: "copyright",
            4: "character",
            5: "species",
            6: "invalid",
            7: "meta",
            8: "lore"
        };

        console.log(`category: ${categoryMap[categoryId]} (id: ${categoryId})`);
        return categoryMap[categoryId] || "none";
    } catch (error) {
        console.error('Error fetching tag category:', error);
        return "none";
    }
},

loadJsonData: async function() {
    try {
        const response = await fetch('data.json');
        const data = await response.json();
        this.appData = data;
    } catch (error) {
        console.error('Ошибка загрузки данных:', error);
        return { internal: {}, options: {}, tags: [] };
    }
},

loadAllData: async function () {
    return new Promise((resolve) => {
        browser.storage.local.get(['e621enhancerData'], (result) => {
            this.appData = result.e621enhancerData;
            
            resolve(true);
        });
    });
},

saveAllData: function() {
    browser.storage.local.set({ e621enhancerData: this.appData }, () => { });
},

// ============= Items =============
createItem: function(type, id, order = -1) {
    if (order === -1) 
        order = this.getNextOrderItem();
    return {"type": type, "id": id, "order": order}
},

getNextOrderItem: function() {
    const lastId = this.appData.items.length > 0
        ? Math.max(...this.appData.items.map(i => i.order))
        : 0;

    return lastId + 1;
},

getItemById: function(id) {
    return this.appData.items.find(item => item.id == id);
},

// ============= Теги =============
addTagToData: async function(tagName, tagCategory = null) {
    const tagId = this.getNextTagId();
    this.appData.tags.push({
        "id": tagId, 
        "name": tagName, 
        "category": tagCategory,
        "folderId": null,
        "updatedAt": new Date().toISOString()
    });
    this.appData.items.push(this.createItem("tag", tagId));
},

updateTagInData: async function(tagId, newName) {
    const tagData = this.getTagById(tagId);

    // пустое имя — удалить
    if (newName === '') {
        this.removeTagFromData(tagId);
        return;
    }

    // если имя не поменялось
    if (tagData.name === newName) return;

    // обновляем локальные данные мгновенно
    const index = this.getTagIndex(tagId);
    this.appData.tags[index] = {
        id: tagData.id,
        name: newName,
        category: tagData.category, // пока старая
        folderId: tagData.folderId,
        updatedAt: new Date().toISOString()
    }

    await this.saveAllData();
    await this.updateTagCategory(tagId);
},

updateTagCategory: async function(tagId) {
    const index = this.getTagIndex(tagId);

    // тихий запрос категории в фоне, без await
    this.fetchTagCategory(this.appData.tags[index].name).then(cat => {
        this.appData.tags[index].category = cat;
        this.saveAllData();
    }).catch(() => {
        // если что‑то сломалось — просто молчим
    })
},

removeTagFromData: function(tagId) {
    // Удаляем тег из массива tags
    const tagIndex = this.getTagIndex(tagId);
    if (tagIndex !== -1) {
        this.appData.tags.splice(tagIndex, 1);
    }
    
    // Удаляем тег из всех папок
    this.appData.folders.forEach(folder => {
        const tagIdIndex = folder.tagsId.indexOf(tagId);
        if (tagIdIndex !== -1) {
            folder.tagsId.splice(tagIdIndex, 1);
        }
    });
    
    // Удаляем тег из items
    const itemIndex = this.appData.items.findIndex(item => 
        item.type === "tag" && item.id === tagId
    );
    if (itemIndex !== -1) {
        this.appData.items.splice(itemIndex, 1);
    }
    
    this.saveAllData();
},

getNextTagId: function() {
    const lastId = this.appData.tags.length > 0
        ? Math.max(...this.appData.tags.map(t => t.id))
        : 0;

    return lastId + 1;
},

getTagById: function(tagId) {
    return this.appData.tags.find(tag => tag.id == tagId);
},

getTagIndex: function(tagId) {
    return this.appData.tags.findIndex(t => t.id === tagId);
},

// ============= Папки =============
getNextFolderId: function() {
    const folders = this.appData.folders;
    
    if (folders.length === 0) {
        return 'f1';
    }
    
    const lastNumber = Math.max(...folders.map(folder => {
        const match = folder.id.match(/^f(\d+)$/);
        return match ? parseInt(match[1]) : 0;
    }));
    
    return `f${lastNumber + 1}`;
},

addFolderToData: async function(folderName, folderId = null) {
    if (!folderId)
        folderId = this.getNextFolderId();

    this.appData.folders.push({
        "id": folderId, 
        "name": folderName,
        "collapsed": false,
        "tagsId": []
    });
    this.appData.items.push(this.createItem("folder", folderId));
},

getFolderById: function(folderId) {
    return this.appData.folders.find(folder => folder.id == folderId);
},

getFolderIndex: function(folderId) {
    return this.appData.folders.findIndex(folder => folder.id === folderId);
},

updateFolderInData: async function(folderId, newName) {
    const folderData = this.getFolderById(folderId);

    // пустое имя — удалить
    if (newName === '') {
        this.removeFolderFromData(folderId);
        return;
    }

    // если имя не поменялось
    if (folderData.name === newName) return;

    // обновляем локальные данные
    const index = this.getFolderIndex(folderId);
    this.appData.folders[index].name = newName;
    
    await this.saveAllData();
},

removeFolderFromData: function(folderId) {
    // Удаляем все теги папки
    const folder = this.getFolderById(folderId);
    [...folder.tagsId].forEach(tagId => {
        this.removeTagFromData(tagId);
    })
    
    // Удаляем папку из массива folders
    const folderIndex = this.getFolderIndex(folderId);
    if (folderIndex !== -1) {
        this.appData.folders.splice(folderIndex, 1);
    }

    // Удаляем папку из items
    const itemIndex = this.appData.items.findIndex(item => 
        item.type === "folder" && item.id === folderId
    );
    if (itemIndex !== -1) {
        this.appData.items.splice(itemIndex, 1);
    }
    
    this.saveAllData();
},

addTagToFolder: function(tagId, folderId) {
    this.removeTagFromFolder(tagId);

    const folder = this.getFolderById(folderId);
    folder.tagsId.push(tagId);

    // Добавляем ссылку на папку из тега
    const tag = this.getTagById(tagId);
    tag.folderId = folderId;
    this.saveAllData();

    console.log(`Tag "${tag.name}" added to folder "${folder.name}"`);
},

removeTagFromFolder: function(tagId) {
    const tag = this.getTagById(tagId);
    if (tag.folderId === null) return;

    const folder = this.getFolderById(tag.folderId);
    folder.tagsId = folder.tagsId.filter(id => id !== tagId);
    tag.folderId = null;
    this.saveAllData();
},

// ============= Другое =============
getTags: function() {
    return this.appData.tags;
},

getItems: function () {
    return this.appData.items;
},

getFolders: function () {
    return this.appData.folders;
},

getSettings: function() {
    return this.appData.options;
},

getInternal: function() {
    return this.appData.internal;
},

// Переделать
sortAndGroupItems: function() {
    // 1. Сортируем по order (от большего к меньшему или наоборот, в зависимости от нужного порядка)
    const sorted = [...this.appData.items].sort((a, b) => b.order - a.order);
    
    // 2. Создаем массив для результата
    const result = [];
    
    // 3. Собираем папки и их теги
    const folderMap = new Map(); // id папки -> {папка, теги}
    
    // 4. Сначала находим все папки
    sorted.forEach(item => {
        if (item.type === 'folder') {
            folderMap.set(item.id, {
                folder: item,
                tags: []
            });
        }
    });
    
    // 5. Распределяем теги по папкам
    sorted.forEach(item => {
        if (item.type === 'tag') {
            // Находим папку, в которой этот тег
            let found = false;
            
            for (const [folderId, folderData] of folderMap) {
                // Проверяем, есть ли этот тег в tagsId папки
                // Нужна информация о папках из e621Utils.appData.folders
                const folderInfo = this.appData.folders.find(f => f.id === folderId);
                if (folderInfo && folderInfo.tagsId.includes(item.id)) {
                    folderData.tags.push(item);
                    found = true;
                    break;
                }
            }
            
            // Если тег не принадлежит ни одной папке, добавляем в результат отдельно
            if (!found) {
                result.push(item);
            }
        }
    });
    
    // 6. Собираем результат: папки + их теги
    folderMap.forEach((folderData, folderId) => {
        // Добавляем папку
        result.push(folderData.folder);
        
        // Добавляем теги этой папки (можно отсортировать по order)
        folderData.tags.sort((a, b) => b.order - a.order);
        result.push(...folderData.tags);
    });
    
    // 7. Обновляем order в соответствии с новой последовательностью
    result.forEach((item, index) => {
        item.order = result.length - 1 - index; // или просто index, в зависимости от нумерации
    });
    
    this.appData.items = result;
    this.saveAllData();
},

// Неудачная попытка
sortAndGroupItems2: function() {
    const items = this.getItems();

    // let newItems = [];
    let index = 0;
    
    items.forEach(item => {
        if (item.type === "folder") {
            // Устанавливаем order для папки
            item.order = index++;
            
            // Сразу после папки устанавливаем order для всех её тегов
            items.forEach(tagItem => {
                if (tagItem.type === "tag") {
                    const tag = this.getTagById(tagItem.id);
                    if (tag.folderId === item.id) {
                        tagItem.order = index++;
                    }
                }
            });
        } else if (item.type === "tag") {
            const tag = this.getTagById(item.id);
            // Обрабатываем только теги без папки
            if (tag.folderId === null) {
                item.order = index++;
            }
        }
    });
    
    this.saveAllData();
},

// Неудачная попытка
insertInOrder: function (itemId, newOrder) {
    const items = this.appData.items;

    // сортируем по текущему order
    items.sort((a, b) => a.order - b.order);

    // находим сам item
    const targetIndex = items.findIndex(i => i.id == itemId);
    if (targetIndex === -1) return;

    const targetItem = items[targetIndex];

    // собираем блок для перемещения
    let block = [];

    if (targetItem.type === "folder") {
        // папка + все её теги
        block.push(targetItem);

        const folder = this.getFolderById(targetItem.id);
        if (folder) {
            folder.tagsId.forEach(tagId => {
                const tagItem = items.find(i => i.type === "tag" && i.id === tagId);
                if (tagItem) block.push(tagItem);
            });
        }
    } else {
        // одиночный тег
        block.push(targetItem);
    }

    // удаляем блок из items
    const blockIds = new Set(block.map(i => `${i.type}:${i.id}`));
    const rest = items.filter(i => !blockIds.has(`${i.type}:${i.id}`));

    // ограничиваем newOrder
    if (newOrder < 0) newOrder = 0;
    if (newOrder > rest.length) newOrder = rest.length;

    // вставляем блок
    rest.splice(newOrder, 0, ...block);

    // пересчитываем order
    rest.forEach((item, index) => {
        item.order = index;
    });

    this.appData.items = rest;
    this.saveAllData();
},

initData: async function() {
    await this.loadAllData();
    
    // если данных нет — грузим из json
    if (!this.appData || !this.appData.internal || this.appData.internal.length === 0) {
        console.log("Загрузка данных по умолчанию");
        
        await this.loadJsonData();
        this.saveAllData();
    }

    if (this._isInitialized) return;
    this._isInitialized = true;

    this.sortAndGroupItems();

    this.appData.tags.forEach(tag => {
        if (tag.category === null)
            this.updateTagCategory(tag.id);
    });
}

}

// Для лёгкой отладки
window.e621Utils2 = {
...window.e621Utils,  // Копируем все старые свойства
// Перезаписываем нужное

loadJsonData: async function () {
    const response = await fetch('data.json');
    this.appData = await response.json();
    return this.appData;
},

saveAllData: function() {
    console.log('"Save"');
},

fetchTagCategory: async function(tagName) {
    return "general";
},

initData: async function() {
    await this.loadJsonData();
    this.sortAndGroupItems();
},

}
