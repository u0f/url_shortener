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
            responseElement.innerHTML = `URL created: <a href="${window.location.origin}/${result.shortUrl}" target="_blank">${window.location.origin}/${result.shortUrl}</a> <button id="copyButton" onclick="navigator.clipboard.writeText('${window.location.origin}/${result.shortUrl}').then(function() { alert('URL copied successfully!'); })">        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path fill-rule="evenodd" clip-rule="evenodd" d="M21 8C21 6.34315 19.6569 5 18 5H10C8.34315 5 7 6.34315 7 8V20C7 21.6569 8.34315 23 10 23H18C19.6569 23 21 21.6569 21 20V8ZM19 8C19 7.44772 18.5523 7 18 7H10C9.44772 7 9 7.44772 9 8V20C9 20.5523 9.44772 21 10 21H18C18.5523 21 19 20.5523 19 20V8Z" fill="#0F0F0F"/>
            <path d="M6 3H16C16.5523 3 17 2.55228 17 2C17 1.44772 16.5523 1 16 1H6C4.34315 1 3 2.34315 3 4V18C3 18.5523 3.44772 19 4 19C4.55228 19 5 18.5523 5 18V4C5 3.44772 5.44772 3 6 3Z" fill="#0F0F0F"/>
        </svg></button>`;
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
