const express = require("express");
const { getUserByEmail } = require("./helpers");
const app = express();
const PORT = process.env.port || 8080; // default port 8080
const bodyParser = require("body-parser");
// const cookieParser = require('cookie-parser'); //replace cookieParser with cookieSession
const cookieSession = require('cookie-session');
const randomize = require('randomatic'); //generate a random string with specific pattern
app.use(bodyParser.urlencoded({extended: true}));
// app.use(cookieParser());
app.use(cookieSession({keys: ['light']}));
app.set("view engine", "ejs");

//***********encrypt********/
const bcrypt = require('bcrypt');
const password1 = "purple-monkey-dinosaur";
const hashedPassword = bcrypt.hashSync(password1, 10);
const password2 = "dishwasher-funk";
const hashedPassword2 = bcrypt.hashSync(password2, 10);
//***********encrypt********/

const generateRandomString = function() {
  let strForShortUrl = Math.random().toString(30).slice(-6);
  return strForShortUrl;
};

//move the getUserByEmail(get user by email) function into helpers.js file

//below function "urlsForUser" is to generate a customized urlDatabase for a specific user.
const urlsForUser = (id) => {
  let userURLDatabase = {};
  for (const item in urlDatabase) {
    if (urlDatabase[item].userID === id) {
      userURLDatabase[item] = {};
      userURLDatabase[item].longURL = urlDatabase[item].longURL;
      userURLDatabase[item].userID = urlDatabase[item].userID;
    }
  }
  return userURLDatabase;
};

//object urlDatabase to store the new created short URL and long URL
const urlDatabase = {
  "b2xVn2": {longURL: "http://www.lighthouselabs.ca", userID: "userRandomID"},
  "9sm5xK": {longURL: "http://www.google.com", userID: "user2RandomID"}
};

//object users which will be used to store and access the users in the app.
const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: hashedPassword
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: hashedPassword2
  }
};

app.get("/login", (req, res, next) => {
  res.render("login");
  next();
}, (req,res) => {
  console.log("Now the user is in login page!");
});

app.post("/login", (req, res) => {
  let user = getUserByEmail(req.body.email, users);//User exists and is returned by getUserByEmail function
  if (user) { //user exists and then we compare the password
    if (bcrypt.compareSync(req.body.password, user.password)) {
      req.session.user_id = user.id;
      res.redirect("/urls"); //password is correct we direct user to /urls page.
    } else {
      res.statusCode = 403;
      res.send("Password is incorrect, please try again!");
      res.redirect("/login");
    }
  } else {
    res.statusCode = 403;
    res.send("User does not exist, please re-login or register!");
  }
});

app.post("/logout", (req,res) => {
  req.session = null;
  res.redirect("/urls");
});

app.get("/register", (req, res) => {
  res.render("registration");
});

app.post("/register", (req, res) => {
  if (req.body.email.length === 0 || req.body.password.length === 0) {
    res.statusCode = 400;
    res.send("Cannot send empty email or password!");
  } else {
    if (!getUserByEmail(req.body.email, users)) {
      const randomID = randomize('Aa0', 6);
      let hashedPassword = bcrypt.hashSync(req.body.password, 10);
      users[randomID] = {id: randomID, email: req.body.email, password: hashedPassword};//use body since it handles HTML FORM, if handles user input, we should use req.params...
      console.log(users);
      req.session.user_id = randomID;
      res.redirect("/urls");
    } else {
      res.statusCode = 400;
      res.send("The email is already taken, please choose another email!");
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
  let userURLDatabase = urlsForUser(req.session.user_id);
  let templateVars = {urls: userURLDatabase, user: users[req.session.user_id]};
  res.render("urls_index", templateVars);
});

app.post("/urls", (req, res) => {
  let shortURL = randomize('Aa0', 6);
  urlDatabase[shortURL] = {}; //create the empty object before adding contents in it.
  urlDatabase[shortURL]["longURL"] = req.body["longURL"];
  // urlDatabase[shortURL]["userID"] = req.cookies["user_id"];
  urlDatabase[shortURL]["userID"] = req.session.user_id;
  res.redirect(`/urls/${shortURL}`);
});

app.get("/urls/new", (req, res) => {
  res.render("urls_new", {user: users[req.session.user_id]});
});
//above route must be above "/urls/:shortURL" since otherwise it would be taken as :ID

app.get("/urls/:shortURL", (req, res) => {
  let templateVars = {shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL].longURL, user: users[req.session.user_id]};
  res.render("urls_show", templateVars);
});

app.post("/urls/:shortURL/delete", (req, res) => {//this is to operate from UI by "delete" button
  if (urlDatabase[req.params.shortURL].userID === req.session.user_id) {
    delete urlDatabase[req.params.shortURL];
    res.redirect("/urls");
  } else {
    res.redirect("/urls");
  }
});

app.get("/urls/:shortURL/delete", (req, res) => {
  if (urlDatabase[req.params.shortURL].userID === req.session.user_id) {
    delete urlDatabase[req.params.shortURL];
    res.redirect("/urls");
  } else {
    res.redirect("/urls");
  }
});

app.post("/urls/:id", (req, res) => {
  if (!req.session.user_id) {
    res.redirect("/login");
  } else if (urlDatabase[req.params.id].userID === req.session.user_id) {
    urlDatabase[req.params.id].longURL = req.body.longURL;
    res.redirect("/urls/");
  }
});

app.get("/u/:shortURL", (req, res) => {//anyone can access the URL as long as he/she has the short URL
  const longURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect(longURL);
});

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
});

// app.get("/fetch", (req, res) => {
//   res.send(`a = ${a}`);
// })

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});