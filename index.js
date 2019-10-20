const twitter = require("twit");
const fs = require("fs");
const credentials = JSON.parse(fs.readFileSync(__dirname + "/credentials.json", "utf8"));
const t = new twitter(credentials.twitter);

function tweet(status) {
  t.post("statuses/update", {status}, (err, data, response) => {
    if (err) return console.log("Tweet Error: " + err);
  });
}

tweet("Hello World...");