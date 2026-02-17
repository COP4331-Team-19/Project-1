// Base URL and extension for API calls 
const urlBase = '/api';
const extension = 'php';

// function for login
async function doLogin() {
    // login credentials found here 
    const loginName = document.getElementById('loginName').value;
    const loginPassword = document.getElementById('loginPassword').value;

    document.getElementById('loginResult').innerHTML = '';

    const jsonPayload = JSON.stringify({
        Login: loginName,
        Password: loginPassword
    });

    try {
        // login API called
        const response = await fetch(urlBase + '/Login.' + extension, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: jsonPayload
        });

        const data = await response.json();

        // if login credientials not correct
        if (data.error && data.error !== "") {
            document.getElementById('loginResult').innerHTML = data.error;
        } else {
            // else store credentials and redirect to contact page
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

// function to register 
async function doRegister() {
    // get new login credentials and info
    const firstName = document.getElementById('regFirstName').value;
    const lastName = document.getElementById('regLastName').value;
    const loginName = document.getElementById('regLoginName').value;
    const password = document.getElementById('regPassword').value;

    document.getElementById('registerResult').innerHTML = '';

    //json objects for register API
    const jsonPayload = JSON.stringify({
        FirstName: firstName,
        LastName: lastName,
        Login: loginName,
        Password: password
    });

    try {
        // calling the register API
        const response = await fetch(urlBase + '/register.' + extension, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: jsonPayload
        });

        const data = await response.json();

        // registration error response 
        if (data.error && data.error !== "") {
            document.getElementById('registerResult').innerHTML = data.error;
        } else {
            // auccessful account registration 
            const resultSpan = document.getElementById('registerResult');
            resultSpan.style.color = '#28a745';
            resultSpan.innerHTML = 'Account created successfully! Please login.';

            // clear form fields
            document.getElementById('regFirstName').value = '';
            document.getElementById('regLastName').value = '';
            document.getElementById('regLoginName').value = '';
            document.getElementById('regPassword').value = '';

            // switch to login form after 2 seconds
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

// logout function
function doLogout() {
    // clear the users data 
    localStorage.removeItem('userId');
    localStorage.removeItem('firstName');
    localStorage.removeItem('lastName');

    // redirect to login page
    window.location.href = 'index.html';
}

// load all the contacts within user ID using display contacts API
async function loadAllContacts() {
    const userId = localStorage.getItem("userId");

    // redirect user if no login ID found to login page 
    if (!userId) {
        window.location.href = "index.html";
        return;
    }

    try {
        // calling display contacts API
        const response = await fetch("/api/DisplayContact.php", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                ID: userId
            })
        });

        const data = await response.json();
        console.log("DisplayContacts API Response:", data);

        // error response
        if (data.error) {
            console.error("Display error:", data.error);
            const tbody = document.getElementById("contactsBody");
            tbody.innerHTML = "";
            return [];
        }

        // return the contacts in an array
        return Array.isArray(data) ? data : [];

    } catch (error) {
        console.error("Error loading all contacts:", error);
        return [];
    }
}

// search existing contacts function
async function searchContacts(searchTerm = '') {
    const userId = localStorage.getItem("userId");

    // extra check to make sure that if theres no user id to redirect to login
    if (!userId) {
        window.location.href = "index.html";
        return;
    }

    console.log("Searching for:", searchTerm);

    try {
        // call search contact API
        const response = await fetch("/api/SearchContact.php", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            //making json objects for API call
            body: JSON.stringify({
                userId: userId,
                search: searchTerm
            })
        });

        const data = await response.json();
        console.log("SearchContacts API Response:", data);

        // error response
        if (data.error && data.error !== "") {
            console.error("Search error:", data.error);
            const tbody = document.getElementById("contactsBody");
            tbody.innerHTML = "";
            return;
        }

        // display results 
        displayContacts(data.results || []);

    } catch (error) {
        console.error("Error searching contacts:", error);
    }
}

// display contacts function
function displayContacts(contacts) {
    const tbody = document.getElementById("contactsBody");
    tbody.innerHTML = "";
    
    console.log("Displaying contacts:", contacts);
    
    // Create a row for each contact
    contacts.forEach(function(contact) {
        const row = tbody.insertRow();
        
        // Handle both API formats (DisplayContact and SearchContact)
        const firstName = contact.FirstName || contact.firstName || "";
        const lastName = contact.LastName || contact.lastName || "";
        const email = contact.Email || contact.email || "";
        const phoneNum = contact.Phone || contact.phoneNum || "";
        
        row.innerHTML = `
            <td><span>${escapeHtml(firstName)}</span></td>
            <td><span>${escapeHtml(lastName)}</span></td>
            <td><span>${escapeHtml(email)}</span></td>
            <td><span>${escapeHtml(phoneNum)}</span></td>
            <td>
              <button class="edit-btn" onclick="editContact(this)">✎</button>
              <button class="delete-btn" onclick="deleteContact(this)">×</button>
            </td>
        `;
    });
}

