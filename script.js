// Глобальные переменные
let events = [];
let settings = {};

// Загрузка данных из JSON файлов и localStorage
async function loadData() {
    try {
        // Сначала пробуем загрузить из localStorage (приоритет)
        const storedEvents = localStorage.getItem('eventTicketsEvents');
        if (storedEvents) {
            const parsedEvents = JSON.parse(storedEvents);
            // Конвертируем в формат клиентской части
            events = parsedEvents.map(event => ({
                id: event.id,
                title: {
                    ru: event.title || event.titleRu || 'Мероприятие',
                    fr: event.titleFr || event.title || 'Événement'
                },
                date: event.date,
                time: event.time,
                location: {
                    ru: event.location || event.locationRu || 'Место проведения',
                    fr: event.locationFr || event.location || 'Lieu'
                },
                description: {
                    ru: event.description || event.descriptionRu || 'Описание мероприятия',
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
            console.log('Мероприятия загружены из localStorage:', events);
        } else {
            // Если в localStorage нет данных, загружаем из JSON
            const eventsResponse = await fetch('./data/events.json');
            if (eventsResponse.ok) {
                events = await eventsResponse.json();
                console.log('Мероприятия загружены из JSON:', events);
            } else {
                console.warn('Не удалось загрузить events.json, используем данные по умолчанию');
                events = getDefaultEvents();
            }
        }

        // Загружаем настройки
        const settingsResponse = await fetch('./data/settings.json');
        if (settingsResponse.ok) {
            settings = await settingsResponse.json();
        } else {
            console.warn('Не удалось загрузить settings.json, используем настройки по умолчанию');
            settings = getDefaultSettings();
        }
    } catch (error) {
        console.error('Ошибка загрузки данных:', error);
        events = getDefaultEvents();
        settings = getDefaultSettings();
    }
}

// Данные по умолчанию (fallback)
function getDefaultEvents() {
    return [
        {
            id: 1,
            title: {
                ru: "Концерт классической музыки",
                fr: "Concert de musique classique"
            },
            date: "2025-02-15",
            time: "19:00",
            location: {
                ru: "Концертный зал «Филармония»",
                fr: "Salle de concert «Philharmonie»"
            },
            description: {
                ru: "Вечер классической музыки с произведениями Чайковского и Рахманинова в исполнении симфонического оркестра.",
                fr: "Soirée de musique classique avec des œuvres de Tchaïkovski et Rachmaninov interprétées par l'orchestre symphonique."
            },
            category: "music",
            image: "🎼",
            tickets: [
                { id: "adult", type: { ru: "Взрослый", fr: "Adulte" }, price: 2500 },
                { id: "student", type: { ru: "Студенческий", fr: "Étudiant" }, price: 1500 },
                { id: "child", type: { ru: "Детский", fr: "Enfant" }, price: 1000 }
            ]
        },
        {
            id: 2,
            title: {
                ru: "Театральная постановка «Гамлет»",
                fr: "Représentation théâtrale «Hamlet»"
            },
            date: "2025-02-20",
            time: "18:30",
            location: {
                ru: "Драматический театр",
                fr: "Théâtre dramatique"
            },
            description: {
                ru: "Классическая трагедия Шекспира в современной интерпретации. Режиссер - лауреат премии «Золотая маска».",
                fr: "La tragédie classique de Shakespeare dans une interprétation moderne. Mise en scène par un lauréat du prix «Masque d'Or»."
            },
            category: "theater",
            image: "🎭",
            tickets: [
                { id: "parterre", type: { ru: "Партер", fr: "Parterre" }, price: 3000 },
                { id: "amphitheater", type: { ru: "Амфитеатр", fr: "Amphithéâtre" }, price: 2000 },
                { id: "balcony", type: { ru: "Балкон", fr: "Balcon" }, price: 1500 }
            ]
        },
        {
            id: 3,
            title: {
                ru: "Выставка современного искусства",
                fr: "Exposition d'art contemporain"
            },
            date: "2025-02-25",
            time: "10:00",
            location: {
                ru: "Галерея современного искусства",
                fr: "Galerie d'art contemporain"
            },
            description: {
                ru: "Уникальная выставка работ современных художников. Более 100 произведений живописи, скульптуры и инсталляций.",
                fr: "Exposition unique d'œuvres d'artistes contemporains. Plus de 100 œuvres de peinture, sculpture et installations."
            },
            category: "art",
            image: "🎨",
            tickets: [
                { id: "full", type: { ru: "Полный билет", fr: "Billet complet" }, price: 800 },
                { id: "student", type: { ru: "Студенческий", fr: "Étudiant" }, price: 400 },
                { id: "group", type: { ru: "Групповой (от 5 чел.)", fr: "Groupe (à partir de 5 pers.)" }, price: 600 }
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
        title: {
            ru: "Выставка современного искусства",
            fr: "Exposition d'art contemporain"
        },
        date: "2025-03-01",
        time: "10:00",
        location: {
            ru: "Музей современного искусства",
            fr: "Musée d'art contemporain"
        },
        description: {
            ru: "Уникальная выставка работ современных художников. Более 100 произведений живописи и скульптуры.",
            fr: "Exposition unique d'œuvres d'artistes contemporains. Plus de 100 œuvres de peinture et de sculpture."
        },
        image: "🎨",
        tickets: [
            { type: { ru: "Взрослый", fr: "Adulte" }, price: 800 },
            { type: { ru: "Льготный", fr: "Tarif réduit" }, price: 400 },
            { type: { ru: "Детский", fr: "Enfant" }, price: 200 }
        ]
    }
];

// Переводы
const translations = {
    ru: {
        title: "EventTickets - Билеты на мероприятия",
        newEvents: "Новые мероприятия",
        heroTitle: "Актуальные мероприятия",
        heroSubtitle: "Выберите интересующее вас событие и забронируйте билеты",
        upcomingEvents: "Предстоящие события",
        filterAll: "Все мероприятия",
        whyChooseUs: "Почему выбирают нас",
        feature1Title: "Простое бронирование",
        feature1Text: "Забронируйте билеты за пару кликов",
        feature2Title: "Удобная оплата",
        feature2Text: "Перевод или наличные на выбор",
        feature3Title: "Электронные билеты",
        feature3Text: "QR-код на вашем телефоне",
        feature4Title: "Безопасность",
        feature4Text: "Защита ваших данных",
        footerText: "Ваш надежный партнер в мире событий",
        contactsTitle: "Контакты",
        socialTitle: "Социальные сети",
        copyright: "Все права защищены.",
        from: "от",
        selectTickets: "Выберите билеты",
        quantity: "Количество",
        total: "Итого",
        orderTickets: "Заказать билеты",
        customerInfo: "Информация о покупателе",
        name: "Имя и фамилия",
        email: "Email",
        phone: "Телефон",
        paymentMethod: "Способ оплаты",
        bankTransfer: "Банковский перевод",
        bankTransferDesc: "Оплата по реквизитам",
        cash: "Наличные",
        cashDesc: "Оплата при встрече",
        submitOrder: "Оформить заказ",
        orderSuccess: "Заказ успешно оформлен!",
        orderSuccessDesc: "На указанный email отправлены инструкции по оплате. После подтверждения оплаты вы получите электронный билет с QR-кодом.",
        loading: "Загрузка...",
        error: "Произошла ошибка",
        close: "Закрыть",
        backToEvents: "Вернуться к мероприятиям",
        stats1: "Мероприятий",
        stats2: "Гостей",
        stats3: "Довольных"
    },
    fr: {
        title: "EventTickets - Billets d'événements",
        newEvents: "Nouveaux événements",
        heroTitle: "Événements actuels",
        heroSubtitle: "Choisissez l'événement qui vous intéresse et réservez vos billets",
        upcomingEvents: "Événements à venir",
        filterAll: "Tous les événements",
        whyChooseUs: "Pourquoi nous choisir",
        feature1Title: "Réservation simple",
        feature1Text: "Réservez vos billets en quelques clics",
        feature2Title: "Paiement pratique",
        feature2Text: "Virement ou espèces au choix",
        feature3Title: "Billets électroniques",
        feature3Text: "Code QR sur votre téléphone",
        feature4Title: "Sécurité",
        feature4Text: "Protection de vos données",
        footerText: "Votre partenaire fiable dans le monde des événements",
        contactsTitle: "Contacts",
        socialTitle: "Réseaux sociaux",
        copyright: "Tous droits réservés.",
        from: "à partir de",
        selectTickets: "Sélectionner les billets",
        quantity: "Quantité",
        total: "Total",
        orderTickets: "Commander des billets",
        customerInfo: "Informations sur l'acheteur",
        name: "Nom et prénom",
        email: "Email",
        phone: "Téléphone",
        paymentMethod: "Mode de paiement",
        bankTransfer: "Virement bancaire",
        bankTransferDesc: "Paiement par coordonnées bancaires",
        cash: "Espèces",
        cashDesc: "Paiement en personne",
        submitOrder: "Passer la commande",
        orderSuccess: "Commande passée avec succès!",
        orderSuccessDesc: "Les instructions de paiement ont été envoyées à l'email indiqué. Après confirmation du paiement, vous recevrez un billet électronique avec code QR.",
        loading: "Chargement...",
        error: "Une erreur s'est produite",
        close: "Fermer",
        backToEvents: "Retour aux événements",
        stats1: "Événements",
        stats2: "Invités",
        stats3: "Satisfaits"
    }
};

let currentLang = localStorage.getItem('selectedLanguage') || 'ru';
let currentEvent = null;
let cart = {};

// Инициализация приложения
document.addEventListener('DOMContentLoaded', async function() {
    // Загружаем данные из JSON файлов
    await loadData();
    
    // Устанавливаем сохраненный язык
    setInitialLanguage();
    loadSiteSettings();
    loadEvents();
    setupLanguageSwitcher();
    setupEventHandlers();
    initCursorFollower();
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
    const interactiveElements = document.querySelectorAll('a, button, input, select, textarea, .card, .logo');
    
    interactiveElements.forEach(el => {
        el.addEventListener('mouseenter', () => follower.classList.add('active'));
        el.addEventListener('mouseleave', () => follower.classList.remove('active'));
    });
    
    // Отслеживаем новые элементы (через MutationObserver или просто делегирование, но пока так)
    document.addEventListener('mouseover', (e) => {
        if (e.target.matches('a, button, .btn-primary, .nav-item, .card')) {
            follower.classList.add('active');
        }
    });
    
    document.addEventListener('mouseout', (e) => {
        if (e.target.matches('a, button, .btn-primary, .nav-item, .card')) {
            follower.classList.remove('active');
        }
    });
}

// Загрузка настроек сайта
function loadSiteSettings() {
    const settings = JSON.parse(localStorage.getItem('eventTicketsSettings')) || {};
    
    if (settings.siteName) {
        // Обновляем заголовок на странице
        const logoTitle = document.querySelector('.logo h1');
        if (logoTitle) logoTitle.textContent = settings.siteName;
        
        // Обновляем title страницы
        document.title = settings.siteName;
        
        // Обновляем переводы, чтобы при переключении языка имя сохранялось
        translations.ru.title = settings.siteName;
        translations.fr.title = settings.siteName;
        
        // Обновляем футер
        const footerTitle = document.querySelector('.footer-section h4');
        if (footerTitle && footerTitle.textContent === 'EventTickets') {
            footerTitle.textContent = settings.siteName;
        }
    }
    
    if (settings.logoUrl) {
        const logoContainer = document.querySelector('.logo');
        if (logoContainer) {
            const oldIcon = logoContainer.querySelector('.logo-icon');
            if (oldIcon) oldIcon.style.display = 'none';
            
            // Проверяем, есть ли уже изображение логотипа
            let logoImg = logoContainer.querySelector('.custom-logo');
            if (!logoImg) {
                logoImg = document.createElement('img');
                logoImg.className = 'custom-logo';
                logoImg.style.height = '40px';
                logoImg.style.marginRight = '10px';
                logoContainer.insertBefore(logoImg, logoContainer.querySelector('h1'));
            }
            logoImg.src = settings.logoUrl;
            logoImg.alt = settings.siteName || 'Logo';
        }
    }
}

// Установка начального языка
function setInitialLanguage() {
    // Обновляем активную кнопку
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.lang === currentLang);
    });
    
    // Обновляем заголовок
    document.title = translations[currentLang].title;
    
    // Обновляем контент
    updatePageTexts();
}

// Загрузка событий на главную страницу
function loadEvents() {
    const eventsGrid = document.getElementById('eventsGrid');
    if (!eventsGrid) return;

    eventsGrid.innerHTML = '';
    
    events.forEach(event => {
        const eventCard = createEventCard(event);
        eventsGrid.appendChild(eventCard);
    });
}

// Создание карточки события
function createEventCard(event) {
    const card = document.createElement('div');
    card.className = 'event-card';
    card.onclick = () => openEventDetail(event.id);
    
    const eventDate = new Date(event.date).toLocaleDateString(currentLang === 'ru' ? 'ru-RU' : 'fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
    
    const minPrice = Math.min(...event.tickets.map(t => t.price));
    const title = typeof event.title === 'object' ? event.title[currentLang] : event.title;
    const location = typeof event.location === 'object' ? event.location[currentLang] : event.location;
    const fromText = translations[currentLang].from;
    
    card.innerHTML = `
        <div class="event-image">${event.image}</div>
        <div class="event-content">
            <h3 class="event-title">${title}</h3>
            <div class="event-date">${eventDate} в ${event.time}</div>
            <div class="event-location">${location}</div>
            <div class="event-price">${fromText} ${minPrice} ₽</div>
        </div>
    `;
    
    return card;
}

// Открытие детальной страницы события
function openEventDetail(eventId) {
    const event = events.find(e => e.id === eventId);
    if (!event) return;
    
    currentEvent = event;
    cart = {};
    
    // Сохраняем текущий язык перед переходом
    localStorage.setItem('selectedLanguage', currentLang);
    
    // Создаем страницу события
    document.body.innerHTML = createEventDetailPage(event);
    setupEventDetailHandlers();
}

// Создание страницы детального просмотра события
function createEventDetailPage(event) {
    const eventDate = new Date(event.date).toLocaleDateString(currentLang === 'ru' ? 'ru-RU' : 'fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
    
    const title = typeof event.title === 'object' ? event.title[currentLang] : event.title;
    const location = typeof event.location === 'object' ? event.location[currentLang] : event.location;
    const description = typeof event.description === 'object' ? event.description[currentLang] : event.description;
    
    return `
        <header class="header">
            <div class="container">
                <div class="header-content">
                    <div class="logo">
                        <h1 onclick="location.reload()">EventTickets</h1>
                    </div>
                    <nav class="nav">
                        <div class="language-switcher">
                            <button class="lang-btn ${currentLang === 'ru' ? 'active' : ''}" data-lang="ru">RU</button>
                            <button class="lang-btn ${currentLang === 'fr' ? 'active' : ''}" data-lang="fr">FR</button>
                        </div>
                    </nav>
                </div>
            </div>
        </header>

        <main class="main">
            <section class="event-detail">
                <div class="container">
                    <div class="event-header">
                        <div class="event-info">
                            <div class="event-details">
                                <h1>${title}</h1>
                                <div class="event-meta">
                                    <div class="meta-item">
                                        <span>�</sspan>
                                        <span>${eventDate} в ${event.time}</span>
                                    </div>
                                    <div class="meta-item">
                                        <span>📍</span>
                                        <span>${location}</span>
                                    </div>
                                </div>
                                <p class="event-description">${description}</p>
                            </div>
                            <div class="ticket-selection">
                                <h3>${translations[currentLang].selectTickets}</h3>
                                ${event.tickets.map(ticket => createTicketSelector(ticket)).join('')}
                                <div class="total-section">
                                    <div class="total-price" id="totalPrice">${translations[currentLang].total}: 0 ₽</div>
                                    <button class="btn-primary" onclick="showOrderForm()" id="orderBtn" disabled>
                                        ${translations[currentLang].orderTickets}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="order-form" id="orderForm" style="display: none;">
                        <h3>${translations[currentLang].customerInfo}</h3>
                        <form id="customerForm">
                            <div class="form-group">
                                <label for="customerName">${translations[currentLang].name} *</label>
                                <input type="text" id="customerName" class="form-control" required>
                            </div>
                            <div class="form-group">
                                <label for="customerEmail">${translations[currentLang].email} *</label>
                                <input type="email" id="customerEmail" class="form-control" required>
                            </div>
                            <div class="form-group">
                                <label for="customerPhone">${translations[currentLang].phone} *</label>
                                <input type="tel" id="customerPhone" class="form-control" required>
                            </div>
                            <div class="form-group">
                                <label>${translations[currentLang].paymentMethod} *</label>
                                <div class="payment-methods">
                                    <div class="payment-option selected" data-method="transfer">
                                        <h4>${translations[currentLang].bankTransfer}</h4>
                                        <p>${translations[currentLang].bankTransferDesc}</p>
                                    </div>
                                    <div class="payment-option" data-method="cash">
                                        <h4>${translations[currentLang].cash}</h4>
                                        <p>${translations[currentLang].cashDesc}</p>
                                    </div>
                                </div>
                            </div>
                            <button type="submit" class="btn-primary">
                                ${translations[currentLang].submitOrder}
                            </button>
                        </form>
                    </div>
                </div>
            </section>
        </main>

        <footer class="footer">
            <div class="container">
                <p>&copy; 2025 EventTickets. Все права защищены.</p>
            </div>
        </footer>
    `;
}

// Создание селектора билетов
function createTicketSelector(ticket) {
    const ticketType = typeof ticket.type === 'object' ? ticket.type[currentLang] : ticket.type;
    
    return `
        <div class="ticket-type">
            <div class="ticket-info">
                <h4>${ticketType}</h4>
                <div class="ticket-price">${ticket.price} ₽</div>
            </div>
            <div class="quantity-control">
                <button type="button" class="qty-btn" onclick="changeQuantity('${ticketType}', -1)">−</button>
                <input type="number" class="qty-input" value="0" min="0" max="10" 
                       id="qty-${ticketType}" onchange="updateQuantity('${ticketType}', this.value)">
                <button type="button" class="qty-btn" onclick="changeQuantity('${ticketType}', 1)">+</button>
            </div>
        </div>
    `;
}

// Настройка обработчиков для страницы события
function setupEventDetailHandlers() {
    loadSiteSettings();
    setupLanguageSwitcher();
    
    // Обработчики для способов оплаты
    document.querySelectorAll('.payment-option').forEach(option => {
        option.addEventListener('click', function() {
            document.querySelectorAll('.payment-option').forEach(opt => opt.classList.remove('selected'));
            this.classList.add('selected');
        });
    });
    
    // Обработчик формы заказа
    document.getElementById('customerForm').addEventListener('submit', handleOrderSubmit);
}

// Изменение количества билетов
function changeQuantity(ticketType, delta) {
    const input = document.getElementById(`qty-${ticketType}`);
    const currentValue = parseInt(input.value) || 0;
    const newValue = Math.max(0, Math.min(10, currentValue + delta));
    input.value = newValue;
    updateQuantity(ticketType, newValue);
}

// Обновление количества билетов
function updateQuantity(ticketType, quantity) {
    const qty = Math.max(0, Math.min(10, parseInt(quantity) || 0));
    document.getElementById(`qty-${ticketType}`).value = qty;
    
    if (qty > 0) {
        cart[ticketType] = qty;
    } else {
        delete cart[ticketType];
    }
    
    updateTotal();
}

// Обновление общей суммы
function updateTotal() {
    let total = 0;
    let hasItems = false;
    
    Object.keys(cart).forEach(ticketType => {
        const ticket = currentEvent.tickets.find(t => {
            const type = typeof t.type === 'object' ? t.type[currentLang] : t.type;
            return type === ticketType;
        });
        if (ticket) {
            total += ticket.price * cart[ticketType];
            hasItems = true;
        }
    });
    
    document.getElementById('totalPrice').textContent = `${translations[currentLang].total}: ${total} ₽`;
    document.getElementById('orderBtn').disabled = !hasItems;
}

// Показать форму заказа
function showOrderForm() {
    document.getElementById('orderForm').style.display = 'block';
    document.getElementById('orderForm').scrollIntoView({ behavior: 'smooth' });
}

// Обработка отправки заказа
function handleOrderSubmit(e) {
    e.preventDefault();
    
    const customerData = {
        name: document.getElementById('customerName').value,
        email: document.getElementById('customerEmail').value,
        phone: document.getElementById('customerPhone').value,
        paymentMethod: document.querySelector('.payment-option.selected').dataset.method
    };
    
    // Создаем заказ
    const order = createOrder(customerData);
    
    // Сохраняем заказ
    saveOrder(order);
    
    // Показываем сообщение об успехе
    showSuccessMessage(order);
}

// Создание заказа
function createOrder(customerData) {
    const orderId = generateOrderId();
    const orderDate = new Date().toISOString();
    
    // Подготавливаем билеты
    const tickets = [];
    let totalAmount = 0;
    
    Object.keys(cart).forEach(ticketType => {
        const ticket = currentEvent.tickets.find(t => {
            const type = typeof t.type === 'object' ? t.type[currentLang] : t.type;
            return type === ticketType;
        });
        
        if (ticket && cart[ticketType] > 0) {
            const ticketInfo = {
                type: ticketType,
                typeRu: typeof ticket.type === 'object' ? ticket.type.ru : ticket.type,
                typeFr: typeof ticket.type === 'object' ? ticket.type.fr : ticket.type,
                price: ticket.price,
                quantity: cart[ticketType],
                subtotal: ticket.price * cart[ticketType]
            };
            tickets.push(ticketInfo);
            totalAmount += ticketInfo.subtotal;
        }
    });
    
    const order = {
        id: orderId,
        eventId: currentEvent.id,
        eventTitle: {
            ru: typeof currentEvent.title === 'object' ? currentEvent.title.ru : currentEvent.title,
            fr: typeof currentEvent.title === 'object' ? currentEvent.title.fr : currentEvent.title
        },
        eventDate: currentEvent.date,
        eventTime: currentEvent.time,
        eventLocation: {
            ru: typeof currentEvent.location === 'object' ? currentEvent.location.ru : currentEvent.location,
            fr: typeof currentEvent.location === 'object' ? currentEvent.location.fr : currentEvent.location
        },
        customer: {
            name: customerData.name,
            email: customerData.email,
            phone: customerData.phone
        },
        tickets: tickets,
        totalAmount: totalAmount,
        paymentMethod: customerData.paymentMethod,
        status: 'PENDING',
        orderDate: orderDate,
        createdAt: new Date().toLocaleString('ru-RU'),
        language: currentLang
    };
    
    return order;
}

// Генерация ID заказа
function generateOrderId() {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `ORD-${timestamp}-${random}`;
}

// Сохранение заказа в localStorage и JSON
function saveOrder(order) {
    try {
        // Получаем существующие заказы
        const existingOrders = JSON.parse(localStorage.getItem('eventTicketsOrders')) || [];
        
        // Добавляем новый заказ
        existingOrders.push(order);
        
        // Сохраняем в localStorage
        localStorage.setItem('eventTicketsOrders', JSON.stringify(existingOrders));
        
        // Также сохраняем в JSON файл (для удобного просмотра)
        saveOrdersToJSON(existingOrders);
        
        console.log('Заказ сохранен:', order);
        return true;
    } catch (error) {
        console.error('Ошибка сохранения заказа:', error);
        return false;
    }
}

// Сохранение заказов в JSON файл
async function saveOrdersToJSON(orders) {
    try {
        // В реальном приложении здесь был бы API запрос
        // Пока просто логируем для разработки
        console.log('Заказы для сохранения в JSON:', orders);
        
        // Можно добавить отправку на сервер:
        // await fetch('./data/orders.json', {
        //     method: 'POST',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify(orders)
        // });
    } catch (error) {
        console.error('Ошибка сохранения в JSON:', error);
    }
}

// Получение всех заказов
function getAllOrders() {
    try {
        return JSON.parse(localStorage.getItem('eventTicketsOrders')) || [];
    } catch (error) {
        console.error('Ошибка загрузки заказов:', error);
        return [];
    }
}

// Получение заказа по ID
function getOrderById(orderId) {
    const orders = getAllOrders();
    return orders.find(order => order.id === orderId);
}

// Обновление статуса заказа
function updateOrderStatus(orderId, newStatus) {
    try {
        const orders = getAllOrders();
        const orderIndex = orders.findIndex(order => order.id === orderId);
        
        if (orderIndex !== -1) {
            orders[orderIndex].status = newStatus;
            orders[orderIndex].updatedAt = new Date().toLocaleString('ru-RU');
            
            localStorage.setItem('eventTicketsOrders', JSON.stringify(orders));
            return true;
        }
        return false;
    } catch (error) {
        console.error('Ошибка обновления заказа:', error);
        return false;
    }
}

// Показать сообщение об успехе
function showSuccessMessage(order) {
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>${translations[currentLang].orderSuccess}</h3>
                <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
            </div>
            <div class="success-message">
                <div class="order-summary">
                    <h4>Заказ №${order.id}</h4>
                    <p><strong>Мероприятие:</strong> ${order.eventTitle[currentLang]}</p>
                    <p><strong>Дата:</strong> ${new Date(order.eventDate).toLocaleDateString(currentLang === 'ru' ? 'ru-RU' : 'fr-FR')} в ${order.eventTime}</p>
                    <p><strong>Сумма:</strong> ${order.totalAmount} ₽</p>
                    <p><strong>Статус:</strong> Ожидает оплаты</p>
                </div>
                <div class="success-text">
                    ${translations[currentLang].orderSuccessDesc}
                </div>
            </div>
            <div class="modal-actions">
                <button class="btn-primary" onclick="location.reload()">
                    ${translations[currentLang].backToEvents}
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// Настройка переключателя языков
function setupLanguageSwitcher() {
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const lang = this.dataset.lang;
            if (lang !== currentLang) {
                switchLanguage(lang);
            }
        });
    });
}

// Переключение языка
function switchLanguage(lang) {
    currentLang = lang;
    
    // Сохраняем выбранный язык в localStorage
    localStorage.setItem('selectedLanguage', lang);
    
    // Обновляем активную кнопку языка
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.lang === lang);
    });
    
    // Обновляем заголовок страницы
    document.title = translations[lang].title;
    
    // Обновляем все элементы с data-translate
    document.querySelectorAll('[data-translate]').forEach(element => {
        const key = element.getAttribute('data-translate');
        if (translations[lang][key]) {
            element.textContent = translations[lang][key];
        }
    });
    
    // Перезагружаем события с новым языком
    loadEvents();
    
    // Обновляем текст на странице если мы на главной
    updatePageTexts();
}

