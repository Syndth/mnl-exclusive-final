// js/itemCards.js

document.addEventListener('DOMContentLoaded', () => {
    const itemCards = document.querySelectorAll('.itemcard');
    const cartQuantityIndicator = document.querySelector('.cart-quantity-indicator'); // Added this

    // Function to update the cart quantity in the header
    const updateHeaderCartQuantity = () => {
        let cartItems = JSON.parse(localStorage.getItem('cartItems')) || [];
        let totalQuantity = 0;
        cartItems.forEach(item => {
            totalQuantity += item.quantity;
        });
        if (cartQuantityIndicator) {
            cartQuantityIndicator.textContent = totalQuantity;
            // Optionally, show/hide the indicator if quantity is 0
            if (totalQuantity > 0) {
                cartQuantityIndicator.style.display = 'inline-block';
            } else {
                cartQuantityIndicator.style.display = 'none';
            }
        }
    };

    itemCards.forEach(card => {
        const selectedColorDisplay = card.querySelector('.selected-color-display');
        const colorOptions = card.querySelectorAll('.color-options .color');
        const selectedSizeDisplay = card.querySelector('.selected-size-display');
        const sizeOptions = card.querySelectorAll('.size-option .size');
        const itemQtyDisplay = card.querySelector('.item-qty');
        const qtyMinusBtn = card.querySelector('.qty-minus');
        const qtyPlusBtn = card.querySelector('.qty-plus');
        const addToCartBtn = card.querySelector('.add-to-cart-btn');

        let selectedColor = '';
        let selectedSize = '';
        let quantity = 0;

        const updateCardButtonState = () => {
            if (selectedColor !== '' && selectedSize !== '' && quantity > 0) {
                addToCartBtn.removeAttribute('disabled');
            } else {
                addToCartBtn.setAttribute('disabled', 'disabled');
            }
        };

        colorOptions.forEach(colorDiv => {
            colorDiv.addEventListener('click', () => {
                colorOptions.forEach(c => c.classList.remove('selected'));
                colorDiv.classList.add('selected');
                selectedColor = colorDiv.dataset.color;
                selectedColorDisplay.textContent = selectedColor;
                updateCardButtonState();
            });
        });

        sizeOptions.forEach(sizeBtn => {
            sizeBtn.addEventListener('click', () => {
                sizeOptions.forEach(s => s.classList.remove('selected'));
                sizeBtn.classList.add('selected');
                selectedSize = sizeBtn.textContent;
                selectedSizeDisplay.textContent = selectedSize;
                updateCardButtonState();
            });
        });

        qtyMinusBtn.addEventListener('click', () => {
            if (quantity > 0) {
                quantity--;
                itemQtyDisplay.textContent = quantity;
                if (quantity === 0) {
                    qtyMinusBtn.setAttribute('disabled', 'disabled');
                }
                updateCardButtonState();
            }
        });

        qtyPlusBtn.addEventListener('click', () => {
            quantity++;
            itemQtyDisplay.textContent = quantity;
            if (quantity > 0) {
                qtyMinusBtn.removeAttribute('disabled');
            }
            updateCardButtonState();
        });

        addToCartBtn.addEventListener('click', () => {
            const itemId = card.dataset.itemId;
            const itemName = card.querySelector('h5').textContent;
            const price = parseFloat(card.querySelector('.item-price').textContent);
            const imageUrl = card.querySelector('.item-image').src;

            const itemToAdd = {
                id: itemId,
                name: itemName,
                color: selectedColor,
                size: selectedSize,
                quantity: quantity,
                price: price,
                imageUrl: imageUrl
            };

            let cartItems = JSON.parse(localStorage.getItem('cartItems')) || [];
            
            // Check if item (with same ID, color, and size) already exists in cart
            const existingItemIndex = cartItems.findIndex(
                item => item.id === itemToAdd.id && 
                        item.color === itemToAdd.color && 
                        item.size === itemToAdd.size
            );

            if (existingItemIndex > -1) {
                // If exists, update quantity
                cartItems[existingItemIndex].quantity += itemToAdd.quantity;
            } else {
                // If not, add new item
                cartItems.push(itemToAdd);
            }

            localStorage.setItem('cartItems', JSON.stringify(cartItems));

            alert(`${itemToAdd.quantity}x ${itemName} (${selectedColor}, ${selectedSize}) added to cart!`);
            
            // Update the header cart quantity after adding item
            updateHeaderCartQuantity();

            // Optional: Reset the current item card selection after adding to cart
            selectedColor = '';
            selectedSize = '';
            quantity = 0;
            selectedColorDisplay.textContent = '';
            selectedSizeDisplay.textContent = '';
            itemQtyDisplay.textContent = '0';
            colorOptions.forEach(c => c.classList.remove('selected'));
            sizeOptions.forEach(s => s.classList.remove('selected'));
            qtyMinusBtn.setAttribute('disabled', 'disabled');
            addToCartBtn.setAttribute('disabled', 'disabled');
        });
        
        updateCardButtonState();
    });

    // Initial update of cart quantity on page load
    updateHeaderCartQuantity();
});