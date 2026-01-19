// Глобальные переменные для админ-панели
let adminEvents = [];
let adminSettings = {};
let isAuthenticated = false;
let authToken = null;

// API базовый URL для админки
const ADMIN_API_BASE = window.location.origin + '/api';

// Функция для создания заголовков с авторизацией
function getAuthHeaders() {
    const headers = {
        'Content-Type': 'application/json'
    };
    
    if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
    }
    
    return headers;
}

// Проверка аутентификации
function checkAuthentication() {
    console.log('=== checkAuthentication начата ===');
    
    const savedToken = localStorage.getItem('adminToken');
    const authTime = localStorage.getItem('adminAuthTime');
    
    console.log('Сохраненный токен:', savedToken ? 'Есть' : 'Нет');
    console.log('Время авторизации:', authTime);
    
    // Проверяем, прошло ли более 24 часов с момента входа
    if (savedToken && authTime) {
        const now = new Date().getTime();
        const authTimestamp = parseInt(authTime);
        const hoursPassed = (now - authTimestamp) / (1000 * 60 * 60);
        
        console.log('Часов прошло:', hoursPassed);
        
        if (hoursPassed < 24) {
            authToken = savedToken;
            isAuthenticated = true;
            console.log('Токен действителен, показываем админ-панель');
            showAdminPanel();
            console.log('Вызов initializeAdminPanel из checkAuthentication...');
            initializeAdminPanel();
            return;
        } else {
            console.log('Токен истек');
        }
    }
    
    // Если не аутентифицирован, показываем форму входа
    console.log('Показываем форму входа');
    showLoginForm();
}

// Показать форму входа
function showLoginForm() {
    document.getElementById('loginOverlay').style.display = 'flex';
    document.getElementById('adminPanel').style.display = 'none';
}

// Показать админ-панель
function showAdminPanel() {
    document.getElementById('loginOverlay').style.display = 'none';
    document.getElementById('adminPanel').style.display = 'flex';
    document.getElementById('adminPanel').classList.add('authenticated');
}

