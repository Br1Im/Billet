// Глобальные переменные для админ-панели
let adminEvents = [];
let adminSettings = {};

// Загрузка данных из JSON файлов
async function loadAdminData() {
    try {
        // Загружаем мероприятия
        const eventsResponse = await fetch('./data/events.json');
        if (eventsResponse.ok) {
            const events = await eventsResponse.json();
            adminEvents = events.map(event => ({
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
        } else {
            console.warn('Не удалось загрузить events.json');
            adminEvents = getDefaultAdminEvents();
        }

        // Загружаем настройки
        const settingsResponse = await fetch('./data/settings.json');
        if (settingsResponse.ok) {
            adminSettings = await settingsResponse.json();
        } else {
            console.warn('Не удалось загрузить settings.json');
            adminSettings = getDefaultSettings();
        }
    } catch (error) {
        console.error('Ошибка загрузки данных:', error);
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

// Функции для работы с заказами из localStorage
function getAllOrders() {
    try {
        return JSON.parse(localStorage.getItem('eventTicketsOrders')) || [];
    } catch (error) {
        console.error('Ошибка загрузки заказов:', error);
        return [];
    }
}

function updateOrderStatus(orderId, newStatus) {
    try {
        const orders = getAllOrders();
        const orderIndex = orders.findIndex(order => order.id === orderId);
        
        if (orderIndex !== -1) {
            orders[orderIndex].status = newStatus;
            orders[orderIndex].updatedAt = new Date().toLocaleString('ru-RU');
            
            localStorage.setItem('eventTicketsOrders', JSON.stringify(orders));
            
            // Сохраняем в JSON файл
            saveOrdersToJSON(orders);
            
            // Обновляем отображение
            loadAdminOrders();
            return true;
        }
        return false;
    } catch (error) {
        console.error('Ошибка обновления заказа:', error);
        return false;
    }
}

function deleteOrder(orderId) {
    try {
        const orders = getAllOrders();
        const filteredOrders = orders.filter(order => order.id !== orderId);
        
        localStorage.setItem('eventTicketsOrders', JSON.stringify(filteredOrders));
        
        // Сохраняем в JSON файл
        saveOrdersToJSON(filteredOrders);
        
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
            
            localStorage.setItem('eventTicketsOrders', JSON.stringify(orders));
            
            // Обновляем отображение
            loadAdminOrders();
            return true;
        }
        return false;
    } catch (error) {
        console.error('Ошибка обновления заказа:', error);
        return false;
    }
}

function deleteOrder(orderId) {
    try {
        const orders = getAllOrders();
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

let currentEditingEvent = null;

// Инициализация админ-панели
document.addEventListener('DOMContentLoaded', async function() {
    // Загружаем данные из JSON файлов
    await loadAdminData();
    
    setupAdminNavigation();
    loadAdminEvents();
    loadAdminOrders();
    setupEventModal();
    loadEventFilters();
    loadSettings();
    updateDashboardStats();
    initCursorFollower();
    
    // Обновляем статистику каждые 30 секунд
    setInterval(updateDashboardStats, 30000);
});

// Инициализация следящего курсора
function initCursorFollower() {
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
function loadSettings() {
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
        document.querySelector('.admin-logo h2').textContent = settings.siteName;
        document.title = `Админ-панель - ${settings.siteName}`;
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
    eventsList.innerHTML = '';
    
    adminEvents.forEach(event => {
        const eventCard = createAdminEventCard(event);
        eventsList.appendChild(eventCard);
    });
}

// Создание карточки события для админки
function createAdminEventCard(event) {
    const card = document.createElement('div');
    card.className = 'admin-event-card';
    
    const eventDate = new Date(event.date).toLocaleDateString('ru-RU');
    const ticketTypes = event.tickets.map(t => `${t.type}: ${t.price}₽`).join(', ');
    
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
function loadAdminOrders() {
    const ordersList = document.getElementById('adminOrdersList');
    if (!ordersList) return;
    
    ordersList.innerHTML = '';
    
    const statusFilter = document.getElementById('statusFilter')?.value || '';
    const eventFilter = document.getElementById('eventFilter')?.value || '';
    
    // Получаем заказы из localStorage
    let filteredOrders = getAllOrders();
    
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
    
    const ticketsInfo = order.tickets.map(t => `${t.type} x${t.quantity} (${t.price}₽)`).join(', ');
    
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
                <div><strong>Сумма:</strong> ${order.totalAmount}₽</div>
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
function loadAdminGuests() {
    const guestsList = document.getElementById('adminGuestsList');
    const eventFilter = document.getElementById('guestEventFilter')?.value;
    
    if (!guestsList) return;
    
    if (!eventFilter) {
        guestsList.innerHTML = '<p class="loading">Выберите мероприятие для просмотра списка гостей</p>';
        return;
    }
    
    // Получаем заказы из localStorage
    const allOrders = getAllOrders();
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
            <button class="btn-secondary" onclick="exportGuestList()">Экспорт в Excel</button>
        </div>
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
                <td>${order.totalAmount}₽</td>
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
    `;
    
    guestsList.innerHTML = guestsHtml;
}
        
        guestsHtml += `
            <tr>
                <td>${order.customerName}</td>
                <td>${order.customerEmail}</td>
                <td>${order.customerPhone}</td>
                <td>${ticketsInfo}</td>
                <td>${order.qrCode}</td>
                <td>${checkedInStatus}</td>
                <td>
                    <button class="btn-secondary" onclick="resendTicket(${order.id})">Переслать билет</button>
                </td>
            </tr>
        `;
    });
    
    guestsHtml += '</tbody></table>';
    guestsList.innerHTML = guestsHtml;
}

// Настройка модального окна события
function setupEventModal() {
    document.getElementById('addEventBtn').addEventListener('click', openEventModal);
    document.getElementById('eventForm').addEventListener('submit', handleEventSubmit);
    
    // Добавляем первый тип билета по умолчанию
    addTicketType();
}

// Открытие модального окна события
function openEventModal(eventId = null) {
    currentEditingEvent = eventId;
    const modal = document.getElementById('eventModal');
    const title = document.getElementById('eventModalTitle');
    
    if (eventId) {
        title.textContent = 'Редактировать мероприятие';
        const event = adminEvents.find(e => e.id === eventId);
        fillEventForm(event);
    } else {
        title.textContent = 'Добавить мероприятие';
        document.getElementById('eventForm').reset();
        // Очищаем типы билетов и добавляем один пустой
        document.getElementById('ticketTypes').innerHTML = '';
        addTicketType();
    }
    
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
    const container = document.getElementById('ticketTypes');
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
}

// Удаление типа билета
function removeTicketType(button) {
    const container = document.getElementById('ticketTypes');
    if (container.children.length > 1) {
        button.closest('.ticket-type-form').remove();
    }
}

// Обработка отправки формы события
function handleEventSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const ticketTypes = [];
    
    // Собираем типы билетов
    document.querySelectorAll('.ticket-type-form').forEach(form => {
        const name = form.querySelector('.ticket-type-name').value;
        const price = parseInt(form.querySelector('.ticket-type-price').value);
        if (name && price) {
            ticketTypes.push({ type: name, price: price });
        }
    });
    
    const eventData = {
        title: document.getElementById('eventTitle').value,
        date: document.getElementById('eventDate').value,
        time: document.getElementById('eventTime').value,
        location: document.getElementById('eventLocation').value,
        description: document.getElementById('eventDescription').value,
        image: document.getElementById('eventImage').value || '🎪',
        tickets: ticketTypes
    };
    
    if (currentEditingEvent) {
        // Редактирование существующего события
        const eventIndex = adminEvents.findIndex(e => e.id === currentEditingEvent);
        adminEvents[eventIndex] = { ...adminEvents[eventIndex], ...eventData };
    } else {
        // Добавление нового события
        const newId = Math.max(...adminEvents.map(e => e.id)) + 1;
        adminEvents.push({ id: newId, ...eventData });
    }
    
    loadAdminEvents();
    loadEventFilters();
    closeEventModal();
    
    // Показываем уведомление об успехе
    showNotification('Мероприятие успешно сохранено!', 'success');
}

// Редактирование события
function editEvent(eventId) {
    openEventModal(eventId);
}

// Удаление события
function deleteEvent(eventId) {
    if (confirm('Вы уверены, что хотите удалить это мероприятие?')) {
        adminEvents = adminEvents.filter(e => e.id !== eventId);
        loadAdminEvents();
        loadEventFilters();
        showNotification('Мероприятие удалено', 'success');
    }
}

// Подтверждение оплаты
function confirmPayment(orderId) {
    if (updateOrderStatus(orderId, 'PAID')) {
        showNotification('Оплата подтверждена! Билет отправлен клиенту.', 'success');
    } else {
        showNotification('Ошибка при подтверждении оплаты', 'error');
    }
}

// Повторная отправка билета
function resendTicket(orderId) {
    const order = getAllOrders().find(o => o.id === orderId);
    if (order) {
        showNotification(`Билет повторно отправлен на email: ${order.customer.email}`, 'success');
    } else {
        showNotification('Заказ не найден', 'error');
    }
}

// Подтверждение удаления заказа
function deleteOrderConfirm(orderId) {
    const order = getAllOrders().find(o => o.id === orderId);
    if (!order) {
        showNotification('Заказ не найден', 'error');
        return;
    }
    
    if (confirm(`Вы уверены, что хотите удалить заказ #${orderId}?\nКлиент: ${order.customer.name}\nСумма: ${order.totalAmount}₽`)) {
        if (deleteOrder(orderId)) {
            showNotification('Заказ успешно удален', 'success');
        } else {
            showNotification('Ошибка при удалении заказа', 'error');
        }
    }
}

// Отметка входа гостя
function checkInGuest(orderId) {
    const orders = getAllOrders();
    const orderIndex = orders.findIndex(o => o.id === orderId);
    if (orderIndex !== -1) {
        orders[orderIndex].checkedIn = true;
        orders[orderIndex].checkedInAt = new Date().toLocaleString('ru-RU');
        localStorage.setItem('eventTicketsOrders', JSON.stringify(orders));
        loadAdminGuests();
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
function saveSettings() {
    const settings = {
        siteName: document.getElementById('siteName').value,
        logoUrl: document.getElementById('logoUrl').value,
        bankName: document.getElementById('bankName').value,
        iban: document.getElementById('iban').value,
        bic: document.getElementById('bic').value,
        accountHolder: document.getElementById('accountHolder').value
    };
    
    // В реальном приложении здесь была бы отправка на сервер
    localStorage.setItem('eventTicketsSettings', JSON.stringify(settings));
    
    // Применяем настройки сразу
    applyAdminSettings(settings);
    
    showNotification('Настройки сохранены', 'success');
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
function exportGuestList() {
    const eventFilter = document.getElementById('guestEventFilter')?.value;
    if (!eventFilter) {
        showNotification('Выберите мероприятие для экспорта', 'error');
        return;
    }
    
    const allOrders = getAllOrders();
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
        
        csvContent += `#${order.id},"${order.customer.name}","${order.customer.email}","${order.customer.phone}","${ticketsInfo}",${order.totalAmount}₽,"${checkedInStatus}","${checkedInTime}"\n`;
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
function getOrdersStatistics() {
    const orders = getAllOrders();
    
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
function updateDashboardStats() {
    const stats = getOrdersStatistics();
    
    // Обновляем элементы статистики, если они есть
    const totalOrdersEl = document.getElementById('totalOrders');
    const pendingOrdersEl = document.getElementById('pendingOrders');
    const paidOrdersEl = document.getElementById('paidOrders');
    const totalRevenueEl = document.getElementById('totalRevenue');
    
    if (totalOrdersEl) totalOrdersEl.textContent = stats.total;
    if (pendingOrdersEl) pendingOrdersEl.textContent = stats.pending;
    if (paidOrdersEl) paidOrdersEl.textContent = stats.paid;
    if (totalRevenueEl) totalRevenueEl.textContent = `${stats.totalRevenue}₽`;
}