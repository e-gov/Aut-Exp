
### ID-kaardiga autentimine testimine
Järgnevate testidega saab uurida, kas ID-kaardiga autentimine on õigesti teostatud. Teostuse õigsuse määravad nii välise autentimisteenuse teostus (kui veebirakendus kasutab autentimisteenust) kui ka veebirakenduse enda teostus (kui veebirakendus teeb autentimise ise), samuti seansihalduse teostus (veebirakenduses, ühekordse sisselogimise e SSO puhul ka SSO teenuses). 

Elemendid: ID-kaardi kaardilugejasse 1) panek 2) väljavõtmine 3) uuesti sissepanek 4) teise inimese kaardi sissepanek 5) autentimine. 6) uuesti autentimine 7) autentimine teise inimese poolt. 8) PIN 1 küsimine. 9) seansi lõpetamine (väljalogimine) kasutaja poolt 10) serveri poolt.

| testi nr  | tee             | jah |      ei      |
|-----------|-----------------|-----|--------------|
| 1  | Logi ID-kaardiga sisse. Võta kaart välja. Tee rakenduses mõni oluline toiming. Kas rakendus laseb toimingu teha? |  | 👍 Ei saa eeldada, et kaardi kaardilugejas hoidmine on autendituna püsimise tingimus.| 👍 Mõni rakendus suudab jälgida, kas kaart on sees.  |
| 2  | Logi-ID kaardiga sisse. Logi välja. Logi uuesti sisse. Kas rakendus küsib uuesti sisselogimisel PIN 1-te? |  👍 | |
| 3  | Logi ID-kaardiga sisse mõnda muusse rakendusse. Seejärel ava sirvikus uus sakk ja logi rakendusse sisse. Kas rakendus küsib PIN 1-te? | 👍 | 😮 |
| 4  | Logi ID-kaardiga sisse. Võta kaart välja. Pane kaart uuesti sisse. Kas rakendus laseb tööd jätkata? | 👍 | 👍 |
| 5  | Logi ID-kaardiga sisse. Võta kaart välja. Pane teise inimese kaart sisse. Kas rakendus laseb tööd jätkata? | 👍 Ei saa eeldada, et kaardi kaardilugejas hoidmine on autendituna püsimise tingimus. | 👍 |
| 6  | Logi ID-kaardiga sisse. Sule sakk. Ava uus sakk. Ava rakendus. Kas oled sisselogitud? | 👍 Veebirakendusel (selle serveripoolsel osal) on saki sulgemist raske kinni püüda. | 👍 |
| 7  | Logi ID-kaardiga sisse. Sule sirvik. Ava sirvik uuesti. Kas oled sisselogitud? | 😮 | 👍 |
| 8  | Logi ID-kaardiga sisse. Sule sakk. Sule sirvik. Ava sirvik uuesti. Ava rakendus. Kas oled sisselogitud? | | |
| 9  | Logi ID-kaardiga sisse. Logi välja. Võta kaart välja. Pane teise inimese kaart sisse. Logi sisse. Kas rakendus küsib PIN 1-te? | 👍 | 💥 ID-kaardiga autentimine on vigaselt teostatud! |

**

ID-kaardiga autentimise traditsiooniline meetod tugineb TLS seansi kokkuleppimisele serveri ja sirviku vahel.

Kokkuleppimise käigus loeb sirvik ID-kaardilt kasutaja autentimisserdi ja edastab selle serverile. Serdi lugemisel küsib sirvik (täpsemalt kasutaja arvutisse paigaldatud ID-kaardi baastarkvara) kasutajalt PIN 1-te.

ID-kaardiga autentimise lahenduses tuleb jälgida, et **autentimine ei toimuks TLS seansi korduvkasutamisega**. Server peab TLS seansi kokkuleppimisel sirvikule teatama, et ta ei soovi seansi korduvkasutamist. Sirvik peab soovi täitma. See peab avalduma PIN1 küsimises. Platvormiti on seadistused, seadistamise võimalused - ja tarkvara reageerimine seadistusele! - erinevad. Seetõttu tuleb ID-kaardi lahendust kindlasti testida:

- kas ja kuidas kaardi väljavõtmine, aga ka uuesti kaardilugejasse panemine mõjutab autentimist?
- kas korduval autentimisel (ilma sirvikut sulgemata) küsitakse PIN1?

TLS seanss (_TLS session_) on serveri ja sirviku vahel kokkulepitud turvaparameetrite kogum (ühine krüpteerimisvõti jm). Server ja sirvik lepivad seansi kokku ja kasutavad seda korduvalt. Sirviku järjekordsel pöördumisel serveri poole (HTTP päring) võtavad pooled olemasoleva TLS seansi ja loovad seda kasutades TCP ühenduse (_TCP connection_). Päring saab vastatud ja TCP ühendus suletakse. Kokkulepitud turvaparameetreid s.o TLS seanssi saab aga kasutada edaspidigi. Seda nimetatakse TLS seansi korduvkasutamiseks (_TLS session resumption_). TLS seansi korduvkasutamise aeg on piiratud kasutatava võrgutarkvara (harilikult OpenSSL) seadistusega. Seejärel tuleb seanss uuesti luua. Pooled võivad TLS "seansilepingu" igal ajal uuesti läbi rääkida (_TLS session renegotiation_). Uuesti läbirääkimine (nimetame seda ümberkätlemiseks) võib toimuda nii serveri kui ka sirviku algatusel. Ümberkätlemisel lepivad pooled turvaparameetrid uuesti kokku.

**

Repo eesmärk on uurida ja katsetada ID-kaardi kasutamist veebirakendustes:

- ID-kaardiga autentimist traditsioonilisel meetodil (TLS kliendiserdi kaudu)
- TLS seansi korduvkasutamist (_TLS session resumption_)
- TLS seansi ümberkätlust (_TLS session renegotiation_)
- sertide (nii autentimis- kui ka allkirjastamisserdi) lugemist ID-kaardilt sirvikus töötava Javascripti kaudu (hwcrypto.js ja Chrome Token Signing sirvikulaienduse abil).

Selleks on Node.js veebirakendused: `uuring.js`, `loeSerdid.js` ja `allkirjasta.js`.

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
npm install --save jsonwebtoken
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

Käivita server:

`node allkirjasta`

Sirvikus ava:

`https://<host>:8000`

See ei ole täielik, XML konteineri ja ajatempliga allkiri, vaid lihtsam.

 
