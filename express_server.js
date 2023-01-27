const express = require("express");
const app = express();
var cookieParser = require('cookie-parser')
const PORT = 8080; // default port 8080
app.set("view engine", "ejs");
function generateRandomString() {
  return Math.random().toString(36).substring(6);
};
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
};


const addUser = (email, password) => {
  const id = generateRandomString();
  users[id] = {
    id,
    email,
    password
  };
  return id;
};
const findUser = email => {
  return Object.values(users).find(user => user.email === email);
};

const checkPassword = (user, password) => {
  if (user.password === password) {
    return true;
  } else {
    return false;
  }
};

const urlDatabase = {
  "b2xVn2": { longURL: "http://www.lighthouselabs.ca", userID: "userRandomID" },
  "9sm5xK": { longURL: "http://www.google.com", userID: "user2RandomID" }
};
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.get("/", (req, res) => {
  res.send("Hello!");
});
app.get("/urls.json", (req, res) => {
  res.json(users);
});
app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});
app.get("/urls", (req, res) => {
  let templateVars = { 
    user: users[req.cookies["userId"]],
    urls: urlsForUser(req.cookies["userId"])
  };
  if (templateVars.user) {
    res.render("urls_index", templateVars);
  } else {
    res.status(400).send("You need to login or register to access this page");
  }
});
app.get("/urls/new", (req, res) => {
  let templateVars = { user: users[req.cookies["userId"]] };
  if (templateVars.user) {
    res.render("urls_new", templateVars);
  } else {
    res.render("urls_login", templateVars);
  }
});
app.post("/urls", (req, res) => {
  console.log(req.body); // Log the POST request body to the console
  const longURL = req.body.longURL;
  const userID = req.cookies['userId'];
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = { longURL, userID };
  res.redirect(`/urls/${shortURL}`); // Respond with 'Ok' (we will replace this)
});
app.get("/hello", (req, res) => {
  const templateVars = { greeting: "Hello World!" };
  res.render("hello_world", templateVars);
});

app.get("/urls/:id", (req, res) => {
  const templateVars = {
    user: users[req.cookies["userId"]],
    id: req.params.id, 
    longURL: urlDatabase[req.params.id].longURL };
    if (!templateVars.user) {
      res.status(400).send("You need to register or login to access this page");
    }
    if (req.cookies["userId"] === urlDatabase[templateVars.id].userID) {
      res.render("urls_show", templateVars);
    } else {
      res.status(400).send("This TinyURL doesn't belong to you!");
    }
});
app.post("/urls/:id", (req, res) => {
  const shortURL = req.params.id;
  const longURL = req.body.longURL;
  urlDatabase[shortURL].longURL = longURL;
  res.redirect(`/urls/${shortURL}`);
});

app.get("/u/:id", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect(longURL);
});
app.post("/urls/:id/delete", (req,res) => {
  const shortURL = req.params.id;
  if (req.cookies["userId"] === urlDatabase[shortURL].userID) {
    delete urlDatabase[req.params.id];
    res.redirect("/urls");
  } else {
    res.status(400).send("You are not allowed to delete that TinyURL!");
  }
});
app.post("/urls/:id", (req, res) => {
  const shortURL = req.params.id;
  const longURL = req.body.longURL;
  if (req.cookies["userId"] === urlDatabase[shortURL].userID) {
    urlDatabase[shortURL].longURL = longURL;
    res.redirect(`/urls/${shortURL}`);
  } else {
    res.status(400).send("Your are not allowed to edit that TinyURL!")
  }

  
});
app.get("/login", (req, res) => {
  let templateVars = { user: users[req.cookies["userId"]] };
  res.render("urls_login", templateVars);
});
app.post("/login", (req,res) => {
  const { email, password } = req.body;
  const user = findUser(email);
  if (!user) {
    res.status(403).send("Email cannot be found");
  } else if (!checkPassword(user, password))  {
    res.status(403).send("You have entered wrong password");
  } else {
    res.cookie('userId', user.id);
    res.redirect("/urls");
  }
});

app.post("/logout", (req, res) => {
  res.clearCookie('userId');
  res.redirect("/urls");
});
app.get("/register", (req,res) => {
  let templateVars = { user: users[req.cookies["userId"]] };
  res.render("urls_register", templateVars);
});
app.post("/register", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).send('Email and/or password is missing');
  } else if (findUser(email)) {
    res.status(400).send('This email has already been registered')
  } else {
    const userId = addUser(email, password);
    res.cookie('userId', userId);
    res.redirect("/urls");
  }
});
const urlsForUser = (id) => {
  let filtered = {};
  for (let urlID of Object.keys(urlDatabase)) {
    if (urlDatabase[urlID].userID === id) {
      filtered[urlID] = urlDatabase[urlID];
    }
  }
  return filtered;
};
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});