const express = require("express");
const app = express();
const PORT = process.env.port || 8080; // default port 8080
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
app.set("view engine", "ejs");

const generateRandomString = function() {
  let strForShortUrl = Math.random().toString(30).slice(-6);
  return strForShortUrl;
}

const existEmailLoop = function(emailBeingChecked) {
  // let goodToGo = false;
  for (const key in users) {
    if (users[key].email === emailBeingChecked) {
      return users[key];
    }
  }
  return false;
}

//object urlDatabase to store the new created short URL and long URL
const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

//object users which will be used to store and access the users in the app.
const users = { 
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: "dishwasher-funk"
  }
}

app.get("/login", (req, res) => {
  res.render("login");
});

app.post("/login", (req, res) => {
  // console.log(req.body);
  let user = existEmailLoop(req.body.email);
  // console.log("post login", user);
  if(user) {
    if (req.body.password === user.password) {
      res.cookie("user_id", user.id);
      res.redirect("/urls");
    } else {
      res.statusCode = 403;
      res.send();
    }
  } else {
    res.statusCode = 403;
    res.send();
  }
  // res.redirect("/urls");
});

app.post("/logout", (req,res) => {
  res.clearCookie("user_id");
  res.redirect("/urls");
});

app.get("/register", (req, res) => {
  res.render("registration");
});

app.post("/register", (req, res) => {
  // console.log(req.body); //it returns { email: 'sdf@sadf', password: 'sefwe' }
  if (req.body.email.length ===0 || req.body.password.length === 0) {
    res.statusCode = 400;
    res.send();
  } else {
    if (!existEmailLoop(req.body.email)) {
      const randomID = generateRandomString();
      users[randomID] = {id: randomID, email: req.body.email, password: req.body.password};//use body since it handles HTML FORM, if handles user input, we should use req.params...
      // console.log(users);
      res.cookie("user_id", randomID);
      res.redirect("/urls");
    } else {
      res.statusCode = 400;
      res.send();
    }
  } 
});

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/urls", (req, res) => {
  let templateVars = {urls: urlDatabase, user: users[req.cookies["user_id"]]};
  res.render("urls_index", templateVars);
});

app.post("/urls", (req, res) => {
  // console.log(req.body);
  // res.send("ok");
  let shortURL = generateRandomString();
  urlDatabase[shortURL] = req.body["longURL"];
  res.redirect(`/urls/${shortURL}`);
})

app.get("/urls/new", (req, res) => {
  res.render("urls_new", {user: users[req.cookies["user_id"]]});
});
//above route must be above "/urls/:shortURL" since otherwise it would be taken as :ID

app.get("/urls/:shortURL", (req, res) => {
  let templateVars = {shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL], user: users[req.cookies["user_id"]]};
  res.render("urls_show", templateVars);
});

app.post("/urls/:shortURL/delete", (req, res) => {
  delete urlDatabase[req.params.shortURL];
  // let templateVars = urlDatabase;
  // res.render("urls_index", templateVars);
  res.redirect("/urls");
});

app.post("/urls/:id", (req, res) => {
  urlDatabase[req.params.id] = req.body.longURL;
  res.redirect("/urls/");
});

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
})

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

// app.get("/hello", (req, res) => {
//   let templateVars = { greeting: 'Hello World!' };
//   res.render("hello_world", templateVars);
// });

app.get("/set", (req, res) => {
  const a = 1;
  res.send(`a = ${a}`);
})

// app.get("/fetch", (req, res) => {
//   res.send(`a = ${a}`);
// })

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});