// Данные для админ-панели
let adminEvents = [
    {
        id: 1,
        title: "Концерт классической музыки",
        date: "2025-02-15",
        time: "19:00",
        location: "Концертный зал «Филармония»",
        description: "Вечер классической музыки с произведениями Чайковского и Рахманинова в исполнении симфонического оркестра.",
        image: "🎼",
        tickets: [
            { type: "Взрослый", price: 2500 },
            { type: "Студенческий", price: 1500 },
            { type: "Детский", price: 1000 }
        ]
    },
    {
        id: 2,
        title: "Театральная постановка «Гамлет»",
        date: "2025-02-20",
        time: "18:30",
        location: "Драматический театр",
        description: "Классическая трагедия Шекспира в современной интерпретации.",
        image: "🎭",
        tickets: [
            { type: "Партер", price: 3000 },
            { type: "Амфитеатр", price: 2000 },
            { type: "Балкон", price: 1500 }
        ]
    }
];

let adminOrders = [
    {
        id: 1001,
        eventId: 1,
        eventTitle: "Концерт классической музыки",
        customerName: "Иван Петров",
        customerEmail: "ivan@example.com",
        customerPhone: "+7 (999) 123-45-67",
        tickets: [
            { type: "Взрослый", quantity: 2, price: 2500 },
            { type: "Детский", quantity: 1, price: 1000 }
        ],
        total: 6000,
        paymentMethod: "transfer",
        status: "pending",
        orderDate: "2025-01-10T14:30:00",
        qrCode: "QR001001"
    },
    {
        id: 1002,
        eventId: 1,
        eventTitle: "Концерт классической музыки",
        customerName: "Мария Сидорова",
        customerEmail: "maria@example.com",
        customerPhone: "+7 (999) 987-65-43",
        tickets: [
            { type: "Взрослый", quantity: 1, price: 2500 }
        ],
        total: 2500,
        paymentMethod: "cash",
        status: "paid",
        orderDate: "2025-01-11T10:15:00",
        qrCode: "QR001002",
        checkedIn: false
    }
];

let currentEditingEvent = null;

// Инициализация админ-панели
document.addEventListener('DOMContentLoaded', function() {
    setupAdminNavigation();
    loadAdminEvents();
    loadAdminOrders();
    setupEventModal();
    loadEventFilters();
});

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
    ordersList.innerHTML = '';
    
    const statusFilter = document.getElementById('statusFilter')?.value || '';
    const eventFilter = document.getElementById('eventFilter')?.value || '';
    
    let filteredOrders = adminOrders;
    
    if (statusFilter) {
        filteredOrders = filteredOrders.filter(order => order.status === statusFilter);
    }
    
    if (eventFilter) {
        filteredOrders = filteredOrders.filter(order => order.eventId == eventFilter);
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
    
    const orderDate = new Date(order.orderDate).toLocaleDateString('ru-RU');
    const ticketsInfo = order.tickets.map(t => `${t.type} x${t.quantity}`).join(', ');
    
    const statusClasses = {
        pending: 'status-pending',
        paid: 'status-paid',
        expired: 'status-expired'
    };
    
    const statusTexts = {
        pending: 'Ожидает оплаты',
        paid: 'Оплачен',
        expired: 'Просрочен'
    };
    
    card.innerHTML = `
        <div class="order-info">
            <h4>Заказ #${order.id}</h4>
            <div class="order-details">
                <div><strong>${order.customerName}</strong> (${order.customerEmail})</div>
                <div>${order.eventTitle}</div>
                <div>${ticketsInfo}</div>
                <div>Сумма: ${order.total}₽ | ${orderDate}</div>
            </div>
        </div>
        <div class="order-status ${statusClasses[order.status]}">
            ${statusTexts[order.status]}
        </div>
        <div class="order-actions">
            ${order.status === 'pending' ? 
                `<button class="btn-primary" onclick="confirmPayment(${order.id})">Подтвердить оплату</button>` : 
                `<button class="btn-secondary" onclick="resendTicket(${order.id})">Переслать билет</button>`
            }
        </div>
    `;
    
    return card;
}

// Загрузка гостей
function loadAdminGuests() {
    const guestsList = document.getElementById('adminGuestsList');
    const eventFilter = document.getElementById('guestEventFilter').value;
    
    if (!eventFilter) {
        guestsList.innerHTML = '<p class="loading">Выберите мероприятие для просмотра списка гостей</p>';
        return;
    }
    
    const eventOrders = adminOrders.filter(order => 
        order.eventId == eventFilter && order.status === 'paid'
    );
    
    if (eventOrders.length === 0) {
        guestsList.innerHTML = '<p class="loading">Нет оплаченных заказов для выбранного мероприятия</p>';
        return;
    }
    
    let guestsHtml = `
        <table class="guests-table">
            <thead>
                <tr>
                    <th>Имя</th>
                    <th>Email</th>
                    <th>Телефон</th>
                    <th>Билеты</th>
                    <th>QR-код</th>
                    <th>Статус входа</th>
                    <th>Действия</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    eventOrders.forEach(order => {
        const ticketsInfo = order.tickets.map(t => `${t.type} x${t.quantity}`).join(', ');
        const checkedInStatus = order.checkedIn ? 
            '<span class="checked-in">✓ Вошел</span>' : 
            '<button class="check-in-btn" onclick="checkInGuest(' + order.id + ')">Отметить вход</button>';
        
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
    const orderIndex = adminOrders.findIndex(o => o.id === orderId);
    if (orderIndex !== -1) {
        adminOrders[orderIndex].status = 'paid';
        adminOrders[orderIndex].checkedIn = false;
        loadAdminOrders();
        showNotification('Оплата подтверждена! Билет отправлен клиенту.', 'success');
    }
}

// Повторная отправка билета
function resendTicket(orderId) {
    showNotification('Билет повторно отправлен на email клиента', 'success');
}

// Отметка входа гостя
function checkInGuest(orderId) {
    const orderIndex = adminOrders.findIndex(o => o.id === orderId);
    if (orderIndex !== -1) {
        adminOrders[orderIndex].checkedIn = true;
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
        bankName: document.getElementById('bankName').value,
        iban: document.getElementById('iban').value,
        bic: document.getElementById('bic').value,
        accountHolder: document.getElementById('accountHolder').value
    };
    
    // В реальном приложении здесь была бы отправка на сервер
    localStorage.setItem('eventTicketsSettings', JSON.stringify(settings));
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