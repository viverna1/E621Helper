// ============= Глобальные переменные =============
const tagsContainer = document.getElementById('tags-list');
const addButton = document.getElementById('add-tag-btn');
const addTagButton = document.getElementById('add-tag-btn');
const addFolderButton = document.getElementById('add-folder-btn');
const main = document.getElementById('tags-main');
const dotColor = "#999";

// ============= Работа с тегами =============
function createTagElement(tagData) {
    const tagColor = e621Utils.getSettings()["tags_color"];
    const tagItem = document.createElement('li');
    tagItem.className = 'tag-item';
    tagItem.id = "tag-item-" + tagData.id;
    tagItem.dataset.tag = tagData.name;

    tagItem.innerHTML = `
        <svg class="drag-point" width="25" height="25" viewBox="40 0 10 80">
            <circle cx="30" cy="20" r="5" fill="${dotColor}"/>
            <circle cx="30" cy="40" r="5" fill="${dotColor}"/>
            <circle cx="30" cy="60" r="5" fill="${dotColor}"/>
            <circle cx="50" cy="20" r="5" fill="${dotColor}"/>
            <circle cx="50" cy="40" r="5" fill="${dotColor}"/>
            <circle cx="50" cy="60" r="5" fill="${dotColor}"/>
        </svg>
        <input type="text" class="tag-name" value="${tagData.name}">
        <div class="tag-actions">
            <button class="btn submit-btn" title="Submit changes" style="display: none;">
                <i class="fas fa-check"></i>
            </button>
            <a href="${formatLink(tagData.name)}" target="_blank" class="btn link-btn" title="Follow the link">
                <i class="fas fa-external-link-alt"></i>
            </a>
            <button class="btn copy-btn" title="Copy Tag">
                <i class="fas fa-copy"></i>
            </button>
            <button class="btn delete-btn" title="Delete Tag">
                <i class="fas fa-trash-alt"></i>
            </button>
        </div>
    `;

    const input = tagItem.querySelector('.tag-name');
    if (tagColor) {
        input.classList.add(`tag-${tagData.category}`);
    }

    setupTagEventHandlers(tagItem, tagData.id);
    tagsContainer.prepend(tagItem);
    return input;
}

function setupTagEventHandlers(tagItem, tagId) {
    const submitBtn = tagItem.querySelector('.submit-btn');
    const tagInput = tagItem.querySelector('.tag-name');
    const copyBtn = tagItem.querySelector('.copy-btn');
    const deleteBtn = tagItem.querySelector('.delete-btn');
    const linkBtn = tagItem.querySelector('.link-btn');
    const dragPoints = tagItem.querySelector('.drag-point');

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

    // Драг-дроп точки
    dragPoints.addEventListener('mousedown', startDrag);
}

async function copyTagToClipboard(tagItem) {
    const tagName = tagItem.querySelector('.tag-name').value;
    await navigator.clipboard.writeText(tagName);

    // Закрываем расширение, если это включено
    settings = e621Utils.getSettings();
    if (settings["copy_close"]) {
        setTimeout(window.close, 100);
    }
    
    const icon = tagItem.querySelector('.copy-btn i');
    icon.className = 'fas fa-check';
    
    setTimeout(() => {
        icon.className = 'fas fa-copy';
    }, 1000);
}

async function updateTag(tagId, newName) {
    const element = getTagElement(tagId);

    // пустое имя — удалить
    if (newName === '') {
        deleteTag(element);
        return;
    }

    // обновляем ссылку
    const link = element.querySelector('.link-btn');
    link.href = formatLink(newName);
}

function deleteTag(tagItem) {
    tagItem.remove();
}

function formatLink(target) {
    return "https://e621.net/posts?tags=" + target.replace(/\s+/g, '+');
}

