const twitter = require("twit");
const fs = require("fs");
const credentials = JSON.parse(fs.readFileSync(__dirname + "/credentials.json", "utf8"));
const t = new twitter(credentials.twitter);
const request = require("request");

function tweet(status) {
  t.post("statuses/update", {status}, (err, data, response) => {
    if (err) return console.log("Tweet Error: " + err);
  });
}

function getPosts() {
  return new Promise((resolve, reject) => {
    request("https://www.reddit.com/r/minecraft/hot.json?sort=new", (err, res, body) => {
      if (err) return reject(err);
      if (res.statusCode != 200) return reject("Status Code " + res.statusCode + " recieved");
      var posts = JSON.parse(body).data.children.map((p) => {
        return {
          title: p.data.title,
          score: p.data.score,
          postUrl: `https://reddit.com/r/${p.data.subreddit}/comments/${p.data.id}`,
          url: p.data.url,
          isImage: p.data.url.startsWith("https://i.redd.it/"),
          date: new Date(p.data.created_utc * 1000)
        };
      });

      posts = posts.filter(p => {
        return p.isImage &&
        (new Date().getTime() - p.date.getTime() < 1000 * 60 * 60 * 12);
      });

      console.log(posts);
    });
  });
}

getPosts().catch(() => {});