const express = require('express');
const path = require('path');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const bodyParser = require('body-parser');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const bcrypt = require('bcryptjs');
const app = express();
const port = 3000;
const QRCode = require('qrcode');
require('dotenv').config();

const uri = process.env.MONGO_URI;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
  tls: true,
  tlsAllowInvalidCertificates: true
});

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

let db, urlsCollection, totalURLsCollection, usersCollection;

client.connect().then(() => {
  db = client.db('url_program');
  urlsCollection = db.collection('urls');
  totalURLsCollection = db.collection('totalURLcreated');
  usersCollection = db.collection('users');
  console.log('Connected to MongoDB');
}).catch(err => {
  console.error('Failed to connect to MongoDB', err);
});

async function isAuthenticated(req, res, next) {
  try {
    if (req.session.userId) {
      const user = await usersCollection.findOne({ _id: new ObjectId(req.session.userId) });
      if (user) {
        req.username = user.username;
        return next();
      }
      return res.status(401).send({ error: 'Unauthorized' });
    }
    return res.status(401).send({ error: 'Unauthorized' });
  } catch (error) {
    console.error('Error in authentication middleware:', error);
    res.status(500).send({ error: 'Internal Server Error' });
  }
}

// Configuración de la sesión
app.use(session({
  secret: process.env.SESSION_SECRET || 'mySecret',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    client: client,
    dbName: 'url_program',
    collectionName: 'sessions',
    ttl: 14 * 24 * 60 * 60
  }),
  cookie: {
    maxAge: 14 * 24 * 60 * 60 * 1000
  }
}));

const blockedDomains = [
  "iplogger.org",
  "upgrade",
  "wl.gl",
  "upgrade",
  "ed.tc",
  "upgrade",
  "bc.ax",
  "upgrade",
  "iplogger.com",
  "maper.info",
  "iplogger.ru",
  "iplogger.co",
  "2no.co",
  "yip.su",
  "iplogger.info",
  "ipgrabber.ru",
  "ipgraber.ru",
  "iplis.ru",
  "02ip.ru",
  "ezstat.ru",
  "iplog.co",
  "iplogger.cn",
  "pornhub.com",
  "xvideos.com",
  "xhamster.com",
  "redtube.com",
  "youporn.com",
  "xnxx.com",
  "brazzers.com",
  "pulpo69.com"
];

app.get('/helloworld', isAuthenticated, (req, res) => {
  const username = req.username || 'Guest'; // Manejar el caso cuando no se encuentra el nombre de usuario
  res.send(`Hello, ${username}! Welcome to the protected route.`);
});

app.get('/logged_user', isAuthenticated, (req, res) => {
  const username = req.username; // Handle the case when username is not found
  if (!username) {
    return res.status(404).json({ error: 'Username not found' });
  }
  res.json({ username });
});

app.get('/generate-qr', async (req, res) => {
  const text = req.query.text; // El texto para el código QR viene de la query string

  try {
      const qr = await QRCode.toDataURL(text, { scale: 10 }); // Aumenta el tamaño del código QR
      res.status(200).send({ qr });
  } catch (error) {
      console.error(error);
      res.status(500).send({ error: 'Failed to generate QR code' });
  }
});

const routes = [
  { path: '/privacy-policy', file: 'privay-policy.html' },
  { path: '/terms-and-conditions', file: 'terms-conditions.html' },
  { path: '/cookie-policy', file: 'cookie-policy.html' },
  { path: '/contact', file: 'contact.html' },
  { path: '/404', file: '404.html' },
  { path: '/qr-generator', file: 'qr-generator.html' },
  { path: '/register', file: 'register.html' },
  { path: '/login', file: 'login.html' },
  { path: '/logout', file: 'logout.html'},
  { path: '/', file: 'url_list.html'}
];

routes.forEach(route => {
  app.get(route.path, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', route.file));
  });
});


app.get('/count', async (req, res) => {
  try {
    const totalURLsDocument = await totalURLsCollection.findOne({});
    const count = totalURLsDocument ? totalURLsDocument.totalURLcreated : 0;
    res.status(200).send({ count });
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: 'Failed to retrieve URL count' });
  }
});

const blockedShortUrls = ['helloworld', 'favicon.ico', 'privacy-policy', 
                          'terms-and-condicions', 'cookie-policy', 'contact', 
                          'count', 'create', 'admin', '404',
                          'script.js', 'script2.js', 'script3.js', 'script4.js' , 
                          'qr-generator', 'generate-qr', 'public', 'register', 'login',
                          'logout', 'script5.js', 'script6.js'
];

