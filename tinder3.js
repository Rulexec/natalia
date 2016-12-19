let DATA = require('./tinder2.json');

let print = process.stdout.write.bind(process.stdout);

print(`<!doctype html><html><head><meta charset='utf'><title>Наталья собирает, Александр организует</title>`);

print(`<style>
.users-group > .user {
  display: inline-block;
  padding: 2em;
}
</style>`);

print(`</head><body>`);

function renderUsers(users) {
  print(`<div class='users-group'>`);

  users.forEach(user => {
    print(`<div class='user'>`);
    print(`<a href='https://vk.com/id${user.uid}'>`);
    print(`<img src='${user.photo_big}'>`);
    print(`<p>${user.first_name} ${user.last_name}</p>`);
    print(`</a>`);
    print(`</div>`);
  });

  print(`</div>`);
}

DATA.countries.forEach(country => {
  if (country.cities.length === 0) return;

  print(`<h1>${country.country}</h1>`);

  country.cities.forEach(city => {
    if (city.users.length === 0) return;

    print(`<h2>${city.city}</h2>`);

    renderUsers(city.users);
  });

  if (country.usersWithoutCity.length > 0) {
    print(`<h2>Без города</h2>`);

    renderUsers(country.usersWithoutCity);
  }
});

if (DATA.usersWithoutCountry.length > 0) {
  print(`<h1>Без страны</h1>`);

  renderUsers(DATA.usersWithoutCountry);
}

print(`</body></html>`);
console.log();
