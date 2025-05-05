const express = require('express');
const bodyParser = require('body-parser');
const pgp = require('pg-promise')();
const cors = require('cors');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = 3000;

// Cheie secretă pentru JWT (în practică, folosește o cheie mai complexă și o păstrează într-un loc sigur)
const JWT_SECRET = 'secretKeyForJWT';

app.use(cors());
app.use(bodyParser.json());

const db = pgp({
  user: 'admin1',
  password: 'admin',
  host: 'localhost',
  port: 5432,
  database: 'pet_shop'
});

app.use(bodyParser.json());

// Endpoint pentru înregistrare
app.post('/register', async (req, res) => {
  const { nume_utilizator, parola } = req.body;

  try {
    // Verificăm dacă numele de utilizator este deja înregistrat
    const existingUser = await db.oneOrNone('SELECT * FROM utilizatori WHERE nume_utilizator = $1', [nume_utilizator]);

    if (existingUser) {
      return res.status(400).json({ message: 'Numele de utilizator este deja folosit.' });
    }

    // Adăugăm noul utilizator în baza de date
    await db.none('INSERT INTO utilizatori(nume_utilizator, parola) VALUES($1, $2)', [nume_utilizator, parola]);

    res.status(201).json({ message: 'Utilizator înregistrat cu succes!' });
  } catch (error) {
    console.error('Eroare la înregistrare:', error);
    res.status(500).json({ message: 'Eroare la înregistrare.' });
  }
});

// Endpoint pentru autentificare
app.post('/login', async (req, res) => {
  const { nume_utilizator, parola } = req.body;

  try {
    const user = await db.oneOrNone('SELECT * FROM utilizatori WHERE nume_utilizator = $1 AND parola = $2', [nume_utilizator, parola]);

    if (!user) {
      return res.status(401).json({ message: 'Numele de utilizator sau parola incorecte.' });
    }

    // Creează un token JWT
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '1h' });

    res.status(200).json({ message: 'Autentificare reușită!', token });
  } catch (error) {
    console.error('Eroare la autentificare:', error);
    res.status(500).json({ message: 'Eroare la autentificare.' });
  }
});

// Adaugă o rută pentru a obține toate produsele
app.get('/products', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
      return res.status(401).json({ message: 'Token lipsă sau invalid.' });
  }

  try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const products = await db.any('SELECT * FROM produse');
      res.status(200).json(products);
    } catch (error) {
      console.error('Eroare la obținerea produselor:', error);
      res.status(500).json({ message: 'Eroare la obținerea produselor.' });
    }
  });

  app.post('/addToCart', async (req, res) => {
    const { produsId, cantitate } = req.body;
    const token = req.headers.authorization?.split(' ')[1];
  
    if (!token) {
      return res.status(401).json({ message: 'Autentificare necesară.' });
    }
  
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const utilizatorId = decoded.userId;
  
      await db.none('INSERT INTO cos_cumparaturi (utilizator_id, produs_id, cantitate) VALUES ($1, $2, $3)', [utilizatorId, produsId, cantitate]);
      res.status(200).json({ message: 'Produs adăugat în coș!' });
    } catch (error) {
      console.error('Eroare la adăugarea în coș:', error);
      res.status(500).json({ message: 'Eroare la adăugarea în coș.' });
    }
  });
  
  app.post('/updateCart', async (req, res) => {
    const { produsId, cantitate } = req.body;
    const token = req.headers.authorization?.split(' ')[1];
  
    if (!token) {
      return res.status(401).json({ message: 'Autentificare necesară.' });
    }
  
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const utilizatorId = decoded.userId;
  
      // Check if the item already exists in the cart
      const cartEntry = await db.oneOrNone('SELECT * FROM cos_cumparaturi WHERE utilizator_id = $1 AND produs_id = $2', [utilizatorId, produsId]);
  
      if (cartEntry) {
        // Update the quantity if it exists
        await db.none('UPDATE cos_cumparaturi SET cantitate = $1 WHERE utilizator_id = $2 AND produs_id = $3', [cantitate, utilizatorId, produsId]);
      } else {
        // Insert a new item if it doesn't exist
        await db.none('INSERT INTO cos_cumparaturi (utilizator_id, produs_id, cantitate) VALUES ($1, $2, $3)', [utilizatorId, produsId, cantitate]);
      }
  
      res.status(200).json({ message: 'Coș actualizat cu succes.' });
    } catch (error) {
      console.error('Eroare la actualizarea coșului:', error);
      res.status(500).json({ message: 'Eroare la actualizarea coșului.' });
    }
  });

  app.get('/getCartItems', async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
  
    if (!token) {
      return res.status(401).json({ message: 'Autentificare necesară.' });
    }
  
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const utilizatorId = decoded.userId;
  
      // Get the items from the cart along with the product details
      const cartItems = await db.any(`
        SELECT c.id, c.produs_id, p.nume_produs, p.pret, c.cantitate, (p.pret * c.cantitate) AS total
        FROM cos_cumparaturi c
        JOIN produse p ON c.produs_id = p.id
        WHERE c.utilizator_id = $1
      `, [utilizatorId]);
  
      res.status(200).json(cartItems);
    } catch (error) {
      console.error('Eroare la obținerea articolelor din coș:', error);
      // res.status(500).json({ message: 'Eroare la obținerea articolelor din coș.' });
    }
  });
    
  app.post('/resource', (req, res) => {
    const token = req.headers.authorization;

    if (!token) {
        return res.status(401).json({ message: 'Token lipsă.' });
    }

    try {
        const decoded = jwt.verify(token.replace('Bearer ', ''), JWT_SECRET);
        const utilizatorId = decoded.userId;

        // Acum puteți verifica ID-ul utilizatorului și acorda acces la resursă

        res.status(200).json({ message: 'Acces la resursă permis.' });
    } catch (error) {
        console.error('Eroare la verificarea token-ului:', error);
        res.status(401).json({ message: 'Token invalid.' });
    }
});



app.listen(PORT, () => {
  console.log(`Serverul rulează la adresa http://localhost:${PORT}`);
});



  
