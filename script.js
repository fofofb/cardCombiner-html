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
    let selectedCardElement = null; // For card selection

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

        const duplicateBtn = document.createElement('button');
        duplicateBtn.classList.add('duplicate-btn');
        duplicateBtn.textContent = '复制';

        duplicateBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (isDeletionModeActive) return;

            const originalTitle = cardData.title;
            const originalContent = cardData.content;
            const newTitle = `${originalTitle} (复制)`;

            const newCardData = { title: newTitle, content: originalContent };
            const duplicatedCardElement = createCard(newCardData);
            cardContainer.appendChild(duplicatedCardElement);
            // It's good practice to insert the duplicated card next to the original,
            // but for simplicity, appending to the end is acceptable as per initial plan.
            // If inserting next to original: card.insertAdjacentElement('afterend', duplicatedCardElement);


            saveCardsToLocalStorage();
        });

        cardButtons.appendChild(editBtn);
        cardButtons.appendChild(deleteBtn);
        cardButtons.appendChild(duplicateBtn); // Add the duplicate button
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

        // Card click listener for deletion mode AND selection
        card.addEventListener('click', function(event) { // Use 'function' for 'this'
            if (isDeletionModeActive) {
                // Deletion mode logic (already here)
                event.stopPropagation(); // Keep this if it's preventing other issues
                this.remove(); // 'this' is the card
                saveCardsToLocalStorage();
                // If the deleted card was selected, clear selection
                if (selectedCardElement === this) {
                    selectedCardElement = null;
                }
                return; // Stop further processing for deletion
            }

            // Card selection logic (new)
            // Don't trigger selection if a button on the card was clicked
            if (event.target.closest('.card-buttons')) {
                return;
            }

            if (selectedCardElement === this) {
                // Already selected, deselect it
                this.classList.remove('selected');
                selectedCardElement = null;
            } else {
                // Deselect previously selected card if any
                if (selectedCardElement) {
                    selectedCardElement.classList.remove('selected');
                }
                // Select the new card
                this.classList.add('selected');
                selectedCardElement = this;
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
            const pastedText = await navigator.clipboard.readText();
            if (pastedText.trim() !== '') {
                // Generate timestamp title
                const now = new Date();
                const year = now.getFullYear();
                const month = String(now.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
                const day = String(now.getDate()).padStart(2, '0');
                const hours = String(now.getHours()).padStart(2, '0');
                const minutes = String(now.getMinutes()).padStart(2, '0');
                const seconds = String(now.getSeconds()).padStart(2, '0');
                const generatedTitle = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;

                const newCardData = { title: generatedTitle, content: pastedText };
                const newCardElement = createCard(newCardData);
                cardContainer.appendChild(newCardElement);
                saveCardsToLocalStorage();

                // Optional: Provide feedback via copyStatusMessage
                if (copyStatusMessage) { // Check if copyStatusMessage is defined
                     copyStatusMessage.textContent = '卡片已通过剪贴板内容创建，标题为时间戳。';
                     copyStatusMessage.style.color = 'green';
                     setTimeout(() => { copyStatusMessage.textContent = ''; }, 3000);
                }

            } else {
                if (copyStatusMessage) {
                    copyStatusMessage.textContent = '剪贴板为空或只包含空格。';
                    copyStatusMessage.style.color = 'orange';
                    setTimeout(() => { copyStatusMessage.textContent = ''; }, 3000);
                } else {
                    alert('剪贴板为空或只包含空格。');
                }
            }
        } catch (err) {
            console.error('无法从剪贴板读取文本: ', err);
            if (copyStatusMessage) {
                copyStatusMessage.textContent = '无法从剪贴板读取。请检查权限。';
                copyStatusMessage.style.color = 'red';
                setTimeout(() => { copyStatusMessage.textContent = ''; }, 3000);
            } else {
                alert('无法从剪贴板读取。请检查权限。');
            }
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

    // --- Start of Advanced Copy Functionality ---

    async function performAdvancedCopy() {
        if (!selectedCardElement) return;

        const cardContentElement = selectedCardElement.querySelector('.card-main-content');

        if (!cardContentElement) {
            console.error('Selected card has no content element.');
            return;
        }

        const textForArea1 = cardContentElement.textContent;

        try {
            const textFromClipboard = await navigator.clipboard.readText();

            textArea1.value = textForArea1;
            textArea2.value = textFromClipboard;

            let combinedText;
            // Ensure textFromClipboard is not empty before wrapping, to avoid "```\n\n```"
            const wrappedTextForArea2 = textFromClipboard.trim() !== '' ? "```\n" + textFromClipboard + "\n```" : "";

            if (textForArea1.trim() !== '' && wrappedTextForArea2 !== '') {
                combinedText = textForArea1 + "\n\n" + wrappedTextForArea2;
            } else if (wrappedTextForArea2 !== '') {
                combinedText = wrappedTextForArea2;
            } else {
                combinedText = textForArea1;
            }

            await navigator.clipboard.writeText(combinedText);

            if (copyStatusMessage) {
                copyStatusMessage.textContent = '已将选中卡片与剪贴板内容组合并复制!';
                copyStatusMessage.style.color = 'green';
                setTimeout(() => { copyStatusMessage.textContent = ''; }, 3000);
            }
        } catch (err) {
            console.error('Advanced copy failed: ', err);
            if (copyStatusMessage) {
                // Handle cases where clipboard might be empty or permission denied for read
                let errorMsg = '高级复制失败: ';
                if (err.name === 'NotFoundError' || (err.message && err.message.includes("clipboard is empty"))) {
                    // If clipboard is empty, proceed to copy only card content to textArea1 and then to clipboard
                    textArea1.value = textForArea1;
                    textArea2.value = ''; // Clear textArea2
                    try {
                        await navigator.clipboard.writeText(textForArea1);
                        copyStatusMessage.textContent = '剪贴板为空，已复制选中卡片内容!';
                        copyStatusMessage.style.color = 'green';
                    } catch (writeErr) {
                        console.error('Failed to write card content to clipboard: ', writeErr);
                        copyStatusMessage.textContent = '复制卡片内容失败。';
                        copyStatusMessage.style.color = 'red';
                    }
                } else if (err.name === 'NotAllowedError' || err.name === 'SecurityError') {
                     errorMsg += '读取剪贴板权限被拒绝。';
                     copyStatusMessage.textContent = errorMsg;
                     copyStatusMessage.style.color = 'red';
                } else {
                    errorMsg += err.message;
                    copyStatusMessage.textContent = errorMsg;
                    copyStatusMessage.style.color = 'red';
                }
                setTimeout(() => { copyStatusMessage.textContent = ''; }, 5000);
            }
        }
    }

    // Modified copyTextBtn Event Listener
    copyTextBtn.addEventListener('click', () => {
        if (selectedCardElement) {
            performAdvancedCopy();
        } else {
            // Existing logic for copying from textArea1 and textArea2 directly
            let text1 = textArea1.value;
            let text2 = textArea2.value;
            let combinedTextToCopy;

            if (text2.trim() !== '') {
                const wrappedText2 = "```\n" + text2 + "\n```";
                if (text1.trim() !== '') {
                    combinedTextToCopy = text1 + "\n\n" + wrappedText2;
                } else {
                    combinedTextToCopy = wrappedText2;
                }
            } else {
                combinedTextToCopy = text1;
            }

            if (copyStatusMessage) copyStatusMessage.textContent = '';

            if (combinedTextToCopy.trim()) {
                navigator.clipboard.writeText(combinedTextToCopy)
                    .then(() => {
                        if (copyStatusMessage) {
                            copyStatusMessage.textContent = '组合文本已复制到剪贴板!';
                            copyStatusMessage.style.color = 'green';
                            setTimeout(() => { copyStatusMessage.textContent = ''; }, 3000);
                        }
                    })
                    .catch(err => {
                        console.error('无法复制文本: ', err);
                        if (copyStatusMessage) {
                            copyStatusMessage.textContent = '复制失败。请重试或检查浏览器权限。';
                            copyStatusMessage.style.color = 'red';
                        }
                    });
            } else {
                if (copyStatusMessage) {
                    copyStatusMessage.textContent = '没有文本可供复制。';
                    copyStatusMessage.style.color = 'orange';
                    setTimeout(() => { copyStatusMessage.textContent = ''; }, 3000);
                }
            }
        }
    });

    // --- End of Advanced Copy Functionality ---

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

    // Global paste event listener for Ctrl+V to create card
    document.addEventListener('paste', async (event) => {
        const activeElement = document.activeElement;
        const isInputFocused = activeElement && (
            activeElement.tagName === 'INPUT' ||
            activeElement.tagName === 'TEXTAREA' ||
            activeElement.id === 'modal-title-input' ||
            activeElement.id === 'modal-content-textarea'
        );

        if (isInputFocused) {
            // If an input/textarea is focused, let the default paste behavior occur
            return;
        }

        // If not in an input field, proceed to create a card from pasted content
        event.preventDefault(); // Prevent default paste behavior elsewhere

        try {
            const pastedText = event.clipboardData.getData('text/plain');

            if (pastedText.trim() !== '') {
                // Generate timestamp title
                const now = new Date();
                const year = now.getFullYear();
                const month = String(now.getMonth() + 1).padStart(2, '0');
                const day = String(now.getDate()).padStart(2, '0');
                const hours = String(now.getHours()).padStart(2, '0');
                const minutes = String(now.getMinutes()).padStart(2, '0');
                const seconds = String(now.getSeconds()).padStart(2, '0');
                const generatedTitle = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;

                const newCardData = { title: generatedTitle, content: pastedText };
                const newCardElement = createCard(newCardData);
                cardContainer.appendChild(newCardElement);
                saveCardsToLocalStorage();

                if (copyStatusMessage) {
                    copyStatusMessage.textContent = '卡片已通过 Ctrl+V 创建，标题为时间戳。';
                    copyStatusMessage.style.color = 'green';
                    setTimeout(() => { copyStatusMessage.textContent = ''; }, 3000);
                }
            } else {
                if (copyStatusMessage) {
                    copyStatusMessage.textContent = '剪贴板为空或只包含空格。';
                    copyStatusMessage.style.color = 'orange';
                    setTimeout(() => { copyStatusMessage.textContent = ''; }, 3000);
                }
            }
        } catch (err) {
            console.error('无法从剪贴板读取 (Ctrl+V): ', err);
            if (copyStatusMessage) {
                copyStatusMessage.textContent = '无法从剪贴板读取内容。';
                copyStatusMessage.style.color = 'red';
                setTimeout(() => { copyStatusMessage.textContent = ''; }, 3000);
            }
        }
    });

    // Global Ctrl+C handler for advanced copy
    document.addEventListener('keydown', (event) => {
        if (event.ctrlKey && event.key === 'c') {
            const activeElement = document.activeElement;
            const isInputFocused = activeElement && (
                activeElement.tagName === 'INPUT' ||
                activeElement.tagName === 'TEXTAREA' ||
                activeElement.id === 'modal-title-input' ||
                activeElement.id === 'modal-content-textarea'
            );

            if (selectedCardElement && !isInputFocused) {
                event.preventDefault(); // Prevent default copy action
                performAdvancedCopy();
            }
            // If an input is focused, or no card is selected, allow default Ctrl+C behavior.
        }
    });
});
