let api = require('./api');

let ownerId = 79796,
    pollId = 247953143,
    
    yesPeterId = 829072611,
    yesNoPeterId = 829072612;

let accessToken = process.env.ACCESS_TOKEN;

api.getPollVoters({
  accessToken, ownerId, pollId,
  answerIds: [yesPeterId, yesNoPeterId],
  offset: 0,
  count: 1000,
  fields: ['screen_name', 'sex', 'bdate', 'city', 'country', 'photo_big'],
  lang: 'ru'
}).bind(function(data) {
  console.log(JSON.stringify(data));
}).run(function(error) {
  error && console.error(error);
});
