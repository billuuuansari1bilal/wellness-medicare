const ADMIN_PASSWORD = "BilalAnsariNaziyaSalmani";
let medicineData = JSON.parse(localStorage.getItem("wellness_medicines")) || [...medicines];
let cart = [];
let editId = null;
let isAdmin = false;
let selectedImage = "";
let currentOrderMedId = null;

window.onload = () => {
    renderMedicines(medicineData);
    const img = document.getElementById("imageFile");
    if(img){
        img.addEventListener("change",function(){
            const file=this.files[0];
            if(!file){ selectedImage=""; return; }
            const reader=new FileReader();
            reader.onload=function(e){ selectedImage=e.target.result; };
            reader.readAsDataURL(file);
        });
    }
};

function saveLocal(){
    localStorage.setItem("wellness_medicines", JSON.stringify(medicineData));
}

function adminLogin(){
    if(isAdmin){
        document.getElementById("adminPanel").style.display="block";
        return;
    }
    let pass=prompt("Enter Admin Password");
    if(pass===ADMIN_PASSWORD){
        isAdmin=true;
        alert("Welcome Admin");
        document.getElementById("adminPanel").style.display="block";
        renderMedicines(medicineData);
    } else {
        alert("Wrong Password");
    }
}

function searchMedicine(){
    let value=document.getElementById("search").value.toLowerCase();
    let result=medicineData.filter(m=>
        m.brand.toLowerCase().includes(value)||
        m.salt.toLowerCase().includes(value)||
        m.company.toLowerCase().includes(value)
    );
    renderMedicines(result);
}

function renderMedicines(list){
    let container=document.getElementById("medicineContainer");
    container.innerHTML="";
    [...list].sort((a,b)=>b.id-a.id).forEach(m=>{
        container.innerHTML += `
        <div class="card">
            <img src="${m.image || 'medicine.png'}" class="medicineImage">
            <h2>${m.brand}</h2>
            <p><b>Salt:</b> ${m.salt}</p>
            <p><b>MG:</b> ${m.mg}</p>
            <p><b>Company:</b> ${m.company}</p>
            <p><b>Packing:</b> ${m.packing}</p>
            <p><b>MRP:</b> ₹${m.mrp}</p>
            <p><b>MFG:</b> ${m.mfg}</p>
            <p><b>Expiry:</b> ${m.expiry}</p>
            
            <button style="background:#198754" onclick="openQtyPopup(${m.id})">
                🛒 Add to Cart
            </button>

            ${isAdmin ? `
            <button class="editBtn" onclick="editMedicine(${m.id})">✏️ Edit</button>
            <button class="deleteBtn" onclick="deleteMedicine(${m.id})">🗑️ Delete</button>
            ` : ""}
        </div>`;
    });
}

// --- Cart System Functions ---

function openQtyPopup(id){
    currentOrderMedId = id;
    let m = medicineData.find(x => x.id === id);
    document.getElementById("popTitle").innerText = "Order: " + m.brand;
    document.getElementById("stripQty").value = 0;
    document.getElementById("boxQty").value = 0;
    document.getElementById("qtyPopup").style.display = "block";
    
    document.getElementById("confirmAddBtn").onclick = function(){
        let sQty = parseInt(document.getElementById("stripQty").value) || 0;
        let bQty = parseInt(document.getElementById("boxQty").value) || 0;
        
        if(sQty === 0 && bQty === 0) {
            alert("Please enter quantity");
            return;
        }
        
        addToCart(currentOrderMedId, sQty, bQty);
        closeQtyPopup();
    };
}

function closeQtyPopup(){
    document.getElementById("qtyPopup").style.display = "none";
}

function addToCart(id, strips, boxes){
    let m = medicineData.find(x => x.id === id);
    let existing = cart.find(item => item.id === id);
    
    if(existing){
        existing.strips += strips;
        existing.boxes += boxes;
    } else {
        cart.push({
            id: m.id,
            name: m.brand,
            strips: strips,
            boxes: boxes
        });
    }
    updateCartUI();
}

function updateCartUI(){
    let bar = document.getElementById("bottomCartBar");
    let countText = document.getElementById("cartCount");
    
    if(cart.length > 0){
        bar.style.display = "flex";
        countText.innerText = cart.length + " Items in Cart";
    } else {
        bar.style.display = "none";
    }
}

function sendWhatsApp(){
    if(cart.length === 0) return;
    
    let message = "🏥 *Wellness Medicare - New Order*\n\n";
    cart.forEach((item, index) => {
        message += `${index + 1}. *${item.name}*\n`;
        if(item.strips > 0) message += `   - Strips: ${item.strips}\n`;
        if(item.boxes > 0) message += `   - Boxes: ${item.boxes}\n`;
        message += `\n`;
    });

    let number = "916396832385";
    let url = "https://wa.me/" + number + "?text=" + encodeURIComponent(message);
    window.location.href = url;
    
    // Clear cart after order
    cart = [];
    updateCartUI();
}

// --- Original Admin & Utility Functions (Keep Same) ---

function saveMedicine(){
    if(!isAdmin){ alert("Admin Login Required"); return; }
    let medicine={
        brand:document.getElementById("brand").value,
        salt:document.getElementById("salt").value,
        company:document.getElementById("company").value,
        mg:document.getElementById("mg").value,
        packing:document.getElementById("packing").value,
        mfg:document.getElementById("mfg").value,
        expiry:document.getElementById("expiry").value,
        mrp:document.getElementById("mrp").value,
        image:selectedImage || "medicine.png"
    };

    if(editId===null){
        medicine.id=Date.now();
        medicineData.push(medicine);
    } else {
        let old=medicineData.find(x=>x.id===editId);
        Object.assign(old,medicine);
        editId=null;
    }
    saveLocal();
    renderMedicines(medicineData);
    clearForm();
    alert("Medicine Saved");
}

function editMedicine(id){
    if(!isAdmin) return;
    let m=medicineData.find(x=>x.id===id);
    editId=id;
    document.getElementById("adminPanel").style.display="block";
    document.getElementById("brand").value=m.brand;
    document.getElementById("salt").value=m.salt;
    document.getElementById("company").value=m.company;
    document.getElementById("mg").value=m.mg;
    document.getElementById("packing").value=m.packing;
    document.getElementById("mfg").value=m.mfg;
    document.getElementById("expiry").value=m.expiry;
    document.getElementById("mrp").value=m.mrp;
    selectedImage=m.image;
}

function deleteMedicine(id){
    if(!isAdmin){ alert("Admin Login Required"); return; }
    if(confirm("Delete Medicine?")){
        medicineData=medicineData.filter(x=>x.id!==id);
        saveLocal();
        renderMedicines(medicineData);
        alert("Medicine Deleted");
    }
}

function clearForm(){
    document.querySelectorAll("#adminPanel input").forEach(input=>{ input.value=""; });
    selectedImage=""; editId=null;
}

function goTop(){ window.scrollTo({ top:0, behavior:"smooth" }); }

window.addEventListener("scroll",()=>{
    let btn=document.getElementById("topBtn");
    if(!btn)return;
    if(window.scrollY>300) btn.style.display="flex";
    else btn.style.display="none";
});

function logoutAdmin(){
    isAdmin=false;
    document.getElementById("adminPanel").style.display="none";
    clearForm();
    renderMedicines(medicineData);
    alert("Logged Out");
}
