// ============= ебучее сука Управление данными =============
window.e621Utils = {

appData: {
    version: "1.1.0",
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
    console.log(`fetching tag "${tagName}" category...`);

    if (tagName === '') {
        console.log("tag empty: none");
        return "none"
    }

    if (tagName.includes(":")) {
        console.log("category: meta");
        return "meta"
    }
    
    try {
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
    const response = await fetch('data.json');
    const data = await response.json();
    this.appData = data;
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
createItem: function(type, id, order = null) {
    if (!order) 
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

updateItems: function(newList) {
    this.appData.items = newList;
    this.syncOrder();
    this.saveAllData();
},

// ============= Теги =============
addTagToData: function(tagName = '', tagCategory = null) {
    const tagId = this.getNextTagId();
    
    const newTag = {
        "id": tagId, 
        "name": tagName, 
        "category": tagCategory,
        "folderId": null,
        "updatedAt": new Date().toISOString()
    }

    this.appData.tags.push(newTag);
    this.appData.items.push(this.createItem("tag", tagId));
    return newTag;
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

syncOrder: async function() {
    try {
        let originalItems = [...this.getItems()];
        let newItems = [];
        let index = 0;

        originalItems.forEach(item => {
            if (item.type === "tag") {
                const tag = this.getTagById(item.id);
                
                // Если у тега есть папка - скип
                if (tag.folderId) return;
                
                newItems.push({ type: "tag", id: tag.id, order: index });
                // console.log(`tag: o:${item.order} | i:${index} => "${tag.name}", fol: ${tag.folderId}, id: ${tag.id}`);
            } else {
                const folder = this.getFolderById(item.id)
                
                originalItems.forEach(item => {
                    if (item.type === "tag") {
                        const tag = this.getTagById(item.id);
                        
                        if (folder.tagsId.includes(tag.id)) {
                            newItems.push({ type: "tag", id: tag.id, order: index });
                            // console.log(`--- tag: o:${item.order} | i:${index} => "${tag.name}", fol: ${tag.folderId}, id: ${tag.id}`);
                            index++;
                        }
                    }
                });
                
                // console.log(`folder: o:${item.order} | i:${index} => "${folder.name}", fol: [${folder.tagsId}]`);
                newItems.push({ type: "folder", id: folder.id, order: index });
            }
            index++;
        });

        this.appData.items = newItems;
        await this.saveAllData();
    } catch (error) {
        console.error("syncOrder ERROR:", error);
        return;
    }
},

// ============= Экспорт / Импорт =============
exportAll: function() {
    // Преобразуем объект в JSON строку с отступами
    const jsonData = JSON.stringify(e621Utils.appData, null, 2);
    
    // Создаем Blob (бинарный объект)
    const blob = new Blob([jsonData], { type: 'application/json' });
    
    // Создаем URL для Blob
    const url = URL.createObjectURL(blob);
    
    // Создаем временную ссылку
    const a = document.createElement('a');
    a.href = url;
    a.download = 'e621enhancer.json'; // Имя файла
    
    // Симулируем клик для скачивания
    document.body.appendChild(a);
    a.click();
    
    // Очищаем
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
},

exportTags: function() {
    const tagsData = {
        "tags": e621Utils.getTags(),
        "folders": e621Utils.getFolders(),
        "items": e621Utils.getItems()
    }

    // Преобразуем объект в JSON строку с отступами
    const jsonData = JSON.stringify(tagsData, null, 2);
    
    // Создаем Blob (бинарный объект)
    const blob = new Blob([jsonData], { type: 'application/json' });
    
    // Создаем URL для Blob
    const url = URL.createObjectURL(blob);
    
    // Создаем временную ссылку
    const a = document.createElement('a');
    a.href = url;
    a.download = 'e621enhancer-tags.json'; // Имя файла
    
    // Симулируем клик для скачивания
    document.body.appendChild(a);
    a.click();
    
    // Очищаем
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
},

importData: async function(jsonString) {
    try {
        const importedData = JSON.parse(jsonString);

        await e621Utils.loadAllData();
        const defaultData = e621Utils.appData;
        console.log(defaultData);
        
        
        // Заменяем данные: импортированные или дефолтные
        e621Utils.appData = {
            version: importedData.version || defaultData.version,
            internal: importedData.internal || defaultData.internal,
            options: importedData.options || defaultData.options,
            tags: importedData.tags || defaultData.tags,
            folders: importedData.folders || defaultData.folders,
            items: importedData.items || defaultData.items,
            recentTags: []
        };
        
        e621Utils.saveAllData();
        console.log('Import successful');
        return { success: true };
        
    } catch (error) {
        console.error('Import error:', error);
        return { success: false, error: error.message };
    }
},

importFromFile: function() {
    return new Promise((resolve, reject) => {
        // Создаём скрытый input
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json,application/json';
        input.style.display = 'none';
        
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) {
                reject(new Error('No file selected'));
                return;
            }
            
            const reader = new FileReader();
            
            reader.onload = (e) => {
                const result = e621Utils.importData(e.target.result);
                document.body.removeChild(input); // Удаляем input
                resolve(result);
            };
            
            reader.onerror = () => {
                document.body.removeChild(input);
                reject(new Error('File reading failed'));
            };
            
            reader.readAsText(file);
        };
        
        // Если пользователь закрыл диалог без выбора
        input.oncancel = () => {
            document.body.removeChild(input);
            reject(new Error('File selection cancelled'));
        };
        
        // Добавляем в DOM и кликаем
        document.body.appendChild(input);
        input.click();
    });
},

saveFile: function(data) {
    // Создаем Blob (бинарный объект)
    const blob = new Blob([data], { type: 'application/txt' });
    
    // Создаем URL для Blob
    const url = URL.createObjectURL(blob);
    
    // Создаем временную ссылку
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tags.txt'; // Имя файла
    
    // Симулируем клик для скачивания
    document.body.appendChild(a);
    a.click();
    
    // Очищаем
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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

    await this.syncOrder();

    this.appData.tags.forEach(tag => {
        if (tag.category === null)
            this.updateTagCategory(tag.id);
    });
}

}

const isDebugMode = typeof browser === 'undefined';
if (isDebugMode) {
    // Для лёгкой отладки
    window.e621Utils2 = {
    ...window.e621Utils,  // Копируем все старые свойства
    // Перезаписываем нужное

    loadJsonData: async function () {
        const response = await fetch('data.json');
        this.appData = await response.json();
        return this.appData;
    },

    loadAllData: async function () {
        return await this.appData;
    },

    saveAllData: function() {
        console.log('"Save"');
    },

    fetchTagCategory: async function(tagName) {
        return "general";
    },

    initData: async function() {
        await this.loadJsonData();
        
        if (this._isInitialized) return;
        this._isInitialized = true;

        await this.syncOrder();
    },
}
}
