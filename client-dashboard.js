// client-dashboard.js
import { auth, db, signOut, onAuthStateChanged } from './auth.js';
import { collection, getDocs } from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js';

const ordersContainer = document.getElementById('ordersContainer');
const userEmailSpan = document.getElementById('userEmail');
const logoutBtn = document.getElementById('logoutBtn');

logoutBtn.addEventListener('click', async () => {
  await signOut();
  window.location.href = 'login.html';
});

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = 'login.html';
    return;
  }

  userEmailSpan.textContent = user.email;

  const ordersRef = collection(db, 'clients', user.email, 'orders');

  try {
    const snapshot = await getDocs(ordersRef);
    ordersContainer.innerHTML = '';

    if (snapshot.empty) {
      ordersContainer.innerHTML = '<p>У вас пока нет заказов.</p>';
      return;
    }

    snapshot.forEach(docSnap => {
      const order = docSnap.data();
      const cleanProduct = order.product ? order.product.replace(/^"+|"+$/g, '') : 'Не указан';

      const div = document.createElement('div');
      div.className = 'order-card';
      div.innerHTML = `
        <h3>Заказ №${docSnap.id}</h3>
        <p>Товар: ${cleanProduct}</p>
        <p>Статус: <strong>${order.status || 'Ожидает обработки'}</strong></p>
        <p>Дата заказа: ${order.createdAt?.toDate().toLocaleString() || 'Неизвестно'}</p>
        ${order.trackingNumber ? `<p class="tracking">Трек-номер: <span class="tracking-number" title="Нажмите для копирования">${order.trackingNumber}</span></p>` : ''}
      `;
      ordersContainer.appendChild(div);
    });

    // Обработчик копирования трек-номера по клику
    ordersContainer.addEventListener('click', (e) => {
      if (e.target.classList.contains('tracking-number')) {
        const text = e.target.textContent;
        navigator.clipboard.writeText(text).then(() => {
          e.target.title = 'Скопировано!';
          setTimeout(() => {
            e.target.title = 'Нажмите для копирования';
          }, 1500);
        });
      }
    });

  } catch (error) {
    ordersContainer.innerHTML = `<p>Ошибка при загрузке заказов: ${error.message}</p>`;
    console.error(error);
  }
});
