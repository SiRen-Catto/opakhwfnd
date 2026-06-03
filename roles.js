const STORAGE_KEY = 'mono_planner_roles';
const defaultRoles = [
    { id: 1, name: "Admin", pronoun: "He", identity: "System Controller", desc: "Default system administrator.", avatarUrl: "", bannerUrl: "" }
];

let roles = defaultRoles;
try { 
    const saved = localStorage.getItem(STORAGE_KEY);
    if(saved) roles = JSON.parse(saved);
} catch(e) { console.warn("Local storage disabled or unavailable."); }

if(roles.length === 0) roles = defaultRoles;
let currentRole = roles[0];
let editingRoleId = null;
let tempAvatar = "";
let tempBanner = "";
let activeImageTarget = "";

// 直接注入 HTML
const mainContentRoles = document.getElementById('main-content');
const appFrame = document.getElementById('app-frame');

if(mainContentRoles && appFrame) {
    const pageHtml = `
        <div class="page" id="page-roles">
            <div class="role-list" id="roleListContainer"></div>
        </div>
    `;
    mainContentRoles.insertAdjacentHTML('beforeend', pageHtml);

    const modalHtml = `
        <div class="modal-overlay" id="editModal">
            <div class="edit-card">
                <div class="edit-header">
                    <button class="btn-text" onclick="closeEditModal()">Cancel</button>
                    <span style="font-size:12px; font-weight:bold;">Edit Profile</span>
                    <button class="btn-text btn-save" onclick="saveRoleData()">Save</button>
                </div>
                <div class="edit-body">
                    <div class="banner-upload" id="editBanner" onclick="openImagePicker('banner')"></div>
                    <div class="avatar-upload-wrapper" id="editAvatar" onclick="openImagePicker('avatar')"><span id="editAvatarText">A</span></div>
                    <div class="form-group">
                        <div class="input-box"><label class="input-label">Name</label><input type="text" id="inputName" class="input-field" placeholder="Role Name"></div>
                        <div class="input-box">
                            <label class="input-label">Pronouns</label>
                            <select id="inputPronoun" class="input-field">
                                <option value="He">He / Him</option><option value="She">She / Her</option><option value="They">They / Them</option><option value="It">It / Its</option>
                            </select>
                        </div>
                        <div class="input-box"><label class="input-label">Identity / Role</label><input type="text" id="inputIdentity" class="input-field" placeholder="e.g. System Admin"></div>
                        <div class="input-box"><label class="input-label">Bio / Settings</label><textarea id="inputBio" class="input-field" rows="4" placeholder="Character description..."></textarea></div>
                    </div>
                    <div id="deleteBtnArea" style="padding: 0 20px 40px;"><button onclick="deleteCurrentRole()" style="width:100%; padding:15px; border:1px solid #ff4444; color:#ff4444; background:transparent;">Delete Role</button></div>
                </div>
            </div>
        </div>
        <div class="modal-overlay" id="imgPickerOverlay" style="z-index: 2100; align-items: center;">
            <div class="img-picker-modal active">
                <p style="margin:0 0 10px; font-size:12px;">Select Image Source</p>
                <button class="picker-btn" onclick="triggerFileInput()">Local File (Album)</button>
                <button class="picker-btn" onclick="triggerUrlInput()">Image URL (Link)</button>
                <button class="picker-btn" style="border-color: transparent;" onclick="closeImagePicker()">Cancel</button>
            </div>
        </div>
        <input type="file" id="fileInput" accept="image/png, image/jpeg, image/jpg" style="display:none" onchange="handleFileSelect(this)">
    `;
    appFrame.insertAdjacentHTML('beforeend', modalHtml);

    document.getElementById('userTrigger').addEventListener('click', (e) => {
        e.stopPropagation();
        document.getElementById('roleDropdown').classList.toggle('active');
    });
    document.addEventListener('click', () => document.getElementById('roleDropdown').classList.remove('active'));
    document.getElementById('inputName').addEventListener('input', updatePreviewUI);

    renderRoles();
    updateHeader();
}

function updateHeader() {
    document.getElementById('currentName').textContent = currentRole.name;
    document.getElementById('currentAvatar').textContent = currentRole.name.charAt(0);
}

