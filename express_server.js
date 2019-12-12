const express = require("express");
const { getUserByEmail } = require("./helpers");
const app = express();
const PORT = process.env.port || 8080; // default port 8080
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
app.set("view engine", "ejs");
//***********encrypt********/
const bcrypt = require('bcrypt');
const password = "purple-monkey-dinosaur"; // found in the req.params object
const hashedPassword = bcrypt.hashSync(password, 10);
//***********encrypt********/

const generateRandomString = function() {
  let strForShortUrl = Math.random().toString(30).slice(-6);
  return strForShortUrl;
}

//move the getUserByEmail(get user by email) function into help.js file

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
  "b2xVn2": {longURL: "http://www.lighthouselabs.ca", userID: "userRandomID"} ,
  "9sm5xK": {longURL: "http://www.google.com", userID: "user2RandomID"}
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
  let user = getUserByEmail(req.body.email, users);
  // console.log("post login", user);
  if(user) {
    if (bcrypt.compareSync(req.body.password, user.password)) {
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
    if (!getUserByEmail(req.body.email)) {
      const randomID = generateRandomString();
      let hashedPassword = bcrypt.hashSync(req.body.password, 10);
      users[randomID] = {id: randomID, email: req.body.email, password: hashedPassword};//use body since it handles HTML FORM, if handles user input, we should use req.params...
      console.log(users);
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
  let userURLDatabase = urlsForUser(req.cookies["user_id"]);
  let templateVars = {urls: userURLDatabase, user: users[req.cookies["user_id"]]};
  res.render("urls_index", templateVars);
});

app.post("/urls", (req, res) => {
  // console.log(req.body);
  let shortURL = generateRandomString();
  urlDatabase[shortURL] = {}; //create the empty object before adding contents in it.
  urlDatabase[shortURL]["longURL"] = req.body["longURL"];
  urlDatabase[shortURL]["userID"] = req.cookies["user_id"];
  res.redirect(`/urls/${shortURL}`);
})

app.get("/urls/new", (req, res) => {
  res.render("urls_new", {user: users[req.cookies["user_id"]]});
});
//above route must be above "/urls/:shortURL" since otherwise it would be taken as :ID

app.get("/urls/:shortURL", (req, res) => {
  let templateVars = {shortURL: req.params.shortURL, 
    longURL: urlDatabase[req.params.shortURL].longURL, user: users[req.cookies["user_id"]]};
  res.render("urls_show", templateVars);
});

app.post("/urls/:shortURL/delete", (req, res) => {
  delete urlDatabase[req.params.shortURL];
  // let templateVars = urlDatabase;
  // res.render("urls_index", templateVars);
  res.redirect("/urls");
});

app.post("/urls/:id", (req, res) => {
  if (!req.cookies["user_id"]) {
    res.redirect("login");
  } else if (urlDatabase[req.params.id].userID === req.cookies["user_id"]) {
    res.redirect("/urls/");
  }
  // urlDatabase[req.params.id].longURL = req.body.longURL;
});

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL].longURL;
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

module.exports = users;