// ============= Папки =============
function createFolderElement(folderName, folderId, isEdit = false) {
    const folderItem = document.createElement('li');
    folderItem.className = 'folder-item';
    folderItem.id = "folder-item-" + folderId;

    folderItem.innerHTML = `
        <svg class="drag-point" width="25" height="25" viewBox="40 0 10 80">
            <circle cx="30" cy="20" r="5" fill="${dotColor}"/>
            <circle cx="30" cy="40" r="5" fill="${dotColor}"/>
            <circle cx="30" cy="60" r="5" fill="${dotColor}"/>
            <circle cx="50" cy="20" r="5" fill="${dotColor}"/>
            <circle cx="50" cy="40" r="5" fill="${dotColor}"/>
            <circle cx="50" cy="60" r="5" fill="${dotColor}"/>
        </svg>
        <button class="btn collapse-btn"><i class="fas fa-chevron-down"></i></button>
        <input type="text" class="tag-name" value="${folderName}" ${isEdit ? '' : 'readonly'}>
        <div class="tag-actions ${isEdit ? 'hide' : ''}">
            <button class="btn edit-btn" title="Edit folder name"><i class="fas fa-pen"></i></button>
            <button class="btn delete-btn" title="Delete folder"><i class="fas fa-trash-alt"></i></button>
        </div>
        <div class="confirm-actions ${isEdit ? '' : 'hide'}">
            <button class="btn confirm-btn"><i class="fas fa-check"></i></button>
            <button class="btn reject-btn"><i class="fas fa-xmark"></i></button>
        </div>
    `;

    setupFolderEventHandlers(folderItem, folderId, isEdit);
    tagsContainer.prepend(folderItem);
}

function setupFolderEventHandlers(folderItem, folderId, isEdit) {
    const collapseBtn = folderItem.querySelector('.collapse-btn');
    const input = folderItem.querySelector('.tag-name');
    const editBtn = folderItem.querySelector('.edit-btn');
    const deleteBtn = folderItem.querySelector('.delete-btn');
    const dragPoints = folderItem.querySelector('.drag-point');
    let oldName = input.value;

    // Кнопка свернуть
    collapseBtn.addEventListener('click', () => {
        toggleCollapseFolder(folderId);
        e621Utils.saveAllData();
    });

    // Изменение
    editBtn.addEventListener('click', () => {
        input.readOnly = false;
        input.focus();
        input.setSelectionRange(input.value.length, input.value.length);
        oldName = input.value;

        // Удаляем старый обработчик blur
        input.removeEventListener('blur', handleBlur);
        
        // Добавляем новый обработчик blur с задержкой
        setTimeout(() => {
            input.addEventListener('blur', handleBlur);
        }, 100);

        confirmChanges(folderItem, () => {
            if (input.value === "") {
                input.value = oldName;
                input.readOnly = true;
                input.removeEventListener('blur', handleBlur);
                return;
            }
            const newName = input.value;
            if (newName !== oldName) {
                e621Utils.updateFolderInData(folderId, newName);
            }
            input.readOnly = true;
            input.removeEventListener('blur', handleBlur);
        }, () => {
            input.value = oldName;
            input.readOnly = true;
            input.removeEventListener('blur', handleBlur);
        });
    });

    if (isEdit) {
        input.readOnly = false;
        setTimeout(() => {
            input.focus();
            input.select();
        }, 10);

        input.addEventListener('blur', () => {
            if (input.value === "")
                folderItem.remove();
        });

        confirmChanges(folderItem, () => {
            if (input.value === "") {
                folderItem.remove();
            }
            const newName = input.value;
             e621Utils.updateFolderInData(folderId, newName);
            input.readOnly = true;
            input.removeEventListener('blur', handleBlur);
        }, () => {
            folderItem.remove();
        });
    }

    function handleBlur() {
        setTimeout(() => {
            const confirmActions = folderItem.querySelector('.confirm-actions');
            if (!confirmActions.classList.contains('hide')) {
                input.focus(); // Возвращаем фокус, если открыто окно подтверждения
            }
        }, 10);
    }
    
    // Удаление
    deleteBtn.addEventListener('click', () => {
        confirmChanges(folderItem, () => {
            deleteFolder(folderItem, folderId);
            e621Utils.removeFolderFromData(folderId);
        }, () => {});
    });

    // Драг-дроп точки
    dragPoints.addEventListener('mousedown', startDrag);
}

