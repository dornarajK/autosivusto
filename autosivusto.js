const express = require('express');
const path = require('path');
const fs = require('fs');
const {port, host} = require('./config.json');
const autot = require('./autot.json');
const { toUnicode } = require('punycode');
const ejs = require('ejs'); 
const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'sivupohjat'));
app.use('/inc', express.static('includes'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const nimi = 'Dornaraj';

// Apufunktiot
newId = () => {
  let max = 0;
  for (let auto of autot) {
    if (auto.id > max) {
      max = auto.id;
    }
  }

  return max + 1;
};
// Määritellään polut

// ! tarkistus 12.5
// Uusi polku, autolista
// app.get('/', (req, res) => {
//   res.render('autolista', {
//     autot: autot,
//     lukumaara: autot.length,
//   });
// });

app.get('/', (req, res) => {
  // Assuming 'nimi' is defined somewhere in your server logic
   // Replace 'Your Name' with the actual name variable
  res.render('autolista', {
    autot: autot,
    lukumaara: autot.length,
    nimi: nimi // Pass the name variable to the template
  });
});

//?hakutulos.ejs 
app.post('/lisaa', (req, res) => {
  const etsi = req.body.merkki; 
  // Use req.body.merkki to get the search term
  // Use req.body.merkki to get the search term
  const vastaus = autot.filter(auto => (auto.merkki === etsi));
 
  res.render('hakutulos', {
    autot: vastaus,
    lukumaara: vastaus.length,
    nimi: nimi
  });
});

//? lisaa.ejs
app.get("/lisaa", function (req, res) {
  res.render('lisaa.ejs',{
    nimi: nimi  
  });{
}});

//?etu sivu
app.get("/", function (req, res) {
  
  res.render("/");
});

//?autolista.ejs 
app.get("/autolista", function (req, res) {
  res.render("autolista.ejs",{
    nimi: nimi   
  });
});

//* lisää json 
app.post('/sub', (req, res) => {
  const newCar = {
    id: newId(),
    merkki: req.body.merkki,
    malli: req.body.malli,
    vuosimalli: req.body.vuosimalli,
    omistaja: req.body.omistaja
  };

  // Lisää uusi auto autot-listaan
  autot.push(newCar);

  // Tallenna autot.json-tiedosto
  fs.writeFile('autot.json', JSON.stringify(autot, null, 2), err => {
    if (err) {
      console.error(err);
      res.status(500).send('Internal Server Error');
    } else {
      // Ohjaa sivusto takaisin autolista-sivulle
      res.redirect('/');
    }
  });
});

// JSON API-listaus
app.get('/autot', (req, res) => {
  res.json(autot);
});

app.get('/autot/:id', (req, res) => {
  const vastaus = [];
  const haettava =  Number.parseInt(req.params.id);

  for (let auto of autot) {
      if (auto.id === haettava) {
          vastaus.push(auto);
      }
  }
  res.json(vastaus);
});

app.post('/autot/uusi', (req, res) => {
  // kerätään tiedot pyynnön body-osasta
  const merkki = req.body.merkki;
  const malli = req.body.malli;
  const vuosimalli = req.body.vuosimalli;
  const omistaja = req.body.omistaja;
  // jos kaikkia tietoja ei ole annettu, ilmoitetaan virheestä
  // (muuttuja saa arvon undefined, jos vastaavaa elementtiä
  // ei ollut pyynnössä)
  if (merkki == undefined ||
      malli == undefined ||
      vuosimalli == undefined ||
      omistaja == undefined
      ) {
    res.status(400).json({'viesti': 'Virhe: Kaikkia tietoja ei annettu.'});
  }
  else {
      // luodaan tiedoilla uusi olio
      const uusi = {
          id: newId(),
          merkki: merkki,
          malli: malli,
          vuosimalli: vuosimalli,
          omistaja: omistaja,
      };
      // lisätään olio työntekijöiden taulukkoon
      autot.push(uusi);
      // lähetetään onnistumisviesti
      res.json(uusi);
  }
});

app.put('/autot/:id', (req, res) => {
  const id =  Number.parseInt(req.params.id);
  // kerätään tiedot pyynnön body-osasta
  const merkki = req.body.merkki;
  const malli = req.body.malli;
  const vuosimalli = req.body.vuosimalli;
  const omistaja = req.body.omistaja;

  // jos kaikkia tietoja ei ole annettu, ilmoitetaan virheestä
  // (muuttuja saa arvon undefined, jos vastaavaa elementtiä
  // ei ollut pyynnössä)
  if (
    id == undefined ||
    merkki == undefined ||
    malli == undefined ||
    vuosimalli == undefined ||
    omistaja == undefined
  ) {
    res.status(400).json({'viesti': 'Virhe: Kaikkia tietoja ei annettu.'});
  }
  else {
    let onOlemassa = false;
    let uusi = {};

    // Etsitään muokattava henkilö ja muokataan arvot
    for (let auto of autot) {
      if (auto.id == id) {
        auto.merkki = merkki;
        auto.malli = malli;
        auto.vuosimalli = vuosimalli;
        auto.omistaja = omistaja;
        onOlemassa = true;

        uusi = {
          id: id,
          merkki: merkki,
          malli: malli,
          vuosimalli: vuosimalli,
          omistaja: omistaja,
        };
      }
    }

    // Tarkistetaan onnistuiko muokkaaminen
    if (!onOlemassa) {
      res.status(400).json({"viesti": "Virhe: Tuntematon auto."});
    }
    else {
      // lähetetään onnistumisviesti
      res.json(uusi);
    }
  }
});

app.delete('/autot/:id', (req, res) => {
  const poistettava = req.params.id;
  let onOlemassa = false;

  for (let i = 0; i < autot.length; i++) {
    if (autot[i].id == poistettava) {
      autot.splice(i, 1);
      onOlemassa = true;

      // korjaus indeksinumeroon poistamisen jälkeen, jotta ei hypätä yhden henkilön yli
      i--;
    }
  }

  if (onOlemassa) {
    res.json({'viesti': 'Auto poistettu.'});
  }
  else {
    res.status(400).json({'viesti': 'Virhe: Annettua ID-numeroa ei ole olemassa.'});
  }
});

// Käynnistetään express-palvelin
app.listen(port, host, () => {console.log('Autopalvelin kuuntelee')});
