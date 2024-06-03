document.getElementById('qrForm').addEventListener('submit', function(event) {
    event.preventDefault();

    const text = document.getElementById('url').value;

    // Check if the text is a valid URL
    try {
        new URL(text);
    } catch (_) {
        return alert('Please enter a valid URL.');
    }

    fetch(`/generate-qr?text=${encodeURIComponent(text)}`)
        .then(response => response.json())
        .then(data => {
            const img = document.createElement('img');

            img.src = data.qr;

            img.style.width = '500px'; 
            img.style.height = '500px';
            img.style.display = 'block'; 
            img.style.margin = '0 auto'; 

            const responseDiv = document.getElementById('response');
            responseDiv.innerHTML = '';
            responseDiv.appendChild(img);
        })
        .catch(error => console.error('Error:', error));
});