// Escape HTML to prevent XSS attacks
function escapeHtml(str) {
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// delete contact function
async function deleteContact(btn) {
    // check to see if this is second stage to confirm delete
    if (btn.classList.contains('delete-confirm')) {
        // second click to actually delete contact
        const row = btn.closest('tr');
        const cells = row.getElementsByTagName('td');
        
        // get contact data from row
        const firstName = cells[0].innerText.trim();
        const lastName = cells[1].innerText.trim();
        const email = cells[2].innerText.trim();
        const phoneNum = cells[3].innerText.trim();
        const userId = localStorage.getItem("userId");

        try {
            // call delete contact api with json objects 
            const response = await fetch("/api/DeleteContact.php", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    firstName: firstName,
                    lastName: lastName,
                    email: email,
                    phoneNum: phoneNum,
                    userId: userId
                })
            });

            const data = await response.json();

            // delete error handling
            if (data.error && data.error !== "") {
                console.error("Delete error:", data.error);
                alert("Error deleting contact: " + data.error);
                // reset delete button
                btn.classList.remove('delete-confirm');
                btn.innerHTML = "×";
            } else {
                // remove the row from the table
                row.remove();
                
                // refresh search results 
                const searchBar = document.getElementById('searchBar');
                if (searchBar && searchBar.value.trim()) {
                    await searchContacts(searchBar.value);
                }
            }

        } catch (error) {
            console.error("Error deleting contact:", error);
            alert("Connection error. Could not delete contact.");
            // reset button state
            btn.classList.remove('delete-confirm');
            btn.innerHTML = "×";
        }

    } else {
        // first click to show confirmation
        btn.classList.add('delete-confirm');
        btn.innerHTML = "✓";

        // revert after 3 seconds
        setTimeout(() => {
            if (btn && document.body.contains(btn)) {
                btn.classList.remove('delete-confirm');
                btn.innerHTML = "×";
            }
        }, 3000);
    }
}

// add new contact function
function addContact() {
    const tbody = document.getElementById('contactsBody');

    // insert new row
    const row = tbody.insertRow(0);
    row.classList.add('editing-mode');

    // create input
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

// save contact
async function saveNewContact(btn) {
    const row = btn.closest('tr');
    const inputs = row.querySelectorAll('input');

    // store values from inputs
    const firstName = inputs[0].value.trim();
    const lastName  = inputs[1].value.trim();
    const email     = inputs[2].value.trim();
    const phoneNum  = inputs[3].value.trim();
    const userId    = localStorage.getItem("userId");

    // vlidate the inputs
    if (!firstName || !lastName || !email || !phoneNum) {
        inputs.forEach(input => {
            if(!input.value) input.style.borderColor = "red";
        });
        return;
    }

    try {
        // call add contact api with json objects 
        const res = await fetch("/api/AddContact.php", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ firstName, lastName, email, phoneNum, userId })
        });

        const data = await res.json();

        // handle error 
        if (data.error && data.error !== "") {
            console.error("Add error:", data.error);
            alert("Error adding contact: " + data.error);
            return;
        }

        // convert row to view mode
        const cells = row.getElementsByTagName('td');
        cells[0].innerHTML = `<span>${escapeHtml(firstName)}</span>`;
        cells[1].innerHTML = `<span>${escapeHtml(lastName)}</span>`;
        cells[2].innerHTML = `<span>${escapeHtml(email)}</span>`;
        cells[3].innerHTML = `<span>${escapeHtml(phoneNum)}</span>`;

        // reset button to edit mode
        btn.innerHTML = "✎";
        btn.classList.remove('save-btn');
        btn.onclick = function() { editContact(this); };
        row.classList.remove('editing-mode');
        
        // refresh search results if searching
        const searchBar = document.getElementById('searchBar');
        if (searchBar && searchBar.value.trim()) {
            await searchContacts(searchBar.value);
        }

    } catch (err) {
        console.error("Error adding contact:", err);
        alert("Connection error. Could not add contact.");
    }
}

// initialize search function
function initializeContactsSearch() {
    const searchBar = document.getElementById('searchBar');
    if (searchBar) {
        // actively search as input is being given
        searchBar.addEventListener('input', function() {
            const searchTerm = this.value;
            searchContacts(searchTerm);
        });
        
        // search upon enter key used as well
        searchBar.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                const searchTerm = this.value.trim();
                searchContacts(searchTerm);
            }
        });
    }
}

