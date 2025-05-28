document.addEventListener('DOMContentLoaded', () => {
    const addCardBtn = document.getElementById('add-card-btn');
    const pasteCardBtn = document.getElementById('paste-card-btn'); // Get the new button
    const exportCardsBtn = document.getElementById('export-cards-btn'); // Get the export button
    const importCardsInput = document.getElementById('import-cards-input'); // Get the import input
    const toggleDeleteModeBtn = document.getElementById('toggle-delete-mode-btn'); // Get the toggle delete mode button
    const bodyElement = document.body; // Get the body element
    const cardContainer = document.getElementById('card-container');
    const textArea1 = document.getElementById('text-area-1');
    const textArea2 = document.getElementById('text-area-2');
    const copyTextBtn = document.getElementById('copy-text-btn');
    const copyStatusMessage = document.getElementById('copy-status-message'); // Get the new element

    // Modal elements
    const cardInputModal = document.getElementById('card-input-modal');
    const modalTitleElement = document.getElementById('modal-title'); // Renamed for clarity from modalTitle (which is a string var now)
    const modalTitleInput = document.getElementById('modal-title-input');
    const modalContentTextarea = document.getElementById('modal-content-textarea');
    const modalSaveBtn = document.getElementById('modal-save-btn');
    const modalCancelBtn = document.getElementById('modal-cancel-btn');
    const closeModalBtn = document.querySelector('.close-modal-btn');

    let draggedCard = null; // To store the card being dragged
    let editingCard = null; // To store the card's main div element being edited
    let isDeletionModeActive = false; // State variable for deletion mode

    // Function to open the modal
    // Mode can be 'add', 'edit', or 'paste'
    function openModal(mode = 'add', cardElement = null, prefillData = { title: '', content: '' }) {
        editingCard = (mode === 'edit') ? cardElement : null;
        
        let modalTitleText = '';
        let currentTitle = '';
        let currentContent = '';

        if (mode === 'edit' && cardElement) {
            modalTitleText = '修改卡片';
            currentTitle = cardElement.querySelector('.card-title').textContent;
            currentContent = cardElement.querySelector('.card-main-content').textContent;
        } else if (mode === 'paste') {
            modalTitleText = '从剪贴板创建卡片';
            currentTitle = prefillData.title || ''; // Should be empty as per req
            currentContent = prefillData.content || '';
        } else { // 'add' mode
            modalTitleText = '增加卡片';
        }

        modalTitleElement.textContent = modalTitleText;
        modalTitleInput.value = currentTitle;
        modalContentTextarea.value = currentContent;
        
        cardInputModal.style.display = 'flex';
        modalTitleInput.focus(); // Focus on title input first
    }

    // Function to close the modal
    function closeModal() {
        modalTitleInput.value = '';
        modalContentTextarea.value = '';
        editingCard = null;
        cardInputModal.style.display = 'none';
    }

    // Event listeners for modal buttons
    closeModalBtn.addEventListener('click', closeModal);
    modalCancelBtn.addEventListener('click', closeModal);

    modalSaveBtn.addEventListener('click', () => {
        const title = modalTitleInput.value.trim();
        const content = modalContentTextarea.value.trim();

        if (!title) {
            alert('卡片标题不能为空!');
            return;
        }
        // Content can be empty if desired by user

        const cardData = { title, content };

        if (editingCard) {
            // Editing existing card
            editingCard.querySelector('.card-title').textContent = title;
            editingCard.querySelector('.card-main-content').textContent = content;
        } else {
            // Adding new card
            const newCard = createCard(cardData);
            cardContainer.appendChild(newCard);
        }
        saveCardsToLocalStorage();
        closeModal();
    });

    // Close modal if user clicks outside the modal content
    window.addEventListener('click', (event) => {
        if (event.target === cardInputModal) {
            closeModal();
        }
    });

    // Function to create a new card
    function createCard(cardData) { // Expects { title, content }
        const card = document.createElement('div');
        card.classList.add('card');

        const cardTitleDiv = document.createElement('div');
        cardTitleDiv.classList.add('card-title');
        cardTitleDiv.textContent = cardData.title;

        const cardMainContentDiv = document.createElement('div');
        cardMainContentDiv.classList.add('card-main-content');
        cardMainContentDiv.textContent = cardData.content;
        // cardMainContentDiv.style.display = 'none'; // Already handled by CSS

        const cardButtons = document.createElement('div');
        cardButtons.classList.add('card-buttons');

        const editBtn = document.createElement('button');
        editBtn.classList.add('edit-btn');
        editBtn.textContent = '修改';
        editBtn.addEventListener('click', () => {
            if (isDeletionModeActive) return;
            openModal('edit', card); // Pass the whole card element
        });

        const deleteBtn = document.createElement('button');
        deleteBtn.classList.add('delete-btn');
        deleteBtn.textContent = '删除';
        deleteBtn.addEventListener('click', () => {
            if (isDeletionModeActive) return;
            card.remove();
            saveCardsToLocalStorage();
        });

        cardButtons.appendChild(editBtn);
        cardButtons.appendChild(deleteBtn);
        card.appendChild(cardTitleDiv);
        card.appendChild(cardMainContentDiv); // Hidden content
        card.appendChild(cardButtons);

        // Add dragstart event listener to the card
        card.addEventListener('dragstart', (e) => {
            draggedCard = card;
            setTimeout(() => {
                card.classList.add('dragging');
            }, 0);
            // Drag content, not title
            e.dataTransfer.setData('text/plain', cardMainContentDiv.textContent);
        });

        // Add dragend event listener to the card
        card.addEventListener('dragend', () => {
            draggedCard.classList.remove('dragging');
            draggedCard = null;
        });

        // Card click listener for deletion mode
        card.addEventListener('click', (e) => {
            if (isDeletionModeActive) {
                e.stopPropagation();
                card.remove();
                saveCardsToLocalStorage();
            }
        });

        card.setAttribute('draggable', !isDeletionModeActive);
        return card;
    }

    // Event listener for adding a new card
    addCardBtn.addEventListener('click', () => {
        openModal('add');
    });

    // Event listener for pasting a new card from clipboard
    pasteCardBtn.addEventListener('click', async () => {
        try {
            const text = await navigator.clipboard.readText();
            if (text.trim() !== '') {
                openModal('paste', null, { content: text }); // Title will be empty
            } else {
                alert('剪贴板为空或只包含空格。');
            }
        } catch (err) {
            console.error('无法从剪贴板读取文本: ', err);
            alert('无法从剪贴板读取。请检查权限。');
        }
    });

    // Event listener for exporting cards
    exportCardsBtn.addEventListener('click', () => {
        const cards = document.querySelectorAll('#card-container .card');
        if (cards.length === 0) {
            alert('没有卡片可供导出。');
            return;
        }

        const cardObjects = Array.from(cards).map(card => {
            return {
                title: card.querySelector('.card-title').textContent,
                content: card.querySelector('.card-main-content').textContent
            };
        });
        const jsonString = JSON.stringify(cardObjects, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = 'cards.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });

    // Toggle Deletion Mode Button Event Listener
    toggleDeleteModeBtn.addEventListener('click', () => {
        isDeletionModeActive = !isDeletionModeActive;
        toggleDeleteModeBtn.classList.toggle('active', isDeletionModeActive);
        bodyElement.classList.toggle('delete-mode-active', isDeletionModeActive);

        const allCards = document.querySelectorAll('#card-container .card');
        allCards.forEach(c => {
            c.setAttribute('draggable', !isDeletionModeActive);
        });
    });

    // Event listener for importing cards
    importCardsInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (!file) return;

        if (file.type !== 'application/json') {
            alert('文件类型无效。请选择一个 .json 文件。');
            importCardsInput.value = '';
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedData = JSON.parse(e.target.result);
                if (!Array.isArray(importedData) || !importedData.every(item => 
                    typeof item === 'object' && item !== null && 
                    'title' in item && typeof item.title === 'string' &&
                    'content' in item && typeof item.content === 'string'
                )) {
                    throw new Error('JSON 格式无效：需要一个包含 title 和 content 属性的对象数组。');
                }

                importedData.forEach(cardData => {
                    if (cardData.title.trim() !== '' || cardData.content.trim() !== '') { // Allow cards with empty content but not empty title
                        const newCard = createCard(cardData);
                        cardContainer.appendChild(newCard);
                    }
                });
                saveCardsToLocalStorage();
                alert(importedData.length + ' 张卡片已成功导入!');
            } catch (error) {
                console.error('无法导入卡片: ', error);
                alert('无法导入卡片: ' + error.message);
            } finally {
                importCardsInput.value = '';
            }
        };
        reader.onerror = () => {
            console.error('读取文件时出错。');
            alert('读取文件时出错。');
            importCardsInput.value = '';
        };
        reader.readAsText(file);
    });

    // Drag and drop functionality for text areas
    [textArea1, textArea2].forEach(area => {
        area.addEventListener('dragover', (e) => {
            e.preventDefault();
            area.classList.add('drag-over');
        });

        area.addEventListener('dragleave', () => {
            area.classList.remove('drag-over');
        });

        area.addEventListener('drop', (e) => {
            e.preventDefault();
            area.classList.remove('drag-over');
            const cardContent = e.dataTransfer.getData('text/plain'); // Now this is card's main content
            area.value = cardContent; // Replace textarea content
        });
    });

    // Copy text functionality
    copyTextBtn.addEventListener('click', () => {
        let text1 = textArea1.value;
        let text2 = textArea2.value;
        let combinedText;

        if (text2.trim() !== '') {
            // Wrap text2 content if it's not empty or just whitespace
            const wrappedText2 = "```\n" + text2 + "\n```";
            if (text1.trim() !== '') {
                combinedText = text1 + "\n\n" + wrappedText2; // Add an extra newline if text1 also exists
            } else {
                combinedText = wrappedText2;
            }
        } else {
            combinedText = text1; // Only text1 if text2 is empty
        }
        
        copyStatusMessage.textContent = ''; // Clear previous message

        if (combinedText.trim()) {
            navigator.clipboard.writeText(combinedText)
                .then(() => {
                    copyStatusMessage.textContent = '组合文本已复制到剪贴板!';
                    copyStatusMessage.style.color = 'green';
                    setTimeout(() => { copyStatusMessage.textContent = ''; }, 3000);
                })
                .catch(err => {
                    console.error('无法复制文本: ', err);
                    copyStatusMessage.textContent = '复制失败。请重试或检查浏览器权限。';
                    copyStatusMessage.style.color = 'red';
                });
        } else {
            copyStatusMessage.textContent = '没有文本可供复制。';
            copyStatusMessage.style.color = 'orange';
            setTimeout(() => { copyStatusMessage.textContent = ''; }, 3000);
        }
    });

    // Function to save cards to Local Storage
    function saveCardsToLocalStorage() {
        const cards = document.querySelectorAll('#card-container .card');
        const cardObjects = Array.from(cards).map(card => {
            return {
                title: card.querySelector('.card-title').textContent,
                content: card.querySelector('.card-main-content').textContent
            };
        });
        localStorage.setItem('userCards', JSON.stringify(cardObjects));
    }

    // Function to load cards from Local Storage
    function loadCardsFromLocalStorage() {
        const storedCards = localStorage.getItem('userCards');
        if (storedCards) {
            try {
                const cardObjects = JSON.parse(storedCards);
                if (Array.isArray(cardObjects)) { // Basic validation
                    cardObjects.forEach(cardData => {
                        // Additional check for valid structure during load
                        if (typeof cardData === 'object' && cardData !== null && 
                            'title' in cardData && 'content' in cardData) {
                            const newCard = createCard(cardData);
                            cardContainer.appendChild(newCard);
                        } else {
                            console.warn('Skipping invalid card data from localStorage:', cardData);
                        }
                    });
                }
            } catch (error) {
                console.error('Error parsing cards from localStorage:', error);
                // Optionally clear corrupted data: localStorage.removeItem('userCards');
            }
        }
    }

    // Load cards from local storage when the page loads
    loadCardsFromLocalStorage();
});
