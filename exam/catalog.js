const productGrid = document.getElementById("product-grid");
const loadMoreButton = document.getElementById("load-more");
const sortOrderSelect = document.getElementById("sort-order");
let myWishes = JSON.parse(localStorage.getItem('myWishes')) || [];

let currentPage = 1;
const perPage = 10; 
let totalProducts = 0;
let currentSortOrder = "rating_desc"; 

// Возвращает реальную цену 
function getComparablePrice(product) {
  return product.discount_price !== null ? product.discount_price : product.actual_price;
}

/*// Показ уведомлений
function showNotification(message) {
  const notification = document.getElementById("notification");
  notification.textContent = message; 
  notification.classList.add("show");

  // Скрытие уведомление через 3 секунды
  setTimeout(() => {
    notification.classList.remove("show");
  }, 3000);
}*/

// Создание карточек
function renderProducts(products) {
  products.forEach((product) => { //Проход по массиву
    const productCard = document.createElement("div");
    productCard.classList.add("product-card"); //CSS

    const finalPrice = product.discount_price ? product.discount_price : product.actual_price; // фин цена

    let discountHtml = "";
    if (product.discount_price) {
      const discountPercent = Math.floor(100 - (product.discount_price / product.actual_price) * 100);
      discountHtml = `<span class="product-discount">-${discountPercent}%</span>`;
    }

    //Шаблонные строки
    productCard.innerHTML = `
      <img src="${product.image_url}" alt="${product.name}" class="product-image">
      <h2 class="product-name">${product.name}</h2>
      <div class="product-rating">
        <span class="rating-value">${product.rating.toFixed(1)}</span> 
        <span class="stars">
          ${"★".repeat(Math.floor(product.rating)) + "☆".repeat(5 - Math.floor(product.rating))}
        </span>
      </div>
      <div class="product-prices">
        <span class="product-price">${finalPrice} ₽</span>
        ${product.discount_price ? `<span class="product-old-price">${product.actual_price} ₽</span>` : ""}
        ${discountHtml}
      </div>
      <button class="product-button">Добавить в корзину</button>
    `;
    productCard.setAttribute('data-id', product.id) //Атрибут с id

    if (myWishes.includes(String(product.id))) { 
      productCard.classList.add('product-card-selected')
    }
    productGrid.appendChild(productCard); //Добавление в контейнер

    let addButton = productCard.querySelector('.product-button'); //Сохранение ссылки
    addButton.addEventListener('click', addCoolOrder); //Обработчик события
  });
}

//Загрузка товаров с сервера + обработка + отображение
async function fetchProducts(page, sortOrder) {
  const API_URL = `https://edu.std-900.ist.mospolytech.ru/exam-2024-1/api/goods?api_key=ea0cb7c7-758b-482c-a02f-5f6c15ccbab5&page=${page}&per_page=${perPage}&sort_order=${sortOrder}`;

  try { 
    const response = await fetch(API_URL); //Асинхронность
    const data = await response.json(); //Преобразование

    if (sortOrder.includes("price")) {
      data.goods.sort((a, b) => {
        const priceA = getComparablePrice(a);
        const priceB = getComparablePrice(b);
        return sortOrder === "price_asc" ? priceA - priceB : priceB - priceA;
      });
    }

    totalProducts = data._pagination.total_count; //Общее кол-во товаров

    renderProducts(data.goods);

    // Скрытие кнопки, если все товары загружены
    const totalPages = Math.ceil(totalProducts / perPage); 
    if (page >= totalPages) {
      loadMoreButton.classList.add("hidden");
    }
  } catch (error) {
    console.log(error);
    showNotification("Ошибка загрузки данных. Попробуйте снова.");
  }
}

//Выделение карточки
function backlightRgb(HTMLelement) {
  HTMLelement.classList.add('product-card-selected')
}

//Добавление в корзину
function addCoolOrder(event) {//Объект события
  if (myWishes.includes(event.target.parentNode.getAttribute('data-id'))) {
    return;
  }
  const productCard = event.target.parentNode; //Родительсикй элемент кнопки, представляющий карточку товара
  const productId = productCard.getAttribute('data-id');

  myWishes.push(productId);
  localStorage.setItem('myWishes', JSON.stringify(myWishes));
  backlightRgb(productCard);
}

sortOrderSelect.addEventListener("change", () => { //Обработчик события + выпадающий список
 
  currentPage = 1;

  
  loadMoreButton.classList.remove("hidden"); //Показ Ещё


  currentSortOrder = sortOrderSelect.value; //Извлечение выбранное значение сортировки из списка


  productGrid.innerHTML = "";


  fetchProducts(currentPage, currentSortOrder);
});

//Добавление обработчика событий

loadMoreButton.addEventListener("click", () => {
  currentPage++;
  fetchProducts(currentPage, currentSortOrder);
});


document.addEventListener('DOMContentLoaded', () => { //Поностью загружен
  fetchProducts(currentPage, currentSortOrder);
});
