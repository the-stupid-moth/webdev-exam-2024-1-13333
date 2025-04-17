
const cartGrid = document.getElementById('cart-grid');
const emptyCartMessage = document.getElementById('empty-cart');
const orderForm = document.getElementById('order-form');
const totalPriceElement = document.getElementById('total-price');
const deliveryPriceElement = document.getElementById('delivery-price');
const notifications = document.getElementById('notifications');

let myWishes = JSON.parse(localStorage.getItem('myWishes')) || [];
let cartItems = [];
let deliveryPrice = 200; 

// Отображение уведомлений
function showNotification(message, type = 'success') {
    if (!notifications) {
        console.error("Элемент для уведомлений не найден!");
        return;
    }

    notifications.textContent = message;

  
    notifications.classList.remove('success', 'error');


    notifications.classList.add(type);

    notifications.classList.add('show');


    setTimeout(() => {
        notifications.classList.remove('show');
    }, 3000);
}

//Расчёт стоимости доставки
function calculateDeliveryPrice() {
    const dateInput = document.querySelector('input[name="delivery_date"]').value;
    const interval = document.querySelector('select[name="delivery_interval"]').value;
    const selectedDate = new Date(dateInput);

    if (!dateInput) return deliveryPrice; // Если дата не выбрана, используем базовую стоимость

    const isWeekend = selectedDate.getDay() === 0 || selectedDate.getDay() === 6; // Воскресенье или суббота
    deliveryPrice = 200; // Сброс базовой стоимости

    if (isWeekend) {
        deliveryPrice += 300; // Выходные дни
    } else if (interval === '18:00-22:00') {
        deliveryPrice += 200; // Вечерние часы в будние дни
    } 

    return deliveryPrice;
}

// Загрузка товаров в корзину
async function loadTheBooty() {
    if (!myWishes.length) {
        showNotification("Корзина пуста.", "error");
        return;
    }

    const requests = myWishes.map(productId => {
        const API_URL = `https://edu.std-900.ist.mospolytech.ru/exam-2024-1/api/goods/${productId}?api_key=ea0cb7c7-758b-482c-a02f-5f6c15ccbab5`;
        return fetch(API_URL).then(response => response.json());
    });

    try {
        const results = await Promise.all(requests);
        cartItems = results;
        showNotification("Товары успешно загружены в корзину.", "success");
    } catch (error) {
        console.error("Ошибка загрузки товаров:", error);
        showNotification("Ошибка загрузки данных. Попробуйте снова.", "error");
    }
}

// Обновление корзины
function updateCart() {
    cartGrid.innerHTML = '';

    if (cartItems.length === 0) {
        emptyCartMessage.classList.remove('hidden');
        return;
    }

    emptyCartMessage.classList.add('hidden');

    cartItems.forEach(item => {
        const finalPrice = item.discount_price || item.actual_price;
        const discountHtml = item.discount_price
            ? `<span class="product-discount">-${Math.floor(100 - (item.discount_price / item.actual_price) * 100)}%</span>`
            : "";

        const productCard = document.createElement('div');
        productCard.className = 'product-card';

        productCard.innerHTML = `
            <img src="${item.image_url}" alt="${item.name}" class="product-image">
            <h2 class="product-name">${item.name}</h2>
            <div class="product-rating">
                <span class="rating-value">${item.rating.toFixed(1)}</span>
                <span class="stars">${'★'.repeat(Math.floor(item.rating)) + '☆'.repeat(5 - Math.floor(item.rating))}</span>
            </div>
            <div class="product-prices">
                <span class="product-price">${finalPrice} ₽</span>
                ${item.discount_price ? `<span class="product-old-price">${item.actual_price} ₽</span>` : ""}
                ${discountHtml}
            </div>
            <button class="remove-button" data-id="${item.id}">Удалить</button>
        `;

        cartGrid.appendChild(productCard);
    });

    updateTotalPrice();
}

// Обновление итоговой стоимости
function updateTotalPrice() {
    const itemsTotalPrice = cartItems.reduce((sum, item) => {
        return sum + (item.discount_price || item.actual_price);
    }, 0);

    const deliveryCost = calculateDeliveryPrice();

    deliveryPriceElement.textContent = `${deliveryCost.toFixed(2)} `;
    totalPriceElement.textContent = `${(itemsTotalPrice + deliveryCost).toFixed(2)} `;
}

// Обработчик для удаления товара
cartGrid.addEventListener('click', (event) => {
    if (event.target.classList.contains('remove-button')) {
        const id = parseInt(event.target.dataset.id, 10);
        cartItems = cartItems.filter(item => item.id !== id);
        myWishes = myWishes.filter(wishId => parseInt(wishId, 10) !== id);
        localStorage.setItem('myWishes', JSON.stringify(myWishes));
        showNotification("Товар удален из корзины.", "success");
        updateCart();
    }
});

// Обработчик для изменений в форме
orderForm.addEventListener('input', updateTotalPrice);

// Отправка данных формы
async function sendFormData(formData) {
    const API_URL = `https://edu.std-900.ist.mospolytech.ru/exam-2024-1/api/orders?api_key=ea0cb7c7-758b-482c-a02f-5f6c15ccbab5`;

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            body: formData
        });

        if (response.ok) {
            showNotification("Заказ успешно оформлен!", "success");
            setTimeout(() => {
                window.location.href = "index.html"; // Переход на главную страницу
            }, 2000);
        } else {
            showNotification("Ошибка при оформлении заказа. Попробуйте снова.", "error");
        }
    } catch (error) {
        console.error("Ошибка сети:", error);
        showNotification("Ошибка сети. Проверьте подключение и попробуйте снова.", "error");
    }
}

// Обработчик для отправки формы
orderForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const formData = new FormData(orderForm);
    const dateInput = document.querySelector('input[name="delivery_date"]').value;
    const formattedDate = dateInput.split('-').reverse().join('.');
    formData.set('delivery_date', formattedDate);

    myWishes.forEach(prId => formData.append('good_ids', prId));
    formData.set('subscribe', document.querySelector('#subscribe').checked ? 1 : 0);

    await sendFormData(formData);

    localStorage.removeItem('myWishes');
    myWishes = [];
    cartItems = [];
    updateCart();
});

loadTheBooty().then(updateCart);
