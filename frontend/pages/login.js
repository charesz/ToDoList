document.querySelector('form').addEventListener('submit', function(e) {
    // 1. Prevent the form from automatically redirecting
    e.preventDefault();

    // 2. Grab the input values
    const email = document.querySelector('input[type="email"]').value;
    const password = document.querySelector('input[type="password"]').value;

    // 3. Simple Logic: Check against a hardcoded user (for testing)
    // In a real app, you'd fetch this from a database or localStorage
    const validEmail = "admin@kanban.com";
    const validPassword = "password123";

    if (email === validEmail && password === validPassword) {
        alert("Login successful! Redirecting...");
        // 4. Manually redirect if credentials are correct
        window.location.href = "../index.html";
    } else {
        // 5. Show error if they don't match
        alert("Incorrect login details. Sign up if you're new!");
    }
});