function confirmChanges(folderItem, onConfirm, onCancel) {
    const tagActions = folderItem.querySelector('.tag-actions');
    const confirmActions = folderItem.querySelector('.confirm-actions');
    const confirmButton = folderItem.querySelector('.confirm-btn');
    const rejectButton = folderItem.querySelector('.reject-btn');

    tagActions.classList.add("hide");
    confirmActions.classList.remove("hide");

    const handleConfirm = () => {
        onConfirm();
        cleanup();
    };

    const handleReject = () => {
        onCancel();
        cleanup();
    };

    const cleanup = () => {
        tagActions.classList.remove("hide");
        confirmActions.classList.add("hide");
        confirmButton.removeEventListener('click', handleConfirm);
        rejectButton.removeEventListener('click', handleReject);
    };

    confirmButton.addEventListener('click', handleConfirm);
    rejectButton.addEventListener('click', handleReject);
}

function cancelChanges(folderItem) {
    const tagActions = folderItem.querySelector('.tag-actions');
    const confirmActions = folderItem.querySelector('.confirm-actions');

    tagActions.classList.remove("hide");
    confirmActions.classList.add("hide");
    return;
}

async function updateFolder(folderItem, newName) {
    // пустое имя — удалить
    if (newName === '') {
        deleteFolder(folderItem);
        return;
    }
}

function deleteFolder(folderItem, folderId) {
    // Удаляем все теги папки
    const folder = e621Utils.getFolderById(folderId);
    folder.tagsId.forEach(tagId => {
        const tagElement = document.getElementById("tag-item-" + tagId);
        deleteTag(tagElement);
    })

    folderItem.remove();
}

function toggleCollapseFolder(folderId) {
    const folder = e621Utils.getFolderById(folderId);
    const collapseBtn = document.querySelector(`#folder-item-${folderId} .collapse-btn`);
    
    if (folder.tagsId.length > 0) {
        folder.tagsId.forEach(tagId => {
            const tagElement = document.getElementById(`tag-item-${tagId}`);
                tagElement.classList.toggle('hide', !folder.collapsed);
        });
    }

    collapseBtn.style.transform = folder.collapsed ? 'rotate(0deg)' : 'rotate(270deg)';

    folder.collapsed = !folder.collapsed;
}

// ============= КОНЧЕНАЯ DRAG & DROP СИСТЕМА =============
let dragState = {
    draggedItem: null,          // Перетаскиваемый элемент
    draggedType: null,          // 'tag' или 'folder'
    draggedId: null,            // ID перетаскиваемого элемента
    originalNextSibling: null,  // Следующий элемент до перетаскивания
    offsetY: 0,                 // Смещение курсора относительно элемента
    wasFolderCollapsed: false,  // Была ли папка свёрнута до перетаскивания
};

let lastHighlightedFolder = null;
let dropIndicator = null;

// Создание индикатора места вставки
function createDropIndicator() {
    dropIndicator = document.createElement('div');
    dropIndicator.className = 'drop-indicator';
    dropIndicator.style.display = 'none';
    document.body.appendChild(dropIndicator);
}

// Начало перетаскивания
function startDrag(e) {
    e.preventDefault();
    
    const item = e.target.closest('.tag-item, .folder-item');
    if (!item) return;
    
    // Инициализация состояния
    dragState.draggedItem = item;
    dragState.draggedType = isTag(item) ? 'tag' : 'folder';
    dragState.draggedId = dragState.draggedType === 'tag' ? getTagId(item) : getFolderId(item);
    dragState.originalNextSibling = item.nextElementSibling;
    
    const rect = item.getBoundingClientRect();
    dragState.offsetY = e.clientY - rect.top;
    
    // Если перетаскиваем папку, сворачиваем её
    if (dragState.draggedType === 'folder') {
        const folder = e621Utils.getFolderById(dragState.draggedId);
        dragState.wasFolderCollapsed = folder.collapsed;
        
        if (!folder.collapsed) {
            toggleCollapseFolder(dragState.draggedId);
        }
    }
    
    // Убираем тег из папки в начале перетаскивания
    if (dragState.draggedType === 'tag') {
        e621Utils.removeTagFromFolder(dragState.draggedId);
    }
    
    // Делаем элемент перемещаемым
    item.classList.add('dragging');
    item.style.position = 'absolute';
    item.style.width = rect.width + 'px';
    item.style.left = rect.left + 'px';
    item.style.top = rect.top + 'px';
    item.style.zIndex = '1000';
    
    document.addEventListener('mousemove', onDragMove);
    document.addEventListener('mouseup', onDragEnd);
    onDragMove(e);
}