app.post('/create', async (req, res) => {
  var { shortUrl, longUrl } = req.body;

  //Handling possible XSS attacks + removing invisible characters
  shortUrl = shortUrl
  .trim()
  .replace(/\u200B/g, '')
  .replace(/[\x00-\x1F\x7F-\x9F]/g, '')
  .replace(/[\u200B-\u200D\uFEFF]/g, '')
  .replace(/&lt;|&gt;|&amp;|&quot;|&#039;/g, '');

  if (shortUrl.length > 20) {
    return res.status(400).send({ error: 'Short URL exceeds maximum length of 20 characters' });
  }

  if (blockedShortUrls.includes(shortUrl.toLowerCase())) {
    return res.status(400).send({ error: 'This short URL is blocked' });
  }

  try {
    const url = new URL(longUrl);
    const domain = url.hostname.toLowerCase();
    
    const isBlocked = blockedDomains.some(blockedDomain => {
      return domain === blockedDomain || domain.endsWith(`.${blockedDomain}`);
    });

    if (isBlocked) {
      return res.status(400).send({ error: 'Long URL contains a blocked domain' });
    }

    const existingUrl = await urlsCollection.findOne({ shortUrl });
    if (existingUrl) {
      return res.status(409).send({ error: 'Short URL already exists' });
    }

    //Agarro laa id del usuario
    const userId = req.session.userId || 'Guest';

    const newUrl = { User: userId, shortUrl, longUrl, createdAt: new Date() };
    await urlsCollection.insertOne(newUrl);
    await totalURLsCollection.updateOne({}, { $inc: { totalURLcreated: 1 }, $set: { lastCreation: new Date() } });
    res.status(201).send({ message: 'URL created', shortUrl });
  } catch (error) {
    if (error instanceof TypeError) {
      res.status(400).send({ error: 'Invalid URL' });
    } else {
      res.status(500).send({ error: 'Failed to create URL' });
    }
  }
});

app.get('/url_list', isAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'url_list.html'));
});

app.get('/list', isAuthenticated, async (req, res) => {
  const userId = req.session.userId;

  try {
    const userUrls = await urlsCollection.find({ User: userId }).toArray();
    res.json(userUrls);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user URLs' });
  }
});

app.get('/:shortUrl', async (req, res) => {
  const { shortUrl } = req.params;
  try {
    const url = await urlsCollection.findOne({ shortUrl });
    if (url) {
      res.redirect(url.longUrl);
    } else {
      res.redirect('/404');
    }
  } catch (error) {
    res.status(500).send({ error: 'Failed to retrieve URL' });
  }
});

// Ruta de registro
app.post('/reg', async (req, res) => {
  const { username, password } = req.body;

  try {
    const existingUser = await usersCollection.findOne({ username });
    if (existingUser) {
      return res.status(409).send({ error: 'Username already exists' });
    }

    if (!username || !password) {
      return res.status(400).send({ error: 'Username and password are required' });
    }
  
    //Si la contraseña tiene menos de 5 caracteres o el usuario tiene menos de 3 caracteres
    if (password.length < 6 || username.length < 3) {
      return res.status(400).send({ error: 'Username and password must have at least 3 and 5 characters, respectively' });
    }
  
    //La contraseña no puede ser igual al nombre de usuario
    if (password === username) {
      return res.status(400).send({ error: 'Password must be different from username' });
    }
  
    //La contraseña no puede ser igual a la palabra "password"
    if (password === 'password') {
      return res.status(400).send({ error: 'Password cannot be "password"' });
    }
  
    //La password no puede solo contener números
    if (/^\d+$/.test(password)) {
      return res.status(400).send({ error: 'Password must contain letters' });
    }
  
    //La password no puede ser solo letras 
    if (/^[a-zA-Z]+$/.test(password)) {
      return res.status(400).send({ error: 'Password must contain numbers' });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    await usersCollection.insertOne({ username, password: hashedPassword });

    res.status(201).send({ message: 'User registered successfully. Redirecting to login...' });
  } catch (error) {
    res.status(500).send({ error: 'Failed to register user' });
  }
});

// Ruta de login
app.post('/log', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).send({ error: 'Username and password are required' });
  }

  try {
    const user = await usersCollection.findOne({ username });
    if (!user) {
      return res.status(401).send({ error: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).send({ error: 'Invalid credentials' });
    }

    req.session.userId = user._id;
    res.status(200).send({ message: 'Logged in successfully. Redirecting...' });
  } catch (error) {
    res.status(500).send({ error: 'Failed to login user' });
  }
});

// Ruta de logout
app.post('/lout', isAuthenticated, (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res.status(500).send({ error: 'Failed to logout' });
    }
    res.redirect('/'); 
  });
});

app.delete('/url_delete/:id', isAuthenticated, async (req, res) => {
  const id = req.params.id;
  const loggedUserId = req.session.userId;

  try {
    const url = await urlsCollection.findOne({ _id: new ObjectId(id) });

    if (!url) {
      return res.status(404).send({ error: 'URL not found' });
    }

    if (url.User !== loggedUserId) {
      return res.status(403).send({ error: 'Unauthorized' });
    }

    const result = await urlsCollection.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return res.status(404).send({ error: 'URL not found' });
    }

    res.status(200).send({ message: 'URL deleted successfully' });

  } catch (error) {

    res.status(500).send({ error: 'Failed to delete URL' });

  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});