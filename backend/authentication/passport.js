const passport = require("passport");
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require("bcryptjs");
const query = require("../db/query.js");
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;

passport.use(
  new LocalStrategy(async (username, password, done) => {
    try {
      const user = await query.getUser(username, "");

      if (!user) {
        return done(null, false, { message: "Incorrect username" });
      }
      const match = await bcrypt.compare(password, user.password);
      if (!match) {
        return done(null, false, { message: "Incorrect password" })
      }
      return done(null, user);
    } catch(err) {
      return done(err);
    }
  })
);

const jwtOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.ACCESS_TOKEN_SECRET
};

passport.use('access-token',
  new JwtStrategy(jwtOptions, async (jwt_payload, done) => {
    try {
      const user = await query.getUserById(jwt_payload.id);

      if (user)
        return done(null, user);
      else
        return done (null, false);
    } catch (err) {
      return done(err);
    }
  })
);