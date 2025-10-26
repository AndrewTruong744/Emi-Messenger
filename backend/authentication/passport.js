import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import bcrypt from 'bcryptjs';
import query from '../db/query.js';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import {Strategy as GoogleStrategy} from 'passport-google-oauth20';

passport.use(
  new LocalStrategy(async (username, password, done) => {
    try {
      const user = await query.getUser(username, "");

      if (user.sub !== null) {
        return done(null, false, { message: "Use Single Sign On" });
      }
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
  secretOrKey: process.env.ACCESS_TOKEN_SECRET,
  session: false
};

passport.use('access-token',
  new JwtStrategy(jwtOptions, async (jwt_payload, done) => {
    try {
      const user = await query.getUserById(jwt_payload.id);
      console.log(user);
      if (user)
        return done(null, user);
      else
        return done (null, false);
    } catch (err) {
      return done(err);
    }
  })
);

passport.use('google', new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: 'http://localhost:3000/api/oauth2/redirect/google',
    scope: ['profile', 'email']
  },
  async (accessToken, refreshToken, profile, done) => {
    const googleSub = profile.id;

    const userContents = {
      email: profile.emails[0].value,
      displayName: profile.displayName,
      sub: googleSub,
      username: crypto.randomUUID(),
    }

    try {
      const user = await query.getUserBySub(googleSub);

      if (user) {
        return done(null, user);
      } else {
        const createdUser = await query.createUser(userContents);
        console.log('authenticated');
        return done(null, createdUser);
      }
    } catch (err) {
      console.log(err);
      return done(err);
    }
  }
));