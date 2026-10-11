document.addEventListener('DOMContentLoaded', () => {

    // Плавная прокрутка к якорям
    const navLinks = document.querySelectorAll('a[href^="#"]');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href').substring(1);
            const targetSection = document.getElementById(targetId);

            if (targetSection) {
                window.scrollTo({
                    top: targetSection.offsetTop - 80, // Отступ от хедера
                    behavior: 'smooth'
                });
            }
        });
    });

    // Модальное окно бронирования (заглушка)
    const bookBtn = document.getElementById('bookBtn');
    const modal = document.createElement('div');
    modal.classList.add('modal');
    modal.innerHTML = `
        <div class="modal__content">
            <h3>Форма бронирования</h3>
            <p>Функционал бронирования подключается через CRM-систему или Telegram Bot API.</p>
            <button id="closeModal" class="button button--primary">Закрыть</button>
        </div>
    `;
    document.body.appendChild(modal);
    modal.style.display = 'none';

    bookBtn.addEventListener('click', () => {
        modal.style.display = 'flex';
    });

    modal.addEventListener('click', (e) => {
        if (e.target === modal || e.target.id === 'closeModal') {
            modal.style.display = 'none';
        }
    });

});
document.addEventListener('DOMContentLoaded', () => {

    // --- 1. Таймер обратного отсчета для турниров ---
    const countDownDate = new Date("Oct 1, 2026 00:00:00").getTime();
    
    const x = setInterval(function() {
        const now = new Date().getTime();
        const distance = countDownDate - now;

        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        document.getElementById("days").innerText = String(days).padStart(2, '0');
        document.getElementById("hours").innerText = String(hours).padStart(2, '0');
        document.getElementById("minutes").innerText = String(minutes).padStart(2, '0');
        document.getElementById("seconds").innerText = String(seconds).padStart(2, '0');

        if (distance < 0) {
            clearInterval(x);
            document.getElementById("countdownTimer").innerHTML = "ТУРНИР ИДЕТ ПРЯМО СЕЙЧАС!";
        }
    }, 1000);

    // --- 2. Логика бронирования (модалки и карта) ---
    const modal = document.getElementById("bookingModal");
    const selectedPCSpan = document.getElementById("selectedPC");
    let selectedPCId = null;

    // Клики по свободным местам на карте
    document.querySelectorAll('.pc-slot.free').forEach(slot => {
        slot.addEventListener('click', function() {
            selectedPCId = this.dataset.id;
            selectedPCSpan.innerText = selectedPCId;
            modal.style.display = "flex";
        });
    });

    // Закрытие модалки
    document.querySelector(".close-modal").onclick = function() {
        modal.style.display = "none";
    };
    window.onclick = function(event) {
        if (event.target == modal) {
            modal.style.display = "none";
        }
    };

    // Подтверждение брони (заглушка)
    document.querySelector('.confirm-book').addEventListener('click', () => {
        alert(`Станция ${selectedPCId} успешно забронирована! Проверьте детали в приложении.`);
        modal.style.display = "none";
        // Здесь должен быть вызов API для записи в базу данных
    });

    // --- 3. Глобальные кнопки ---
    const bookBtn = document.getElementById('bookBtn');
    bookBtn.addEventListener('click', () => {
        // Прокрутка к секции бронирования при нажатии главной кнопки
        document.getElementById('booking').scrollIntoView({ behavior: 'smooth' });
    });

});