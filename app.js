const express = require("express");
const app = express();
app.use(express.json());
const {
  models: { User, Note },
} = require("./db");
const path = require("path");
const jwt = require("jsonwebtoken");

const requireToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization;
    const user = await User.byToken(token);
    next();
  } catch (error) {
    next(error);
  }
};

app.get("/", (req, res) => res.sendFile(path.join(__dirname, "index.html")));

app.post("/api/auth", async (req, res, next) => {
  try {
    res.send({
      token: await User.authenticate(req.body),
    });
  } catch (ex) {
    next(ex);
  }
});

app.get("/api/auth", async (req, res, next) => {
  try {
    // console.log('this is req.headers',req.headers)
    // console.log('this is the request after auth', req)
    res.send(
      await User.byToken(jwt.verify(req.headers.authorization, process.env.JWT))
    );
  } catch (ex) {
    next(ex);
  }
});

app.delete("/api/auth", async (req, res, next) => {
  try {
    res.send();
  } catch (ex) {
    next(ex);
  }
});

app.get("/api/users/:userId/notes", requireToken, async (req, res, next) => {
  console.log(req.params);
  try {
    const userId = jwt.verify(req.params.userId, process.env.JWT);
    res.send(await Note.byUserId(userId));
  } catch (error) {
    next(error);
  }
});

app.use((err, req, res, next) => {
  console.log(err);
  res.status(err.status || 500).send({ error: err.message });
});

module.exports = app;
