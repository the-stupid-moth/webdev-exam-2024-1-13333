document.addEventListener("DOMContentLoaded", () => {
    const ordersList = document.getElementById("orders-list");
    const notification = document.getElementById("notification");
    const viewModal = document.getElementById("view-order-modal");
    const editModal = document.getElementById("edit-order-modal");
    const deleteModal = document.getElementById("delete-order-modal");
    const closeViewBtn = document.getElementById("close-view-btn");
    const closeEditBtn = document.getElementById("close-edit-btn");
    const confirmDeleteBtn = document.getElementById("confirm-delete");
    const cancelDeleteBtn = document.getElementById("cancel-delete");
    const notifications = document.getElementById('notifications');
    const closeCornerBtnEditModal = document.getElementById('close-edit');
    const closeCornerBtnViewModal = document.getElementById('close-order-modal');
    const closeCornetBtnDeleteModal = document.getElementById('close-delete');

    let orders = [];
    let goods = [];
    let currentOrderId = null;

    // Функция для отображения уведомлений
    function showNotifications(message, type = 'success') {
        if (!notifications) {
            console.error("Элемент для уведомлений не найден!");
            return;
        }
    
        notifications.textContent = message;
    
        notifications.classList.remove('success', 'error', 'hidden');
        notifications.classList.add(type, 'show');
    
        setTimeout(() => {
            notifications.classList.remove('show');
            notifications.classList.add('hidden');
        }, 3000);
    }
    

    // Функция загрузки заказов с сервера
    async function fetchOrders() {
        const API_URL = `https://edu.std-900.ist.mospolytech.ru/exam-2024-1/api/orders?api_key=ea0cb7c7-758b-482c-a02f-5f6c15ccbab5`;
        try {
            const response = await fetch(API_URL);
            const data = await response.json();
            orders = data.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
            renderOrders();
        } catch (error) {
            showNotifications("Ошибка загрузки заказов. Попробуйте позже.", "error");
            // console.error(error); // Для отладки
        }
    }

    async function fetchGoodById(id) {
        // Проверяем локальный кэш
        let existingGood = goods.find(good => good.id === id);
        if (existingGood) {
            return existingGood;
        }
    
        const API_URL = `https://edu.std-900.ist.mospolytech.ru/exam-2024-1/api/goods/${id}?api_key=ea0cb7c7-758b-482c-a02f-5f6c15ccbab5`;
        try {
            const response = await fetch(API_URL);
            const data = await response.json();
    
            goods.push(data);  // Сохраняем, чтобы не качать дважды
            return data;
        } catch (error) {
            showNotifications("Ошибка загрузки товаров. Попробуйте позже.", "error");
            // console.error(error); // Для отладки
        }
    }

    async function fetchOrderById(id) {
        // Проверяем локальный кэш
        let existingOrders = orders.find(good => good.id === id);
        if (existingOrders) {
            return existingOrders;
        }
    
        const API_URL = `https://edu.std-900.ist.mospolytech.ru/exam-2024-1/api/orders/${id}?api_key=ea0cb7c7-758b-482c-a02f-5f6c15ccbab5`;
        try {
            const response = await fetch(API_URL);
            const data = await response.json();
    
            orders.push(data);  // Сохранение
            return data;
        } catch (error) {
            showNotifications("Ошибка загрузки товаров. Попробуйте позже.", "error");
            // console.error(error); // Для отладки
        }
    }

    async function getGoodNameById(id) {
        const good = await fetchGoodById(id);
        if (!good) return ""; // На случай ошибки загрузки
        return good.name;
    }
    
    async function getGoodPriceById(id) {
        const good = await fetchGoodById(id);
        if (!good) return 0; // На случай ошибки или отсутствия данных
        return good.discount_price ? good.discount_price : good.actual_price;
    }

    async function calculateOrderPrice(order) {
        const goodPrices = await Promise.all(
            order.good_ids.map(id => getGoodPriceById(id))
        );

        const sum = goodPrices.reduce((acc, price) => acc + price, 0);
        return sum;
    }

    async function calculateDeliveryPrice(order) {
        let delivery_date = new Date(order.delivery_date);
        let delivery_interval = order.delivery_interval;
    
        // Базовая стоимость
        let deliveryPrice = 200;
    
        // Проверка, попадает ли дата на выходные
        const isWeekend = delivery_date.getDay() === 0 || delivery_date.getDay() === 6;
        if (isWeekend) {
            deliveryPrice += 300; // Выходные
        } else if (delivery_interval === '18:00-22:00') {
            deliveryPrice += 200; // Вечер буднего дня
        }
    
        return deliveryPrice;
    }

    // Функция отображения заказов в таблице
    async function renderOrders() {
        ordersList.innerHTML = "";
        if (orders.length === 0) {
            ordersList.innerHTML = "<tr><td colspan='6'>Нет заказов</td></tr>";
            return;
        }


        orders.forEach(async (order, index) => {

            const total_price = await calculateOrderPrice(order) + await calculateDeliveryPrice(order);
            const goodNames = await Promise.all(
                order.good_ids.map(id => getGoodNameById(id))
              );
    
            const goodNamesString = goodNames.join(', ');

            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${order.created_at}</td>
                <td>${goodNamesString}</td>
                <td>${total_price} ₽</td>
                <td>${order.delivery_date} ${order.delivery_interval}</td>
                <td>
                    <button class="view-order" data-id="${order.id}">👁</button>
                    <button class="edit-order" data-id="${order.id}">✏</button>
                    <button class="delete-order" data-id="${order.id}">🗑</button>
                </td>
            `;
            ordersList.appendChild(row);
        });
    }

    // Обработчик кликов по таблице заказов
    ordersList.addEventListener("click", (event) => {
        const target = event.target;
        currentOrderId = target.dataset.id;

        if (target.classList.contains("view-order")) {
            viewOrder(currentOrderId);
        } else if (target.classList.contains("edit-order")) {
            editOrder(currentOrderId);
        } else if (target.classList.contains("delete-order")) {
            confirmDeleteOrder(currentOrderId);
        }
    });

    // Функция редактирования заказа (пока заглушка)
    async function editOrder(orderId) {
        const order = await fetchOrderById(orderId);
        if (!order) return;
        let currentOrder = order;
    
        const goodNames = await Promise.all(order.good_ids.map(id => getGoodNameById(id)));
        const goodNamesString = goodNames.join(", ");
    
        document.getElementById("order-created").innerText = order.created_at;
        document.getElementById("edit-name").value = order.full_name || "";
        document.getElementById("edit-phone").value = order.phone || "";
        document.getElementById("edit-email").value = order.email || "";
        document.getElementById("edit-address").value = order.delivery_address || "";
        document.getElementById("edit-date").value = order.delivery_date || "";
        document.getElementById("edit-time").value = order.delivery_interval || "";
        document.getElementById("order-goods").innerText = goodNamesString;
    
        const totalPrice = await calculateOrderPrice(order) + await calculateDeliveryPrice(order);
        document.getElementById("order-price").innerText = `${totalPrice} ₽`;
    
        document.getElementById("edit-comment").value = order.comment || "";
        document.getElementById("edit-order-modal").classList.remove("hidden");
    
        // 🎯 Пересчёт цены при изменении даты или времени
        async function recalculatePriceOnEdit() {
            const newDate = document.getElementById("edit-date").value;
            const newTime = document.getElementById("edit-time").value;
    
            const tempOrder = {
                ...currentOrder,
                delivery_date: newDate,
                delivery_interval: newTime
            };
    
            const newTotal = await calculateOrderPrice(tempOrder) + await calculateDeliveryPrice(tempOrder);
            document.getElementById("order-price").innerText = `${newTotal} ₽`;
        }
    
        document.getElementById("edit-date").addEventListener("input", recalculatePriceOnEdit);
        document.getElementById("edit-time").addEventListener("input", recalculatePriceOnEdit);
    
        const form = document.getElementById("edit-order-form");
        form.onsubmit = null;
    
        form.onsubmit = async function (event) {
            event.preventDefault();
    
            const updatedFields = {};
    
            const newName = document.getElementById("edit-name").value;
            if (newName !== currentOrder.full_name) updatedFields.full_name = newName;
    
            const newPhone = document.getElementById("edit-phone").value;
            if (newPhone !== currentOrder.phone) updatedFields.phone = newPhone;
    
            const newEmail = document.getElementById("edit-email").value;
            if (newEmail !== currentOrder.email) updatedFields.email = newEmail;
    
            const newAddress = document.getElementById("edit-address").value;
            if (newAddress !== currentOrder.delivery_address) updatedFields.delivery_address = newAddress;
    
            const newDate = document.getElementById("edit-date").value;
            if (newDate !== currentOrder.delivery_date) updatedFields.delivery_date = newDate;
    
            const newTime = document.getElementById("edit-time").value;
            if (newTime !== currentOrder.delivery_interval) updatedFields.delivery_interval = newTime;
    
            const newComment = document.getElementById("edit-comment").value;
            if (newComment !== currentOrder.comment) updatedFields.comment = newComment;
    
            if (Object.keys(updatedFields).length === 0) {
                alert("Нет изменений для сохранения.");
                return;
            }
    
            try {
                const response = await fetch(`https://edu.std-900.ist.mospolytech.ru/exam-2024-1/api/orders/${currentOrder.id}?api_key=ea0cb7c7-758b-482c-a02f-5f6c15ccbab5`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(updatedFields)
                });
    
                if (!response.ok) throw new Error(`Ошибка: ${response.status}`);
    
                showNotifications("Заказ успешно обновлён!", "success");
                document.getElementById("edit-order-modal").classList.add("hidden");
                currentOrder = null;
                fetchOrders();
            } catch (error) {
                console.error("Ошибка при обновлении заказа:", error);
                alert("Не удалось сохранить изменения. Попробуйте снова.");
            }
        };
    }
    
    // Функция подтверждения удаления заказа
    
    async function viewOrder(orderId) {
        // Получаем заказ по ID (нужно реализовать или использовать уже имеющуюся функцию fetchOrderById)
        const order = await fetchOrderById(orderId);
        if (!order) return;
      
        // Если требуется вывести названия товаров
        const goodNames = await Promise.all(
          order.good_ids.map(id => getGoodNameById(id))
        );
        const goodNamesString = goodNames.join(", ");
      
        // Заполняем поля (div.form-value) из объекта заказа
        document.getElementById("view-order-created").textContent = order.created_at || "";
        document.getElementById("view-order-name").textContent = order.full_name || "";
        document.getElementById("view-order-phone").textContent = order.phone || "";
        document.getElementById("view-order-email").textContent = order.email || "";
        document.getElementById("view-order-address").textContent = order.delivery_address || "";
        document.getElementById("view-order-delivery-date").textContent = order.delivery_date || "";
        document.getElementById("view-order-delivery-time").textContent = order.delivery_interval || "";
        document.getElementById("view-order-goods").textContent = goodNamesString;
      
        // Считаем итоговую стоимость (товары + доставка)
        const totalPrice = await calculateOrderPrice(order) + await calculateDeliveryPrice(order);
        document.getElementById("view-order-price").textContent = `${totalPrice} ₽`;
      
        // Комментарий
        document.getElementById("view-order-comment").textContent = order.comment || "Нет комментария";
      
        // Показываем модалку
        const viewModal = document.getElementById("view-order-modal");
        viewModal.classList.remove("hidden");
      }

    // Функция подтверждения удаления заказа
    function confirmDeleteOrder(orderId) {
        deleteModal.classList.remove("hidden");
    }

    // Функция удаления заказа с сервера
    async function deleteOrder() {
        const API_URL = `https://edu.std-900.ist.mospolytech.ru/exam-2024-1/api/orders/${currentOrderId}?api_key=ea0cb7c7-758b-482c-a02f-5f6c15ccbab5`;
        try {
            const response = await fetch(API_URL, { method: "DELETE" });
            if (response.ok) {
                orders = orders.filter(order => order.id != currentOrderId);
                renderOrders();
                showNotifications("Заказ удален.", "success");
                deleteModal.classList.add("hidden");
            } else {
                showNotifications("Ошибка удаления заказа.", "error");
            }
        } catch (error) {
            showNotifications("Ошибка сети. Повторите попытку позже.", "error");
        }
    }

    // Закрытие модальных окон
    closeViewBtn.addEventListener("click", () => viewModal.classList.add("hidden"));
    closeCornerBtnViewModal.addEventListener("click", () => viewModal.classList.add("hidden"));
    closeEditBtn.addEventListener("click", () => editModal.classList.add("hidden"));
    closeCornerBtnEditModal.addEventListener("click", () => editModal.classList.add("hidden"));
    cancelDeleteBtn.addEventListener("click", () => deleteModal.classList.add("hidden"));
    closeCornetBtnDeleteModal.addEventListener("click", () => deleteModal.classList.add("hidden"));
    confirmDeleteBtn.addEventListener("click", deleteOrder);

    // Загрузка заказов при загрузке страницы
    fetchOrders();
});
