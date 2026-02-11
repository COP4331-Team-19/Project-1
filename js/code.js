// BASE URL for API calls
const urlBase = '/api';
const extension = 'php';

// LOGIN FUNCTION
async function doLogin() {
    const loginName = document.getElementById('loginName').value;
    const loginPassword = document.getElementById('loginPassword').value;

    document.getElementById('loginResult').innerHTML = '';

    const jsonPayload = JSON.stringify({
        Login: loginName,
        Password: loginPassword
    });

    try {
        const response = await fetch(urlBase + '/Login.' + extension, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: jsonPayload
        });

        const data = await response.json();

        if (data.error && data.error !== "") {
            document.getElementById('loginResult').innerHTML = data.error;
        } else {
            localStorage.setItem('userId', data.id);
            localStorage.setItem('firstName', data.firstName);
            localStorage.setItem('lastName', data.lastName);

            window.location.href = 'contacts.html';
        }
    } catch (error) {
        console.error('Error:', error);
        document.getElementById('loginResult').innerHTML = 'Connection error. Please try again.';
    }
}

// REGISTER FUNCTION
async function doRegister() {
    const firstName = document.getElementById('regFirstName').value;
    const lastName = document.getElementById('regLastName').value;
    const loginName = document.getElementById('regLoginName').value;
    const password = document.getElementById('regPassword').value;

    document.getElementById('registerResult').innerHTML = '';

    const jsonPayload = JSON.stringify({
        FirstName: firstName,
        LastName: lastName,
        Login: loginName,
        Password: password
    });

    try {
        const response = await fetch(urlBase + '/register.' + extension, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: jsonPayload
        });

        const data = await response.json();

        if (data.error && data.error !== "") {
            document.getElementById('registerResult').innerHTML = data.error;
        } else {
            const resultSpan = document.getElementById('registerResult');
            resultSpan.style.color = '#28a745';
            resultSpan.innerHTML = 'Account created successfully! Please login.';

            document.getElementById('regFirstName').value = '';
            document.getElementById('regLastName').value = '';
            document.getElementById('regLoginName').value = '';
            document.getElementById('regPassword').value = '';

            setTimeout(function() {
                toggleForms();
                resultSpan.innerHTML = '';
                resultSpan.style.color = '';
            }, 2000);
        }
    } catch (error) {
        console.error('Error:', error);
        document.getElementById('registerResult').innerHTML = 'Connection error. Please try again.';
    }
}

// CONTACTS PAGE FUNCTIONS
function loadContacts() {
    console.log("loadContacts function called");
    const userId = localStorage.getItem("userId");

    if (!userId) {
        window.location.href = "index.html";
        return;
    }

    fetch("/api/DisplayContact.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId })
    })
    .then(function(res) {
        return res.text().then(function(text) {
            console.log("Status:", res.status);
            console.log("Raw response:", text);
            return JSON.parse(text);
        });
    })
    .then(function(data) {
        const tbody = document.getElementById("contactsBody");
        tbody.innerHTML = "";

        if (data && data.error) {
            alert(data.error);
            return;
        }

        if (!Array.isArray(data)) {
            console.error("Unexpected response:", data);
            return;
        }

        data.forEach(function(contact) {
            const row = tbody.insertRow();
	    row.innerHTML = `
  		<td><span>${escapeHtml(contact.FirstName ?? "")}</span></td>
 		<td><span>${escapeHtml(contact.LastName ?? "")}</span></td>
 		<td><span>${escapeHtml(contact.Email ?? "")}</span></td>
 		<td><span>${escapeHtml(contact.Phone ?? "")}</span></td>
 		<td>
  		  <button class="edit-btn" onclick="editContact(this)">✎</button>
   		  <button class="delete-btn" onclick="deleteContact(this)">×</button>
 	        </td>
	    `;	
	});
    })
    .catch(function(err) {
        console.error("Error loading contacts:", err);
    });
}

