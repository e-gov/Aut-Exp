Käesoleva repo eesmärk on uurida ID-kaardi veebirakendustes kasutamisel ettetulevaid efekte: TLS seansi korduvkasutamist (_TLS session resumption_), TLS seansi ümberkätlust (_TLS session renegotiation_) jt.

## ID-kaardiga autentimine Node.js-s

`uuring.js`

Kasutamine:

```
git clone https://github.com/e-gov/Aut-Exp # klooni repo serverarvutisse
cd Aut-Exp
mkdir keys 
```

Kanna kausta `keys`:

- serveri privaatvõti `https-server.key`
- serveri sert `https-server.cert`
- serveri CA sert `ca.cert`
- SK juursert `EE_Certification_Centre_Root_CA.pem.crt`
- SK vahesert `ESTEID-SK_2015.pem.crt`

Käivita server:

`node uuring`

Paigalda serveri CA sert või selle ülemsert sirvikusse usaldusankruks.

Sirvikus ava:

`https://<host>:8000`

Rakendus koosneb kahest lehest: avaleht `/` ja autentimisleht `/autendi`. Avalehe laadimisel serveri kliendiserti ei küsi. Vajuta nupule `Autendi`; sellega liigud autentimislehele. Autentimislehe laadimisel nõuab server sirvikult kliendiserti (`connection.renegotiate`). Serveri käivitamisel on seatud väärtus `SSL_OP_NO_SESSION_RESUMPTION_ON_RENEGOTIATION` - see peaks tagama, et seansi ümberkätlemisel tehakse uus seanss. Kahjuks see seadistus ei taga, et sirvik PIN1-te uuesti küsiks. Siiski kontrollib sirvik, et ID-kaarti on sees ja seda ei ole vahepeal välja võetud. Sellistel tingimustel on PIN1 "puhverdamine" aktsepteeritav. Serveri konsoolilt saad jälgida serdi väljalugemisi.

## Sertide lugemine ID-kaardilt

`loeSerdid.js`

Käivita server:

`node loeSerdid`

Paigalda serveri CA sert või selle ülemsert sirvikusse usaldusankruks.

Sirvikus ava:

`https://<host>:8000`

## Allkirjastamine (mittetäielik)

`allkirjas.js`

 