/* Get references to DOM elements */
const categoryFilter = document.getElementById("categoryFilter");
const productsContainer = document.getElementById("productsContainer");
const chatForm = document.getElementById("chatForm");
const chatWindow = document.getElementById("chatWindow");
const selectedProductsList = document.getElementById("selectedProductsList");
const productSearch = document.getElementById("productSearch");
const directionToggle = document.getElementById("directionToggle");
const directionLabel = document.getElementById("directionLabel");

/* Array to track selected products */
let selectedProducts = [];

/* Track current filters */
let currentCategory = "";
let currentSearchTerm = "";

/* Direction toggle functionality */
directionToggle.addEventListener("click", () => {
  const html = document.documentElement;
  const currentDir = html.getAttribute("dir") || "ltr";
  const newDir = currentDir === "ltr" ? "rtl" : "ltr";

  html.setAttribute("dir", newDir);
  html.setAttribute("lang", newDir === "rtl" ? "ar" : "en");

  /* Update button label */
  directionLabel.textContent = newDir === "ltr" ? "RTL" : "LTR";

  /* Save preference to localStorage */
  localStorage.setItem("textDirection", newDir);
});

/* Load saved direction preference on page load */
const savedDirection = localStorage.getItem("textDirection");
if (savedDirection) {
  const html = document.documentElement;
  html.setAttribute("dir", savedDirection);
  html.setAttribute("lang", savedDirection === "rtl" ? "ar" : "en");
  directionLabel.textContent = savedDirection === "ltr" ? "RTL" : "LTR";
}

/* Array to store conversation history */
let conversationHistory = [
  {
    role: "system",
    content:
      "You are a helpful beauty and skincare advisor for L'Oréal products. Answer questions about skincare routines, product recommendations, haircare, makeup, fragrance, and beauty tips. Be friendly, concise, and informative. When discussing routines, reference the specific products mentioned in the conversation.",
  },
];

/* Load selected products from localStorage on page load */
function loadSelectedProductsFromStorage() {
  const saved = localStorage.getItem("selectedProducts");
  if (saved) {
    try {
      selectedProducts = JSON.parse(saved);
    } catch (e) {
      /* If parsing fails, reset to empty array */
      selectedProducts = [];
      localStorage.removeItem("selectedProducts");
    }
  }
}

/* Save selected products to localStorage */
function saveSelectedProductsToStorage() {
  localStorage.setItem("selectedProducts", JSON.stringify(selectedProducts));
}

/* Initialize from localStorage */
loadSelectedProductsFromStorage();

/* Show initial placeholder until user selects a category */
productsContainer.innerHTML = `
  <div class="placeholder-message">
    Select a category to view products
  </div>
`;

/* Load product data from JSON file */
async function loadProducts() {
  const response = await fetch("products.json");
  const data = await response.json();
  return data.products;
}

/* Filter and display products based on category and search term */
async function filterAndDisplayProducts() {
  const products = await loadProducts();

  let filteredProducts = products;

  /* Apply category filter if selected */
  if (currentCategory) {
    filteredProducts = filteredProducts.filter(
      (product) => product.category === currentCategory
    );
  }

  /* Apply search filter if there's a search term */
  if (currentSearchTerm) {
    const searchLower = currentSearchTerm.toLowerCase();
    filteredProducts = filteredProducts.filter((product) => {
      /* Search in product name, brand, and description */
      return (
        product.name.toLowerCase().includes(searchLower) ||
        product.brand.toLowerCase().includes(searchLower) ||
        product.description.toLowerCase().includes(searchLower)
      );
    });
  }

  /* Show message if no products match the filters */
  if (filteredProducts.length === 0) {
    productsContainer.innerHTML = `
      <div class="placeholder-message">
        <i class="fa-solid fa-search" style="font-size: 32px; margin-bottom: 10px; opacity: 0.5;"></i>
        <p>No products found matching your search.</p>
        <p style="font-size: 14px; margin-top: 8px; opacity: 0.7;">Try different keywords or select another category.</p>
      </div>
    `;
    return;
  }

  displayProducts(filteredProducts);
}

