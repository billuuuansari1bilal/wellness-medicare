const ADMIN_PASSWORD = "BilalAnsariNaziyaSalmani";
let medicineData = []; 
let cart = [];
let editId = null;
let isAdmin = false;
let selectedImage = "";

// --- STRONGER SWIPE TO BACK LOGIC ---
let touchstartX = 0;
let touchstartY = 0;

document.getElementById('detailView').addEventListener('touchstart', function(e) {
    touchstartX = e.changedTouches[0].screenX;
    touchstartY = e.changedTouches[0].screenY;
}, {passive: true});

document.getElementById('detailView').addEventListener('touchend', function(e) {
    let touchendX = e.changedTouches[0].screenX;
    let touchendY = e.changedTouches[0].screenY;
    
    let xDiff = touchendX - touchstartX;
    let yDiff = Math.abs(touchendY - touchstartY);

    // Agar Right ki taraf swipe 80px se zyada ho 
    // Aur vertical (upar-neeche) movement kam ho
    if (xDiff > 80 && yDiff < 50) {
        hideDetails();
    }
}, {passive: true});
// ------------------------------------

// Load Cloud Data
window.onload = () => {
    db.collection("medicines").orderBy("createdAt", "desc").onSnapshot((snapshot) => {
        medicineData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderMedicines(medicineData);
    }, (error) => { console.error("Cloud Error:", error); });

    document.getElementById("imageFile").addEventListener("change", function(){
        const reader = new FileReader();
        reader.onload = (e) => { selectedImage = e.target.result; };
        if(this.files[0]) reader.readAsDataURL(this.files[0]);
    });
};

function renderMedicines(list) {
    let container = document.getElementById("medicineContainer");
    if(!container) return;
    container.innerHTML = "";
    list.forEach(m => {
        container.innerHTML += `
        <div class="card">
            <img src="${m.image || 'medicine.png'}" class="medicineImage" onclick="viewDetails('${m.id}')">
            <h2 onclick="viewDetails('${m.id}')">${m.brand}</h2>
            <button class="btn-details" onclick="viewDetails('${m.id}')">👁 View Details</button>
            <button class="btn-cart-small" onclick="openQtyPopup('${m.id}')">🛒 Add to Cart</button>
            ${isAdmin ? `
                <div style="display:flex; gap:4px; margin-top:5px;">
                    <button onclick="editMedicine('${m.id}')" style="flex:1; padding:6px; background:#f1f5f9; border:none; border-radius:6px;">✏️</button>
                    <button onclick="deleteMedicine('${m.id}')" style="flex:1; padding:6px; background:#fef2f2; color:red; border:none; border-radius:6px;">🗑️</button>
                </div>` : ""}
        </div>`;
    });
}

function viewDetails(id) {
    let m = medicineData.find(x => x.id === id);
    if(!m) return;
    document.getElementById("detailContent").innerHTML = `
        <img src="${m.image || 'medicine.png'}" class="detail-img">
        <div class="detail-info-card">
            <h1 style="color:#0b5ed7; margin-bottom:20px; font-size:24px;">${m.brand}</h1>
            <div class="info-row"><b>Salt</b> <span>${m.salt}</span></div>
            <div class="info-row"><b>Dosage</b> <span>${m.mg}</span></div>
            <div class="info-row"><b>Company</b> <span>${m.company}</span></div>
            <div class="info-row"><b>Packing</b> <span>${m.packing}</span></div>
            <div class="info-row"><b>MRP</b> <span style="color:#198754; font-weight:bold;">₹${m.mrp}</span></div>
            <div class="info-row"><b>MFG Date</b> <span>${m.mfg}</span></div>
            <div class="info-row"><b>Expiry Date</b> <span>${m.expiry}</span></div>
            <button class="confirm-btn-premium" style="margin-top:25px;" onclick="openQtyPopup('${m.id}')">Add to Cart Now</button>
        </div>`;
    document.getElementById("mainView").style.display = "none";
    document.getElementById("detailView").style.display = "block";
    window.scrollTo(0,0);
}

function hideDetails() {
    document.getElementById("detailView").style.display = "none";
    document.getElementById("mainView").style.display = "block";
}

