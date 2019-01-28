## TLS-põhine ID-kaardiga autentimine

Üritame ahela otsast otsani (_end-to-end_) läbi käia. Tekstilise jutustusega, sest TLS-põhise autentimise täisvoog puudutab nii mitut lüli ja tasandit, et ühe joonisega võib-olla ei saagi seda kujutada. [EstEid arhitektuuridokumendis](http://open-eid.github.io/#architecture-of-id-software), on ainult ID-kaardi baastarkvara komponentide ja nende vahetu ümbruse skeemid.

Ahela (või voo) peamised lülid:

- veebirakendus (serveriosa)
- veebirakenduse platvorm
- edge proxy
- sirvik
- opsüsteem e platvorm
- EstEID minidraiver (ID-kaardi baastarkvara komponent)
- kaardilugeja
- ID-kaart
- kasutaja.

Toetamist vajavaid sirvikuid on 3-5 (Chrome, Firefox, Internet Explorer, Edge). Toetamist vajavaid platvorme ligikaudu samaspalju (Windows, MacOS, Linux). Praktikas on oluline ka veebirakenduse platvorm  (Java, sh Tomcat, Apache veebiserver; Node.js vm). Edge proxy võib olla F5 Local Traffic Manager, Nginex vm.

Kõik lülid, v.a kasutaja, teostavad erinevaid tehnilisi standardeid. Standardite teostus varieerub tooteti.

Variante on seetõttu palju. Käime läbi tõenäoliselt enimlevinuma: Chrome Windows platvormil.
Chrome-i on paigaldatud [Chrome Native Client plugin]( https://github.com/open-eid/chrome-token-signing), kuid see autentimisvoos ei osale. Windows-sse on paigaldatud [EstEID Smart Card MiniDriver](https://github.com/open-eid/minidriver).

TLS-põhine autentimine algab HTTPS päringuga sirvikust veebirakenduse serveriosa poole.

Suuremas organisatsioonis on tavaline, et päringu võtab vastu ja TLS seansi korraldab "välisliikluse vahendaja" (edge proxy). See on moment on oluline eelkõige selle poolest, et Edge proxy kasutamisel on selle õige seadistamine väga oluliseks.

Päringut vastuvõttev veebirakenduse serveriosa (või seda esindav Edge proxy) peab olema seadistatud "kliendiserdi autentimisele" (Client Certificate Authentication, CCA). Kõnekeeles: server peab TLS kätluses küsima sirvikult serti.

(Üks võimalus on panna server kliendiserti küsima ainult autentimise otspunktis. Teiste otspunktide poole pöördub sirvik juba seansiga, saates küpsisest seansitõendi. Kokkuvõttes ei ole siiski näha, mis kasu see annaks).

Sirvik pärib op-süsteemi vahendusel ID-kaardilt kasutaja serdi. ja edastab selle serveripoolele. See käib läbi mitme lüli, millest lähemalt allpool. Niipalju siiski, et serdi lugemisel ID-kaardilt tehakse küsimus-vastus (_challenge-response_) krüptograafiline arvutus ja kasutajalt küsitakse PIN1-te. See on oluline, sest just PIN1 sisestamisega tõendab kasutaja, et mitte ainult kaart ei ole kaardilugejas, vaid ka kaardi omanik on arvuti taga.

TLS kätluse tulemusel loovad sirvik ja serveripool omavahel TLS seansi (_TLS session_). TLS seanss võiks lõppeda HTTPS päring-vastus transaktsiooniga. Kuna TLS kätluses toimuv ühise võtme kokkuleppimine on suhteliselt aeganõudev arvutus, on laialdaselt kasutusel TLS seansi puhverdamine e korduvkasutamine (_TLS session resumption_), vt [RFC 5077 Transport Layer Security (TLS) Session Resumption](https://www.ietf.org/rfc/rfc5077.txt). Tehniliselt on TLS seansi korduvkasutamine TLS laiendus, vt [RFC 4366 Transport Layer Security (TLS) Extensions]( https://www.ietf.org/rfc/rfc4366.txt). TLS seansi korduvkasutamisel salvestatakse varem kätluses kokkulepitud võtmed jm parameetrid ja võetakse järgmise HTTPS päring-vastus paari töötlemisel taas kasutusele. Sisuliselt tähendab see TLS seansi kestmist üle mitmete HTTPS päring-vastus paaride. TLS seansi korduvkasutamisel sirvikut uuesti ei autendita. Vaikimisi kestab selline seanss nt 300 sekundit, mille järel tehakse uus TLS seanss.

ID-kaardiga autentimisel tekitab TLS seansi korduvkasutamine probleemi: kuidas panna sirvik ID-kaardilt uuesti serti küsima - koos PIN1 küsimisega.

[TLS 1.2 protokollis](https://tools.ietf.org/html/rfc5246) on ümberkätluse (_TLS session renegotiation_) võimalus. Ümberkätlus tähendab seda, et serveripool ja sirvik võivad kehtiva TLS seansi krüptoparameetrid uuesti kokku leppida. Selle käigus saavad serveripool ja sirvik ka uuesti serte vahetada. Ümberkätlus on siiski suunatud krüptoparameetrite uuesti kokkuleppimisele, mitte kliendi uuesti autentimisele. Kasutame seega kõrvalefekti ja see alati ei toimi.

Veebirakendusest väljalogimine - ja seejärel uuesti sisselogimine iseenesest ei taga PIN1 uuestiküsimist.

Ümberkätlust saab algatada kumbki TLS seansi osapool. Seega server, saades sirvikust järjekordse HTTPS päringu, võib sirvikult nõuda kehtiva TLS seansi krüptoparameetrite uuesti kokkuleppimist. Ümberkätluses võib nõuda ka kogu seansi uuestiloomist. Samuti saab veebiserveri seadistada nii, et TLS seansi puhverdamist ei kasutata (mis aeglustab andmeliiklust). Need seadistused nõuavad veebiserveri head tundmist. Nt Node.js platvormil tuleks üles otsida ja seada parameeter `SSL_OP_NO_SESSION_RESUMPTION_ON_RENEGOTIATION` (“Instructs OpenSSL to always start a new session when performing renegotiation.”). Need ei ole enam triviaalsed seadistused.

Isegi kui serveripoolelt tuleb "selgesõnaline" nõudmine TLS seanss ümber kätelda või uuesti luua, sõltub palju ka sirviku poolel kasutatavast PIN1 puhverdamisest.

Sirvik ise ei puhverda. Puhverdab op-süsteem.

Windowsis on see dokumenteeritud: [Smart Card Architecture](https://docs.microsoft.com/en-us/windows/security/identity-protection/smart-cards/smart-card-architecture), jaotis "PIN caching". Põhjaliku uurimiseta on siiski raske aru saada, kuidas see käib. Funktsiooniga `RtlSecureZeroMemory` saab arvutis töötav rakendus (sirvik või DigiDoc4 klientrakendus) PIN1 puhvri tühjendada. Kas ja millistel juhtudel sirvik (Chrome) PIN1 puhvri tühjendamist op-süsteemilt nõuab, on selgusetu. Chrome-i lähtekood on küll avalik, samuti [BoringSSL](https://commondatastorage.googleapis.com/chromium-boringssl-docs/headers.html) (OpenSSL-i fork) lähtekood (Chrome kasutab seda TLS-suhtluseks), kuid nende uurimine nõuaks süvenemist.

Windows-isse on paigaldatud ID-kaardi baastarkvarasse kuuluv komponent [EstEID Smart Card MiniDriver](https://github.com/open-eid/minidriver), mis teostab [Windows Smart Card Minidrivers](https://docs.microsoft.com/en-us/previous-versions/windows/hardware/design/dn631754(v=vs.85)) v 7.07 spetsifikatsiooni. Minidraiver töötab pistikprogrammina op-süsteemi koosseisus, vt joonis [Smart Card Architecture](https://docs.microsoft.com/en-us/windows/security/identity-protection/smart-cards/smart-card-architecture)


See ahela osa on seega detailsemalt: sirvik (vm rakendus) <-> [Microsoft Base CSP](https://docs.microsoft.com/en-us/windows/desktop/seccrypto/microsoft-cryptographic-service-providers) (Cryptographic Service Provider) <-> minidraiver <-> [WinScard CryptoAPI](https://docs.microsoft.com/en-us/windows/desktop/api/winscard/) <-> [Smart Card Resource Manager](https://docs.microsoft.com/en-us/windows/desktop/secauthn/smart-card-resource-manager) <-> Device Manager <-> kaardilugeja <-> ID-kaart. 

Kaardi seisundi pärimine (kas kaart on sees?). Windows API pakub selleks võimalusi, nt [Smart Card Removal Policy Service](https://docs.microsoft.com/en-us/windows/security/identity-protection/smart-cards/smart-card-removal-policy-service) ja [SCardStatusA](https://docs.microsoft.com/en-us/windows/desktop/api/winscard/nf-winscard-scardstatusa). Kas ja kuidas need võimalused autentimisvoos võiksid kasutust leida, on selgusetu. Dokumentatsiooni põhjal tundub, et Windows-i [Security & Identity](https://docs.microsoft.com/en-us/windows/desktop/api/_security/) kujundamisel on esiplaanil olnud Windows-arvuti põhised kasutuslood. Nt saab seadistada, et kiipkaardi väljavõtmisel läheb arvuti lukku või kasutaja logitakse (arvutist) välja. Veebirakenduste kasutuslood aga tagaplaanil. 

Teadaolevalt on ka ID-kaardi tarkvaras seadistusi, mis mõjutavad PIN1 käitumist.

Kokkuvõttes on TLS-põhine ID-kaardiga autentimine pika ahelaga, erinevate organisatsioonide kontrolli all olevaid komponente - ja nende seadistusi (mis tooteti erinevad) hõlmav protsess. Protsessis on see mitmeid puhvreid, mis on küll vajalikud, kuid puhvrite õigeaegse tühjendamise puudumisel autentimine kas ei tööta või võib isegi viia väärate tulemusteni.

Protsessi võib küll uurida - nii standardite, koodi kui ka praktilise katsetamise ja testimise tasandil - kuid see on aeganõudev. Ühel inimesel on ka raske süüvida ahela kõigisse lülidesse.

Seetõttu pakub tõsist huvi alternatiiv - mitte-TLS-põhine ID-kaardiga autentimine, [Web eID: electronic identity cards on the Web](https://github.com/open-eid/browser-extensions2), M. Sõmermaa.

TLS on arenev protokoll. Protokolli laiendatakse uute võimalustega, nt: [RFC 8471 (2018) The Token Binding Protocol Version 1.0](https://tools.ietf.org/html/rfc8471) - TLS suhtluses kaua. üle seansside ja ühenduse kestva seose loomine kliendi ja serveri vahel. Omab mõtet, kui klient kasutab HSM-i. Vt ka [RFC 8472 (2018) Transport Layer Security (TLS) Extension for Token Binding Protocol Negotiation](https://tools.ietf.org/html/rfc8472). Laiendused toovad kaasa keerukust, eksimis- ja ründevõimalusi. Nt
[Tracking Users across the Web via TLS Session Resumption]( https://svs.informatik.uni-hamburg.de/publications/2018/2018-12-06-Sy-ACSAC-Tracking_Users_across_the_Web_via_TLS_Session_Resumption.pdf). Ka see on argument ID-kaardiga kasutaja autentimise TLS-st lahtisidumise poolt.
