// {"uid":380206,"first_name":"Оюна","last_name":"Чойбсонова","sex":1,"screen_name":"ch.o181","city":2,"country":1,"photo_big":"https://pp.vk.me/c638126/v638126206/fcf8/X4y3i9GumFY.jpg"}
let api = require('./api'),
    M = require('asyncm');

let ANSWERS_DATA = require('./tinder.json');

let yesPeterId = 829072611,
    yesNoPeterId = 829072612;

let allUsersList = [],
    yesPeterList, yesNoPeterList;

let countriesMap = new Map(), citiesMap = new Map();

ANSWERS_DATA.forEach(function(answerData) {
  if (answerData.answer_id === yesPeterId) {
    yesPeterList = answerData.users;
  } else if (answerData.answer_id === yesNoPeterId) {
    yesNoPeterList = answerData.users;
  } else {
    throw new Error(answerData.answer_id);
  }

  answerData.users.forEach(user => {
    allUsersList.push(user);

    if (typeof user.country === 'number') countriesMap.set(user.country, null);
    if (typeof user.city === 'number') citiesMap.set(user.city, null);
  });
});

M.parallel([
  api.getCountriesById(Array.from(countriesMap.keys()), {lang: 'ru'}),
  api.getCitiesById(Array.from(citiesMap.keys()), {lang: 'ru'})
], {single: true}).bind(function(data) {
  data[0].forEach(country => countriesMap.set(country.cid, country.name));
  data[1].forEach(city => citiesMap.set(city.cid, city.name));

  let usersWithoutCountry = [],
      countryToUsers = new Map();

  allUsersList.forEach(user => {
    if (typeof user.country === 'number') {
      user.countryName = countriesMap.get(user.country);

      let users = countryToUsers.get(user.country);
      if (users) {
        users.push(user);
      } else {
        countryToUsers.set(user.country, [user]);
      }
    } else if (typeof user !== 'number') {
      usersWithoutCountry.push(user);
    }

    if (typeof user.city === 'number') {
      user.cityName = citiesMap.get(user.city);
    }
  });

  let result = {countries: [], usersWithoutCountry};

  for (var [countryId, countryUsers] of countryToUsers.entries()) {
    let cityToUsers = new Map();

    let usersWithoutCity = [];

    countryUsers.forEach(user => {
      if (user.cityName) {
        let users = cityToUsers.get(user.city);
        if (users) {
          users.push(user);
        } else {
          cityToUsers.set(user.city, [user]);
        }
      } else {
        usersWithoutCity.push(user);
      }
    });

    let cities = [];

    for (var [cityId, cityUsers] of cityToUsers.entries()) {
      cities.push({city: citiesMap.get(cityId), users: cityUsers});
    }

    result.countries.push({country: countriesMap.get(countryId), cities: cities, usersWithoutCity})
  }

  console.log(JSON.stringify(result));
}).run(function(error) { error && console.error(error); });