/* Create HTML for displaying product cards */
function displayProducts(products) {
  productsContainer.innerHTML = products
    .map((product) => {
      /* Check if this product is already selected */
      const isSelected = selectedProducts.some((p) => p.id === product.id);
      return `
    <div class="product-card ${
      isSelected ? "selected" : ""
    }" data-product-id="${product.id}">
      <img src="${product.image}" alt="${product.name}">
      <div class="product-info">
        <h3>${product.name}</h3>
        <p>${product.brand}</p>
      </div>
      <button class="info-btn" data-product-id="${
        product.id
      }" aria-label="View details for ${product.name}">
        <i class="fa-solid fa-info"></i>
      </button>
    </div>
  `;
    })
    .join("");

  /* Add click event listeners to all product cards */
  const productCards = document.querySelectorAll(".product-card");
  productCards.forEach((card) => {
    card.addEventListener("click", (e) => {
      /* Don't toggle selection if clicking the info button */
      if (e.target.closest(".info-btn")) {
        return;
      }
      const productId = parseInt(card.dataset.productId);
      toggleProductSelection(productId, products);
    });
  });

  /* Add click event listeners to info buttons */
  const infoButtons = document.querySelectorAll(".info-btn");
  infoButtons.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const productId = parseInt(btn.dataset.productId);
      const product = products.find((p) => p.id === productId);
      showProductModal(product);
    });
  });
}

/* Toggle product selection when clicked */
function toggleProductSelection(productId, products) {
  const product = products.find((p) => p.id === productId);
  const index = selectedProducts.findIndex((p) => p.id === productId);

  if (index === -1) {
    /* Product not selected yet, add it */
    selectedProducts.push(product);
  } else {
    /* Product already selected, remove it */
    selectedProducts.splice(index, 1);
  }

  /* Save to localStorage */
  saveSelectedProductsToStorage();

  /* Update both the product grid and selected products list */
  displayProducts(products);
  updateSelectedProductsList();
}

/* Clear all selected products */
function clearAllSelections() {
  selectedProducts = [];
  saveSelectedProductsToStorage();
  updateSelectedProductsList();

  /* Update product grid if it's currently showing products */
  const productCards = document.querySelectorAll(".product-card");
  productCards.forEach((card) => {
    card.classList.remove("selected");
  });
}

/* Update the Selected Products section */
function updateSelectedProductsList() {
  if (selectedProducts.length === 0) {
    selectedProductsList.innerHTML = `
      <p style="color: #999; font-size: 16px;">No products selected yet. Click on products above to add them.</p>
    `;
    return;
  }

  /* Add clear all button at the top */
  const clearAllBtn = `
    <button id="clearAllBtn" class="clear-all-btn" aria-label="Clear all selected products">
      <i class="fa-solid fa-trash-can"></i> Clear All
    </button>
  `;

  const productsHTML = selectedProducts
    .map(
      (product) => `
    <div class="selected-product-tag">
      <span>${product.name}</span>
      <button class="remove-btn" data-product-id="${product.id}" aria-label="Remove ${product.name}">
        <i class="fa-solid fa-xmark"></i>
      </button>
    </div>
  `
    )
    .join("");

  selectedProductsList.innerHTML = clearAllBtn + productsHTML;

  /* Add click event listener to clear all button */
  const clearAllButton = document.getElementById("clearAllBtn");
  if (clearAllButton) {
    clearAllButton.addEventListener("click", () => {
      if (confirm("Are you sure you want to remove all selected products?")) {
        clearAllSelections();
      }
    });
  }

  /* Add click event listeners to remove buttons */
  const removeButtons = document.querySelectorAll(".remove-btn");
  removeButtons.forEach((btn) => {
    btn.addEventListener("click", async () => {
      const productId = parseInt(btn.dataset.productId);
      const products = await loadProducts();
      toggleProductSelection(productId, products);
    });
  });
}

/* Filter and display products when category changes */
categoryFilter.addEventListener("change", async (e) => {
  currentCategory = e.target.value;
  await filterAndDisplayProducts();
});

/* Filter products as user types in search field */
productSearch.addEventListener("input", async (e) => {
  currentSearchTerm = e.target.value.trim();

  /* If there's a search term but no category selected, show all products */
  if (currentSearchTerm && !currentCategory) {
    const products = await loadProducts();
    currentCategory = ""; /* Clear category requirement for search */
  }

  await filterAndDisplayProducts();
});

