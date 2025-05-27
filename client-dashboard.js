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
      ordersContainer.innerHTML = '<p>Henüz siparişiniz yok.</p>';
      return;
    }

    snapshot.forEach(docSnap => {
      const order = docSnap.data();
      const cleanProduct = order.product ? order.product.replace(/^"+|"+$/g, '') : 'Belirtilmemiş';

      const div = document.createElement('div');
      div.className = 'order-card';
      div.innerHTML = `
        <h3>Sipariş №${docSnap.id}</h3>
        <p>Ürün: ${cleanProduct}</p>
        <p>Durum: <strong>${order.status || 'İşlem bekleniyor'}</strong></p>
        <p>Sipariş Tarihi: ${order.createdAt?.toDate().toLocaleString() || 'Bilinmiyor'}</p>
        ${order.trackingNumber ? `<p class="tracking">Takip Numarası: <span class="tracking-number" title="Kopyalamak için tıklayın">${order.trackingNumber}</span></p>` : ''}
      `;
      ordersContainer.appendChild(div);
    });

    // Takip numarasını tıklayınca kopyalama işlemi
    ordersContainer.addEventListener('click', (e) => {
      if (e.target.classList.contains('tracking-number')) {
        const text = e.target.textContent;
        navigator.clipboard.writeText(text).then(() => {
          e.target.title = 'Kopyalandı!';
          setTimeout(() => {
            e.target.title = 'Kopyalamak için tıklayın';
          }, 1500);
        });
      }
    });

  } catch (error) {
    ordersContainer.innerHTML = `<p>Siparişleri yüklerken hata oluştu: ${error.message}</p>`;
    console.error(error);
  }
});
