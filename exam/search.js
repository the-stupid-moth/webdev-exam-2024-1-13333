// автодополнение
const searchInput = document.getElementById("search-input");
const autocompleteList = document.getElementById("autocomplete-list");
const apiKey = "ea0cb7c7-758b-482c-a02f-5f6c15ccbab5";

searchInput.addEventListener("input", async () => {
  const query = searchInput.value.trim();
  if (query.length === 0) {
    autocompleteList.innerHTML = "";
    return;
  }

  const response = await fetch(`https://edu.std-900.ist.mospolytech.ru/exam-2024-1/api/autocomplete?query=${query}&api_key=${apiKey}`);
  const suggestions = await response.json();

  autocompleteList.innerHTML = "";
  suggestions.forEach(suggestion => {
    const item = document.createElement("div");
  
    const lowerSuggestion = suggestion.toLowerCase();
    const queryLower = query.toLowerCase();
    const index = lowerSuggestion.indexOf(queryLower);
  
    if (index !== -1) {
      const before = suggestion.slice(0, index);
      const match = suggestion.slice(index, index + query.length);
      const after = suggestion.slice(index + query.length);
  
      // выделяем совпавшую часть жирным
      item.innerHTML = `${before}<strong>${match}</strong>${after}`;
    } else {
      item.textContent = suggestion;
    }
  
    item.classList.add("autocomplete-item");
  
    item.addEventListener("click", () => {
      const currentWords = searchInput.value.trim().split(/\s+/);
      const lastWord = currentWords.pop(); // удаляем последнее введённое слово
      currentWords.push(suggestion);       // добавляем выбранную подсказку
      searchInput.value = currentWords.join(" ") + " ";
      searchInput.focus();
      autocompleteList.innerHTML = "";
    });    
  
    autocompleteList.appendChild(item);
  });  
});

// поиск по кнопке "Найти"
document.getElementById("search-button").addEventListener("click", async () => {
  const query = searchInput.value.trim();
  const response = await fetch(`https://edu.std-900.ist.mospolytech.ru/exam-2024-1/api/goods?query=${query}&api_key=${apiKey}`);
  const data = await response.json();

  productGrid.innerHTML = ""; // очищаем предыдущие товары
  if (data.length === 0) {
    productGrid.innerHTML = "<p>Нет товаров, соответствующих вашему запросу.</p>";
  } else {
    renderProducts(data); // перерисовываем
  }

  if (loadMoreButton) loadMoreButton.style.display = "none"; // скрываем кнопку "Загрузить ещё"
});