// Обновление текстов на странице
function updatePageTexts() {
    const t = translations[currentLang];
    
    // Обновляем hero секцию
    const heroTitle = document.querySelector('.hero-title');
    const heroSubtitle = document.querySelector('.hero-subtitle');
    const badgeText = document.querySelector('.badge-text');
    
    if (heroTitle) heroTitle.textContent = t.heroTitle;
    if (heroSubtitle) heroSubtitle.textContent = t.heroSubtitle;
    if (badgeText) badgeText.textContent = t.newEvents;
    
    // Обновляем заголовок секции событий
    const sectionTitle = document.querySelector('.section-title');
    if (sectionTitle) sectionTitle.textContent = t.upcomingEvents;
    
    // Обновляем фильтры
    const filterTabs = document.querySelectorAll('.filter-tab');
    if (filterTabs.length > 0) {
        filterTabs[0].textContent = t.filterAll;
    }
    
    // Обновляем секцию "Почему выбирают нас"
    const featuresTitle = document.querySelectorAll('.section-title')[1];
    if (featuresTitle) featuresTitle.textContent = t.whyChooseUs;
    
    const featureCards = document.querySelectorAll('.feature-card');
    if (featureCards.length >= 4) {
        featureCards[0].querySelector('h4').textContent = t.feature1Title;
        featureCards[0].querySelector('p').textContent = t.feature1Text;
        featureCards[1].querySelector('h4').textContent = t.feature2Title;
        featureCards[1].querySelector('p').textContent = t.feature2Text;
        featureCards[2].querySelector('h4').textContent = t.feature3Title;
        featureCards[2].querySelector('p').textContent = t.feature3Text;
        featureCards[3].querySelector('h4').textContent = t.feature4Title;
        featureCards[3].querySelector('p').textContent = t.feature4Text;
    }
    
    // Обновляем статистику
    const statLabels = document.querySelectorAll('.stat-label');
    if (statLabels.length >= 3) {
        statLabels[0].textContent = t.stats1;
        statLabels[1].textContent = t.stats2;
        statLabels[2].textContent = t.stats3;
    }
    
    // Обновляем футер
    const footerSections = document.querySelectorAll('.footer-section');
    if (footerSections.length >= 3) {
        footerSections[0].querySelector('p').textContent = t.footerText;
        footerSections[1].querySelector('h4').textContent = t.contactsTitle;
        footerSections[2].querySelector('h4').textContent = t.socialTitle;
    }
    
    // Обновляем кнопки и другие элементы
    const selectTicketsTitle = document.querySelector('.ticket-selection h3');
    if (selectTicketsTitle) selectTicketsTitle.textContent = t.selectTickets;
    
    const totalPrice = document.getElementById('totalPrice');
    if (totalPrice) {
        const currentTotal = totalPrice.textContent.match(/\d+/);
        totalPrice.textContent = `${t.total}: ${currentTotal ? currentTotal[0] : '0'} ₽`;
    }
    
    const orderBtn = document.getElementById('orderBtn');
    if (orderBtn) orderBtn.textContent = t.orderTickets;
    
    // Обновляем форму заказа
    updateOrderFormTexts();
}