// Движение во время перетаскивания
function onDragMove(e) {
    if (!dragState.draggedItem) return;
    e.preventDefault();
    
    const newY = e.clientY - dragState.offsetY + window.pageYOffset;
    dragState.draggedItem.style.top = newY + 'px';
    
    updateDropIndicator(e.clientY);
}

// Обновление индикатора места вставки
function updateDropIndicator(mouseY) {
    const allItems = Array.from(tagsContainer.children).filter(el => 
        !el.classList.contains('dragging') && 
        !(el.classList.contains('tag-item') && el.classList.contains('hide'))
    );

    // Убираем все подсветки
    if (lastHighlightedFolder) {
        lastHighlightedFolder.classList.remove('drag-over');
    }

    
    if (allItems.length === 0) {
        dropIndicator.style.display = 'none';
        return;
    }
    
    const dropPosition = findDropPosition(allItems, mouseY);
    
    if (!dropPosition) {
        dropIndicator.style.display = 'none';
        return;
    }
    
    // Показываем линию-индикатор
    const rect = dropPosition.element.getBoundingClientRect();
    dropIndicator.style.left = rect.left + 'px';
    dropIndicator.style.width = rect.width + 'px';
    dropIndicator.style.display = 'block';
    
    if (dropPosition.position === 'before' || dropPosition.position === 'before') {
        dropIndicator.style.top = (rect.top - 1 + window.pageYOffset) + 'px';
    } else if (dropPosition.position === 'after') {
        dropIndicator.style.top = (rect.bottom - 1 + window.pageYOffset) + 'px';
    }

    // Подсвечиваем папку
    if (dropPosition.folderId) {
        const folder = getFolderElement(dropPosition.folderId);
        folder.classList.add("drag-over");
        lastHighlightedFolder = folder;
    }
}

// Определение позиции для вставки
function findDropPosition(allItems, mouseY) {
    const isDraggingTag = dragState.draggedType === 'tag';
    const isDraggingFolder = dragState.draggedType === 'folder';
    
    // Проверяем, курсор выше первого элемента
    const firstRect = allItems[0].getBoundingClientRect();
    if (mouseY < firstRect.top) {
        return { element: allItems[0], position: 'before', folderId: null };
    }
    
    // Проверяем, курсор ниже последнего элемента
    const lastRect = allItems[allItems.length - 1].getBoundingClientRect();
    if (mouseY > lastRect.bottom) {
        return { element: allItems[allItems.length - 1], position: 'end', folderId: null };
    }
    
    // Ищем элемент под курсором
    for (let i = 0; i < allItems.length; i++) {
        const item = allItems[i];
        const rect = item.getBoundingClientRect();
        
        if (mouseY >= rect.top && mouseY <= rect.bottom) {
            const isInTopHalf = mouseY < (rect.top + rect.height / 2);
            const isHoverTag = isTag(item);
            const isHoverFolder = !isTag(item);
            
            // ========== Перетаскиваем ТЕГ ==========
            if (isDraggingTag) {
                if (isHoverTag) {
                    const tagId = getTagId(item);
                    const tag = e621Utils.getTagById(tagId);
                    return { 
                        element: item, 
                        position: isInTopHalf ? 'before' : 'after',
                        folderId: tag.folderId
                    };
                } else if (!isInTopHalf) {
                    const folderId = getFolderId(item);
                    return { element: item, position: 'after', folderId: folderId };
                } else {
                    return { element: item, position: 'before', folderId: null };
                }
            }
            
            // ========== Перетаскиваем ПАПКУ ==========
            if (isDraggingFolder) {
                if (isHoverTag) {
                    // Папка на тег
                    const targetTagId = getTagId(item);
                    const targetTag = e621Utils.getTagById(targetTagId);
                    
                    if (targetTag.folderId) {
                        // Тег в папке - ищем последний тег этой папки
                        let lastTagElement = null;
                        
                        for (let j = 0; j < allItems.length; j++) {
                            const checkItem = allItems[j];
                            if (isTag(checkItem)) {
                                const checkTagId = getTagId(checkItem);
                                const checkTag = e621Utils.getTagById(checkTagId);
                                
                                if (checkTag.folderId === targetTag.folderId) {
                                    lastTagElement = checkItem;
                                }
                            }
                        }
                        
                        if (lastTagElement) {
                            return { element: lastTagElement, position: 'after', folderId: null };
                        }
                        
                        const folderElement = getFolderElement(targetTag.folderId);
                        return { element: folderElement, position: 'after', folderId: null };
                    } else {
                        // Тег не в папке
                        return { 
                            element: item, 
                            position: isInTopHalf ? 'before' : 'after',
                            folderId: null
                        };
                    }
                } else if (isHoverFolder) {
                    // Папка на папку
                    const targetFolderId = getFolderId(item);
                    const targetFolder = e621Utils.getFolderById(targetFolderId);
                    
                    if (isInTopHalf) {
                        // Верхняя половина - вставляем перед папкой
                        return { element: item, position: 'before', folderId: null };
                    } else {
                        // Нижняя половина - ищем последний тег целевой папки
                        if (targetFolder.tagsId.length > 0) {
                            let lastTagElement = null;
                            
                            for (let j = 0; j < allItems.length; j++) {
                                const checkItem = allItems[j];
                                if (isTag(checkItem)) {
                                    const checkTagId = getTagId(checkItem);
                                    const checkTag = e621Utils.getTagById(checkTagId);
                                    
                                    if (checkTag.folderId === targetFolderId) {
                                        lastTagElement = checkItem;
                                    }
                                }
                            }
                            
                            if (lastTagElement) {
                                return { element: lastTagElement, position: 'after', folderId: null };
                            }
                        }
                        
                        return { element: item, position: 'after', folderId: null };
                    }
                }
            }
        }
    }
    
    return null;
}

