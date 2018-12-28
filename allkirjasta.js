/*
    Allkirjasta nõusolek
*/

'use strict';

/* Vajalike teekide laadimine */

/* Veebiraamistik Express */
const express = require('express');

/* Node.js krüptoteek */
const crypto = require('crypto');
/* Määra räsialgoritm - SHA256 */
const HASH_ALGO = 'sha256';

/* Serdi dekodeerimiseks */
const Pkijs = require('pkijs')
const Asn1js = require('asn1js')

/* JWT töötlemise teek */
const jsonwebtoken = require('jsonwebtoken');

/* Veebiserveri ettevalmistamine */
const app = express();
/* Kui Heroku keskkonnamuutujas ei ole määratud teisiti,
 siis kasutatakse porti 5000. Node.js ei tööta <1024 portidel.
*/
app.set('port', (process.env.PORT || 5000));

/* HTTP päringu keha töötlemise teek */
const bodyParser = require('body-parser');

/* Sea juurkaust, millest serveeritakse sirvikusse ressursse
 vt http://expressjs.com/en/starter/static-files.html 
 ja https://expressjs.com/en/4x/api.html#express.static */
app.use(express.static(__dirname + '/public'));

/* Sea rakenduse vaadete (kasutajale esitatavate HTML-mallide) kaust */
app.set('views', __dirname + '/views');

/* Määra kasutatav mallimootor */
app.set('view engine', 'ejs');

/* Loo body-parser töötlema application/json päringuid */
var jsonParser = bodyParser.json();

/**
 *  Järgnevad marsruuteri töötlusreeglid
 */

/**
 * Esilehe kuvamine
 */
app.get('/', function (req, res) {
  res.render('pages/allkirjasta');
});

/**
 * Dekodeeri PEM sert
 */
app.post('/decodeCert', jsonParser, function (req, res) {

  if (!req.body) {
    return res.status(500).json({ error: 'Sert ei tulnud päringus' });
  }

  var c = req.body.cert;
  console.log('Saadud sert:');
  console.log(c);

  console.log('Dekodeerin serti...');
  var dc = decodeCert(c);
  console.log('Sert dekodeeritud...');

  // Koosta objekt huvipakkuvatest elementidest
  var h = new Object;

  h['serialNumber'] = ab2str(dc.serialNumber.valueBlock.valueHex);

  var issuer = '';
  dc.issuer.typesAndValues.forEach((e) => {
    issuer = issuer +
      ((issuer === '') ? '' : ', ') +
      e.value.valueBlock.value;
  });

  var subject = '';
  dc.subject.typesAndValues.forEach((e) => {
    subject = subject +
      ((subject === '') ? '' : ', ') +
      e.value.valueBlock.value;
  });

  h['issuer'] = issuer;
  h['subject'] = subject;

  console.log(JSON.stringify(h));
  res.status(200)
    .json(
      {
        serditeave: h
      }
    );
});

/**
 * Tõendi moodustamine
 * AJAX-otspunkt,
 * võtab sirvikust tõendi keha, tagastab tõendi.
 */
app.post('/getJWT', jsonParser, function (req, res) {

  if (!req.body) {
    return res.status(500).json({ error: 'Tõendi keha ei tulnud päringus' });
  }

  console.log('Saadud päringukeha:');
  console.log(JSON.stringify(req.body));

  var jwt = jsonwebtoken.sign(
    req.body.toendiKeha,
    'Tõendi allkirja saladus',
    {
      "algorithm": "HS256",
      "issuer": "Volli-POC",
      "subject": "Nõusolekutõend"
    });

  res.status(200).json({ jwt: jwt });

});

// Minimal example of loading a PEM certificate using pkijs (in node)

// babel-polyfill needs to be loaded for pkijs
// It uses webcrypto which needs browser shims
require('babel-polyfill');

function decodeCert(cert) {
  if (typeof cert !== 'string') {
    throw new Error('Expected PEM as string')
  }

  // Load certificate in PEM encoding (base64 encoded DER)
  const b64 = cert.replace(/(-----(BEGIN|END) CERTIFICATE-----|[\n\r])/g, '')

  // Now that we have decoded the cert it's now in DER-encoding
  const der = Buffer(b64, 'base64')

  // And massage the cert into a BER encoded one
  const ber = new Uint8Array(der).buffer

  // And now Asn1js can decode things \o/
  const asn1 = Asn1js.fromBER(ber)

  return new Pkijs.Certificate({ schema: asn1.result })
}

/* ArrayBuffer to String */
function ab2str(hashBuffer) {
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => ('00' + b.toString(16)).slice(-2)).join('');
  return hashHex;
}

/**
 * Veebiserveri käivitamine 
 */
app.listen(app.get('port'), function () {
  console.log('---- Node rakendus käivitatud ----');
});