/* Show product details in a modal */
function showProductModal(product) {
  /* Create modal HTML */
  const modalHTML = `
    <div class="modal-overlay" id="productModal">
      <div class="modal-content">
        <button class="modal-close" aria-label="Close modal">
          <i class="fa-solid fa-xmark"></i>
        </button>
        <div class="modal-body">
          <img src="${product.image}" alt="${product.name}" class="modal-image">
          <div class="modal-info">
            <h2>${product.name}</h2>
            <p class="modal-brand">${product.brand}</p>
            <p class="modal-description">${product.description}</p>
          </div>
        </div>
      </div>
    </div>
  `;

  /* Add modal to the page */
  document.body.insertAdjacentHTML("beforeend", modalHTML);

  /* Get modal elements */
  const modal = document.getElementById("productModal");
  const closeBtn = modal.querySelector(".modal-close");

  /* Close modal when clicking the close button */
  closeBtn.addEventListener("click", () => {
    modal.remove();
  });

  /* Close modal when clicking outside the content */
  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.remove();
    }
  });

  /* Close modal when pressing Escape key */
  document.addEventListener("keydown", function escapeHandler(e) {
    if (e.key === "Escape") {
      modal.remove();
      document.removeEventListener("keydown", escapeHandler);
    }
  });
}

/* Generate routine button handler */
const generateRoutineBtn = document.getElementById("generateRoutine");
generateRoutineBtn.addEventListener("click", async () => {
  /* Check if any products are selected */
  if (selectedProducts.length === 0) {
    chatWindow.innerHTML = `
      <p style="color: #ff003b; font-weight: 500;">
        <i class="fa-solid fa-exclamation-circle"></i> 
        Please select at least one product to generate a routine.
      </p>
    `;
    return;
  }

  /* Show loading message */
  chatWindow.innerHTML = `
    <div style="display: flex; align-items: center; gap: 10px; color: #666;">
      <i class="fa-solid fa-spinner fa-spin"></i>
      <span>Creating your personalized routine...</span>
    </div>
  `;

  /* Call OpenAI API to generate routine */
  await generateRoutineWithAI();
});

/* Generate personalized routine using OpenAI API */
async function generateRoutineWithAI() {
  /* Prepare product data for the API */
  const productDetails = selectedProducts.map((product) => ({
    name: product.name,
    brand: product.brand,
    category: product.category,
    description: product.description,
  }));

  /* Create user message for routine generation */
  const userMessage = `Create a personalized beauty routine using these products:\n\n${JSON.stringify(
    productDetails,
    null,
    2
  )}\n\nProvide a clear, step-by-step routine with application order and timing (morning/evening). Include helpful tips.`;

  /* Create the messages array for OpenAI */
  const messages = [
    {
      role: "system",
      content:
        "You are a professional beauty and skincare advisor. Create personalized, step-by-step routines based on the products provided. Be specific about order of application, timing (AM/PM), and helpful tips. Keep your response concise and well-formatted.",
    },
    {
      role: "user",
      content: userMessage,
    },
  ];

  /* Cloudflare Worker endpoint */
  const workerUrl = "https://loreal-worker.jmillings.workers.dev/";

  /* Make the API request through Worker with web search enabled */
  const response = await fetch(workerUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: messages,
      temperature: 0.7,
      max_tokens: 1000,
      web_search_options: {
        search_mode: "auto",
      },
    }),
  });

  /* Check if the response is successful */
  if (!response.ok) {
    chatWindow.innerHTML = `
      <p style="color: #ff003b; font-weight: 500;">
        <i class="fa-solid fa-exclamation-triangle"></i> 
        Error: Unable to generate routine. Please check your API key and try again.
      </p>
    `;
    return;
  }

  /* Parse the response */
  const data = await response.json();

  /* Get the AI-generated routine */
  const routine = data.choices[0].message.content;

  /* Get web search results if available */
  const webResults = data.choices[0].message.web_results || [];

  /* Reset conversation history and add the routine generation to it */
  conversationHistory = [
    {
      role: "system",
      content:
        "You are a helpful beauty and skincare advisor for L'Oréal products. Answer questions about skincare routines, product recommendations, haircare, makeup, fragrance, and beauty tips. Be friendly, concise, and informative. When discussing routines, reference the specific products mentioned in the conversation.",
    },
    {
      role: "user",
      content: userMessage,
    },
    {
      role: "assistant",
      content: routine,
      web_results: webResults,
    },
  ];

  /* Display the routine in the chat window with formatting */
  displayChatMessages();
}

/* Initialize the selected products list on page load */
updateSelectedProductsList();