function renderRoles() {
    const listContainer = document.getElementById('roleListContainer');
    const dropdownContainer = document.getElementById('roleDropdown');
    listContainer.innerHTML = ''; dropdownContainer.innerHTML = '';

    roles.forEach(role => {
        const card = document.createElement('div');
        card.className = 'stamp-card';
        if(role.bannerUrl) card.style.backgroundImage = `url('${role.bannerUrl}')`;
        card.onclick = () => openEditModal(role.id);
        
        let avatarStyle = role.avatarUrl ? `width:40px; height:40px; font-size:18px; background-image: url('${role.avatarUrl}'); background-size: cover; color: transparent;` : "width:40px; height:40px; font-size:18px;";
        card.innerHTML = `<div class="avatar" style="${avatarStyle}">${role.name.charAt(0)}</div><div class="role-info"><h3>${role.name} <span style="font-size:10px; opacity:0.6; border:1px solid #666; padding:0 2px; border-radius:3px;">${role.pronoun}</span></h3><p>${role.identity} | ${role.desc.substring(0, 20)}${role.desc.length>20?'...':''}</p></div>`;
        listContainer.appendChild(card);

        const item = document.createElement('div');
        item.className = 'dropdown-item';
        item.onclick = () => { currentRole = role; updateHeader(); document.getElementById('roleDropdown').classList.remove('active'); };
        let smallAvatarStyle = role.avatarUrl ? `width:24px; height:24px; font-size:10px; background-image: url('${role.avatarUrl}'); background-size: cover; color: transparent;` : "width:24px; height:24px; font-size:10px;";
        item.innerHTML = `<div class="avatar" style="${smallAvatarStyle}">${role.name.charAt(0)}</div><span>${role.name}</span>`;
        dropdownContainer.appendChild(item);
    });

    const addBtn = document.createElement('div');
    addBtn.className = 'add-role-card';
    addBtn.innerHTML = `<span style="font-size:24px; color:var(--text-dim);">+</span>`;
    addBtn.onclick = () => openEditModal(null);
    listContainer.appendChild(addBtn);
}

function openEditModal(roleId) {
    editingRoleId = roleId;
    tempAvatar = ""; tempBanner = "";
    if (roleId) {
        const role = roles.find(r => r.id === roleId);
        document.getElementById('inputName').value = role.name;
        document.getElementById('inputPronoun').value = role.pronoun || "He";
        document.getElementById('inputIdentity').value = role.identity || "";
        document.getElementById('inputBio').value = role.desc || "";
        tempAvatar = role.avatarUrl || ""; tempBanner = role.bannerUrl || "";
        document.getElementById('deleteBtnArea').style.display = 'block';
    } else {
        document.getElementById('inputName').value = ""; document.getElementById('inputPronoun').value = "He";
        document.getElementById('inputIdentity').value = ""; document.getElementById('inputBio').value = "";
        document.getElementById('deleteBtnArea').style.display = 'none';
    }
    updatePreviewUI();
    document.getElementById('editModal').classList.add('active');
}

function closeEditModal() { document.getElementById('editModal').classList.remove('active'); }

function updatePreviewUI() {
    const bannerEl = document.getElementById('editBanner');
    bannerEl.style.backgroundImage = tempBanner ? `url('${tempBanner}')` : 'none';
    const avatarEl = document.getElementById('editAvatar');
    const textEl = document.getElementById('editAvatarText');
    if(tempAvatar) {
        avatarEl.style.backgroundImage = `url('${tempAvatar}')`; textEl.style.opacity = 0;
    } else {
        avatarEl.style.backgroundImage = 'none'; textEl.style.opacity = 1;
        const nameVal = document.getElementById('inputName').value;
        textEl.textContent = nameVal ? nameVal.charAt(0) : "A";
    }
}

function saveRoleData() {
    const name = document.getElementById('inputName').value;
    if(!name) { alert("Name is required"); return; }
    const newRoleData = {
        id: editingRoleId || Date.now(), name: name, pronoun: document.getElementById('inputPronoun').value,
        identity: document.getElementById('inputIdentity').value, desc: document.getElementById('inputBio').value,
        avatarUrl: tempAvatar, bannerUrl: tempBanner
    };
    if (editingRoleId) {
        const index = roles.findIndex(r => r.id === editingRoleId);
        if(index !== -1) roles[index] = newRoleData;
        if(currentRole.id === editingRoleId) { currentRole = newRoleData; updateHeader(); }
    } else { roles.push(newRoleData); }
    saveToLocal(); renderRoles(); closeEditModal();
}

function deleteCurrentRole() {
    if(!editingRoleId) return;
    if(confirm("Delete this role? This cannot be undone.")) {
        roles = roles.filter(r => r.id !== editingRoleId);
        if(currentRole.id === editingRoleId) { currentRole = roles.length > 0 ? roles[0] : null; if(currentRole) updateHeader(); }
        saveToLocal(); renderRoles(); closeEditModal();
    }
}

function saveToLocal() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(roles)); } catch (e) { alert("Storage full! Image might be too large."); }
}

function openImagePicker(target) { activeImageTarget = target; document.getElementById('imgPickerOverlay').style.display = 'flex'; }
function closeImagePicker() { document.getElementById('imgPickerOverlay').style.display = 'none'; }
function triggerFileInput() { document.getElementById('fileInput').click(); closeImagePicker(); }
function triggerUrlInput() { const url = prompt("Paste image link (URL ending in .jpg/.png):"); if(url) processImage(url); closeImagePicker(); }
function handleFileSelect(input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) { processImage(e.target.result); };
        reader.readAsDataURL(input.files[0]);
    }
    input.value = '';
}
function processImage(imgData) {
    if(activeImageTarget === 'avatar') tempAvatar = imgData; else tempBanner = imgData;
    updatePreviewUI();
}
