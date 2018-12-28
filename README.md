Repo eesmärk on uurida ja katsetada ID-kaardi kasutamist veebirakendustes:

- ID-kaardiga autentimist traditsioonilisel meetodil (TLS kliendiserdi kaudu)
- TLS seansi korduvkasutamist (_TLS session resumption_)
- TLS seansi ümberkätlust (_TLS session renegotiation_)
- sertide (nii autentimis- kui ka allkirjastamisserdi) lugemist ID-kaardilt sirvikus töötava Javascripti kaudu (hwcrypto.js ja Chrome Token Signing sirvikulaienduse abil).

Selleks on 3 Node.js veebirakendust: `uuring.js`, `loeSerdid.js` ja `allkirjasta.js`

### Ettevalmistavad toimingud

Klooni repo serverarvutisse:

```
git clone https://github.com/e-gov/Aut-Exp 
```

Moodusta kaust `keys`:

```
cd Aut-Exp
mkdir keys 
```

Kanna kausta `keys`:

- serveri privaatvõti `https-server.key`
- serveri sert `https-server.cert`
- serveri CA sert `ca.cert`
- SK juursert `EE_Certification_Centre_Root_CA.pem.crt`
- SK vahesert `ESTEID-SK_2015.pem.crt`

Võtmed on kõigile kolmele veebirakendusele ühised.

Paigalda serveri CA sert või selle ülemsert sirvikusse usaldusankruks.

Paigalda Node.js teegid:

```
npm install --save express
npm install --save ejs
npm install --save pkijs
npm install --save asn1js
```

### ID-kaardiga autentimine Node.js-s

`uuring.js`

Kasutamine:

Käivita server:

`node uuring`

Sirvikus ava:

`https://<host>:8000`

Rakendus koosneb kahest lehest: avaleht `/` ja autentimisleht `/autendi`. Avalehe laadimisel serveri kliendiserti ei küsi. Vajuta nupule `Autendi`; sellega liigud autentimislehele. Autentimislehe laadimisel nõuab server sirvikult kliendiserti (`connection.renegotiate`). Serveri käivitamisel on seatud väärtus `SSL_OP_NO_SESSION_RESUMPTION_ON_RENEGOTIATION` - see peaks tagama, et seansi ümberkätlemisel tehakse uus seanss. Kahjuks see seadistus ei taga, et sirvik PIN1-te uuesti küsiks. Siiski kontrollib sirvik, et ID-kaarti on sees ja seda ei ole vahepeal välja võetud. Sellistel tingimustel on PIN1 "puhverdamine" aktsepteeritav. Serveri konsoolilt saad jälgida serdi väljalugemisi.

### Sertide lugemine ID-kaardilt

`loeSerdid.js`

Käivita server:

`node loeSerdid`

Sirvikus ava:

`https://<host>:8000`

Rakendus loeb ID-kaardilt nii autentimis- kui ka allkirjastamisserdi. Seda teeb mitte TLS seansi vaid sirvikus töötava Javascripti kaudu (hwcrypto.js ja Chrome Token Signing sirvikulaienduse abil).

### Allkirjastamine

`allkirjasta.js`

See ei ole täielik, XML konteineri ja ajatempliga allkiri, vaid lihtsam.

 