// Обновление текстов формы заказа
function updateOrderFormTexts() {
    const t = translations[currentLang];
    
    const customerInfoTitle = document.querySelector('.order-form h3');
    if (customerInfoTitle) customerInfoTitle.textContent = t.customerInfo;
    
    const labels = {
        'customerName': t.name,
        'customerEmail': t.email,
        'customerPhone': t.phone
    };
    
    Object.keys(labels).forEach(id => {
        const label = document.querySelector(`label[for="${id}"]`);
        if (label) label.textContent = labels[id] + ' *';
    });
    
    const paymentMethodLabel = document.querySelector('label:has(+ .payment-methods)');
    if (paymentMethodLabel) paymentMethodLabel.textContent = t.paymentMethod + ' *';
    
    const bankTransferOption = document.querySelector('[data-method="transfer"]');
    if (bankTransferOption) {
        bankTransferOption.querySelector('h4').textContent = t.bankTransfer;
        bankTransferOption.querySelector('p').textContent = t.bankTransferDesc;
    }
    
    const cashOption = document.querySelector('[data-method="cash"]');
    if (cashOption) {
        cashOption.querySelector('h4').textContent = t.cash;
        cashOption.querySelector('p').textContent = t.cashDesc;
    }
    
    const submitBtn = document.querySelector('#customerForm button[type="submit"]');
    if (submitBtn) submitBtn.textContent = t.submitOrder;
}

// Общие обработчики событий
function setupEventHandlers() {
    // Обработка кликов по модальным окнам
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal')) {
            e.target.remove();
        }
    });
}