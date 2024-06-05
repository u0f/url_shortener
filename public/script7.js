async function navbar() {
    try {
        const response  = await fetch('/logged_user', {
          method: 'GET',
        });
    
        const result = await response.json();

        console.log(response)

        if(result.username != null && result.username != undefined){
            document.querySelector('.dropdown-item[href="/logout"]').parentNode.style.display = 'block';
            document.querySelector('.dropdown-item[href="/url_list"]').parentNode.style.display = 'block';
        } else {
            document.querySelector('.dropdown-item[href="/login"]').parentNode.style.display = 'block';
            document.querySelector('.dropdown-item[href="/register"]').parentNode.style.display = 'block';
        };
        document.getElementById('username_a').textContent = `${ ( result.username == undefined ) ? '': result.username}`;

      } catch (error) {
        console.error(error);
      }

}

navbar();