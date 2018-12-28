/**
 * Minimaalne HTTPS server
 * ID-kaardiga autentimise uurimiseks
 */

'use strict';

/* Vajalike teekide laadimine */
const fs = require('fs'); // Sertide laadimiseks
const path = require('path');
const https = require('https');
const express = require('express');

const app = express();

// Sea juurkaust, millest serveeritakse sirvikusse ressursse
app.use(express.static(__dirname + '/public'));

// Sea rakenduse vaadete (kasutajale esitatavate HTML-mallide) kaust
app.set('views', __dirname + '/views');

// Määra kasutatav mallimootor
app.set('view engine', 'ejs');

// Esilehe kuvamine
app.get('/', function (req, res) {
  console.log('avaleht');
  res.render('pages/uuring-avaleht');
});

// Teise lehe kuvamine
app.get('/autendi', function (req, res) {
  // Siin saab tellida TLS seansi ümberkätluse
  // https://nodejs.org/api/tls.html#tls_tlssocket_renegotiate_options_callback
  console.log('abi');
  console.log(req.connection.getProtocol()); // Töötab!

  if (req.connection.authorized) {
    console.log('klient autenditud');
  }
  else {
    console.log('klient autentimata');
  }

  req.connection.renegotiate(
    {
      requestCert: true,
      rejectUnauthorized: true
    },
    (e) => {
      if (e == null) {
        console.log('edukas');
        var kliendisert = req.connection.getPeerCertificate();
        console.log(kliendisert.subject);
        res.render('pages/uuring-autendi');
      } else {
        console.log(e.toString());
        res.render('Autentimine ebaõnnestus');
      }
    });

});

// -------- Defineeri HTTPS server -------- 
var HTTPS_S_options = {
  key: fs.readFileSync(
    path.join(__dirname, 'keys',
      'https-server.key'), 'utf8'),
  cert: fs.readFileSync(
    path.join(__dirname, 'keys',
      'https-server.cert'), 'utf8'),
  ca: [
    fs.readFileSync(path.join(__dirname, 'keys',
      'ca.cert'), 'utf8'),
    fs.readFileSync(path.join(__dirname, 'keys',
      'ESTEID-SK_2015.pem.crt'), 'utf8'),
    fs.readFileSync(path.join(__dirname, 'keys',
      'EE_Certification_Centre_Root_CA.pem.crt'), 'utf8')
  ],
  secureOptions:require('constants').SSL_OP_NO_SESSION_RESUMPTION_ON_RENEGOTIATION,
  requestCert: false,
  rejectUnauthorized: false
};
// Kehtesta suvandid ja sea Express päringutöötlejaks
var httpsServer = https.createServer(HTTPS_S_options, app);

// Veebiserveri käivitamine 
httpsServer.listen(8000, () => {
  console.log('HTTPS server kuuldel pordil: ' + httpsServer.address().port);
});
