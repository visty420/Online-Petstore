var slideIndex = 0;
showSlides();

function showSlides() {
    var i;
    var slides = document.getElementsByClassName("mySlides");

    if (slides && slides.length > 0) {
        for (i = 0; i < slides.length; i++) {
            slides[i].style.display = "none";
        }
        slideIndex++;
        if (slideIndex > slides.length) {
            slideIndex = 1;
        }
        slides[slideIndex - 1].style.display = "block";
        setTimeout(showSlides, 2000); // Schimbă imaginea la fiecare 2 secunde
    }
}

function getUserId() {
    // Trimite o cerere către server pentru a obține ID-ul utilizatorului din sesiune
    return fetch('http://localhost:3000/getUserId', {
      method: 'GET',
      credentials: 'include', // Include cookie-urile pentru autentificare
    })
      .then(response => response.json())
      .then(data => data.userId)
      .catch(error => {
        console.error('Eroare la obținerea ID-ului utilizatorului:', error);
        return null;
      });
  }
  

// Funcție pentru înregistrare
// Funcție pentru înregistrare
function registerUser(event) {
  event.preventDefault(); // Previne comportamentul implicit al formularului

  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  const confirmPassword = document.getElementById('confirm_password').value;

  // Validează parola
  if (password !== confirmPassword) {
      alert('Parolele nu coincid.');
      return;
  }

  // Trimite cerere către server pentru înregistrare
  fetch('http://localhost:3000/register', {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json',
      },
      body: JSON.stringify({ nume_utilizator: username, parola: password }),
  })
  .then(response => response.json())
  .then(data => {
      alert(data.message);
      // Dacă înregistrarea este reușită, ați putea redirecționa utilizatorul către pagina de autentificare aici
  })
  .catch(error => {
      console.error('Eroare la înregistrare:', error);
      alert('Eroare la înregistrare.');
  });
}

// Funcție pentru autentificare
function loginUser(event) {
  event.preventDefault(); // Previne comportamentul implicit al formularului

  const loginUsername = document.getElementById('login_username').value;
  const loginPassword = document.getElementById('login_password').value;

  // Trimite cerere către server pentru autentificare
  fetch('http://localhost:3000/login', {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json',
      },
      body: JSON.stringify({ nume_utilizator: loginUsername, parola: loginPassword }),
  })
  .then(response => response.json())
  .then(data => {
      alert(data.message);
      // Dacă autentificarea este reușită, primiți un token JWT în răspuns și puteți stoca acest token în localStorage pentru utilizare ulterioară
      if (data.token) {
          localStorage.setItem('jwtToken', data.token);
          // Aici puteți redirecționa utilizatorul către o altă pagină sau afișa conținut protejat
      }
  })
  .catch(error => {
      console.error('Eroare la autentificare:', error);
      alert('Numele de utilizator sau parola incorecte.');
  });
}


function requestProtectedResource() {
    const token = localStorage.getItem('jwtToken');

    fetch('http://localhost:3000/resource', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`, // Adaugă token-ul JWT în header
        },
    })
    .then(response => response.json())
    .then(data => {
        // Manipulați răspunsul de la server aici
    })
    .catch(error => {
        console.error('Eroare la obținerea resursei protejate:', error);
    });
}


function addToCart(produsId) {
    // Assume the quantity is always 1 for simplicity; this can be changed as needed
    const quantity = 1;
  
    const token = localStorage.getItem('jwtToken');
  
    if (!token) {
      alert('Autentificare necesară pentru a adăuga produsul în coș.');
      return;
    }
  
    fetch('http://localhost:3000/addToCart', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ produsId, cantitate: quantity }) 
    })
    .then(response => {
      if (!response.ok) {
        // If the server response is not OK, throw an error
        throw new Error('Request failed with status ' + response.status);
      }
      return response.json();
    })
    .then(data => {
      alert(data.message); 
      // If needed, update the local cart representation here
      // For example, if the server sends back the updated cart, you could:
      // localStorage.setItem('cart', JSON.stringify(data.cart));
    })
    .catch(error => {
      console.error('Eroare la adăugarea în coș:', error);
      alert('Eroare la adăugarea produsului în coș.');
    });
  }
  



function createProductCard(product) {
  // Creează containerul pentru produs
  const productContainer = document.createElement('div');
  productContainer.className = 'product-container';

  // Creează imaginea produsului
  const productImage = document.createElement('img');
  productImage.src = `Images/${product.image}`;
  productImage.alt = product.nume_produs;

  // Creează titlul produsului
  const productName = document.createElement('h3');
  productName.textContent = product.nume_produs;

  // Creează descrierea produsului
  const productDescription = document.createElement('p');
  productDescription.textContent = product.descriere;

  // Creează prețul produsului
  const productPrice = document.createElement('p');
  productPrice.textContent = `Preț: ${product.pret} RON`;

  // Creează butonul pentru adăugare în coș
  const addButton = document.createElement('button');
  addButton.textContent = 'Adaugă în Coș';
  addButton.addEventListener('click', () => addToCart(product.id, product.nume_produs, product.pret));

  // Adaugă toate elementele la containerul produsului
  productContainer.appendChild(productImage);
  productContainer.appendChild(productName);
  productContainer.appendChild(productDescription);
  productContainer.appendChild(productPrice);
  productContainer.appendChild(addButton);

  return productContainer;
}

function displayProducts() {
    const token = localStorage.getItem('jwtToken');
    if (!token) {
        alert('Autentificare necesară pentru a afișa produsele.');
        return;
    }

    fetch('http://localhost:3000/products', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`
        },
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Autentificarea a eșuat. Te rog să te loghezi.');
        }
        return response.json();
    })
    .then(products => {
        // Logica pentru afișarea produselor
        const productGallery = document.getElementById('product-gallery');
        products.forEach(product => {
            const productCard = createProductCard(product);
            productGallery.appendChild(productCard);
        });
    })
    .catch(error => {
        console.error('Eroare:', error);
        alert(error.message);
    });
}




function updateCart(utilizatorId, produsId, cantitate) {
  fetch('http://localhost:3000/updateCart', {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json'
      },
      body: JSON.stringify({ utilizatorId, produsId, cantitate })
  })
  .then(response => response.json())
  .then(data => {
      alert(data.message);
      
  })
  .catch(error => {
      console.error('Eroare la actualizarea coșului:', error);
      alert('Eroare la actualizarea coșului.');
  });
}


function displayCartItems() {
    const token = localStorage.getItem('jwtToken');
  
    if (!token) {
      alert('Autentificare necesară pentru a vedea coșul de cumpărături.');
      return;
    }
  
    fetch('http://localhost:3000/getCartItems', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Request failed: ' + response.statusText);
      }
      return response.json();
    })
    .then(cartItems => {
      const cartList = document.getElementById('cart-list');
      cartList.innerHTML = ''; // Clear existing cart items
  
      cartItems.forEach(item => {
        const listItem = document.createElement('li');
        listItem.textContent = `${item.nume_produs} - Cantitate: ${item.cantitate}, Total: ${item.total} RON`;
        cartList.appendChild(listItem);
      });
    })
    .catch(error => {
      console.error('Eroare la afișarea articolelor din coș:', error);
      alert('Eroare la afișarea coșului de cumpărături.');
    });
  }
  
  document.addEventListener('DOMContentLoaded', (event) => {
    displayCartItems();
  });
  









  



  

