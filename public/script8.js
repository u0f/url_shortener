async function list() {
    try {
        const response  = await fetch('/list', {
          method: 'GET',
        });

        const urls = await response.json();

        const container = document.getElementById('div_lista');
        container.className = 'container';

        urls.forEach(url => {
            console.log(url);
            const urlDiv = document.createElement('div');
            urlDiv.className = 'mb-3 p-3 border-bottom';

            const titleLink = document.createElement('a');
            titleLink.textContent = `${window.location.hostname}/${url.shortUrl}`; 
            titleLink.href = `${window.location.protocol}//${window.location.hostname}/${url.shortUrl}`; 
            titleLink.className = 'h5 mb-2 d-block';
            titleLink.target = '_blank'; 

            const longUrlP = document.createElement('a');
            longUrlP.textContent = `Long URL: ${url.longUrl}`;
            longUrlP.href = url.longUrl;
            longUrlP.className = 'mb-1'; 

            const shortUrlP = document.createElement('p');
            shortUrlP.textContent = `Short URL: ${url.shortUrl}`;
            shortUrlP.className = 'mb-1';

            const createdAtP = document.createElement('p');
            const createdAtDate = new Date(url.createdAt);
            const options = { year: 'numeric', month: 'long', day: 'numeric' };
            createdAtP.textContent = `Created At: ${createdAtDate.toLocaleDateString('en-US', options)}`;
            createdAtP.className = 'mb-1';

            const deleteButton = document.createElement('button');
            deleteButton.textContent = 'Delete';
            deleteButton.className = 'btn btn-danger float-right';
            deleteButton.addEventListener('click', () => {
                try {
                    fetch(`/url_delete/${url._id}`, {
                        method: 'DELETE',
                    }).then((result) => {
                        if(result.status == 200){
                            container.removeChild(urlDiv);
                        } else {
                            console.log(result);
                        }
                    });
                } catch (e) {
                    alert(e);
                }
            });

            urlDiv.appendChild(titleLink);
            urlDiv.appendChild(longUrlP);
            urlDiv.appendChild(shortUrlP);
            urlDiv.appendChild(createdAtP);
            urlDiv.appendChild(deleteButton);

            container.appendChild(urlDiv);
        });

    } catch (error) {
        console.error(error);
    }
}

list();