// Обработка входа
async function handleLogin(event) {
    event.preventDefault();
    
    console.log('=== handleLogin начата ===');
    
    const username = document.getElementById('adminUsername').value;
    const password = document.getElementById('adminPassword').value;
    
    console.log('Попытка входа:', username);
    
    if (!username || !password) {
        showNotification('Введите логин и пароль!', 'error');
        return;
    }

    try {
        console.log('Отправка запроса на:', `${ADMIN_API_BASE}/auth/login`);
        const response = await fetch(`${ADMIN_API_BASE}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        console.log('Ответ сервера:', response.status, response.ok);

        if (response.ok) {
            const result = await response.json();
            console.log('Результат входа:', result);
            
            // Сохраняем токен и время входа
            authToken = result.token;
            localStorage.setItem('adminToken', authToken);
            localStorage.setItem('adminAuthTime', new Date().getTime().toString());
            
            isAuthenticated = true;
            showAdminPanel();
            
            // Инициализируем админ-панель
            console.log('Вызов initializeAdminPanel...');
            await initializeAdminPanel();
            
            showNotification('Добро пожаловать в админ-панель!', 'success');
        } else {
            const error = await response.json();
            console.error('Ошибка входа:', error);
            showNotification(error.error || 'Ошибка входа', 'error');
            document.getElementById('adminPassword').value = '';
            document.getElementById('adminPassword').focus();
        }
    } catch (error) {
        console.error('Ошибка входа:', error);
        showNotification('Ошибка соединения с сервером', 'error');
    }
}

// Выход из админ-панели
function logout() {
    if (confirm('Вы уверены, что хотите выйти?')) {
        isAuthenticated = false;
        authToken = null;
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminAuthTime');
        showLoginForm();
        showNotification('Вы вышли из админ-панели', 'info');
    }
}

// Инициализация админ-панели после входа
async function initializeAdminPanel() {
    console.log('=== initializeAdminPanel начата ===');
    console.log('ADMIN_API_BASE:', ADMIN_API_BASE);
    console.log('authToken:', authToken);
    
    // Загружаем данные с сервера
    await loadAdminData();
    
    console.log('После loadAdminData, adminEvents:', adminEvents);
    
    setupAdminNavigation();
    loadAdminEvents();
    await loadAdminOrders();
    setupEventModal();
    loadEventFilters();
    await loadSettings();
    await updateDashboardStats();
    initCursorFollower();
    
    // Обновляем статистику каждые 30 секунд
    setInterval(updateDashboardStats, 30000);
    
    console.log('=== initializeAdminPanel завершена ===');
}

// Загрузка данных с сервера
async function loadAdminData() {
    console.log('loadAdminData начата...');
    try {
        // Загружаем мероприятия с сервера
        console.log('Запрос мероприятий:', `${ADMIN_API_BASE}/events`);
        const eventsResponse = await fetch(`${ADMIN_API_BASE}/events`, {
            headers: getAuthHeaders()
        });
        console.log('Ответ сервера на запрос мероприятий:', eventsResponse.status, eventsResponse.ok);
        
        if (eventsResponse.ok) {
            const serverEvents = await eventsResponse.json();
            console.log('Мероприятия получены с сервера:', serverEvents);
            
            // Конвертируем в формат админки
            adminEvents = serverEvents.map(event => ({
                id: event.id,
                title: event.title.ru,
                titleFr: event.title.fr,
                date: event.date,
                time: event.time,
                location: event.location.ru,
                locationFr: event.location.fr,
                description: event.description.ru,
                descriptionFr: event.description.fr,
                category: event.category,
                image: event.image,
                tickets: event.tickets.map(ticket => ({
                    id: ticket.id,
                    type: ticket.type.ru,
                    typeFr: ticket.type.fr,
                    price: ticket.price
                }))
            }));
            console.log('Мероприятия конвертированы для админки:', adminEvents);
        } else {
            console.warn('Ошибка загрузки мероприятий с сервера, используем данные по умолчанию');
            adminEvents = getDefaultAdminEvents();
        }

        // Загружаем настройки с сервера
        const settingsResponse = await fetch(`${ADMIN_API_BASE}/settings/admin`, {
            headers: getAuthHeaders()
        });
        if (settingsResponse.ok) {
            adminSettings = await settingsResponse.json();
            console.log('Настройки загружены с сервера:', adminSettings);
        } else {
            console.warn('Ошибка загрузки настроек с сервера, используем настройки по умолчанию');
            adminSettings = getDefaultSettings();
        }
    } catch (error) {
        console.error('Ошибка загрузки данных с сервера:', error);
        // Fallback на локальные данные
        adminEvents = getDefaultAdminEvents();
        adminSettings = getDefaultSettings();
    }
}

// Данные по умолчанию для админ-панели
function getDefaultAdminEvents() {
    return [
        {
            id: 1,
            title: "Концерт классической музыки",
            titleFr: "Concert de musique classique",
            date: "2025-02-15",
            time: "19:00",
            location: "Концертный зал «Филармония»",
            locationFr: "Salle de concert «Philharmonie»",
            description: "Вечер классической музыки с произведениями Чайковского и Рахманинова в исполнении симфонического оркестра.",
            descriptionFr: "Soirée de musique classique avec des œuvres de Tchaïkovski et Rachmaninov interprétées par l'orchestre symphonique.",
            category: "music",
            image: "🎼",
            tickets: [
                { id: "adult", type: "Взрослый", typeFr: "Adulte", price: 2500 },
                { id: "student", type: "Студенческий", typeFr: "Étudiant", price: 1500 },
                { id: "child", type: "Детский", typeFr: "Enfant", price: 1000 }
            ]
        },
        {
            id: 2,
            title: "Театральная постановка «Гамлет»",
            titleFr: "Représentation théâtrale «Hamlet»",
            date: "2025-02-20",
            time: "18:30",
            location: "Драматический театр",
            locationFr: "Théâtre dramatique",
            description: "Классическая трагедия Шекспира в современной интерпретации.",
            descriptionFr: "La tragédie classique de Shakespeare dans une interprétation moderne.",
            category: "theater",
            image: "🎭",
            tickets: [
                { id: "parterre", type: "Партер", typeFr: "Parterre", price: 3000 },
                { id: "amphitheater", type: "Амфитеатр", typeFr: "Amphithéâtre", price: 2000 },
                { id: "balcony", type: "Балкон", typeFr: "Balcon", price: 1500 }
            ]
        }
    ];
}

function getDefaultSettings() {
    return {
        siteName: "EventTickets",
        logoUrl: "",
        bankDetails: {
            bankName: "Сбербанк России",
            iban: "RU1234567890123456789012",
            bic: "SBERRU2P",
            recipient: "ООО «EventTickets»"
        }
    };
}

// Функции для работы с мероприятиями
async function saveEventsToStorage() {
    try {
        // Конвертируем мероприятия в формат для клиентской части
        const clientEvents = adminEvents.map(event => ({
            id: event.id,
            title: {
                ru: event.title || 'Мероприятие',
                fr: event.titleFr || event.title || 'Événement'
            },
            date: event.date,
            time: event.time,
            location: {
                ru: event.location || 'Место проведения',
                fr: event.locationFr || event.location || 'Lieu'
            },
            description: {
                ru: event.description || 'Описание мероприятия',
                fr: event.descriptionFr || event.description || 'Description de l\'événement'
            },
            category: event.category || 'other',
            image: event.image || '🎪',
            tickets: event.tickets.map(ticket => ({
                id: ticket.id || ticket.type.toLowerCase().replace(/\s+/g, '_'),
                type: {
                    ru: ticket.type || 'Билет',
                    fr: ticket.typeFr || ticket.type || 'Billet'
                },
                price: ticket.price
            }))
        }));
        
        // Сохраняем в localStorage как резерв
        localStorage.setItem('eventTicketsEvents', JSON.stringify(clientEvents));
        console.log('Мероприятия сохранены в localStorage для клиентской части:', clientEvents);
    } catch (error) {
        console.error('Ошибка сохранения мероприятий:', error);
    }
}

async function loadEventsFromStorage() {
    // Теперь загружаем с сервера, а не из localStorage
    await loadAdminData();
}
// Получение всех заказов с сервера
async function getAllOrders() {
    try {
        const response = await fetch(`${ADMIN_API_BASE}/orders`, {
            headers: getAuthHeaders()
        });
        
        if (response.ok) {
            const orders = await response.json();
            console.log('Заказы загружены с сервера:', orders);
            
            // Также сохраняем в localStorage как резерв
            localStorage.setItem('eventTicketsOrders', JSON.stringify(orders));
            
            return orders;
        } else if (response.status === 401) {
            // Токен недействителен, выходим
            logout();
            return [];
        } else {
            console.warn('Ошибка загрузки заказов с сервера, используем localStorage');
            return JSON.parse(localStorage.getItem('eventTicketsOrders')) || [];
        }
    } catch (error) {
        console.error('Ошибка загрузки заказов:', error);
        return JSON.parse(localStorage.getItem('eventTicketsOrders')) || [];
    }
}

async function updateOrderStatus(orderId, newStatus) {
    try {
        const response = await fetch(`${ADMIN_API_BASE}/orders/${orderId}/status`, {
            method: 'PATCH',
            headers: getAuthHeaders(),
            body: JSON.stringify({ status: newStatus })
        });

        if (response.ok) {
            console.log('Статус заказа обновлен на сервере');
            
            // Обновляем в localStorage как резерв
            const orders = JSON.parse(localStorage.getItem('eventTicketsOrders')) || [];
            const orderIndex = orders.findIndex(order => order.id === orderId);
            if (orderIndex !== -1) {
                orders[orderIndex].status = newStatus;
                orders[orderIndex].updatedAt = new Date().toLocaleString('ru-RU');
                localStorage.setItem('eventTicketsOrders', JSON.stringify(orders));
            }
            
            // Обновляем отображение
            loadAdminOrders();
            return true;
        } else if (response.status === 401) {
            logout();
            return false;
        } else {
            const error = await response.json();
            console.error('Ошибка обновления статуса на сервере:', error);
            return false;
        }
    } catch (error) {
        console.error('Ошибка обновления заказа:', error);
        return false;
    }
}

async function deleteOrder(orderId) {
    try {
        // В API нет endpoint для удаления заказов, используем localStorage
        const orders = JSON.parse(localStorage.getItem('eventTicketsOrders')) || [];
        const filteredOrders = orders.filter(order => order.id !== orderId);
        
        localStorage.setItem('eventTicketsOrders', JSON.stringify(filteredOrders));
        
        // Обновляем отображение
        loadAdminOrders();
        return true;
    } catch (error) {
        console.error('Ошибка удаления заказа:', error);
        return false;
    }
}

// Сохранение заказов в JSON файл
async function saveOrdersToJSON(orders) {
    try {
        // В реальном приложении здесь был бы API запрос
        console.log('Заказы сохранены в JSON:', orders);
        
        // Можно добавить отправку на сервер:
        // await fetch('./data/orders.json', {
        //     method: 'POST',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify(orders, null, 2)
        // });
    } catch (error) {
        console.error('Ошибка сохранения в JSON:', error);
    }
}

let currentEditingEvent = null;

// Инициализация админ-панели
document.addEventListener('DOMContentLoaded', function() {
    // Настраиваем обработчик формы входа
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    
    // Проверяем аутентификацию
    checkAuthentication();
});

// Инициализация следящего курсора
function initCursorFollower() {
    // Проверяем, является ли устройство мобильным
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
                     window.innerWidth <= 768 || 
                     'ontouchstart' in window;
    
    // На мобильных устройствах не создаем курсор
    if (isMobile) {
        return;
    }
    
    // Создаем элемент курсора
    const follower = document.createElement('div');
    follower.className = 'cursor-follower';
    document.body.appendChild(follower);
    
    let mouseX = 0;
    let mouseY = 0;
    let followerX = 0;
    let followerY = 0;
    
    // Отслеживаем движение мыши
    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
    });
    
    // Плавное движение через requestAnimationFrame
    function animate() {
        // Эффект задержки (lerp)
        followerX += (mouseX - followerX) * 0.1;
        followerY += (mouseY - followerY) * 0.1;
        
        follower.style.left = `${followerX}px`;
        follower.style.top = `${followerY}px`;
        
        requestAnimationFrame(animate);
    }
    
    animate();
    
    // Эффект при наведении на интерактивные элементы
    const interactiveElements = document.querySelectorAll('a, button, input, select, textarea, .nav-item');
    
    interactiveElements.forEach(el => {
        el.addEventListener('mouseenter', () => follower.classList.add('active'));
        el.addEventListener('mouseleave', () => follower.classList.remove('active'));
    });
    
    // Делегирование для динамических элементов
    document.addEventListener('mouseover', (e) => {
        if (e.target.matches('a, button, .btn-primary, .nav-item')) {
            follower.classList.add('active');
        }
    });
    
    document.addEventListener('mouseout', (e) => {
        if (e.target.matches('a, button, .btn-primary, .nav-item')) {
            follower.classList.remove('active');
        }
    });
}

// Загрузка настроек
async function loadSettings() {
    try {
        // Загружаем настройки с сервера
        const response = await fetch(`${ADMIN_API_BASE}/settings/admin`, {
            headers: getAuthHeaders()
        });
        if (response.ok) {
            const settings = await response.json();
            
            if (settings.siteName) document.getElementById('siteName').value = settings.siteName;
            if (settings.logoUrl) document.getElementById('logoUrl').value = settings.logoUrl;
            if (settings.contactEmail) document.getElementById('contactEmail').value = settings.contactEmail;
            if (settings.contactPhone) document.getElementById('contactPhone').value = settings.contactPhone;
            if (settings.contactAddress) document.getElementById('contactAddress').value = settings.contactAddress;
            
            // Применяем настройки к админке
            applyAdminSettings(settings);
        } else {
            console.warn('Ошибка загрузки настроек с сервера, используем localStorage');
            loadSettingsFromLocalStorage();
        }
    } catch (error) {
        console.error('Ошибка загрузки настроек:', error);
        loadSettingsFromLocalStorage();
    }
}

function loadSettingsFromLocalStorage() {
    const settings = JSON.parse(localStorage.getItem('eventTicketsSettings')) || {};
    
    if (settings.siteName) document.getElementById('siteName').value = settings.siteName;
    if (settings.logoUrl) document.getElementById('logoUrl').value = settings.logoUrl;
    if (settings.bankName) document.getElementById('bankName').value = settings.bankName;
    if (settings.iban) document.getElementById('iban').value = settings.iban;
    if (settings.bic) document.getElementById('bic').value = settings.bic;
    if (settings.accountHolder) document.getElementById('accountHolder').value = settings.accountHolder;
    
    // Применяем настройки к админке
    applyAdminSettings(settings);
}

// Применение настроек к админке
function applyAdminSettings(settings) {
    if (settings.siteName) {
        // Обновляем все места с названием сайта
        const logoElements = document.querySelectorAll('.admin-logo h2');
        logoElements.forEach(el => {
            el.textContent = settings.siteName;
        });
        document.title = `Админ-панель - ${settings.siteName}`;
    }
    
    // Применяем логотип, если указан
    if (settings.logoUrl) {
        const logoElements = document.querySelectorAll('.admin-logo');
        logoElements.forEach(logoElement => {
            // Удаляем ВСЕ существующие изображения
            const existingImages = logoElement.querySelectorAll('img');
            existingImages.forEach(img => img.remove());
            
            // Создаем новый элемент изображения
            const logoImg = document.createElement('img');
            logoImg.className = 'custom-logo';
            logoImg.src = settings.logoUrl;
            logoImg.alt = settings.siteName || 'Logo';
            logoImg.style.height = '32px';
            logoImg.style.marginBottom = '8px';
            logoImg.style.objectFit = 'contain';
            logoImg.style.display = 'block';
            
            // Вставляем перед заголовком
            const logoTitle = logoElement.querySelector('h2');
            if (logoTitle) {
                logoElement.insertBefore(logoImg, logoTitle);
            }
        });
    }
}

// Настройка навигации
function setupAdminNavigation() {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const section = this.dataset.section;
            switchAdminSection(section);
        });
    });
}

// Переключение разделов
function switchAdminSection(section) {
    // Обновляем активный пункт навигации
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.toggle('active', item.dataset.section === section);
    });
    
    // Показываем нужную секцию
    document.querySelectorAll('.admin-section').forEach(sec => {
        sec.classList.toggle('active', sec.id === `${section}-section`);
    });
    
    // Обновляем заголовок и кнопки
    const titles = {
        events: 'Управление мероприятиями',
        orders: 'Управление заказами',
        guests: 'Список гостей',
        settings: 'Настройки системы'
    };
    
    document.getElementById('sectionTitle').textContent = titles[section];
    
    // Показываем/скрываем кнопку добавления события
    const addBtn = document.getElementById('addEventBtn');
    addBtn.style.display = section === 'events' ? 'block' : 'none';
    
    // Загружаем данные для секции
    if (section === 'guests') {
        loadAdminGuests();
    }
}

// Загрузка событий в админке
function loadAdminEvents() {
    const eventsList = document.getElementById('adminEventsList');
    
    console.log('loadAdminEvents вызвана, adminEvents:', adminEvents);
    console.log('Количество мероприятий:', adminEvents.length);
    
    if (!eventsList) {
        console.error('Элемент adminEventsList не найден!');
        return;
    }
    
    eventsList.innerHTML = '';
    
    if (adminEvents.length === 0) {
        eventsList.innerHTML = `
            <div class="empty-state">
                <h3>Мероприятий пока нет</h3>
                <p>Нажмите "Добавить мероприятие" чтобы создать первое мероприятие</p>
            </div>
        `;
        return;
    }
    
    adminEvents.forEach(event => {
        console.log('Создаем карточку для события:', event);
        const eventCard = createAdminEventCard(event);
        eventsList.appendChild(eventCard);
    });
}

// Создание карточки события для админки
function createAdminEventCard(event) {
    const card = document.createElement('div');
    card.className = 'admin-event-card';
    
    const eventDate = new Date(event.date).toLocaleDateString('ru-RU');
    // Поддержка обоих форматов: старого (t.type - строка) и нового (t.type - объект)
    const ticketTypes = event.tickets.map(t => {
        const ticketType = typeof t.type === 'string' ? t.type : (t.type?.ru || t.type);
        return `${ticketType}: ${t.price}€`;
    }).join(', ');
    
    card.innerHTML = `
        <div class="event-info-admin">
            <h3>${event.title}</h3>
            <div class="event-meta-admin">
                <div>📅 ${eventDate} в ${event.time}</div>
                <div>📍 ${event.location}</div>
                <div>🎫 ${ticketTypes}</div>
            </div>
        </div>
        <div class="event-actions">
            <button class="btn-secondary" onclick="editEvent(${event.id})">Редактировать</button>
            <button class="btn-danger" onclick="deleteEvent(${event.id})">Удалить</button>
        </div>
    `;
    
    return card;
}

// Загрузка заказов
async function loadAdminOrders() {
    const ordersList = document.getElementById('adminOrdersList');
    if (!ordersList) return;
    
    ordersList.innerHTML = '<div class="loading">Загрузка заказов...</div>';
    
    const statusFilter = document.getElementById('statusFilter')?.value || '';
    const eventFilter = document.getElementById('eventFilter')?.value || '';
    
    // Получаем заказы с сервера
    let filteredOrders = await getAllOrders();
    
    if (statusFilter) {
        filteredOrders = filteredOrders.filter(order => order.status.toUpperCase() === statusFilter.toUpperCase());
    }
    
    if (eventFilter) {
        filteredOrders = filteredOrders.filter(order => order.eventId == eventFilter);
    }
    
    // Сортируем по дате создания (новые сначала)
    filteredOrders.sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate));
    
    if (filteredOrders.length === 0) {
        ordersList.innerHTML = `
            <div class="empty-state">
                <h3>Заказов не найдено</h3>
                <p>Пока нет заказов с выбранными фильтрами</p>
            </div>
        `;
        return;
    }
    
    ordersList.innerHTML = '';
    filteredOrders.forEach(order => {
        const orderCard = createAdminOrderCard(order);
        ordersList.appendChild(orderCard);
    });
}

// Создание карточки заказа
function createAdminOrderCard(order) {
    const card = document.createElement('div');
    card.className = 'order-card';
    
    const orderDate = new Date(order.orderDate).toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    const ticketsInfo = order.tickets.map(t => `${t.type} x${t.quantity} (${t.price}€)`).join(', ');
    
    const statusClasses = {
        PENDING: 'status-pending',
        PAID: 'status-paid',
        EXPIRED: 'status-expired'
    };
    
    const statusTexts = {
        PENDING: 'Ожидает оплаты',
        PAID: 'Оплачен',
        EXPIRED: 'Просрочен'
    };
    
    const paymentMethodTexts = {
        transfer: 'Банковский перевод',
        cash: 'Наличные'
    };
    
    card.innerHTML = `
        <div class="order-header">
            <h4>Заказ #${order.id}</h4>
            <div class="order-status ${statusClasses[order.status]}">
                ${statusTexts[order.status]}
            </div>
        </div>
        <div class="order-info">
            <div class="customer-info">
                <div><strong>Клиент:</strong> ${order.customer.name}</div>
                <div><strong>Email:</strong> ${order.customer.email}</div>
                <div><strong>Телефон:</strong> ${order.customer.phone}</div>
            </div>
            <div class="event-info">
                <div><strong>Мероприятие:</strong> ${order.eventTitle.ru}</div>
                <div><strong>Дата события:</strong> ${new Date(order.eventDate).toLocaleDateString('ru-RU')} в ${order.eventTime}</div>
                <div><strong>Место:</strong> ${order.eventLocation.ru}</div>
            </div>
            <div class="order-details">
                <div><strong>Билеты:</strong> ${ticketsInfo}</div>
                <div><strong>Сумма:</strong> ${order.totalAmount}€</div>
                <div><strong>Способ оплаты:</strong> ${paymentMethodTexts[order.paymentMethod]}</div>
                <div><strong>Дата заказа:</strong> ${orderDate}</div>
            </div>
        </div>
        <div class="order-actions">
            ${order.status === 'PENDING' ? 
                `<button class="btn-primary" onclick="confirmPayment('${order.id}')">Подтвердить оплату</button>` : 
                `<button class="btn-secondary" onclick="resendTicket('${order.id}')">Переслать билет</button>`
            }
            <button class="btn-danger" onclick="deleteOrderConfirm('${order.id}')">Удалить</button>
        </div>
    `;
    
    return card;
}

// Загрузка гостей
async function loadAdminGuests() {
    const guestsList = document.getElementById('adminGuestsList');
    const eventFilter = document.getElementById('guestEventFilter')?.value;
    
    if (!guestsList) return;
    
    if (!eventFilter) {
        guestsList.innerHTML = '<p class="loading">Выберите мероприятие для просмотра списка гостей</p>';
        return;
    }
    
    guestsList.innerHTML = '<div class="loading">Загрузка списка гостей...</div>';
    
    // Получаем заказы с сервера
    const allOrders = await getAllOrders();
    const eventOrders = allOrders.filter(order => 
        order.eventId == eventFilter && order.status === 'PAID'
    );
    
    if (eventOrders.length === 0) {
        guestsList.innerHTML = '<p class="loading">Нет оплаченных заказов для выбранного мероприятия</p>';
        return;
    }
    
    let guestsHtml = `
        <div class="guests-header">
            <h3>Список гостей (${eventOrders.length} заказов)</h3>
            <div class="export-buttons">
                <button class="btn-secondary" onclick="exportGuestList()">Экспорт в Excel</button>
            </div>
        </div>
        
        <!-- Обычная таблица для десктопа -->
        <div class="guests-table-wrapper">
            <table class="guests-table">
                <thead>
                    <tr>
                        <th>Заказ</th>
                        <th>Имя</th>
                        <th>Email</th>
                        <th>Телефон</th>
                        <th>Билеты</th>
                        <th>Сумма</th>
                        <th>Статус входа</th>
                        <th>Действия</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    eventOrders.forEach(order => {
        const ticketsInfo = order.tickets.map(t => `${t.type} x${t.quantity}`).join(', ');
        const checkedInStatus = order.checkedIn ? 
            `<span class="checked-in">✓ Вошел ${order.checkedInAt || ''}</span>` : 
            `<button class="check-in-btn" onclick="checkInGuest('${order.id}')">Отметить вход</button>`;
        
        guestsHtml += `
            <tr class="${order.checkedIn ? 'checked-in-row' : ''}">
                <td>#${order.id}</td>
                <td>${order.customer.name}</td>
                <td>${order.customer.email}</td>
                <td>${order.customer.phone}</td>
                <td>${ticketsInfo}</td>
                <td>${order.totalAmount}€</td>
                <td>${checkedInStatus}</td>
                <td>
                    <button class="btn-small" onclick="resendTicket('${order.id}')">Переслать билет</button>
                </td>
            </tr>
        `;
    });
    
    guestsHtml += `
                </tbody>
            </table>
        </div>
        
        <!-- Мобильная версия -->
        <div class="guests-mobile-view">
    `;
    
    eventOrders.forEach(order => {
        const ticketsInfo = order.tickets.map(t => `${t.type} x${t.quantity}`).join(', ');
        const checkedInStatus = order.checkedIn ? 
            `<span class="checked-in">✓ Вошел</span>` : 
            `<button class="check-in-btn" onclick="checkInGuest('${order.id}')">Отметить вход</button>`;
        
        guestsHtml += `
            <div class="guest-card ${order.checkedIn ? 'checked-in-row' : ''}">
                <div class="guest-card-header">
                    <div class="guest-name">${order.customer.name}</div>
                    <div class="guest-actions">
                        ${checkedInStatus}
                    </div>
                </div>
                <div class="guest-details">
                    <div class="guest-detail">
                        <strong>Заказ</strong>
                        #${order.id}
                    </div>
                    <div class="guest-detail">
                        <strong>Email</strong>
                        ${order.customer.email}
                    </div>
                    <div class="guest-detail">
                        <strong>Телефон</strong>
                        ${order.customer.phone}
                    </div>
                    <div class="guest-detail">
                        <strong>Сумма</strong>
                        ${order.totalAmount}€
                    </div>
                    <div class="guest-detail" style="grid-column: 1 / -1;">
                        <strong>Билеты</strong>
                        ${ticketsInfo}
                    </div>
                </div>
                <div class="guest-actions">
                    <button class="btn-small btn-secondary" onclick="resendTicket('${order.id}')">Переслать билет</button>
                </div>
            </div>
        `;
    });
    
    guestsHtml += `
        </div>
    `;
    
    guestsList.innerHTML = guestsHtml;
}

// Настройка модального окна события
function setupEventModal() {
    const addBtn = document.getElementById('addEventBtn');
    const eventForm = document.getElementById('eventForm');
    
    if (!addBtn) {
        console.error('Кнопка addEventBtn не найдена!');
        return;
    }
    
    if (!eventForm) {
        console.error('Форма eventForm не найдена!');
        return;
    }
    
    console.log('Настройка обработчиков модального окна...');
    
    addBtn.addEventListener('click', function(e) {
        e.preventDefault();
        console.log('Клик по кнопке добавления мероприятия');
        openEventModal();
    });
    
    eventForm.addEventListener('submit', handleEventSubmit);
    
    // Добавляем первый тип билета по умолчанию
    addTicketType();
}

// Открытие модального окна события
function openEventModal(eventId = null) {
    console.log('Открытие модального окна, eventId:', eventId);
    
    currentEditingEvent = eventId;
    const modal = document.getElementById('eventModal');
    const title = document.getElementById('eventModalTitle');
    
    if (!modal) {
        console.error('Модальное окно eventModal не найдено!');
        return;
    }
    
    if (!title) {
        console.error('Заголовок eventModalTitle не найден!');
        return;
    }
    
    if (eventId) {
        title.textContent = 'Редактировать мероприятие';
        const event = adminEvents.find(e => e.id === eventId);
        fillEventForm(event);
    } else {
        title.textContent = 'Добавить мероприятие';
        const eventForm = document.getElementById('eventForm');
        if (eventForm) {
            eventForm.reset();
        }
        
        // Очищаем типы билетов и добавляем один пустой
        const ticketTypes = document.getElementById('ticketTypes');
        if (ticketTypes) {
            ticketTypes.innerHTML = '';
            addTicketType();
        }
    }
    
    console.log('Показываем модальное окно');
    modal.classList.add('active');
}

// Закрытие модального окна
function closeEventModal() {
    document.getElementById('eventModal').classList.remove('active');
    currentEditingEvent = null;
}

// Заполнение формы события
function fillEventForm(event) {
    document.getElementById('eventTitle').value = event.title;
    document.getElementById('eventDate').value = event.date;
    document.getElementById('eventTime').value = event.time;
    document.getElementById('eventLocation').value = event.location;
    document.getElementById('eventDescription').value = event.description || '';
    document.getElementById('eventImage').value = event.image || '';
    
    // Заполняем типы билетов
    const ticketTypesContainer = document.getElementById('ticketTypes');
    ticketTypesContainer.innerHTML = '';
    
    event.tickets.forEach(ticket => {
        addTicketType(ticket.type, ticket.price);
    });
}

// Добавление типа билета
function addTicketType(type = '', price = '') {
    console.log('Добавление типа билета:', type, price);
    
    const container = document.getElementById('ticketTypes');
    if (!container) {
        console.error('Контейнер ticketTypes не найден!');
        return;
    }
    
    const ticketDiv = document.createElement('div');
    ticketDiv.className = 'ticket-type-form';
    
    ticketDiv.innerHTML = `
        <div class="form-row">
            <input type="text" placeholder="Тип билета" class="form-control ticket-type-name" value="${type}" required>
            <input type="number" placeholder="Цена" class="form-control ticket-type-price" value="${price}" min="0" required>
            <button type="button" class="btn-danger" onclick="removeTicketType(this)">×</button>
        </div>
    `;
    
    container.appendChild(ticketDiv);
    console.log('Тип билета добавлен');
}

// Удаление типа билета
function removeTicketType(button) {
    const container = document.getElementById('ticketTypes');
    if (container.children.length > 1) {
        button.closest('.ticket-type-form').remove();
    }
}

// Обработка отправки формы события
async function handleEventSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const ticketTypes = [];
    
    // Собираем типы билетов
    document.querySelectorAll('.ticket-type-form').forEach(form => {
        const name = form.querySelector('.ticket-type-name').value;
        const price = parseInt(form.querySelector('.ticket-type-price').value);
        if (name && price) {
            ticketTypes.push({ 
                name_ru: name,
                name_fr: name, // Пока одинаковые, можно будет добавить перевод
                price: price 
            });
        }
    });
    
    const eventData = {
        title_ru: document.getElementById('eventTitle').value,
        title_fr: document.getElementById('eventTitle').value, // Пока одинаковые
        date: document.getElementById('eventDate').value,
        time: document.getElementById('eventTime').value,
        location_ru: document.getElementById('eventLocation').value,
        location_fr: document.getElementById('eventLocation').value, // Пока одинаковые
        description_ru: document.getElementById('eventDescription').value,
        description_fr: document.getElementById('eventDescription').value, // Пока одинаковые
        category: 'other', // По умолчанию
        image: document.getElementById('eventImage').value || '🎪',
        tickets: ticketTypes
    };
    
    try {
        let response;
        if (currentEditingEvent) {
            // Редактирование существующего события
            response = await fetch(`${ADMIN_API_BASE}/events/${currentEditingEvent}`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify(eventData)
            });
        } else {
            // Добавление нового события
            response = await fetch(`${ADMIN_API_BASE}/events`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(eventData)
            });
        }

        if (response.ok) {
            const result = await response.json();
            console.log('Мероприятие сохранено на сервере:', result);
            
            // Перезагружаем данные с сервера
            await loadAdminData();
            
            // Сохраняем в localStorage для синхронизации с клиентской частью
            await saveEventsToStorage();
            
            loadAdminEvents();
            loadEventFilters();
            closeEventModal();
            
            showNotification('Мероприятие успешно сохранено!', 'success');
        } else {
            const error = await response.json();
            console.error('Ошибка сохранения на сервере:', error);
            showNotification('Ошибка сохранения мероприятия: ' + error.error, 'error');
        }
    } catch (error) {
        console.error('Ошибка отправки данных:', error);
        showNotification('Ошибка соединения с сервером', 'error');
    }
}

