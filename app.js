const express = require('express');
const path = require('path');
const { MongoClient, ServerApiVersion } = require('mongodb');
const bodyParser = require('body-parser');
const app = express();
const port = 3000;
require('dotenv').config();

const uri = process.env.MONGO_URI; 

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
  tls: true,
  tlsAllowInvalidCertificates: true // Esto puede ser necesario dependiendo de tu entorno
});

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

let db, urlsCollection;

client.connect().then(() => {
  db = client.db('url_program');
  urlsCollection = db.collection('urls');
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

app.get('/privacy-policy', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'privay-policy.html'));
});

app.get('/terms-and-condicions', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'terms-condicions.html'));
});

app.get('/cookie-policy', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'cookie-policy.html'));
});

app.get('/contact', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'contact.html'));
});

app.get('/count', async (req, res) => {
  try {
    const count = await urlsCollection.countDocuments();
    res.status(200).send({ count });
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: 'Failed to retrieve URL count' });
  }
});

app.post('/create', async (req, res) => {
  const { shortUrl, longUrl } = req.body;

  if (shortUrl.length > 20) {
    return res.status(400).send({ error: 'Short URL exceeds maximum length of 20 characters' });
  }

  try {
    const url = new URL(longUrl);
    const domain = url.hostname;
    
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
    res.status(201).send({ message: 'URL created', shortUrl });
  } catch (error) {
    res.status(500).send({ error: 'Failed to create URL' });
  }
});


app.get('/:shortUrl', async (req, res) => {
  const { shortUrl } = req.params;
  try {
    const url = await urlsCollection.findOne({ shortUrl });
    if (url) {
      res.redirect(url.longUrl);
    } else {
      res.status(404).send('URL not found');
    }
  } catch (error) {
    res.status(500).send({ error: 'Failed to retrieve URL' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
