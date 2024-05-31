async function getCount() {
    try {
      const response  = await fetch('/count', {
        method: 'GET',
      });
  
      const result = await response.json();
  
      document.getElementById('count').textContent = `URLs created: ${result.count}`;
  
    } catch (error) {
      console.error(error);
    }
  }
  
  getCount();