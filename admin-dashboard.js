import { auth, db } from './firebase-config.js';
import {
  signOut,
  onAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js';
import {
  collection,
  getDocs,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  getDoc
} from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js';

const ordersContainer = document.getElementById('ordersContainer');
const logoutBtn = document.getElementById('logoutBtn');
const addOrderForm = document.getElementById('addOrderForm');

let allOrders = [];
let currentPage = 1;
const ordersPerPage = 10;

// Yetkilendirme (Авторизация)
onAuthStateChanged(auth, async user => {
  if (!user || !user.email.includes('admin')) {
    await signOut(auth);
    window.location.href = 'login.html';
    return;
  }

  try {
    const userDoc = await getDoc(doc(db, 'clients', user.email));
    if (!userDoc.exists()) {
      throw new Error('Kullanıcı bulunamadı'); // Пользователь не найден
    }

    const data = userDoc.data();
    const now = new Date();
    const endDate = data.subscriptionEnds?.toDate ? data.subscriptionEnds.toDate() : new Date(data.subscriptionEnds);
    const isSubscriptionExpired = endDate && now > endDate;
    const isSubscriptionInactive = data.subscriptionActive === false;

    if (isSubscriptionExpired || isSubscriptionInactive) {
      alert('Aboneliğiniz aktif değil veya süresi doldu.'); // Ваша подписка неактивна или истекла.
      window.location.href = 'subscribe.html';
      return;
    }

    await loadAllOrders();

  } catch (err) {
    console.error('Abonelik kontrolünde hata:', err); // Ошибка проверки подписки
    await signOut(auth);
    window.location.href = 'subscribe.html';
  }
});

// Siparişleri yükleme (Загрузка заказов)
async function loadAllOrders() {
  ordersContainer.innerHTML = '<h2>Siparişler yükleniyor...</h2>'; // Загрузка заказов...
  try {
    const clientsSnapshot = await getDocs(collection(db, 'clients'));
    allOrders = [];

    for (const clientDoc of clientsSnapshot.docs) {
      const ordersRef = collection(db, 'clients', clientDoc.id, 'orders');
      const ordersSnapshot = await getDocs(ordersRef);

      ordersSnapshot.forEach(orderDoc => {
        allOrders.push({
          id: orderDoc.id,
          clientEmail: clientDoc.id,
          ...orderDoc.data()
        });
      });
    }

    renderOrders();

  } catch (err) {
    ordersContainer.innerHTML = '<p>Siparişleri yüklerken hata oluştu</p>'; // Ошибка при загрузке заказов
    console.error(err);
  }
}

// Sayfalama ile gösterim (Отображение с пагинацией)
function renderOrders() {
  ordersContainer.innerHTML = '';
  const startIndex = (currentPage - 1) * ordersPerPage;
  const endIndex = startIndex + ordersPerPage;
  const paginatedOrders = allOrders.slice(startIndex, endIndex);

  if (paginatedOrders.length === 0) {
    ordersContainer.innerHTML = '<p>Sipariş yok</p>'; // Нет заказов
    return;
  }

  const title = document.createElement('h2');
  title.textContent = 'Tüm Siparişler'; // Все заказы
  ordersContainer.appendChild(title);

  paginatedOrders.forEach(order => {
    const div = document.createElement('div');
    div.className = 'order-card';
    div.innerHTML = `
      <div class="order-header" style="position: relative; padding-right: 120px;">
        <h3>Sipariş: ${order.id}</h3>  <!-- Заказ -->
        <span class="order-status" style="
          position: absolute;
          top: 0;
          right: 0;
          background-color: #28a745;
          color: white;
          padding: 4px 10px;
          border-radius: 12px;
          font-size: 0.9em;
          font-weight: 600;
          text-transform: capitalize;
        ">
          ${order.status || 'Bilinmiyor'} <!-- Неизвестно -->
        </span>
      </div>
      <p><b>Müşteri:</b> ${order.clientEmail}</p> <!-- Клиент -->
      <p><b>Açıklama:</b> ${order.product || 'Veri yok'}</p> <!-- Описание -->
      <p><b>Müşteri Adı:</b> ${order.clientName || 'Veri yok'}</p> <!-- Имя Клиента -->
      <p><b>Adres:</b> ${order.deliveryAdres || 'Veri yok'}</p> <!-- Адрес -->
      <p><b>Fiyat:</b> ${order.price || 'Veri yok'}</p> <!-- Цена -->
      <p><b>Oluşturma Tarihi:</b> ${order.createdAt?.toDate().toLocaleString() || 'Bilinmiyor'}</p> <!-- Дата создания -->
      <div>
        <input id="statusInput-${order.id}" type="text" value="${order.status || ''}" placeholder="Durumu güncelle" />
        <button data-action="update" data-id="${order.id}" data-email="${order.clientEmail}">Durumu Güncelle</button>
        <button data-action="delete" data-id="${order.id}" data-email="${order.clientEmail}">Siparişi Sil</button>
      </div>
      <div style="margin-top: 8px;">
        <input id="trackingInput-${order.id}" type="text" value="${order.trackingNumber || ''}" placeholder="Takip numarasını girin" />
        <button data-action="updateTracking" data-id="${order.id}" data-email="${order.clientEmail}">Takip Numarasını Güncelle</button>
      </div>
    `;
    ordersContainer.appendChild(div);
  });

  // Sayfalama butonları (Кнопки пагинации)
  const paginationDiv = document.createElement('div');
  paginationDiv.style.marginTop = '20px';

  if (currentPage > 1) {
    const prevBtn = document.createElement('button');
    prevBtn.textContent = 'Geri'; // Назад
    prevBtn.onclick = () => {
      currentPage--;
      renderOrders();
    };
    paginationDiv.appendChild(prevBtn);
  }

  if (endIndex < allOrders.length) {
    const nextBtn = document.createElement('button');
    nextBtn.textContent = 'İleri'; // Вперёд
    nextBtn.onclick = () => {
      currentPage++;
      renderOrders();
    };
    paginationDiv.appendChild(nextBtn);
  }

  ordersContainer.appendChild(paginationDiv);
}

// Sipariş ekleme (Добавление заказа)
addOrderForm.addEventListener('submit', async e => {
  e.preventDefault();
  const formData = new FormData(addOrderForm);
  const email = formData.get('email');
  const clientName = formData.get('clientName');
  const deliveryAdres = formData.get('deliveryAdres');
  const product = formData.get('product');
  const price = formData.get('price');
  const status = formData.get('status') || 'Yeni'; // Новый
  const trackingNumber = formData.get('trackingNumber') || '';

  try {
    const orderRef = collection(db, 'clients', email, 'orders');
    await addDoc(orderRef, {
      clientName,
      deliveryAdres,
      product,
      price,
      status,
      trackingNumber,
      createdAt: serverTimestamp()
    });