function escapeHtml(str) {
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function deleteContact(btn) {
    // Check if the button is already in "Confirm" state
    if (btn.classList.contains('delete-confirm')) {
        // 2nd Click: Actually Delete
        const row = btn.closest('tr');
        row.remove();
        
        // TODO: Call your Delete API here
        // const contactId = ...
        // deleteContactAPI(contactId);
        
    } else {
        // 1st Click: Change to "Confirm?" state
        btn.classList.add('delete-confirm');
        btn.innerHTML = "✓"; // Change text to ask for confirmation
        
        // Optional: Auto-revert if they don't click within 3 seconds
        setTimeout(() => {
            if (btn && document.body.contains(btn)) {
                btn.classList.remove('delete-confirm');
                btn.innerHTML = "×";
            }
        }, 3000);
    }
}

function addContact() {
    const tbody = document.getElementById('contactsBody');
    
    // Insert a new row at the top of the table
    const row = tbody.insertRow(0);
    row.classList.add('editing-mode'); // Mark as being edited immediately

    // Insert cells with empty inputs
    row.innerHTML = `
        <td><input type="text" class="inline-input" placeholder="First Name"></td>
        <td><input type="text" class="inline-input" placeholder="Last Name"></td>
        <td><input type="email" class="inline-input" placeholder="Email"></td>
        <td><input type="tel" class="inline-input" placeholder="Phone"></td>
        <td>
            <button class="edit-btn save-btn" onclick="saveNewContact(this)">💾</button>
            <button class="delete-btn" onclick="deleteContact(this)">×</button>
        </td>
    `;
}

// Helper function for saving a new contact
async function saveNewContact(btn) {
    const row = btn.closest('tr');
    const inputs = row.querySelectorAll('input');
    
    const firstName = inputs[0].value.trim();
    const lastName  = inputs[1].value.trim();
    const email     = inputs[2].value.trim();
    const phoneNum  = inputs[3].value.trim();
    const userId    = localStorage.getItem("userId");

    // Validation
    if (!firstName || !lastName || !email || !phoneNum) {
        inputs.forEach(input => {
            if(!input.value) input.style.borderColor = "red";
        });
        return;
    }

    try {
        // API Call
        const res = await fetch("/api/AddContact.php", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ firstName, lastName, email, phoneNum, userId })
        });
        
        // If successful, convert the row to standard "View" mode
        const cells = row.getElementsByTagName('td');
        cells[0].innerHTML = `<span>${escapeHtml(firstName)}</span>`;
        cells[1].innerHTML = `<span>${escapeHtml(lastName)}</span>`;
        cells[2].innerHTML = `<span>${escapeHtml(email)}</span>`;
        cells[3].innerHTML = `<span>${escapeHtml(phoneNum)}</span>`;
        
        // Switch button to normal Edit handler
        btn.innerHTML = "✎";
        btn.classList.remove('save-btn');
        btn.onclick = function() { editContact(this); }; // Rebind to standard edit
        row.classList.remove('editing-mode');

    } catch (err) {
        console.error("Error adding contact:", err);
        // Ideally show an inline error message here, e.g., turning inputs red
    }
}

function initializeContactsSearch() {
    const searchBar = document.getElementById('searchBar');
    if (searchBar) {
        searchBar.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase();
            const rows = document.querySelectorAll('#contactsBody tr');

            rows.forEach(function(row) {
                const text = row.textContent.toLowerCase();
                row.style.display = text.includes(searchTerm) ? '' : 'none';
            });
        });
    }
}

// EDIT CONTACT FUNCTION
function editContact(btn) {
    const row = btn.closest('tr');
    const cells = row.getElementsByTagName('td');
    const isEditing = row.classList.contains('editing-mode');

    if (isEditing) {
        // --- SAVE ACTION ---
        // 1. Get values from the input fields
        const newFirst = cells[0].querySelector('input').value.trim();
        const newLast  = cells[1].querySelector('input').value.trim();
        const newEmail = cells[2].querySelector('input').value.trim();
        const newPhone = cells[3].querySelector('input').value.trim();

        // 2. Simple Validation (ensure not empty)
        if (!newFirst || !newLast || !newEmail || !newPhone) {
            // Instead of alert, we can highlight empty borders red
            if(!newFirst) cells[0].querySelector('input').style.borderColor = "red";
            return; 
        }

        // 3. Update the UI (Convert inputs back to spans)
        cells[0].innerHTML = `<span>${escapeHtml(newFirst)}</span>`;
        cells[1].innerHTML = `<span>${escapeHtml(newLast)}</span>`;
        cells[2].innerHTML = `<span>${escapeHtml(newEmail)}</span>`;
        cells[3].innerHTML = `<span>${escapeHtml(newPhone)}</span>`;

        // 4. Reset Button to Edit Mode
        btn.innerHTML = "✎"; // Pencil icon
        btn.classList.remove('save-btn');
        row.classList.remove('editing-mode');

        // TODO: Call your Update API here with the new values
        // updateContactAPI(userId, newFirst, newLast, newEmail, newPhone);

    } else {
        // --- EDIT ACTION ---
        // 1. Get current text values
        const currentFirst = cells[0].innerText;
        const currentLast  = cells[1].innerText;
        const currentEmail = cells[2].innerText;
        const currentPhone = cells[3].innerText;

        // 2. Replace spans with Input fields
        cells[0].innerHTML = `<input type="text" class="inline-input" value="${currentFirst}" placeholder="First Name">`;
        cells[1].innerHTML = `<input type="text" class="inline-input" value="${currentLast}" placeholder="Last Name">`;
        cells[2].innerHTML = `<input type="email" class="inline-input" value="${currentEmail}" placeholder="Email">`;
        cells[3].innerHTML = `<input type="tel" class="inline-input" value="${currentPhone}" placeholder="Phone">`;

        // 3. Change Button to Save Mode
        btn.innerHTML = "💾"; // Floppy Disk icon
        btn.classList.add('save-btn');
        row.classList.add('editing-mode');
    }
}

console.log("code.js loaded - functions defined");