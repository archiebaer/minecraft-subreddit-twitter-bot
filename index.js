const twitter = require("twit");
const fs = require("fs");
const credentials = JSON.parse(fs.readFileSync(__dirname + "/credentials.json", "utf8"));
const t = new twitter(credentials);
const request = require("request");
const i2b64 = require("image-to-base64");
const tweeted = [];

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
  return `"${post.title}" (${post.score} points) ${post.postUrl}`;
}

//Check for new posts
function checkNewPosts(first) {
  getPosts().then((posts) => {
    console.log("Checking for new posts...");

    if (posts.length <= 0) return;
    const latest = posts[posts.length - 1];
    if (tweeted.includes(latest.id)) return;
    tweeted.push(latest.id);
    if (first) return;
    console.log("Attempting to upload " + latest.postUrl);

    const tweetMsg = tweetBody(latest);
    if (tweetMsg.length > 280) return console.log("Tweet is too long");

    //Get Image
    console.log("Step 1/3: Getting image...");
    i2b64(latest.url).then((b64) => {

      //Upload image to twitter
      console.log("Step 2/3: Uploading image...");
      t.post("media/upload", {media_data: b64}, (err, data, res) => {
        if (err || res.statusCode != 200) return console.log("Failed to upload image");
        const mediaId = data.media_id_string;

        //Tweet
        console.log("Step 3/3: Tweeting...");
        t.post("statuses/update", {status: tweetMsg, media_ids: [mediaId]}, (err, data, res) => {
          if (err || res.statusCode != 200) return console.log("Failed to Tweet");
          console.log(`Success! https://twitter.com/${data.user.screen_name}/status/${data.id_str}`);
        });

      });

    }).catch((err) => {
      console.log("Failed to get image");
    });

  }).catch(() => {});
}

setInterval(checkNewPosts, 60 * 1000);
checkNewPosts(true);