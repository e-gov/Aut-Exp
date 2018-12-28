'use strict';

function logi(teade) {
  $('#logi').append('<br>' + teade);
}

function alusta() {

  $('#kontrolliNupp').click(() => {

    logi(" ");

    if (!window.hwcrypto.use('auto')) {
      logi("Selecting backend failed.");
    }

    window.hwcrypto.debug()
      .then(
        (response) => {
          logi("Debug: " + response);
        },
        (err) => {
          logi("debug() failed: " + err);
          return;
        });

    var options = { lang: 'et' };
    if (document.getElementById("radio1").checked == true) {
      options['filter'] = 'AUTH'
    }

    window.hwcrypto.getCertificate(options)
      .then(
        function (response) {
          var certPEM = hexToPem(response.hex);
          // var certDER = response.encoded;
          logi("Sert loetud:\n");
          kuvaSert(certPEM);
        },
        function (err) {
          logi("Serdi lugemine ebaõnnestus. Kontrolli, kas ID-kaart on lugejas. : "
            + err);
        }
      );
  });

  function kuvaSert(cert) {
    // Tee AJAX-pöördumine serveri poolele sserdi dekodeerimiseks
    $.ajax(
      'decodeCert', // NB! Kontrolli URL
      {
        data: JSON.stringify({
          cert: cert }),
        contentType: 'application/json',
        type: 'POST',
        success: (data, status) => {
          if (status !== 'success') {
            logi('Serdi dekodeerimine ebaõnnestus. :(');
            return
          }
          var inimkujul = JSON.stringify(data.serditeave, undefined, 2);
          logi(inimkujul);
        },
        error: (jqXHR, status, error) => {
          logi('Serdi dekodeerimine ebaõnnestus. :(');
        }
      }
    );

  }

}

