var M = require('asyncm');

var https = require('https');

exports.SEX = {
  MALE: 2,
  FEMALE: 1,
  UNKNOWN: 0
};

exports.getLikesFromPost = function(ownerId, itemId, offset, count, callback) {
  var url = 
    'https://api.vk.com/method/likes.getList' +
      '?type=post&owner_id=' + ownerId +
      '&item_id=' + itemId + '&count=' + count + '&offset=' + offset;

  get(url, function(error, likes) {
    if (error) { callback(error); return; }

    try {
      likes = JSON.parse(likes);
    } catch (e) {
      callback(e); return;
    }

    var response = likes.response;
    if (!response) { callback(likes); return; }

    var set = {};
    callback(null, response.users.filter(function(x) {
      if (set[x] !== undefined) return false;
      else return (set[x] = true);
    }), response.users.length < count || (response.count <= offset + response.users.length));
  });
};

exports.getUsers = function(options) {
  return M.pureF(function() {
    var userIds = options.userIds,
        fields = options.fields || [];

    return 'https://api.vk.com/method/users.get' +
           '?user_ids=' + userIds.join(',') +
           '&fields=' + fields.join(',');
  }).bind(getM).bind(parseJsonM).bind(function(usersResponse) {
    if (!usersResponse.response) return M.pure(usersResponse);

    var users = usersResponse.response.map(function(x) {
      var notAccessible = !!(x.deactivated || x.hidden)
      var o = {
        id: x.uid,
        name: x.first_name + ' ' + x.last_name,
      };

      if (notAccessible) { o.notAccessible = true; return o; }

      o.sex = x.sex;
      o.city = x.city;
      
      if (x.bdate) {
        var b = x.bdate.split('.');

        if (b.length === 3) {
          o.bdate = new Date(b[2], b[1], b[0]);
        } else {
          o.bdate = null;
        }
      } else { o.bdate = null; }

      return o;
    });

    return M.pure(null, users);
  });
};

exports.getFriends = function(userId) {
  var url =
    'https://api.vk.com/method/friends.get' +
      '?user_id=' + userId;

  return getM(url).bind(parseJsonM).bind(function(data)  {
    if (data.response instanceof Array) this.cont(null, data.response);
    else this.cont(data);
  });
}

exports.getWall = function(options) {
  return M.pureF(function() {
    var ownerId = options.ownerId,
        offset = options.offset || 0,
        count = options.count || 50;

    return 'https://api.vk.com/method/wall.get' +
           '?v=5.25&owner_id=' + ownerId + '&extended=0&offset=' + offset + '&count=' + count;
  }).bind(getM).bind(parseJsonM).bind(function(wallResponse) {
    if (!wallResponse.response) return M.pure(wallResponse);

    var posts = wallResponse.response.items.map(function(x) {
      return {
        id: x.id,
        text: x.text,
        type: x.post_type
      };
    });

    return M.pure(null, {
      totalCount: wallResponse.response.count,
      posts: posts
    });
  });
};

exports.getWallComments = function(options) {
  return M.pureF(function() {
    var ownerId = options.ownerId,
        postId = options.postId,
        offset = options.offset || 0,
        count = options.count || 50,

        needLikes = !!options.needLikes,
        previewLength = options.previewLength || 0;

    return 'https://api.vk.com/method/wall.getComments' +
           '?v=5.25&owner_id=' + ownerId + '&post_id=' + postId + '&extended=0&offset=' + offset + '&count=' + count +
           '&need_likes=' + (needLikes ? '1' : '0') + '&preview_length=' + previewLength;
  }).bind(getM).bind(parseJsonM).bind(function(commentsResponse) {
    if (!commentsResponse.response) return M.pure(commentsResponse);

    var comments = commentsResponse.response.items.map(function(x) {
      return {
        id: x.id,
        authorId: x.from_id,
        date: new Date(x.date),
        text: x.text
      };
    });

    return M.pure(null, {
      totalCount: commentsResponse.response.count,
      comments: comments
    });
  });
};

exports.getPollVoters = function(options) {
  var url =
    'https://api.vk.com/method/polls.getVoters' +
      '?access_token=' + options.accessToken +
      '&owner_id=' + options.ownerId +
      '&poll_id=' + options.pollId +
      '&answer_ids=' + options.answerIds.join(',') +
      '&offset=' + options.offset +
      '&count=' + options.count +
      '&fields=' + options.fields.join(',');
 
  if (options.lang) url += '&lang=' + options.lang;

  return getM(url).bind(parseJsonM).bind(function(data)  {
    if (data.response instanceof Array) this.cont(null, data.response);
    else this.cont(data);
  });
};

exports.getCountriesById = function(ids, options) {
  var url =
    'https://api.vk.com/method/database.getCountriesById' +
      '?country_ids=' + ids.join(',');
 
  if (options && options.lang) url += '&lang=' + options.lang;

  return getM(url).bind(parseJsonM).bind(function(data)  {
    if (data.response instanceof Array) this.cont(null, data.response);
    else this.cont(data);
  });
};

exports.getCitiesById = function(ids, options) {
  var url =
    'https://api.vk.com/method/database.getCitiesById' +
      '?city_ids=' + ids.join(',');
 
  if (options && options.lang) url += '&lang=' + options.lang;

  return getM(url).bind(parseJsonM).bind(function(data)  {
    if (data.response instanceof Array) this.cont(null, data.response);
    else this.cont(data);
  });
}

function parseJsonM(data) { return M(function(callback) {
  try {
    data = JSON.parse(data);
  } catch (e) {
    callback(e);
    return;
  }

  callback(null, data);
  return M.alreadyFinished();
}); }

function getM(url) { return M(function(callback) {
  var called = false;
  function call() {
    if (called) return;

    called = true;
    callback.apply(null, arguments);
  }

  setTimeout(function() {
    call('request timeouted');
  }, 5000);

  https.get(url, function(res) {
    if (res.statusCode === 200) {
      res.setEncoding('utf8');

      var totalData = '';

      res.on('data', function(data) {
        totalData += data;
      }).on('end', function() {
        call(null, totalData);
      });
    } else {
      call(res);
    }
  }).on('error', call);
}); }

function get(url, callback) {
  getM(url).run(callback);
}
