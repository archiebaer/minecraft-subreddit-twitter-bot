const twitter = require("twit");
const fs = require("fs");
const credentials = JSON.parse(fs.readFileSync(__dirname + "/credentials.json", "utf8"));
const t = new twitter(credentials.twitter);
const request = require("request");
let lastTweeted;

//Tweet
function tweet(status) {
  t.post("statuses/update", {status}, (err, data, response) => {
    if (err) return console.log("Tweet Error: " + err);
  });
}

//Get Posts
function getPosts() {
  return new Promise((resolve, reject) => {
    request("https://www.reddit.com/r/minecraft/hot.json?sort=new", (err, res, body) => {
      if (err) return reject(err);
      if (res.statusCode != 200) return reject("Status Code " + res.statusCode + " recieved");

      //Get Post data
      var posts = JSON.parse(body).data.children.map((p) => {
        return {
          id: p.data.id,
          title: p.data.title,
          score: p.data.score,
          postUrl: `https://reddit.com/r/${p.data.subreddit}/comments/${p.data.id}`,
          url: p.data.url,
          isImage: p.data.url.startsWith("https://i.redd.it/"),
          date: new Date(p.data.created_utc * 1000)
        };
      });

      //Remove ones older than 12 hours or without image
      posts = posts.filter(p => {
        return p.isImage &&
        (new Date().getTime() - p.date.getTime() < 1000 * 60 * 60 * 12);
      });

      //Sort by date
      posts.sort((a, b) => {
        return a.date - b.date;
      });

      resolve(posts);
    });
  });
}

//Generate Tweet Message Content
function tweetBody(post) {
  return `"${post.title}" (${post.score} points) on r/minecraft. ${post.postUrl}`;
}

//Check for new posts
function checkNewPosts(first) {
  getPosts().then((posts) => {
    console.log("Checking for new posts...");

    if (posts.length <= 0) return;
    const latest = posts[posts.length - 1];
    if (lastTweeted === latest.id) return;
    lastTweeted = latest.id;

    console.log(tweetBody(latest));

  }).catch(() => {});
}

setInterval(checkNewPosts, 60 * 1000);
checkNewPosts(true);