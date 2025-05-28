document.addEventListener('DOMContentLoaded', () => {
    const addCardBtn = document.getElementById('add-card-btn');
    const pasteCardBtn = document.getElementById('paste-card-btn'); // Get the new button
    const exportCardsBtn = document.getElementById('export-cards-btn'); // Get the export button
    const importCardsInput = document.getElementById('import-cards-input'); // Get the import input
    const cardContainer = document.getElementById('card-container');
    const textArea1 = document.getElementById('text-area-1');
    const textArea2 = document.getElementById('text-area-2');
    const copyTextBtn = document.getElementById('copy-text-btn');
    const copyStatusMessage = document.getElementById('copy-status-message'); // Get the new element

    // Modal elements
    const cardInputModal = document.getElementById('card-input-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalTextarea = document.getElementById('modal-textarea');
    const modalSaveBtn = document.getElementById('modal-save-btn');
    const modalCancelBtn = document.getElementById('modal-cancel-btn');
    const closeModalBtn = document.querySelector('.close-modal-btn');

    let draggedCard = null; // To store the card being dragged
    let editingCardContent = null; // To store the card's content div being edited

    // Function to open the modal
    function openModal(isEditing = false, cardContentDiv = null, currentText = '') {
        editingCardContent = isEditing ? cardContentDiv : null;
        modalTitle.textContent = isEditing ? '修改卡片' : '增加卡片';
        modalTextarea.value = currentText;
        cardInputModal.style.display = 'flex'; // Use flex to align center as per CSS
        modalTextarea.focus();
    }

    // Function to close the modal
    function closeModal() {
        modalTextarea.value = '';
        editingCardContent = null;
        cardInputModal.style.display = 'none';
    }

    // Event listeners for modal buttons
    closeModalBtn.addEventListener('click', closeModal);
    modalCancelBtn.addEventListener('click', closeModal);

    modalSaveBtn.addEventListener('click', () => {
        const text = modalTextarea.value.trim();
        if (text) {
            if (editingCardContent) {
                // Editing existing card
                editingCardContent.textContent = text;
            } else {
                // Adding new card
                const newCard = createCard(text);
                cardContainer.appendChild(newCard);
            }
            saveCardsToLocalStorage(); // Save after adding/editing
            closeModal();
        } else {
            alert('卡片文本不能为空!');
        }
    });

    // Close modal if user clicks outside the modal content
    window.addEventListener('click', (event) => {
        if (event.target === cardInputModal) {
            closeModal();
        }
    });

    // Function to create a new card
    function createCard(text) {
        const card = document.createElement('div');
        card.classList.add('card');
        card.setAttribute('draggable', true); // Make the card draggable

        const cardContent = document.createElement('div');
        cardContent.classList.add('card-content');
        cardContent.textContent = text;

        const cardButtons = document.createElement('div');
        cardButtons.classList.add('card-buttons');

        const editBtn = document.createElement('button');
        editBtn.classList.add('edit-btn');
        editBtn.textContent = '修改';
        editBtn.addEventListener('click', () => {
            openModal(true, cardContent, cardContent.textContent);
        });

        const deleteBtn = document.createElement('button');
        deleteBtn.classList.add('delete-btn');
        deleteBtn.textContent = '删除';
        deleteBtn.addEventListener('click', () => {
            card.remove();
            saveCardsToLocalStorage(); // Save after deleting
        });

        cardButtons.appendChild(editBtn);
        cardButtons.appendChild(deleteBtn);
        card.appendChild(cardContent);
        card.appendChild(cardButtons);

        // Add dragstart event listener to the card
        card.addEventListener('dragstart', (e) => {
            draggedCard = card;
            setTimeout(() => {
                card.classList.add('dragging'); // Style when dragging
            }, 0);
            // Set data to be transferred (e.g., the card's text)
            e.dataTransfer.setData('text/plain', cardContent.textContent);
        });

        // Add dragend event listener to the card
        card.addEventListener('dragend', () => {
            draggedCard.classList.remove('dragging');
            draggedCard = null;
        });

        return card;
    }

    // Event listener for adding a new card
    addCardBtn.addEventListener('click', () => {
        openModal(); // Open modal for new card
    });

    // Event listener for pasting a new card from clipboard
    pasteCardBtn.addEventListener('click', async () => {
        try {
            const text = await navigator.clipboard.readText();
            if (text.trim() !== '') {
                const newCard = createCard(text);
                cardContainer.appendChild(newCard);
                saveCardsToLocalStorage(); // Save after adding card
                // Optionally, provide feedback to the user via copyStatusMessage
                // copyStatusMessage.textContent = '卡片已通过剪贴板内容创建!';
                // copyStatusMessage.style.color = 'green';
                // setTimeout(() => { copyStatusMessage.textContent = ''; }, 3000);
            } else {
                // Handle empty clipboard text
                // copyStatusMessage.textContent = '剪贴板为空或只包含空格。';
                // copyStatusMessage.style.color = 'orange';
                // setTimeout(() => { copyStatusMessage.textContent = ''; }, 3000);
                alert('剪贴板为空或只包含空格。'); // Using alert for now
            }
        } catch (err) {
            console.error('无法从剪贴板读取文本: ', err);
            // Handle errors, e.g., permission denied
            // copyStatusMessage.textContent = '无法从剪贴板读取。请检查权限。';
            // copyStatusMessage.style.color = 'red';
            // setTimeout(() => { copyStatusMessage.textContent = ''; }, 3000);
            alert('无法从剪贴板读取。请检查权限。'); // Using alert for now
        }
    });

    // Event listener for exporting cards
    exportCardsBtn.addEventListener('click', () => {
        const cards = document.querySelectorAll('#card-container .card .card-content');
        if (cards.length === 0) {
            // copyStatusMessage.textContent = '没有卡片可供导出。';
            // copyStatusMessage.style.color = 'orange';
            // setTimeout(() => { copyStatusMessage.textContent = ''; }, 3000);
            alert('没有卡片可供导出。'); // Placeholder, can use inline message
            return;
        }

        const cardTexts = Array.from(cards).map(card => card.textContent);
        const jsonString = JSON.stringify(cardTexts, null, 2); // null, 2 for pretty print
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = 'cards.json'; // Filename for the download
        document.body.appendChild(a); // Append to body to make it clickable
        a.click(); // Trigger download
        document.body.removeChild(a); // Clean up
        URL.revokeObjectURL(url); // Release object URL

        // Optionally, provide feedback
        // copyStatusMessage.textContent = '卡片已导出!';
        // copyStatusMessage.style.color = 'green';
        // setTimeout(() => { copyStatusMessage.textContent = ''; }, 3000);
    });

    // Event listener for importing cards
    importCardsInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (!file) {
            return; // No file selected
        }

        if (file.type !== 'application/json') {
            // copyStatusMessage.textContent = '文件类型无效。请选择一个 .json 文件。';
            // copyStatusMessage.style.color = 'red';
            // setTimeout(() => { copyStatusMessage.textContent = ''; }, 3000);
            alert('文件类型无效。请选择一个 .json 文件。');
            importCardsInput.value = ''; // Reset file input
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const cardTexts = JSON.parse(e.target.result);
                if (!Array.isArray(cardTexts) || !cardTexts.every(item => typeof item === 'string')) {
                    throw new Error('JSON 格式无效：需要一个字符串数组。');
                }

                cardTexts.forEach(text => {
                    if (text.trim() !== '') { // Avoid creating empty cards if somehow in JSON
                        const newCard = createCard(text);
                        cardContainer.appendChild(newCard);
                    }
                });
                saveCardsToLocalStorage(); // Save all cards (including new imported ones)

                // copyStatusMessage.textContent = '卡片已成功导入!';
                // copyStatusMessage.style.color = 'green';
                // setTimeout(() => { copyStatusMessage.textContent = ''; }, 3000);
                alert(cardTexts.length + ' 张卡片已成功导入!');
            } catch (error) {
                console.error('无法导入卡片: ', error);
                // copyStatusMessage.textContent = '无法导入卡片: ' + error.message;
                // copyStatusMessage.style.color = 'red';
                // setTimeout(() => { copyStatusMessage.textContent = ''; }, 5000);
                alert('无法导入卡片: ' + error.message);
            } finally {
                importCardsInput.value = ''; // Reset file input regardless of success/failure
            }
        };
        reader.onerror = () => {
            console.error('读取文件时出错。');
            // copyStatusMessage.textContent = '读取文件时出错。';
            // copyStatusMessage.style.color = 'red';
            // setTimeout(() => { copyStatusMessage.textContent = ''; }, 3000);
            alert('读取文件时出错。');
            importCardsInput.value = ''; // Reset file input
        };
        reader.readAsText(file);
    });

    // Drag and drop functionality for text areas
    [textArea1, textArea2].forEach(area => {
        area.addEventListener('dragover', (e) => {
            e.preventDefault(); // Necessary to allow dropping
            area.classList.add('drag-over'); // Visual feedback
        });

        area.addEventListener('dragleave', () => {
            area.classList.remove('drag-over'); // Remove visual feedback
        });

        area.addEventListener('drop', (e) => {
            e.preventDefault();
            area.classList.remove('drag-over');
            const cardText = e.dataTransfer.getData('text/plain');
            // Clear existing content and set it to cardText
            area.value = cardText;
        });
    });

    // Copy text functionality
    copyTextBtn.addEventListener('click', () => {
        const combinedText = textArea1.value + '\n' + textArea2.value; // Combine text with a newline
        copyStatusMessage.textContent = ''; // Clear previous message

        if (combinedText.trim()) {
            navigator.clipboard.writeText(combinedText)
                .then(() => {
                    copyStatusMessage.textContent = '组合文本已复制到剪贴板!';
                    copyStatusMessage.style.color = 'green';
                    setTimeout(() => { copyStatusMessage.textContent = ''; }, 3000); // Clear after 3 seconds
                })
                .catch(err => {
                    console.error('无法复制文本: ', err);
                    copyStatusMessage.textContent = '复制失败。请重试或检查浏览器权限。';
                    copyStatusMessage.style.color = 'red';
                });
        } else {
            copyStatusMessage.textContent = '没有文本可供复制。';
            copyStatusMessage.style.color = 'orange';
            setTimeout(() => { copyStatusMessage.textContent = ''; }, 3000); // Clear after 3 seconds
        }
    });

    // Function to save cards to Local Storage
    function saveCardsToLocalStorage() {
        const cards = document.querySelectorAll('#card-container .card .card-content');
        const cardTexts = Array.from(cards).map(card => card.textContent);
        localStorage.setItem('userCards', JSON.stringify(cardTexts));
    }

    // Function to load cards from Local Storage
    function loadCardsFromLocalStorage() {
        const storedCards = localStorage.getItem('userCards');
        if (storedCards) {
            const cardTexts = JSON.parse(storedCards);
            cardTexts.forEach(text => {
                const newCard = createCard(text);
                cardContainer.appendChild(newCard);
            });
        }
    }

    // Load cards from local storage when the page loads
    loadCardsFromLocalStorage();
});