// Завершение перетаскивания
function onDragEnd(e) {
    if (!dragState.draggedItem) return;
    
    const allItems = Array.from(document.querySelectorAll('.tag-item:not(.dragging):not(.hide), .folder-item:not(.dragging)'));
    const dropPosition = findDropPosition(allItems, e.clientY);
    
    let insertBeforeElement = null;
    const targetFolderId = dropPosition.folderId; // В какую папку попадёт тег
    
    if (dropPosition) {
        // Определяем insertBeforeElement по индикатору
        if (dropPosition.position === 'before') {
            insertBeforeElement = dropPosition.element;
        } else if (dropPosition.position === 'after') {
            insertBeforeElement = dropPosition.element.nextElementSibling;
        }
    }
    
    // Вставляем элемент в DOM
    if (insertBeforeElement) {
        tagsContainer.insertBefore(dragState.draggedItem, insertBeforeElement);
    } else {
        tagsContainer.appendChild(dragState.draggedItem);
    }
    
    // Обрабатываем логику папок
    if (dragState.draggedType === 'tag') {
        // Добавляем тег в папку если нужно
        if (targetFolderId) {
            e621Utils.addTagToFolder(dragState.draggedId, targetFolderId);
            
            // Скрываем тег, если папка свёрнута
            const folder = e621Utils.getFolderById(targetFolderId);
            if (folder.collapsed) {
                dragState.draggedItem.classList.add('hide');
            }
        }
        
    } else if (dragState.draggedType === 'folder') {
        // Перемещаем теги папки под неё
        const folder = e621Utils.getFolderById(dragState.draggedId);
        folder.tagsId.forEach(tagId => {
            const tagElement = getTagElement(tagId);
            if (tagElement) {
                tagsContainer.insertBefore(tagElement, dragState.draggedItem.nextSibling);
            }
        });
        
        // Восстанавливаем состояние свёрнутости
        if (folder.collapsed !== dragState.wasFolderCollapsed) {
            toggleCollapseFolder(dragState.draggedId);
        }
    }
    
    saveOrder();
    cleanupDrag();
}

// Очистка после перетаскивания
function cleanupDrag() {
    if (!dragState.draggedItem) return;
    
    // Убираем стили
    dragState.draggedItem.classList.remove('dragging');
    dragState.draggedItem.style.position = '';
    dragState.draggedItem.style.top = '';
    dragState.draggedItem.style.left = '';
    dragState.draggedItem.style.width = '';
    dragState.draggedItem.style.zIndex = '';
    
    // Убираем подсветки
    const allItems = document.querySelectorAll('.tag-item, .folder-item');
    allItems.forEach(item => item.classList.remove('drag-over'));
    
    // Скрываем индикатор
    dropIndicator.style.display = 'none';
    
    // Удаляем обработчики
    document.removeEventListener('mousemove', onDragMove);
    document.removeEventListener('mouseup', onDragEnd);
    
    // Сбрасываем состояние
    dragState = {
        draggedItem: null,
        draggedType: null,
        draggedId: null,
        originalNextSibling: null,
        offsetY: 0,
        wasFolderCollapsed: false
    };
}

