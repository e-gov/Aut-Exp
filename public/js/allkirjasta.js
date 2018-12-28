'use strict';

const Valjastusala = document.getElementById('Valjastusala');
const Teateala = document.getElementById('Teateala');

function logi_tekst(s) {
  var d = document.createElement("div");
  d.innerHTML = s;
  document.getElementById('Valjastusala').appendChild(d);
}

function alusta() {
  $('#Allkirjastan').click(() => {

    // Tühjenda logi
    document.getElementById('Valjastusala').innerHTML = '';

    // Koosta nõusoleku andja poolt allkirjastatav struktuur
    var nousolek = {
      "kellele": $('Kellele').val(),
      "milleks": $('Milleks').val(),
      "mis ajani": $('MisAjani').val(),
      "nõusoleku andis": 'PRIIT',
      "nõusolekuteenus": "Volli-POC",
      "kuupäev": new Date().toUTCString()
    };

    // Võta allkiri
    allkirjasta();
    var allkiri = 'Allkiri';

    // Koosta tõend    
    var toendiKeha = {
      "nõusolek": nousolek,
      "allkiri": allkiri
    };
    logi_tekst('Koostatud tõend:');
    logi_tekst(JSON.stringify(toendiKeha, undefined, 4));

    // Tee AJAX-pöördumine serveri poolele tõendi moodustamiseks.
    $.ajax(
      'https://volli-poc.herokuapp.com/getJWT',
      {
        data: JSON.stringify({ toendiKeha: toendiKeha }),
        contentType: 'application/json',
        type: 'POST',
        success: (data, status) => {
          console.log('salvestaTekst: POST vastus: data (töölehe tulemus): ' + data.result);
          console.log('salvestaTekst: POST vastus: status: ' + status);
          if (status !== 'success') {
            logi_tekst('Tõendi moodustamine ebaõnnestus. :(');
            return
          }
        },
        error: (jqXHR, status, error) => {
          logi_tekst('Tõendi moodustamine ebaõnnestus. :(');
        }
      }
    );

  });

  function debug() {
    window.hwcrypto.debug().then(function (response) { logi_tekst("Debug: " + response); });
  }

  function allkirjasta() {
    // Timestamp
    logi_tekst("sign() clicked on " + new Date().toUTCString());

    if (!window.hwcrypto.use('auto')) {
      logi_tekst("Selecting backend failed.");
    }

    var hashtype = 'SHA-256';
    var hash = '413140d54372f9baf481d4c54e2d5c7bcf28fd6087000280e07976121dd54af2';
    // logi_tekst("Signing " + hashtype + ": " + hash);

    // debug
    window.hwcrypto.debug()
      .then(
        (response) => {
          logi_tekst("Debug: " + response);
        },
        (err) => {
          logi_tekst("debug() failed: " + err);
          return;
        });

    // Allkirjasta
    window.hwcrypto.getCertificate({ lang: 'et' })
      .then(function (response) {
        var cert = response;
        var certPEM = hexToPem(response.hex);
        logi_tekst("Sert loetud:\n");
        window.hwcrypto.sign(
          cert,
          { type: hashtype, hex: hash },
          { lang: 'et' }
        )
          .then(function (response) {
            logi_tekst("Moodustatud allkiri:\n" +
              response.hex.match(/.{1,64}/g).join("\n"));
          }, function (err) {
            logi_tekst("Allkirjastamine ebaõnnestus: " + err);
          });
      }, function (err) {
        logi_tekst("Allkirjastamine ebaõnnestus. Kontrolli, kas ID-kaart on lugejas. : "
          + err);
      });
  }
}