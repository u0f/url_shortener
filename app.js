const express = require('express');
const path = require('path');
const { MongoClient, ServerApiVersion } = require('mongodb');
const bodyParser = require('body-parser');
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

let db, urlsCollection;

client.connect().then(() => {
  db = client.db('url_program');
  urlsCollection = db.collection('urls');
  totalURLsCollection = db.collection('totalURLcreated');
  console.log('Connected to MongoDB');
}).catch(err => {
  console.error('Failed to connect to MongoDB', err);
});

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

app.get('/helloworld', (req, res) => {
  res.send('Hello World');
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
                          'qr-generator', 'generate-qr', 'public'
];

app.post('/create', async (req, res) => {
  var { shortUrl, longUrl } = req.body;

  //Handling possible XSS attacks + removing invisible characters
  shortUrl = shortUrl
  .trim()
  .replace(/\u200B/g, "")
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

    const newUrl = { shortUrl, longUrl, createdAt: new Date() };
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

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});