async function saveOrder() {
    const elements = [...tagsContainer.children];
    let newItemsList = [];
    let order = 0;
    
    for (let el of elements.reverse()) {
        if (isTag(el)) {
            newItemsList.push({"type": "tag", "id": getTagId(el), "order": order});
        } else {
            newItemsList.push({"type": "folder", "id": getFolderId(el), "order": order});
        }
        
        order++;
    }
    
    e621Utils.updateItems(newItemsList);
}

// ============= Интерфейс =============
function addNewTag() {
    const tag = e621Utils.addTagToData();
    const input = createTagElement(tag);
    input.select();
}

async function addNewFolder() {
    const folderId = e621Utils.getNextFolderId()
    await e621Utils.addFolderToData('', folderId);
    createFolderElement('', folderId, true);
}

function applyTheme(bgColor, secondColor) {
    document.documentElement.style.setProperty('--backgroundСolor', bgColor);
    document.documentElement.style.setProperty('--secondColor', secondColor);
}

// ============= Функции =============
function isTag(el) {
    if (!el) return;
    return el.classList.contains("tag-item");
}

function getTagId(el) {
    return parseInt(el.id.split("-").pop());
}

function getFolderId(el) {
    return el.id.split("-").pop();
}

function tagName(tagId) {
    return e621Utils.getTagById(tagId).name
}

function folderName(folderId) {
    return e621Utils.getFolderById(folderId).name
}

function getTagElement(tagId) {
    return document.getElementById(`tag-item-${tagId}`)
}

function getFolderElement(folderId) {
    return document.getElementById(`folder-item-${folderId}`)
}

// ============= Запуск приложения =============
function showError() {
    try {
        showData();
    } catch (error) { }

    main.style.display = "none";
    settingsMain.style.display = "none";
    settingsButton.style.display = "none";

    const errorSection = document.getElementById('error');
    const resetButton = document.getElementById('error-reset');
    const errorTextarea = document.getElementById('error-textarea');
    const errorCopyButton = document.getElementById('error-copy');
    const errorSaveButton = document.getElementById('error-file');

    errorSection.style.display = "block";

    let tagsString = "";

    const tags = [...e621Utils.getTags()];
    if (typeof tags[0] === 'string') {
        tags.forEach(tagName => {
            tagsString += tagName + "\n";
        });
    } else {
        tags.forEach(tag => {
            tagsString += tag.name + "\n";
        });

    }

    errorTextarea.value += tagsString;
    errorCopyButton.addEventListener('click', () => {
        navigator.clipboard.writeText(tagsString);
    });
    errorSaveButton.addEventListener('click', () => {
        e621Utils.saveFile(tagsString);
    });
    resetButton.addEventListener('click', resetData);
}

function reloadTags() {
    tagsContainer.innerHTML = ''

    const items = e621Utils.getItems().sort((a, b) => a.order - b.order);

    items.forEach(item => {
        if (item.type === "tag") {
            const tag = e621Utils.getTagById(item.id);
            createTagElement(tag);

        } else if (item.type === "folder") {
            const folder = e621Utils.getFolderById(item.id);
            createFolderElement(folder.name.trim(), folder.id);
        }
    });
    
    e621Utils.getFolders().forEach(folder => {
        toggleCollapseFolder(folder.id);
        toggleCollapseFolder(folder.id);
    });
}

async function initializeApp() {
    // загружаем данные из расширения
    await e621Utils.initData();    
    
    if (!e621Utils.appData["version"]) {
        setTimeout(() => {
            showError();
        }, 20);
        return;
    }
    
    reloadTags();

    addButton.addEventListener('click', addNewTag);
    addFolderButton.addEventListener('click', addNewFolder);
    createDropIndicator();
}

initializeApp();
