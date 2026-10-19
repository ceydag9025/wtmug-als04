// Market Ürün Veritabanı (JSON Formatında asgari 5 ürün)
const productsDatabase = [
    {
        barcode: "8690504011234",
        name: "Tam Yağlı Süt 1L",
        brand: "Sütaş",
        category: "Gıda",
        price: 24.50,
        amount: "1 Litre"
    },
    {
        barcode: "8690632015678",
        name: "Yarım Yağlı Dilimli Tost Peyniri",
        brand: "Muratbey",
        category: "Gıda",
        price: 89.90,
        amount: "400 Gram"
    },
    {
        barcode: "8691234567890",
        name: "Bulaşık Deterjanı",
        brand: "Fairy",
        category: "Temizlik",
        price: 65.00,
        amount: "750 ml"
    },
    {
        barcode: "8699876543210",
        name: "Şampuan Duş Jeli",
        brand: "Head & Shoulders",
        category: "Kozmetik",
        price: 110.00,
        amount: "350 ml"
    },
    {
        barcode: "8694443332221",
        name: "Geleneksel Türk Kahvesi",
        brand: "Kurukahveci Mehmet Efendi",
        category: "Gıda",
        price: 45.00,
        amount: "100 Gram"
    }
];

// Durum Değişkenleri
let currentMode = 'single'; // 'single' veya 'cart'
let cart = [];
let lastScannedBarcode = null;
let lastScannedTime = 0;
const SCAN_COOLDOWN = 1500; // 1.5 saniye aynı barkod engelleme süresi

// DOM Elementleri
const videoElement = document.getElementById('scanner');
const cameraErrorElement = document.getElementById('cameraError');
const btnSingleMode = document.getElementById('btnSingleMode');
const btnCartMode = document.getElementById('btnCartMode');
const singleResultSection = document.getElementById('singleResultSection');
const cartSection = document.getElementById('cartSection');
const productCard = document.getElementById('productCard');
const cartList = document.getElementById('cartList');
const cartTotal = document.getElementById('cartTotal');
const btnClearCart = document.getElementById('btnClearCart');
const manualBarcode = document.getElementById('manualBarcode');
const btnManualSubmit = document.getElementById('btnManualSubmit');
const toast = document.getElementById('toast');

// Mod Değiştirme
btnSingleMode.addEventListener('click', () => {
    currentMode = 'single';
    btnSingleMode.classList.add('active');
    btnCartMode.classList.remove('active');
    singleResultSection.classList.remove('hidden');
    cartSection.classList.add('hidden');
});

btnCartMode.addEventListener('click', () => {
    currentMode = 'cart';
    btnCartMode.classList.add('active');
    btnSingleMode.classList.remove('active');
    cartSection.classList.remove('hidden');
    singleResultSection.classList.add('hidden');
});

// Kamera Başlatma ve İzin Yönetimi
async function initCamera() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment' }
        });
        videoElement.srcObject = stream;
        videoElement.setAttribute('playsinline', true);
        cameraErrorElement.classList.add('hidden');
        
        // Barkod Tarama Döngüsünü Başlat
        requestAnimationFrame(scanBarcodes);
    } catch (error) {
        console.error("Kamera erişim hatası:", error);
        cameraErrorElement.classList.remove('hidden');
    }
}

// Barkod Tarama (BarcodeDetector API)
async function scanBarcodes() {
    if (videoElement.readyState === videoElement.HAVE_ENOUGH_DATA) {
        if (!window.BarcodeDetector) {
            showToast("Tarayıcınız BarcodeDetector API'sini desteklemiyor.");
            return;
        }

        try {
            // Klasik barkod formatları (QR hariç: ean_13, code_128, vb.)
            const detector = new BarcodeDetector({ 
                formats: ['ean_13', 'ean_8', 'code_128', 'code_39', 'upc_a', 'upc_e'] 
            });
            const barcodes = await detector.detect(videoElement);

            if (barcodes.length > 0) {
                const code = barcodes[0].rawValue;
                const now = Date.now();

                // 1.5 saniye içinde aynı barkod kadrajdaysa yoksay
                if (code !== lastScannedBarcode || (now - lastScannedTime) > SCAN_COOLDOWN) {
                    lastScannedBarcode = code;
                    lastScannedTime = now;
                    processBarcode(code);
                }
            }
        } catch (err) {
            console.error("Barkod okuma hatası:", err);
        }
    }
    requestAnimationFrame(scanBarcodes);
}

// Barkod İşleme ve Eşleştirme Mantığı
function processBarcode(barcode) {
    const product = productsDatabase.find(p => p.barcode === barcode);

    if (!product) {
        showToast("Ürün bulunamadı.");
        return;
    }

    if (currentMode === 'single') {
        displaySingleProduct(product);
        showToast(`${product.name} okundu.`);
    } else {
        addToCart(product);
        showToast(`${product.name} sepete eklendi.`);
    }
}

// Tekli Mod Görselleştirme
function displaySingleProduct(product) {
    productCard.classList.remove('placeholder');
    productCard.innerHTML = `
        <h3>${product.name}</h3>
        <p><strong>Marka:</strong> ${product.brand}</p>
        <p><strong>Kategori:</strong> ${product.category}</p>
        <p><strong>Miktar:</strong> ${product.amount}</p>
        <p><strong>Fiyat:</strong> ${product.price.toFixed(2)} TL</p>
        <p><strong>Barkod:</strong> ${product.barcode}</p>
    `;
}

// Sepet Modu İşlemleri
function addToCart(product) {
    cart.push(product);
    updateCartUI();
}

function updateCartUI() {
    cartList.innerHTML = '';
    let total = 0;

    cart.forEach((item, index) => {
        total += item.price;
        const li = document.createElement('li');
        li.innerHTML = `
            <span>${item.name} (${item.amount})</span>
            <span>${item.price.toFixed(2)} TL</span>
        `;
        cartList.appendChild(li);
    });

    cartTotal.textContent = total.toFixed(2);
}

btnClearCart.addEventListener('click', () => {
    cart = [];
    updateCartUI();
    showToast("Sepet temizlendi.");
});

// Manuel Barkod Girişi
btnManualSubmit.addEventListener('click', () => {
    const code = manualBarcode.value.trim();
    if (code) {
        processBarcode(code);
        manualBarcode.value = '';
    }
});

// Bildirim (Toast) Gösterimi
function showToast(message) {
    toast.textContent = message;
    toast.classList.remove('hidden');
    setTimeout(() => {
        toast.classList.add('hidden');
    }, 2000);
}

// Uygulamayı Başlat
initCamera();