// Редактирование события
function editEvent(eventId) {
    openEventModal(eventId);
}

// Удаление события
async function deleteEvent(eventId) {
    if (confirm('Вы уверены, что хотите удалить это мероприятие?')) {
        try {
            const response = await fetch(`${ADMIN_API_BASE}/events/${eventId}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });

            if (response.ok) {
                console.log('Мероприятие удалено на сервере');
                
                // Перезагружаем данные с сервера
                await loadAdminData();
                
                // Сохраняем в localStorage для синхронизации
                await saveEventsToStorage();
                
                loadAdminEvents();
                loadEventFilters();
                showNotification('Мероприятие удалено', 'success');
            } else {
                const error = await response.json();
                console.error('Ошибка удаления на сервере:', error);
                showNotification('Ошибка удаления мероприятия: ' + error.error, 'error');
            }
        } catch (error) {
            console.error('Ошибка удаления мероприятия:', error);
            showNotification('Ошибка соединения с сервером', 'error');
        }
    }
}

// Подтверждение оплаты
async function confirmPayment(orderId) {
    const success = await updateOrderStatus(orderId, 'PAID');
    if (success) {
        showNotification('Оплата подтверждена! Билет отправлен клиенту.', 'success');
    } else {
        showNotification('Ошибка при подтверждении оплаты', 'error');
    }
}

// Повторная отправка билета
async function resendTicket(orderId) {
    const orders = await getAllOrders();
    const order = orders.find(o => o.id === orderId);
    if (order) {
        showNotification(`Билет повторно отправлен на email: ${order.customer.email}`, 'success');
    } else {
        showNotification('Заказ не найден', 'error');
    }
}

// Подтверждение удаления заказа
async function deleteOrderConfirm(orderId) {
    const orders = await getAllOrders();
    const order = orders.find(o => o.id === orderId);
    if (!order) {
        showNotification('Заказ не найден', 'error');
        return;
    }
    
    if (confirm(`Вы уверены, что хотите удалить заказ #${orderId}?\nКлиент: ${order.customer.name}\nСумма: ${order.totalAmount}€`)) {
        const success = await deleteOrder(orderId);
        if (success) {
            showNotification('Заказ успешно удален', 'success');
        } else {
            showNotification('Ошибка при удалении заказа', 'error');
        }
    }
}

// Отметка входа гостя
async function checkInGuest(orderId) {
    const orders = await getAllOrders();
    const orderIndex = orders.findIndex(o => o.id === orderId);
    if (orderIndex !== -1) {
        orders[orderIndex].checkedIn = true;
        orders[orderIndex].checkedInAt = new Date().toLocaleString('ru-RU');
        localStorage.setItem('eventTicketsOrders', JSON.stringify(orders));
        await loadAdminGuests();
        showNotification('Гость отмечен как вошедший', 'success');
    }
}

// Экспорт списка гостей
function exportGuests(format) {
    const eventId = document.getElementById('guestEventFilter').value;
    if (!eventId) {
        showNotification('Выберите мероприятие для экспорта', 'error');
        return;
    }
    
    const event = adminEvents.find(e => e.id == eventId);
    const eventOrders = adminOrders.filter(order => 
        order.eventId == eventId && order.status === 'paid'
    );
    
    if (format === 'pdf') {
        // Симуляция экспорта в PDF
        showNotification(`Список гостей для "${event.title}" экспортирован в PDF`, 'success');
    } else if (format === 'excel') {
        // Симуляция экспорта в Excel
        showNotification(`Список гостей для "${event.title}" экспортирован в Excel`, 'success');
    }
}

// Загрузка фильтров событий
function loadEventFilters() {
    const eventFilter = document.getElementById('eventFilter');
    const guestEventFilter = document.getElementById('guestEventFilter');
    
    if (eventFilter) {
        eventFilter.innerHTML = '<option value="">Все мероприятия</option>';
        adminEvents.forEach(event => {
            eventFilter.innerHTML += `<option value="${event.id}">${event.title}</option>`;
        });
        
        eventFilter.addEventListener('change', loadAdminOrders);
    }
    
    if (guestEventFilter) {
        guestEventFilter.innerHTML = '<option value="">Выберите мероприятие</option>';
        adminEvents.forEach(event => {
            guestEventFilter.innerHTML += `<option value="${event.id}">${event.title}</option>`;
        });
        
        guestEventFilter.addEventListener('change', loadAdminGuests);
    }
    
    // Настройка фильтра статусов
    const statusFilter = document.getElementById('statusFilter');
    if (statusFilter) {
        statusFilter.addEventListener('change', loadAdminOrders);
    }
}

// Сохранение настроек
async function saveSettings() {
    const settings = {
        siteName: document.getElementById('siteName').value,
        logoUrl: document.getElementById('logoUrl').value,
        contactEmail: document.getElementById('contactEmail').value,
        contactPhone: document.getElementById('contactPhone').value,
        contactAddress: document.getElementById('contactAddress').value
    };
    
    try {
        const response = await fetch(`${ADMIN_API_BASE}/settings`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(settings)
        });

        if (response.ok) {
            console.log('Настройки сохранены на сервере');
            
            // Также сохраняем в localStorage как резерв
            localStorage.setItem('eventTicketsSettings', JSON.stringify(settings));
            
            // Применяем настройки сразу
            applyAdminSettings(settings);
            
            showNotification('Настройки сохранены', 'success');
        } else {
            const error = await response.json();
            console.error('Ошибка сохранения настроек на сервере:', error);
            showNotification('Ошибка сохранения настроек: ' + error.error, 'error');
        }
    } catch (error) {
        console.error('Ошибка сохранения настроек:', error);
        showNotification('Ошибка соединения с сервером', 'error');
    }
}

// Показ уведомлений
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        z-index: 10000;
        animation: slideIn 0.3s ease;
        ${type === 'success' ? 'background: #48bb78;' : 'background: #f56565;'}
    `;
    
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// CSS анимации для уведомлений
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);

// Экспорт списка гостей
async function exportGuestList() {
    const eventFilter = document.getElementById('guestEventFilter')?.value;
    if (!eventFilter) {
        showNotification('Выберите мероприятие для экспорта', 'error');
        return;
    }
    
    const allOrders = await getAllOrders();
    const eventOrders = allOrders.filter(order => 
        order.eventId == eventFilter && order.status === 'PAID'
    );
    
    if (eventOrders.length === 0) {
        showNotification('Нет данных для экспорта', 'error');
        return;
    }
    
    // Получаем название мероприятия
    const eventTitle = eventOrders[0]?.eventTitle?.ru || 'Мероприятие';
    
    // Создаем CSV данные
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Заказ,Имя,Email,Телефон,Билеты,Сумма,Статус входа,Время входа\n";
    
    eventOrders.forEach(order => {
        const ticketsInfo = order.tickets.map(t => `${t.type} x${t.quantity}`).join('; ');
        const checkedInStatus = order.checkedIn ? 'Вошел' : 'Не вошел';
        const checkedInTime = order.checkedInAt || '';
        
        csvContent += `#${order.id},"${order.customer.name}","${order.customer.email}","${order.customer.phone}","${ticketsInfo}",${order.totalAmount}€,"${checkedInStatus}","${checkedInTime}"\n`;
    });
    
    // Создаем и скачиваем файл
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `guests_${eventTitle}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showNotification('Список гостей экспортирован', 'success');
}

// Функция для получения статистики заказов
async function getOrdersStatistics() {
    const orders = await getAllOrders();
    
    const stats = {
        total: orders.length,
        pending: orders.filter(o => o.status === 'PENDING').length,
        paid: orders.filter(o => o.status === 'PAID').length,
        expired: orders.filter(o => o.status === 'EXPIRED').length,
        totalRevenue: orders.filter(o => o.status === 'PAID').reduce((sum, o) => sum + o.totalAmount, 0),
        checkedIn: orders.filter(o => o.checkedIn).length
    };
    
    return stats;
}

// Обновление статистики на дашборде
async function updateDashboardStats() {
    const stats = await getOrdersStatistics();
    
    // Обновляем элементы статистики, если они есть
    const totalOrdersEl = document.getElementById('totalOrders');
    const pendingOrdersEl = document.getElementById('pendingOrders');
    const paidOrdersEl = document.getElementById('paidOrders');
    const totalRevenueEl = document.getElementById('totalRevenue');
    
    if (totalOrdersEl) totalOrdersEl.textContent = stats.total;
    if (pendingOrdersEl) pendingOrdersEl.textContent = stats.pending;
    if (paidOrdersEl) paidOrdersEl.textContent = stats.paid;
    if (totalRevenueEl) totalRevenueEl.textContent = `${stats.totalRevenue}€`;
}