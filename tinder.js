let api = require('./api');

let ownerId = 79796,
    pollId = 247953143,
    
    yesPeterId = 829072611,
    yesNoPeterId = 829072612;

let accessToken = '164cdf3a6a531db2851c5aa08de1b9a2aa78a91843fd91bbd39e180a71c96f4bfe6617aae396f4ba3b800';

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
