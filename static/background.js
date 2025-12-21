// ============= Глобальные переменные =============
const tagsContainer = document.querySelector(".tag-list.all-tag-list");
const searchControls = document.querySelector(".search-controls");

function createSidebarTag(tagData) {
    tagCategory = tagData.category;
    tagName = tagData.name;
    tagId = tagData.id;

    if (!tagCategory) tagCategory = "general";

    const newTag = document.createElement("template");
    const currentUrl = window.location.href;

    let incExclLinks = "";
    if (currentUrl != "https://e621.net/posts" && currentUrl != "https://e926.net/posts") {
        incExclLinks = `<a rel="nofollow" href="${currentUrl}+${tagName}" class="tag-list-inc">+</a>
        <a rel="nofollow" href="${currentUrl}+-${tagName}" class="tag-list-exl">–</a>`;
    }
    
    newTag.innerHTML = `
    <li class="tag-list-item tag-${tagCategory}" data-name="${tagName}" data-category="${tagCategory}">
        <a class="tag-list-wiki" rel="nofollow"
        href="https://e621.net/wiki_pages/show_or_new?title=${tagName}">?</a>

        ${incExclLinks}

        <a rel="nofollow" class="tag-list-search" href="https://e621.net/posts?tags=${tagName}">
            <span class="tag-list-name">
                ${tagName}
            </span>
        </a>

        <span class="tag-list-actions">
            <button class="tag-list-quick-blacklist quick-delete" title="Delete ${tagName} from your list" data-tag="${tagName}">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3 6H5H21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M10 11V17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M14 11V17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            </button>
        </span>
    </li>
    `

    deleteButton = newTag.content.querySelector(".quick-delete");
        deleteButton.addEventListener("click", (e) => {
        const li = e.currentTarget.closest("li");

        li.remove();

        e621Utils.removeTagFromData(tagId);
    });

    tagsContainer.prepend(newTag.content.firstElementChild);
}

function addStButton() {
    const button = document.createElement("button");
    button.innerHTML = `
        <button id="search-savedtags" class="st-button" title="Saved tags">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 -1 24 24" fill="none"
                stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
                <line x1="7" y1="7" x2="7.01" y2="7"></line>
            </svg>
        </button>
    `

    button.addEventListener("click", () => {
        const tagName = prompt("Enter tag name:");
        if (tagName) {
            createSidebarTag(tagName);
        }
    });
    searchControls.prepend(button);
}

function applySettings() {
    const settings = e621Utils.getSettings();

    if (settings["hide_original_tags"]) {
        tagsContainer.innerHTML = "";
    }
}

async function Init() {
    await e621Utils.initData()
    settings = await e621Utils.getSettings()

    addStButton();
    applySettings();

    if (settings["tags_in_e621"]) {
        items = await e621Utils.getItems().sort((a, b) => a.order - b.order);

        items.forEach(item => {
            if (item.type === "tag")
                createSidebarTag(e621Utils.getTagById(item.id));
            else {
                const space = document.createElement("li");
                space.className = "space";
                space.style.height = "10px";
                tagsContainer.prepend(space);
            }
        });

        const firstChild = tagsContainer.children[0];
        if (firstChild.classList.contains('space')) {
            firstChild.remove();
        }
    }
}

Init();
