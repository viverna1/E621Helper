window.e621Utils = {

appData: {
    internal: {},
    options: {},
    tags: [],
    folders: [],
    items: [],
    recentTags: []
},

fetchTagCategory: async function(tagName) {
    const url = `https://e621.net/tags.json?search[name]=${encodeURIComponent(tagName)}`;

    const response = await fetch(url, {
        headers: {
            "Accept": "application/json",
            "User-Agent": "e621Enchanter/1.0"
        }
    });

    const data = await response.json();

    if (!data || data.length === 0) return null;

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

    return categoryMap[categoryId] || null;
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

createItem: function(type, id, order = -1) {
    if (order === -1) 
        order = this.getNextOrderItem();
    return {"type": type, "id": id, "order": order}
},

addTagToData: async function(tagName, tagCategory = "general") {
    tagId = this.getNextTagId()
    this.appData.tags.push({
        "id": tagId, 
        "name": tagName, 
        "category": tagCategory,
        "editedAt": new Date().toISOString()
    });
    this.appData.items.push(this.createItem("tag", tagId));
    this.saveAllData();
},

updateTagInData: async function(tagId, newName) {
    const tagData = this.getTagById(tagId)

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
        editedAt: new Date().toISOString()
    }

    this.saveAllData();

    // тихий запрос категории в фоне, без await
    this.fetchTagCategory(newName).then(cat => {
        const i = getTagIndex(tagId);
        if (i === -1) return;

        // перезаписываем только категорию
        appData.tags[i].category = cat;
        this.saveAllData();
    }).catch(() => {
        // если что‑то сломалось — просто молчим
    })
},

removeTagFromData: function(tagId) {
    const index = this.getTagIndex(tagId)
    if (index !== -1) {
        this.appData.tags.splice(index, 1);
        this.saveAllData();
    }
},

getNextOrderItem: function() {
    const lastId = this.appData.items.length > 0
        ? Math.max(...this.appData.items.map(i => i.order))
        : 0;

    return lastId + 1;
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

getTags: function() {
    return this.appData.tags;
},

getItems: function () {
    return this.appData.items;
},

getFolders: function () {
    return this.appData.folders;
},

getOptions: function() {
    return this.appData.options;
},

getInternal: function() {
    return this.appData.internal;
},

initData: async function() {
    await this.loadAllData();
    
    // если данных нет — грузим из json
    if (!this.appData || !this.appData.internal || this.appData.internal.length === 0) {
        console.log("Загрузка данных по умолчанию");
        
        await this.loadJsonData();
        this.saveAllData();
    }
}

}

window.e621Utils2 = {

appData: {
    internal: {},
    options: {},
    tags: [],
    folders: [],
    items: [],
    recentTags: []
},

loadJsonData: async function () {
    const response = await fetch('data.json');
    this.appData = await response.json();
    return this.appData;
},

getTags: function () {
    return this.appData.tags || [];
},

getItems: function () {
    return this.appData.items || [];
},

getFolders: function () {
    return this.appData.folders || [];
},

getOptions: function () {
    return this.appData.options || {};
},

getInternal: function () {
    return this.appData.internal || {};
},

getNextTagId: function () {
    const tags = this.getTags();
    if (tags.length === 0) return 1;
    const lastId = Math.max(...tags.map(t => t.id));
    return lastId + 1;
},

getTagById: function (tagId) {
    return this.appData.tags.find(tag => tag.id === tagId);
},

getTagIndex: function (tagId) {
    return this.appData.tags.findIndex(t => t.id === tagId);
},

addTagToData: function (tagName, tagCategory = "general") {
    const newTag = {
        id: this.getNextTagId(),
        name: tagName,
        category: tagCategory,
        editedAt: new Date().toISOString()
    };
    this.appData.tags.push(newTag);
    return newTag;
},

updateTagInData: function (tagId, newName) {
    const tagIndex = this.getTagIndex(tagId);
    if (tagIndex === -1) return false;
    
    if (newName === '') {
        this.removeTagFromData(tagId);
        return false;
    }
    
    this.appData.tags[tagIndex].name = newName;
    this.appData.tags[tagIndex].editedAt = new Date().toISOString();
    return true;
},

removeTagFromData: function (tagId) {
    const tagIndex = this.getTagIndex(tagId);
    if (tagIndex !== -1) {
        this.appData.tags.splice(tagIndex, 1);
        return true;
    }
    return false;
},

initData: async function() {
    await this.loadJsonData();
}

}