/* Display all chat messages from conversation history */
function displayChatMessages() {
  /* Filter out system messages and create HTML for user/assistant messages */
  const messagesHTML = conversationHistory
    .filter((msg) => msg.role !== "system")
    .map((msg) => {
      if (msg.role === "user") {
        return `
        <div style="margin-bottom: 15px;">
          <strong style="color: #ff003b;">You:</strong> ${msg.content}
        </div>
      `;
      } else {
        /* Check if this is the routine message (first assistant message) */
        const isRoutine = conversationHistory.indexOf(msg) === 2;

        /* Format citations if web results exist */
        let citationsHTML = "";
        if (msg.web_results && msg.web_results.length > 0) {
          const citations = msg.web_results
            .map(
              (result, index) =>
                `<a href="${
                  result.url
                }" target="_blank" rel="noopener noreferrer" style="color: #ff003b; text-decoration: none; margin-right: 10px;">[${
                  index + 1
                }] ${result.title}</a>`
            )
            .join("<br>");
          citationsHTML = `
            <div style="margin-top: 15px; padding: 12px; background: rgba(255, 0, 59, 0.05); border-left: 3px solid #ff003b; border-radius: 4px;">
              <strong style="color: #333; font-size: 14px; display: block; margin-bottom: 8px;">
                <i class="fa-solid fa-link"></i> Sources:
              </strong>
              <div style="font-size: 13px; line-height: 1.8;">${citations}</div>
            </div>
          `;
        }

        if (isRoutine) {
          return `
          <div style="line-height: 1.8; margin-bottom: 20px;">
            <h3 style="color: #ff003b; margin-bottom: 15px; font-size: 18px;">
              <i class="fa-solid fa-sparkles"></i> Your Personalized Routine
            </h3>
            <div style="white-space: pre-line; margin-bottom: 15px;">${msg.content}</div>
            ${citationsHTML}
            <div style="border-top: 2px solid rgba(255, 0, 59, 0.1); padding-top: 15px; margin-top: 15px;">
              <p style="color: #666; font-size: 14px; font-style: italic;">
                💬 Have questions? Ask me anything about your routine!
              </p>
            </div>
          </div>
        `;
        } else {
          return `
          <div style="line-height: 1.8; margin-bottom: 15px;">
            <strong style="color: #e3a535;">AI Advisor:</strong> ${msg.content}
            ${citationsHTML}
          </div>
        `;
        }
      }
    })
    .join("");

  chatWindow.innerHTML = messagesHTML;

  /* Scroll to bottom of chat window */
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

/* Chat form submission handler - for asking questions about products */
chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const userInput = document.getElementById("userInput");
  const userQuestion = userInput.value.trim();

  if (!userQuestion) return;

  /* Add user message to conversation history */
  conversationHistory.push({
    role: "user",
    content: userQuestion,
  });

  /* Display all messages including the new user question */
  displayChatMessages();

  /* Add loading indicator */
  const loadingHTML = `
    <div id="loading-indicator" style="display: flex; align-items: center; gap: 10px; color: #666; margin-top: 10px;">
      <i class="fa-solid fa-spinner fa-spin"></i>
      <span>Thinking...</span>
    </div>
  `;
  chatWindow.insertAdjacentHTML("beforeend", loadingHTML);
  chatWindow.scrollTop = chatWindow.scrollHeight;

  /* Clear input */
  userInput.value = "";

  /* Cloudflare Worker endpoint */
  const workerUrl = "https://loreal-worker.jmillings.workers.dev/";

  const response = await fetch(workerUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: conversationHistory,
      temperature: 0.7,
      max_tokens: 500,
      web_search_options: {
        search_mode: "auto",
      },
    }),
  });

  /* Remove loading indicator */
  const loadingIndicator = document.getElementById("loading-indicator");
  if (loadingIndicator) {
    loadingIndicator.remove();
  }

  /* Check response */
  if (!response.ok) {
    conversationHistory.push({
      role: "assistant",
      content:
        "I apologize, but I'm having trouble connecting right now. Please check your API key and try again.",
    });
    displayChatMessages();
    return;
  }

  /* Parse response */
  const data = await response.json();
  const aiResponse = data.choices[0].message.content;
  const webResults = data.choices[0].message.web_results || [];

  /* Add assistant response to conversation history */
  conversationHistory.push({
    role: "assistant",
    content: aiResponse,
    web_results: webResults,
  });

  /* Display updated conversation */
  displayChatMessages();
});
