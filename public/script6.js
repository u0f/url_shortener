document.getElementById('loginForm').addEventListener('submit', function(event) {
    event.preventDefault();
  
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
  
    // Realiza una solicitud POST al servidor
    fetch('/log', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, password })
    })
    .then(response => response.json())
    .then(data => {
      const responseDiv = document.getElementById('response');
      responseDiv.innerHTML = '';
      const message = document.createElement('div');
      message.textContent = data.message || data.error;
      message.className = data.error ? 'alert alert-danger' : 'alert alert-success';
      responseDiv.appendChild(message);

      setTimeout(() => {
        if (!data.error) {
          window.location = '/';
        }
      }, 1500);
    })
    .catch(error => {
      console.error('Error:', error);
      const responseDiv = document.getElementById('response');
      responseDiv.innerHTML = '';
      const message = document.createElement('div');
      message.textContent = 'An error occurred. Please try again.';
      message.className = 'alert alert-danger';
      responseDiv.appendChild(message);
    });
  });
  