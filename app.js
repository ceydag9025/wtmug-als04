// Market Ürün Veritabanı
const productsDatabase = [
    {
        barcode: "8690632041827",
        name: "Toz Kahve",
        brand: "Nescafe",
        category: "Gıda",
        price: 15.00,
        amount: "10 gram"
    },
    {
        barcode: "4015000090940",
        name: "Stick Yapıştırıcı",
        brand: "Pritt",
        category: "Kırtasiye",
        price: 80.00,
        amount: "43 gram"
    },
    {
        barcode: "8690857011964",
        name: "Zımba Teli",
        brand: "3A",
        category: "Kırtasiye",
        price: 35.00,
        amount: "1000 adet"
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
let currentMode = 'single';
let cart = [];
let lastScannedBarcode = null;
let lastScannedTime = 0;
const SCAN_COOLDOWN = 2000;

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

// Kamera Başlatma
async function initCamera() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment' }
        });
        videoElement.srcObject = stream;
        videoElement.setAttribute('playsinline', true);
        cameraErrorElement.classList.add('hidden');
        
        // Tarama döngüsünü başlat
        requestAnimationFrame(scanBarcodes);
    } catch (error) {
        console.error("Kamera erişim hatası:", error);
        cameraErrorElement.classList.remove('hidden');
    }
}

// Barkod Tarama (Güvenli Mod)
async function scanBarcodes() {
    if (videoElement.readyState === videoElement.HAVE_ENOUGH_DATA) {
        if (!window.BarcodeDetector) {
            // Tarayıcı desteklemiyorsa döngüyü kırmıyoruz, sadece kamerayı açık tutuyoruz
            // Kullanıcı manuel giriş yapabilir.
            requestAnimationFrame(scanBarcodes);
            return;
        }

        try {
            const detector = new BarcodeDetector({ 
                formats: ['ean_13', 'ean_8', 'code_128', 'code_39', 'upc_a', 'upc_e'] 
            });
            const barcodes = await detector.detect(videoElement);

            if (barcodes && barcodes.length > 0) {
                const code = barcodes[0].rawValue.trim();
                const now = Date.now();

                if (code !== lastScannedBarcode || (now - lastScannedTime) > SCAN_COOLDOWN) {
                    lastScannedBarcode = code;
                    lastScannedTime = now;
                    processBarcode(code);
                }
            }
        } catch (err) {
            // Tarama anlık hata verse bile döngünün çökmesini engelle
            console.warn("Anlık tarama atlandı:", err);
        }
    }
    requestAnimationFrame(scanBarcodes);
}

// Ürün Eşleştirme
function processBarcode(barcode) {
    // Boşlukları temizleyerek arama yap
    const cleanBarcode = barcode.trim();
    const product = productsDatabase.find(p => p.barcode === cleanBarcode);

    if (!product) {
        showToast("Ürün bulunamadı: " + cleanBarcode);
        if (currentMode === 'single') {
            productCard.innerHTML = `<p style="color:red">Bulunamayan Barkod: ${cleanBarcode}</p>`;
            productCard.classList.remove('placeholder');
        }
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

// Sepet İşlemleri
function addToCart(product) {
    cart.push(product);
    updateCartUI();
}

function updateCartUI() {
    cartList.innerHTML = '';
    let total = 0;

    cart.forEach((item) => {
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

// Manuel Giriş
function handleManualEntry() {
    const code = manualBarcode.value.trim();
    if (code) {
        processBarcode(code);
        manualBarcode.value = '';
    }
}

btnManualSubmit.addEventListener('click', handleManualEntry);
manualBarcode.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        handleManualEntry();
    }
});

// Toast Bildirim
function showToast(message) {
    toast.textContent = message;
    toast.classList.remove('hidden');
    setTimeout(() => {
        toast.classList.add('hidden');
    }, 2000);
}

// Başlat
initCamera();