function changeQty(id, val) {
    let input = document.getElementById(id);
    let currentVal = parseInt(input.value) || 0;
    let newVal = currentVal + val;
    if (newVal >= 0) input.value = newVal;
}

function openQtyPopup(id){
    let m = medicineData.find(x => x.id === id);
    document.getElementById("popTitle").innerText = m.brand;
    document.getElementById("stripQty").value = 0;
    document.getElementById("boxQty").value = 0;
    document.getElementById("qtyPopup").style.display = "flex";
    
    document.getElementById("confirmAddBtn").onclick = function(){
        let s = parseInt(document.getElementById("stripQty").value) || 0;
        let b = parseInt(document.getElementById("boxQty").value) || 0;
        if(s > 0 || b > 0) addToCart(id, s, b);
        document.getElementById("qtyPopup").style.display = "none";
    };
}

function closeQtyPopup(){ document.getElementById("qtyPopup").style.display = "none"; }

function addToCart(id, s, b){
    let m = medicineData.find(x => x.id === id);
    cart.push({ id, name: m.brand, strips: s, boxes: b });
    updateCartUI();
}

function updateCartUI(){
    let bar = document.getElementById("bottomCartBar");
    if(cart.length > 0){
        bar.style.display = "flex";
        document.getElementById("cartCount").innerText = cart.length + " Items Selected";
    } else { bar.style.display = "none"; }
}

function sendWhatsApp(){
    let msg = "🏥 *Wellness Medicare Order Request*\n\n";
    cart.forEach((item, i) => {
        msg += `${i+1}. *${item.name}*\n`;
        if(item.strips > 0) msg += `   - Strips: ${item.strips}\n`;
        if(item.boxes > 0) msg += `   - Boxes: ${item.boxes}\n`;
        msg += `\n`;
    });
    window.location.href = "https://wa.me/916396832385?text=" + encodeURIComponent(msg);
    cart = []; updateCartUI();
}

function searchMedicine(){
    let val = document.getElementById("search").value.toLowerCase();
    let res = medicineData.filter(m => m.brand.toLowerCase().includes(val) || m.salt.toLowerCase().includes(val));
    renderMedicines(res);
}

function adminLogin(){
    let pass = prompt("Enter Admin Password");
    if(pass === ADMIN_PASSWORD){
        isAdmin = true;
        document.getElementById("adminPanel").style.display = "block";
        document.getElementById("adminAuth").style.display = "none";
        renderMedicines(medicineData);
    }
}

async function saveMedicine() {
    const med = {
        brand: document.getElementById("brand").value,
        salt: document.getElementById("salt").value,
        company: document.getElementById("company").value,
        mg: document.getElementById("mg").value,
        packing: document.getElementById("packing").value,
        mfg: document.getElementById("mfg").value,
        expiry: document.getElementById("expiry").value,
        mrp: document.getElementById("mrp").value,
        image: selectedImage || "medicine.png",
        createdAt: new Date()
    };
    if(editId === null) await db.collection("medicines").add(med);
    else await db.collection("medicines").doc(editId).update(med);
    alert("Saved Successfully!"); 
    clearForm();
}

function editMedicine(id){
    let m = medicineData.find(x => x.id === id);
    editId = id;
    document.getElementById("brand").value = m.brand;
    document.getElementById("salt").value = m.salt;
    document.getElementById("company").value = m.company;
    document.getElementById("mg").value = m.mg;
    document.getElementById("packing").value = m.packing;
    document.getElementById("mfg").value = m.mfg;
    document.getElementById("expiry").value = m.expiry;
    document.getElementById("mrp").value = m.mrp;
    selectedImage = m.image;
    window.scrollTo({top: 0, behavior: 'smooth'});
}

function deleteMedicine(id){ if(confirm("Permanently Delete?")) db.collection("medicines").doc(id).delete(); }
function clearForm(){ document.querySelectorAll("#adminPanel input").forEach(i => i.value=""); editId = null; }
function logoutAdmin(){ isAdmin = false; document.getElementById("adminPanel").style.display = "none"; document.getElementById("adminAuth").style.display = "block"; renderMedicines(medicineData); }
