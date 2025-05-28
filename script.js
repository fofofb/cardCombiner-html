document.addEventListener('DOMContentLoaded', () => {
    const addCardBtn = document.getElementById('add-card-btn');
    const cardContainer = document.getElementById('card-container');
    const textArea1 = document.getElementById('text-area-1');
    const textArea2 = document.getElementById('text-area-2');
    const copyTextBtn = document.getElementById('copy-text-btn');

    let draggedCard = null; // To store the card being dragged

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
            const newText = prompt('输入新的卡片文本:', cardContent.textContent);
            if (newText !== null && newText.trim() !== '') {
                cardContent.textContent = newText;
            }
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
        const cardText = prompt('输入卡片文本:');
        if (cardText !== null && cardText.trim() !== '') {
            const newCard = createCard(cardText);
            cardContainer.appendChild(newCard);
        }
    });

    // Placeholder for drag and drop on text areas - will be detailed in next step
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
            // Append text, or replace, or insert at cursor - for now, append
            area.value += (area.value ? ' ' : '') + cardText;
        });
    });

    // Placeholder for copy text functionality - will be detailed in next step
    copyTextBtn.addEventListener('click', () => {
        const combinedText = textArea1.value + '\n' + textArea2.value; // Combine text with a newline
        if (combinedText.trim()) {
            navigator.clipboard.writeText(combinedText)
                .then(() => {
                    alert('组合文本已复制到剪贴板!');
                })
                .catch(err => {
                    console.error('无法复制文本: ', err);
                    alert('复制失败，请查看控制台获取更多信息。');
                });
        } else {
            alert('没有文本可供复制。');
        }
    });

});
