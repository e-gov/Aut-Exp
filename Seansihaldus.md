# Seansihaldus

* [Eesmärk](#eesmärk)
* [Seanss ja selle haldus](#seanss-ja-selle-haldus)
* [Seansi elukaar](#seansi-elukaar)
    * [Seansi loomine](#seansi-loomine)
    * [Seansi kontrollimine](#seansi-kontrollimine)
    * [Seansi aegumine](#seansi-aegumine)
    * [Seansi pikendamine](#seansi-pikendamine)
    * [Seansi lõpetamine](#seansi-lõpetamine)
    * [Seansi puhverdamine](#seansi-puhverdamine)
    * [Ühekordne sisse- ja väljalogimine (SSO)](#ühekordne-sisse--ja-väljalogimine-sso)
    * [Seansi "üleandmine"](#seansi-üleandmine)
* [Seansihalduse skeemi valik](#seansihalduse-skeemi-valik)
    * [Valikukohad](#valikukohad)
    * [Traditsiooniline skeem (juhusõne küpsises)](#traditsiooniline-skeem-juhusõne-küpsises)
    * [Veebitõend küpsises](#veebitõend-küpsises)
    * [Veebitõend sirvikupoolses seansihoidlas (Session Storage)](#veebitõend-sirvikupoolses-seansihoidlas-session-storage)
    * [Tühistusnimekirja kasutamine](#tühistusnimekirja-kasutamine)
    * [Skeemi valimine](#skeemi-valimine)
* [Ohud](#ohud)

## Eesmärk

Käesoleva juhendi eemärk on selgitada:
- mis on seansihaldus
- tüüpilised nõuded seansihaldusele
- variandid seansihalduse lahendamiseks
- kuidas seansihalduse varianti valida.

Lühidalt käsitleme ka seansihaldusega seotud turvaohte.

Selgitamine on vajalik tellija ootuste ja arendaja tööde piiritlemiseks, aga ka arusaamiseks, mida seansihaldus sisaldab. Internetis leidub palju seansihalduse käsitlusi, kuid tihti lähtuvad need kas konkreetsetest toodetest või erinevate arendajate harjumustest.

Piirdume veebirakenduse seansihaldusega. **Veebirakenduse** all mõistame inimkasutaja poolt sirvikus kasutatavat, kuid ka serveripoolset töötlust omavat rakendust. Seansihaldust on IT-s veel paljudes kihtides (nt veebirakenduse all jookseb TLS seanss, kuid see ei ole päris sama, mis kasutaja seanss).

Juhendi sihtrühmaks on e-teenuseid kavandavad arhitektid.

## Seanss ja selle haldus

**Seanss** on ajas piiratud suhe konkreetse kasutaja ja rakenduse vahel.

Seanss on seotud ka kasutaja seadmega, täpsemalt sirvikuga.

**Seansihaldus** rakenduse tehniliste omaduste kompleks, millega tagatakse, et rakendus, eriti selle serveripool, teab, et sirviku taga on sama kasutaja, kes seansi loomisel autenditi.

Veebirakenduses tegeleb seansihaldusega tavaliselt eraldi komponent. Seansihaldus on tihedalt seotud, kuid siiski erineb  autentimisest, pääsuhaldusest ja identiteedihaldusest laiemas mõttes. Seetõttu võib kohata väikeseid süsteeme, kus autentimine, seansi- ja pääsuhaldus on ühe komponendi kanda.

Seansiga seondub **seansiseisundi** hoidmise küsimus. Veebirakendust kasutab üheaegselt palju kasutajaid. Igaüks neist on oma tööjärjega oma seisus. Veebirakendus peab korraldama nende seisude ("olek", _state_) hoimise. Oluline küsimus on kummal pool (või mõlemal pool) olekut hoitakse. **Seansi- e olekuvabaks** (_sessionless_, _stateless_) suhtluseks nimetatakse sellist, kus suhet hoiab ülal ainult üks pool (klient s.t sirvik).

## Seansi elukaar

Seansihaldus jaguneb:

- seansi loomine
- seansi kontrollimine
- seansi aegumine
- seansi pikendamine
- seansi lõpetamine.

Seonduvad teemad on:

- seansi puhverdamine (taaskasutamine)
- ühekordne sisse- ja väljalogimine (_single sign-on_, SSO).
- seansi "üleandmine".

### Seansi loomine

Seanss luuakse vahetult kasutaja autentimise järel.

Nt. Autentimisteenuse TARA kasutamisel on autentimise tulemuseks:

- kasutaja sirviku kaudu tulnud OpenID Connect tagasipöördumispäring (vt https://e-gov.github.io/TARA-Doku/TehnilineKirjeldus#42-tagasisuunamisp%C3%A4ring)
- TARA serverist saadud ja kontrollitud identsustõend (vt https://e-gov.github.io/TARA-Doku/TehnilineKirjeldus#431-identsust%C3%B5end).

Konkreetne tegevus sõltub valitud seansihalduse skeemist (vt allpool).

### Seansi kontrollimine

Seansi kontrollimise vajadus tuleneb sellest, et veebirakendus on hajusrakendus. Veebirakendusel on kaks osa:

- sirvikus töötav osa (_front-end_), edaspidi ka lühidalt sirvik - Javascript kood koos HTML-koodiga. Laetakse serverist allikaadressilt (_origin_ URL).
- serveris töötav osa (_back-end_), edaspidi ka lühidalt server.

Sirvik ja server suhtlevad üksteisega peamiselt HTTP protokolli alusel, päring-vastus režiimis. Erandid: _server push_ tehnoloogia, WebRTC protokoll.

Seanss hõlmab enamat kui üht päring-vastus suhtlusakti. Seetõttu on vaja kontrollida, kas suhtluspartner on ikka sama. Serveril on püsiv identiteet - DNS domeeninime sisaldav URL. Sirvikul - ja seda kasutaval kasutajal - sellist püsiidentiteeti ei ole. Sirvikupoole identiteet luuakse kasutaja autentimisega. Server väljastab sirvikule **seansitõendi** (_session token_). Igal järgmisel pöördumisel esitab sirvik seansitõendi. Server peab kontrollima, et tõend on õige ja kehtiv.

Seansihalduse kontekstis on olulised ka sirviku päringud teistel aadressidel, kui allikaadress, asuvate ressursside laadimiseks. Need päringud jagunevad:

- lehelaadimispäringud
- AJAX-päringud.

Sirvik saab teha AJAX-päringuid ka oma allikaadressi s.t oma serveri poole.

### Seansi aegumine

Server ei saa vahetult kontrollida, kas (sama) kasutaja on veel arvuti taga. Seetõttu on levinud praktika seada seansile aegumisajad. Tüüpiliselt:

- seanss loetakse aegunuks, kui eelmisest autentimisest on möödunud teatud aeg.
- seanss loetakse aegunuks, kui kasutaja ei ole teatud aega midagi teinud.

Aegumisajad määratakse rakenduse seadistuses. Teaduslikult põhjendatud soovitusi aegumisaegade määramiseks ei ole teada.

### Seansi pikendamine

Seansi aegumisel võib rakendus anda kasutajale võimaluse seanssi pikendada. Seda võib teha:

- kasutaja kinnituse küsimisega
- uuesti autentimisega.

### Seansi lõpetamine

Seansi lõpetamine võib toimuda kas kasutaja või serveri algatusel. Seansi lõpetamise viis sõltub valitud seansihalduse skeemist.

Sirviku poolelt võib seansi lõpetamine toimuda:

- sirviku saki (tab) sulgemisega.
- sirviku täieliku sulgemisega.
- "Logi välja" nupuvajutusega, kui rakendus sellist võimalust pakub

Seansi lõpetamine võib olla raskem kui seansi alustamine. Seda mitmel põhjusel:

- seansi lõpetamise otsuse teisele poolele kohene edastamine võib olla võimatu. Nt server ei saa teha päringut sirvikusse (kui just ei kasutata _server push_ tehnoloogiat, _long polling_ mustrit ega WebRTC protokolli).
- seanss võib katkeda ebanormaalselt. Näiteks sirvik "kukub kokku" (_crash_) või kasutaja lõpetab sirviku töö op-süsteemi rakendusehalduri Task Manager vms vahendi abil.

Nii võib tekkida olukord, kus osapoolte arusaamine seansi kehtivusest erineb. Hajussüsteemis ei saagi sellist võimalust täielikult välistada.

### Seansi puhverdamine

Siin peame silmas sotsiaalvõrkude poolt laialt kasutatud praktikat, kus seanssi ei lõpetata sirviku sulgemisega. Sirvikut uuesti avades on kasutaja taas sisse logitud. Tehniliselt tehakse seda seansitõendi panemisega küpsisesse, mida sirviku sulgemisel ei kustutata.

### Ühekordne sisse- ja väljalogimine (SSO)
Ühekordse sisselogimise korral saab kasutaja - nagu nimigi ütleb - ühe autentimisega sisse logida mitmesse rakendusse. Tehniliselt tehakse see nii, et SSO teenus teeb kasutajaga seansi - seda nimetatakse **SSO seansiks**. Lisaks on igal rakendusel kasutajaga oma seanss. Rakendusse sisselogimisel kontrollitakse, kas kasutajaga on loodud SSO seanss. Kui jah, siis uuesti autentimist ei tehta.

Ühekordse sisselogimise juures ei ole kõige raskem mitte tehniline keerukus, vaid tagamine, et kasutaja saab aru, kuhu ta on või ei ole sisse (või välja) loginud. Ühekordne väljalogimine (_single sign-off_) tähendab seda, et kasutaja saab ühe väljalogimisega kõigist rakendustest välja logitud. Kõik vastavad seansid tuleb lõpetada. See on keerukas. 

Ühekordset väljalogimist saab teostada nii, et iga rakendus käib kasutaja iga pöördumise korral SSO serverilt küsimas, kas SSO seanss kehtib. See võib olla võrgule koormav ja on keskseks nuripunktiks (_single point of failure_).

Ühekordset sisselogimist saab kasutada ka ilma ühekordse sisselogimiseta. Sellisel juhul peab iga rakendus oma seansi pidamise ja lõpetamise eest ise hoolt kandma.

### Seansi "üleandmine"

Seansi üleandmise all mõistetakse autentimise tulemuse edasiandmist teisele rakendusele. Nt kasutaja logib sisse teabeväravasse eesti.ee, logib seal sisse ja suunatakse teise e-teenusesse. Hea oleks, kui teises teenuses ei peaks uuesti sisse logima. Seansi "üleandmine" on võimalik, kuid seda ei tohi teha seansitõendit lihtsalt kasutajale kaasa pannes. Tuleb läbi teha nonssi sisaldav voog.

## Seansihalduse skeemi valik

Seansihalduse lahendamiseks on u 4-5 levinud skeemi.

### Valikukohad

Seansihalduses tuleb konkreetses sirvikus töötav konkreetne kasutaja siduda rakendusega. Tavaliselt tehakse seda seansiga üksüheselt seotud identifikaatori või tõendi (_token_) abil. Valikukohad on:

- seansitõendi formaat: 
  - juhusõne
  - või rikkam andmestruktuur. Viimasel juhul on standardiks JSON Web Token (JWT)
- seansitõendi hoidmise koht: 
  - nii serveri kui ka sirviku poolel
  - ainult sirviku poolel
- seansitõendi töötleja sirvikus:
  - sirvik
  - rakenduse sirvikus töötav osa (Javascript)
- seansitõendi hoidmise koht sirvikus: 
  - küpsis
  - turvaküpsis (atribuudiga `HttpOnly`)
  - seansimälu (_web session storage_)
- tühistusnimekirja (_revocation list_) pidamisega või ilma.
- seansitõendi transport sirvikusse 
  - küpsise seadmise korraldusega
  - URL-is (ebaturvaline; mitte kasutada)
  - HTTPS vastuse kehas
- seansitõendi transport serverisse 
  - URL-is (ebaturvaline; mitte kasutada)
  - HTTPS päises (_header_)
  - POST päringu kehas (praktikas ei kasutata).

Need valikud koos määravad seansihalduse skeemi.

### Traditsiooniline skeem (juhusõne küpsises)

- Server genereerib juhusõne - seansitõendi (_session token_)
- Server salvestab seansitõendi serveris peetavasse seansihoidlasse (_session store_)
- Server saadab koos HTTPS päringu vastusega sirvikule korralduse seansitõendi panemiseks küpsisesse (**seansiküpsis**) _(session cookie_). Korralduses määratakse küpsise atribuudid `Secure` ja `HttpOnly`.
- Igakordsel järgneval pöördumisel serveri poole paneb sirvik HTTPS päringu päises seansiküpsise sisu päringule kaasa.
- Server kontrollib, et: 
  - sirvikust saadud seansitõend sisaldub seansihoidlas
  - seansitõend ei ole aegunud. 
-	Seansitõend loetakse aegunuks, kui viimasest autentimisest või kasutaja viimasest pöördumisest on möödunud teatud aeg. Need ajad peavad olema seadistatavad.
  - aegumisel või ka enne seda võib rakendus pakkuda kasutajale võimalust seanssi pikendada.
- Väljalogimine võib toimuda kas kasutaja või serveri algatusel.
- Kasutaja algatatud väljalogimisel: 
  - kasutaja vajutab "Logi välja"; sirvikust läheb serverisse vastav päring
  - server eemaldab seansitõendi seansihoidlast
  - server saadab päringu vastuses sirvikule korralduse seansiküpsise kustutamiseks
  - sirvik kustutab seansiküpsise. Sellega on seanss lõppenud.
- Serveri algatatud väljalogimisel: 
  - server eemaldab seansitõendi seansihoidlast
  - server saadab - võimalusel - kui kasutaja on pöördunud - sirvikusse seansiküpsise kustutamise korralduse.

### Veebitõend küpsises

Erineb traditsioonilisest meetodist selle poolest, et:

- Seansitõendina kasutatakse mitte juhusõne, vaid JSON Web Token-it (JWT). Eesti keeles nimetatakse JWT-t **veebitõendiks**.
- Veebitõendis on: 
  - kasutajat identifitseerivad andmed
  - tõendi väljaandmise aeg
  - allkiri
- Veebitõendisse võib panna ka muid andmeid.
- Serveri poolel seansihoidlat ei peeta.
- Veebitõendi kontrollimisel: 
  - kontrollitakse allkirja
  - tõendi ajalist kehtivust.

### Veebitõend sirvikupoolses seansihoidlas

Erinevus eelnevast on selles, et:
- Server saadab veebitõendi (JWT) sirvikusse HTTP vastuse kehas või päises (header).
- Rakenduse sirvikus töötav osa (Javascript) võtab HTTP vastusest veebitõendi ja paneb selle **seansihoidlasse** (_session store_).
- Sirvik tagab, et seansihoidla tühjendatakse sirviku saki (tab) sulgemisel.
- Rakenduse sirvikus töötav osa (Javascript) tagab, et järgnevatel pöördumistel serveri poole pannakse veebitõend päringuga kaasa (päringu päises, aga võib ka päringu kehas).

Suure hulga klientide puhul peetakse seansihoidlat põhimälus (_in-memory_), mitte andmebaasis. Sellisel juhul tuleb kõrgkäideldavuse saavutamiseks korraldada seansiteabe sünkroonimine klastri õlgade vahel (nt Hazelcast-ga). 

### Tühistusnimekirja kasutamine

Tühistusnimekirja (**revocation list**) pidamine on otstarbekas siis, kui tahetakse teostada väljalogimise funktsionaalsus. Kui rahuldab ka veebitõendi aegumine või sirvikus saki sulgemine (sirvikupoolse seansimälu kasutamisel), siis ei ole tühistusnimekirja vaja.
- Tühistusnimekiri on serveri poolel peetav nimekiri tühistatud veebitõenditest.
- Kasutaja igal pöördumisel kontrollib server, et sirvikust esitatud veebitõend ei ole kantud tühistusnimekirja.
- Veebitõend kantakse tühistusnimekirja väljalogimisel.

### Skeemi valimine

Seansihalduse skeem tuleks valida lähtudes:
- rakenduse kasutusmustrist
- rakenduse kriitilisusest
- ohuhinnangutest (vt jaotis "Ohud").

SSO kasutamise kaalumisel tuleks hinnata, kas ühekordne sisse- ja väljalogimine üldse sobib rakenduste kasutusmustrisse.

## Ohud

Peamised ohud on:

- **tõendivargus** - ründajal õnnestub kätte saada ohvrile väljastatud (või väljastamiseks mõeldud) seansitõendi. Loob eelduse tõendivõltsimisele ja taasesitusründele.
- **tõendi süstimine** - ründajal õnnestub ohvri sirvikus asendada õige tõend oma tõendiga.
- **päringuvõltsimine** (CSRF) - ründajal õnnestub oma tõend toimetada ohvri sirvikusse ja käivitada võltspäring serveri poole.
- **koodisüst** - ründajal õnnestub sirvikus töötava rakendusosa Javascript-i toimetada oma kood. Loob eelduse tõendile ligipääsemiseks.
- **taasesitusrünne** (_replay attack_) - ründajal õnnestub, kas oma või ohvri sirviku kaudu toime panna tõendi kasutamine mitteettenähtud kontekstis.

Ohtudeks võib lugeda ka:

- Ründaja on saavutanud kontrolli ohvri sirviku üle
- Ründaja on saavutanud kontrolli ohvri seadme op-süsteemi üle.

Need viimased on sellised, mille vastu ei ole kaitset ("all bets are off"). Tavaliselt välistatakse ka ohud:

- Ründaja suudab lugeda või muuta sirvikusse salvestatud turvaküpsist (atribuutidega `HttpOnly` ja `Secure` küpsist).
- Ründaja suudab (ohvri sirvikus töötavast teisest rakendusest) ligi saada seansihoidlale (_session storage_).

Koodisüsti ohtu peetakse suhteliselt suureks.