// edit contact function
async function editContact(btn) {
    const row = btn.closest('tr');
    const cells = row.getElementsByTagName('td');
    const isEditing = row.classList.contains('editing-mode');

    if (isEditing) {
        // save updated contact
        
        // get old values from data attributes
        const oldFirst = row.getAttribute('data-old-firstname');
        const oldLast = row.getAttribute('data-old-lastname');
        const oldEmail = row.getAttribute('data-old-email');
        const oldPhone = row.getAttribute('data-old-phone');

        // get new values from inputs
        const newFirst = cells[0].querySelector('input').value.trim();
        const newLast  = cells[1].querySelector('input').value.trim();
        const newEmail = cells[2].querySelector('input').value.trim();
        const newPhone = cells[3].querySelector('input').value.trim();

        // validate each input works
        if (!newFirst || !newLast || !newEmail || !newPhone) {
            if(!newFirst) cells[0].querySelector('input').style.borderColor = "red";
            if(!newLast) cells[1].querySelector('input').style.borderColor = "red";
            if(!newEmail) cells[2].querySelector('input').style.borderColor = "red";
            if(!newPhone) cells[3].querySelector('input').style.borderColor = "red";
            return;
        }

        const userId = localStorage.getItem("userId");

        try {
            // call the edit contact api with json objects 
            const response = await fetch("/api/EditContact.php", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId: userId,
                    oldValues: {
                        firstName: oldFirst,
                        lastName: oldLast,
                        email: oldEmail,
                        phoneNum: oldPhone
                    },
                    newValues: {
                        firstName: newFirst,
                        lastName: newLast,
                        email: newEmail,
                        phoneNum: newPhone
                    }
                })
            });

            const data = await response.json();

            // error handling
            if (data.error && data.error !== "") {
                console.error("Edit error:", data.error);
                alert("Error updating contact: " + data.error);
                return;
            }

            // update UI
            cells[0].innerHTML = `<span>${escapeHtml(newFirst)}</span>`;
            cells[1].innerHTML = `<span>${escapeHtml(newLast)}</span>`;
            cells[2].innerHTML = `<span>${escapeHtml(newEmail)}</span>`;
            cells[3].innerHTML = `<span>${escapeHtml(newPhone)}</span>`;

            // reset button to edit mode
            btn.innerHTML = "✎";
            btn.classList.remove('save-btn');
            row.classList.remove('editing-mode');

            // remove data attributes
            row.removeAttribute('data-old-firstname');
            row.removeAttribute('data-old-lastname');
            row.removeAttribute('data-old-email');
            row.removeAttribute('data-old-phone');

            // refresh search results if searching
            const searchBar = document.getElementById('searchBar');
            if (searchBar && searchBar.value.trim()) {
                await searchContacts(searchBar.value);
            }

        } catch (error) {
            console.error("Error updating contact:", error);
            alert("Connection error. Could not update contact.");
        }

    } else {

         // Get current values
        const currentFirst = cells[0].innerText;
        const currentLast  = cells[1].innerText;
        const currentEmail = cells[2].innerText;
        const currentPhone = cells[3].innerText;

        // store old values 
        row.setAttribute('data-old-firstname', currentFirst);
        row.setAttribute('data-old-lastname', currentLast);
        row.setAttribute('data-old-email', currentEmail);
        row.setAttribute('data-old-phone', currentPhone);

        // replace spans with input fields
        cells[0].innerHTML = `<input type="text" class="inline-input" value="${escapeHtml(currentFirst)}" placeholder="First Name">`;
        cells[1].innerHTML = `<input type="text" class="inline-input" value="${escapeHtml(currentLast)}" placeholder="Last Name">`;
        cells[2].innerHTML = `<input type="email" class="inline-input" value="${escapeHtml(currentEmail)}" placeholder="Email">`;
        cells[3].innerHTML = `<input type="tel" class="inline-input" value="${escapeHtml(currentPhone)}" placeholder="Phone">`;

        // change button to save mode
        btn.innerHTML = "💾";
        btn.classList.add('save-btn');
        row.classList.add('editing-mode');
    }
}

// toggle between Login and Register forms
function toggleForms() {
    const loginDiv = document.getElementById("loginDiv");
    const registerDiv = document.getElementById("registerDiv");

    if (loginDiv.classList.contains("hidden")) {
        loginDiv.classList.remove("hidden");
        registerDiv.classList.add("hidden");
    } else {
        loginDiv.classList.add("hidden");
        registerDiv.classList.remove("hidden");
    }
}

console.log("code.js loaded - functions defined");

// initialize search when page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
        initializeContactsSearch();
    });
} else {
    initializeContactsSearch();
}

// add delay to contacts link navigation
document.addEventListener('DOMContentLoaded', function() {
    const contactsLink = document.querySelector('.contacts-link');
    
    if (contactsLink) {
        contactsLink.addEventListener('click', function(e) {
            e.preventDefault();
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 200);
        });
    }
});