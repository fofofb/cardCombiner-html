document.addEventListener('DOMContentLoaded', () => {
    const addCardBtn = document.getElementById('add-card-btn');
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

});
