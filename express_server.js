const express = require("express");
const app = express();
const bcrypt = require("bcryptjs");
const cookieSession = require('cookie-session');
const methodOverride = require('method-override');
const { getUserByEmail } = require('./helpers');
const PORT = 8080; // default port 8080
app.set("view engine", "ejs");
// eslint-disable-next-line func-style
function generateRandomString() {
  return Math.random().toString(36).substring(6);
}
const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "123"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
};
// Add user to the database
const addUser = (email, password) => {
  const hashedPassword = bcrypt.hashSync(password, 10);
  const id = generateRandomString();
  users[id] = {
    id,
    email,
    password: hashedPassword
  };
  return id;
};
// Return the user object which match the email address
const findUser = email => {
  return Object.values(users).find(user => user.email === email);
};
const urlDatabase = {
  "b2xVn2": { longURL: "http://www.lighthouselabs.ca", userID: "userRandomID" },
  "9sm5xK": { longURL: "http://www.google.com", userID: "user2RandomID" }
};
// Return an URLs object with same userID as the user
const urlsForUser = (id) => {
  let filtered = {};
  for (let urlID of Object.keys(urlDatabase)) {
    if (urlDatabase[urlID].userID === id) {
      filtered[urlID] = urlDatabase[urlID];
    }
  }
  return filtered;
};
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(cookieSession({
  name: 'session',
  keys: ['sudha'],
  maxAge: 24 * 60 * 60 * 1000,
}));

// Routes
// Home Page
app.get("/", (req, res) => {
  let templateVars = {
    user: users[req.session.userId],
    urls: urlsForUser(req.session.useId)
  };
  if (templateVars.user) {
    res.render("urls_index", templateVars);
  } else {
    res.render("urls_login", templateVars);
  }
});
app.get("/urls.json", (req, res) => {
  res.json(users);
});
// Lst of all users URLs
app.get("/urls", (req, res) => {
  let templateVars = {
    user: users[req.session.userId],
    urls: urlsForUser(req.session.userId)
  };
  res.render("urls_index", templateVars);
});

//  URLS /new => page to create a shortURL

app.get("/urls/new", (req, res) => {
  let templateVars = { user: users[req.session.userId] };
  if (templateVars.user) {
    res.render("urls_new", templateVars);
  } else {
    res.render("urls_login", templateVars);
  }
});
app.post("/urls", (req, res) => {
  // console.log(req.body); // Log the POST request body to the console
  const longURL = req.body.longURL;
  const userID = req.session.userId;
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = { longURL, userID };
  res.redirect(`/urls/${shortURL}`); // Respond with 'Ok' (we will replace this)
});

// URLS /id => page of the specific id(short)

app.get("/urls/:id", (req, res) => {
  const templateVars = {
    user: users[req.session.userId],
    id: req.params.id,
    longURL: urlDatabase[req.params.id].longURL };
  if (req.session.userId === urlDatabase[templateVars.id].userID) {
    res.render("urls_show", templateVars);
  } else if (!templateVars.longURL) {
    res.status(400).send("This TinyURL does not exist");
  } else {
    res.status(400).send("This TinyURL does not belong to you");
  }
});
app.patch("/urls/:id", (req, res) => {
  const shortURL = req.params.id;
  const longURL = req.body.longURL;
  urlDatabase[shortURL].longURL = longURL;
  res.redirect(`/urls/${shortURL}`);
});
// u/id => acces thr actual link

app.get("/u/:id", (req, res) => {
  const longURL = urlDatabase[req.params.id].longURL;
  res.redirect(longURL);
});

// URLS/id Delete
// post handler for delete
app.delete("/urls/:id/delete", (req,res) => {
  const shortURL = req.params.id;
  if (req.session.userId === urlDatabase[shortURL].userID) {
    delete urlDatabase[req.params.id];
    res.redirect("/urls");
  } else {
    res.status(400).send("You are not allowed to delete that TinyURL!");
  }
});
app.post("/urls/:id", (req, res) => {
  const shortURL = req.params.id;
  const longURL = req.body.longURL;
  console.log(urlDatabase);
  if (req.session.userId === urlDatabase[shortURL].userID) {
    urlDatabase[shortURL].longURL = longURL;
    res.redirect(`/urls/${shortURL}`);
  } else {
    res.status(400).send("Your are not allowed to edit that TinyURL!");
  }
});
// Login
app.get("/login", (req, res) => {
  let templateVars = {
    user: users[req.session.userId],
    urls: urlsForUser(req.session.userId)
  };
  if (templateVars.user) {
    res.render("urls_index", templateVars);
  } else {
    res.render("urls_login", templateVars);
  }
});
app.post("/login", (req,res) => {
  const email = req.body.email;
  const password = req.body.password;
  const user = findUser(email);
  if (!user) {
    res.status(403).send("Email cannot be found");
  } else if (!bcrypt.compareSync(password, user.password)) {
    res.status(403).send("You have entered wrong password");
  } else {
    req.session.userId = user.id;
    res.redirect("/urls");
  }
});
// logout page
app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/urls");
});
// Register page
app.get("/register", (req,res) => {
  let templateVars = {
    user: users[req.session.userId],
    urls: urlsForUser(req.session.userId)
  };
  if (templateVars.user) {
    res.render("urls_index", templateVars);
  } else {
    res.render("urls_register", templateVars);
  }
});
app.post("/register", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    let templateVars = {
      status: 401,
      message: 'Email and/or password missing',
      user: users[req.session.userId]
    }
    res.status(401);
    res.render("urls_error", templateVars);
    ('Email and/or password is missing');
  } else if (findUser(email, users)) {
    let templateVars = {
      status: 409,
      message: 'This email has already been registered',
      user: users[req.session.userId]
    }
    res.status(409);
    res.render("urls_error", templateVars);
  } else {
    const newUserID =  addUser(email, password, users);
    users[newUserID] = {
      id: newUserID,
      email: email,
      password: bcrypt.hashSync(password, 10),
    };
    req.session.userId = newUserID;
    res.redirect("/urls");
  }
});
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});