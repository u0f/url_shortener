document.getElementById('urlForm').addEventListener('submit', async function(event) {
    event.preventDefault();
    
    const shortUrl = document.getElementById('shortUrl').value;
    const longUrl = document.getElementById('longUrl').value;
    const responseElement = document.getElementById('response');

    try {

        const response = await fetch('/create', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ shortUrl, longUrl })
        });

        const result = await response.json();

        if (response.ok) {
            responseElement.innerHTML = `URL created: <a href="${window.location.origin}/${result.shortUrl}" target="_blank">${window.location.origin}/${result.shortUrl}</a>`;
            
            document.getElementById('shortUrl').value = '';
            document.getElementById('longUrl').value = '';    

            const countElement = document.getElementById('count');
            const count = parseInt(countElement.textContent.split(': ')[1]) + 1;
            countElement.textContent = `Total URLs created: ${count}`;
        
        } else {

            switch(response.status) {
                case 400:
                    if (result.error.includes('exceeds maximum length')) {
                        responseElement.textContent = `Error. The short URL exceeds the maximum length of 30 characters.`;
                    } else if (result.error.includes('contains a blocked domain')) {
                        responseElement.textContent = `Error. The long URL contains a blocked domain.`;
                    
                    } else if (result.error.includes('short URL is blocked')) {
                        responseElement.textContent = `Error. This short URL is blocked.`;
                    } else {
                        responseElement.textContent = `Error.`;
                    }
                    break;
                case 409:
                    responseElement.textContent = `Error. This URL already exists.`;
                    break;
                case 500:
                    responseElement.textContent = `Error. There was a problem on the server.`;
                    break;
                default:
                    responseElement.textContent = `Error.`;
                    break;
            }
        }
    } catch (error) {
        responseElement.textContent = `Error: ${error.message}`;
    }
});
