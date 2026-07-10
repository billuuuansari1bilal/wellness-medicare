const ADMIN_PASSWORD = "BilalAnsariNaziyaSalmani";
let medicineData = []; 
let cart = [];
let editId = null;
let isAdmin = false;
let selectedImage = "";
let currentOrderMedId = null;

// 1. Fetch Cloud Data in Real-time
window.onload = () => {
    db.collection("medicines").orderBy("createdAt", "desc").onSnapshot((snapshot) => {
        medicineData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        renderMedicines(medicineData);
    });

    const img = document.getElementById("imageFile");
    if(img){
        img.addEventListener("change", function(){
            const file = this.files[0];
            const reader = new FileReader();
            reader.onload = (e) => { selectedImage = e.target.result; };
            if(file) reader.readAsDataURL(file);
        });
    }
};

// 2. Render UI
function renderMedicines(list) {
    let container = document.getElementById("medicineContainer");
    container.innerHTML = "";
    
    list.forEach(m => {
        let isInCart = cart.find(item => item.id === m.id);

        container.innerHTML += `
        <div class="card">
            <img src="${m.image || 'medicine.png'}" class="medicineImage">
            <h2>${m.brand}</h2>
            <p><b>Salt:</b> ${m.salt}</p>
            <p><b>Company:</b> ${m.company}</p>
            <p><b>MG:</b> ${m.mg}</p>
            <p><b>Packing:</b> ${m.packing}</p>
            <p><b>MRP:</b> ₹${m.mrp}</p>
            <p><b>MFG:</b> ${m.mfg}</p>
            <p><b>Expiry:</b> ${m.expiry}</p>
            
            ${isInCart ? 
                `<button class="order-btn" style="background:#dc3545;" onclick="removeFromCart('${m.id}')">✖ Unselect / Remove</button>` : 
                `<button class="order-btn" onclick="openQtyPopup('${m.id}')">🛒 Add to Cart</button>`
            }

            ${isAdmin ? `
            <div style="display:flex; gap:5px; margin-top:8px;">
                <button onclick="editMedicine('${m.id}')" style="flex:1; padding:5px; border-radius:5px; background:#f0f0f0;">✏️ Edit</button>
                <button onclick="deleteMedicine('${m.id}')" style="flex:1; padding:5px; border-radius:5px; background:#ffebeb; color:red;">🗑️ Delete</button>
            </div>` : ""}
        </div>`;
    });
}

// 3. Save to Firebase
async function saveMedicine() {
    if(!isAdmin) return;
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

    if(editId === null) {
        await db.collection("medicines").add(med);
        alert("Added to Cloud Successfully!");
    } else {
        await db.collection("medicines").doc(editId).update(med);
        alert("Updated in Cloud Successfully!");
        editId = null;
    }
    clearForm();
}

// 4. Delete from Firebase
async function deleteMedicine(id) {
    if(confirm("Delete from Online Database?")) {
        await db.collection("medicines").doc(id).delete();
    }
}

// --- Cart Logic ---
function openQtyPopup(id){
    currentOrderMedId = id;
    let m = medicineData.find(x => x.id === id);
    document.getElementById("popTitle").innerText = m.brand;
    document.getElementById("stripQty").value = 0;
    document.getElementById("boxQty").value = 0;
    document.getElementById("qtyPopup").style.display = "flex";
    document.getElementById("confirmAddBtn").onclick = function(){
        let sQty = parseInt(document.getElementById("stripQty").value) || 0;
        let bQty = parseInt(document.getElementById("boxQty").value) || 0;
        if(sQty === 0 && bQty === 0) return;
        addToCart(currentOrderMedId, sQty, bQty);
        closeQtyPopup();
    };
}

function addToCart(id, strips, boxes){
    let m = medicineData.find(x => x.id === id);
    cart.push({ id: m.id, name: m.brand, strips: strips, boxes: boxes });
    updateCartUI();
    renderMedicines(medicineData);
}

function removeFromCart(id){
    cart = cart.filter(item => item.id !== id);
    updateCartUI();
    renderMedicines(medicineData);
}

function updateCartUI(){
    let bar = document.getElementById("bottomCartBar");
    if(cart.length > 0){
        bar.style.display = "block";
        document.getElementById("cartCount").innerText = cart.length === 1 ? "1 Item Selected" : cart.length + " Items Selected";
        document.getElementById("cartBadge").innerText = cart.length;
    } else { bar.style.display = "none"; }
}

// Fixed WhatsApp Message (No 0 values)
function sendWhatsApp(){
    if(cart.length === 0) return;
    
    let message = "🏥 *Wellness Medicare - New Order Request*\n\n";
    
    cart.forEach((item, index) => {
        message += `${index + 1}. *${item.name}*\n`;
        
        // Agar strips 0 hain toh line add nahi hogi
        if(item.strips > 0) {
            message += `   - Strips: ${item.strips}\n`;
        }
        
        // Agar boxes 0 hain toh line add nahi hogi
        if(item.boxes > 0) {
            message += `   - Boxes: ${item.boxes}\n`;
        }
        
        message += `\n`;
    });

    window.location.href = "https://wa.me/916396832385?text=" + encodeURIComponent(message);
    
    cart = []; 
    updateCartUI(); 
    renderMedicines(medicineData);
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

function clearForm(){ document.querySelectorAll("#adminPanel input").forEach(i => i.value=""); selectedImage=""; editId=null; }
function logoutAdmin(){ isAdmin=false; document.getElementById("adminPanel").style.display="none"; document.getElementById("adminAuth").style.display="block"; renderMedicines(medicineData); }
function closeQtyPopup(){ document.getElementById("qtyPopup").style.display = "none"; }
function goTop(){ window.scrollTo({top:0, behavior:"smooth"}); }
