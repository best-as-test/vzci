const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { MongoClient } = require('mongodb');
require('dotenv').config(); // Učitavanje varijabli iz .env datoteke

const app = express();
const PORT = process.env.PORT;

let db;

// Middleware
app.use(bodyParser.json());
app.use(cors());

// Povezivanje s MongoDB
async function connectDB() {
  const mongoUri = process.env.MONGO_URI; // Preuzimanje URI-ja iz .env datoteke
  if (!mongoUri) {
    console.error('Greška: MONGO_URI nije definisan u .env datoteci.');
    process.exit(1);
  }

  try {
    const client = new MongoClient(mongoUri, { useUnifiedTopology: true });
    await client.connect();
    db = client.db(); // Automatski se koristi ime baze iz URI-ja
    console.log('Povezano na MongoDB');
  } catch (error) {
    console.error('Greška prilikom povezivanja na bazu:', error);
    process.exit(1);
  }
}

// Ruta za registraciju
app.post('/register', async (req, res) => {
  const { licensePlate, phone, email } = req.body;

  try {
    const existingUser = await db.collection('users').findOne({ licensePlate });
    if (existingUser) {
      return res.json({ success: false, message: 'Registarske oznake već postoje.' });
    }

    await db.collection('users').insertOne({ licensePlate, phone, email });
    res.json({ success: true, message: 'Registracija uspješna.' });
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: 'Greška prilikom registracije.' });
  }
});

// Ruta za pretragu registarskih oznaka
app.post('/search', async (req, res) => {
  const { licensePlate } = req.body;

  try {
    const user = await db.collection('users').findOne({ licensePlate });
    if (user) {
      res.json({ success: true, phone: user.phone });
    } else {
      res.json({ success: false, message: 'Registarske oznake nisu pronađene.' });
    }
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: 'Greška prilikom pretrage.' });
  }
});

// Ruta za brisanje registarskih oznaka
app.post('/delete', async (req, res) => {
  const { licensePlate, phone, email } = req.body;

  try {
    const user = await db.collection('users').findOne({ licensePlate });
    if (user && user.phone === phone && user.email === email) {
      await db.collection('users').deleteOne({ licensePlate });
      res.json({ success: true, message: 'Registarske oznake su uspješno obrisane.' });
    } else {
      res.json({ success: false, message: 'Podaci nisu ispravni.' });
    }
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: 'Greška prilikom brisanja.' });
  }
});

// Pokretanje servera
app.listen(PORT, async () => {
  await connectDB();
  console.log(`Server radi na http://localhost:${PORT}`);
});
