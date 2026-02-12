document.getElementById('signupForm').addEventListener('submit', function(e) {
    e.preventDefault(); // Stop the form from just refreshing

    // Get the values from the input fields
    const name = document.getElementById('fullName').value;
    const email = document.getElementById('email').value;
    const pass = document.getElementById('password').value;
    const confirmPass = document.getElementById('confirmPassword').value;

    // 1. Basic Logic: Check if passwords match
    if (pass !== confirmPass) {
        alert("Passwords do not match!");
        return;
    }

    // 2. Storage Logic: Save the user to localStorage
    // Get existing users or start an empty array
    const users = JSON.parse(localStorage.getItem('users')) || [];

    // Check if email already exists
    const userExists = users.some(user => user.email === email);
    if (userExists) {
        alert("This email is already registered. Please login.");
        return;
    }

    // Add new user to the list
    users.push({ name: name, email: email, password: pass });
    localStorage.setItem('users', JSON.stringify(users));

    // 3. Success! Proceed to the main page
    alert("Account created successfully! Welcome to Kanban.");
    window.location.href = "../index.html"; 
});