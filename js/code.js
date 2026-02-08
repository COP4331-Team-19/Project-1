// BASE URL for API calls
const urlBase = '/api';
const extension = 'php';

// LOGIN FUNCTION
async function doLogin() {
    const loginName = document.getElementById('loginName').value;
    const loginPassword = document.getElementById('loginPassword').value;
    
    // Clear any previous error messages
    document.getElementById('loginResult').innerHTML = '';
    
    // Create JSON payload - matching your Login.php parameter names
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
            // Show error message
            document.getElementById('loginResult').innerHTML = data.error;
        } else {
            // Login successful - store user data
            localStorage.setItem('userId', data.id);
            localStorage.setItem('firstName', data.firstName);
            localStorage.setItem('lastName', data.lastName);
            
            // Redirect to contacts page
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
    
    // Clear any previous messages
    document.getElementById('registerResult').innerHTML = '';
    
    // Create JSON payload - matching your Register.php parameter names
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
            // Show error message
            document.getElementById('registerResult').innerHTML = data.error;
        } else {
            // Signup successful - show success message
            const resultSpan = document.getElementById('registerResult');
            resultSpan.style.color = '#28a745';
            resultSpan.innerHTML = 'Account created successfully! Please login.';
            
            // Clear form fields
            document.getElementById('regFirstName').value = '';
            document.getElementById('regLastName').value = '';
            document.getElementById('regLoginName').value = '';
            document.getElementById('regPassword').value = '';
            
            // Switch to login form after 2 seconds
            setTimeout(() => {
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