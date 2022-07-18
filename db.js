const Sequelize = require("sequelize");
const { STRING } = Sequelize;
const config = {
  logging: false,
};
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const SALT_ROUNDS = 10;

if (process.env.LOGGING) {
  delete config.logging;
}
const conn = new Sequelize(
  process.env.DATABASE_URL || "postgres://localhost/acme_db",
  config
);

const User = conn.define("user", {
  username: STRING,
  password: STRING,
});

User.beforeCreate(async (user) => {
  user.password = await bcrypt.hash(user.password, SALT_ROUNDS);
});

User.byToken = async (id) => {
  try {
    const user = await User.findByPk(id);
    if (user) {
      return user;
    }
    const error = Error("bad credentials");
    error.status = 401;
    throw error;
  } catch (ex) {
    const error = Error("bad credentials");
    error.status = 401;
    throw error;
  }
};

User.authenticate = async ({ username, password }) => {
  const user = await User.findOne({
    where: {
      username,
    },
  });
  if (user && (await bcrypt.compare(password, user.password))) {
    const userToken = jwt.sign(user.id, process.env.JWT);
    const stored = jwt.verify(userToken, process.env.JWT);
    return userToken;
  }
  const error = Error("bad credentials");
  error.status = 401;
  throw error;
};

const Note = conn.define("note", {
  text: {
    type: STRING,
  },
});

Note.byUserId = async (userIdArg) => {
  try {
    const userNotes = await Note.findAll({
      where: {
        userId: userIdArg,
      },
    });

    return userNotes;
  } catch (error) {
    throw error;
  }
};

Note.belongsTo(User);
User.hasMany(Note);

const syncAndSeed = async () => {
  await conn.sync({ force: true });
  const credentials = [
    { username: "lucy", password: "lucy_pw" },
    { username: "moe", password: "moe_pw" },
    { username: "larry", password: "larry_pw" },
  ];
  const [lucy, moe, larry] = await Promise.all(
    credentials.map((credential) => User.create(credential))
  );

  const notes = [
    { text: "test1" },
    { text: "test2" },
    { text: "test3" },
    { text: "test4" },
  ];
  const [note1, note2, note3, note4] = await Promise.all(
    notes.map((note) => Note.create(note))
  );
  await lucy.setNotes(note1);
  await moe.setNotes(note2);
  await larry.setNotes([note3, note4]);

  return {
    users: {
      lucy,
      moe,
      larry,
    },
    notes: {
      note1,
      note2,
      note3,
      note4,
    },
  };
};

module.exports = {
  syncAndSeed,
  models: {
    User,
    Note,
  },
};
