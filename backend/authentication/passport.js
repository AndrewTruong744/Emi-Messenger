const passport = require("passport");
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require("bcryptjs");
const query = require("../db/query.js");
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const OidcStrategy = require('passport-openid-client').Strategy;
const {Issuer} = require('openid-client');
const { Strategy } = require("passport-local");

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

(async () => {
  try {
    const googleIssuer = await Issuer.discover('https://accounts.google.com');

    const client = new googleIssuer.Client({
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uris: ['http://localhost:3000/oauth2/redirect/google'],
      response_types: ['code'],
    });

    passport.use('oidc-google', new Strategy({
        client: client,
        params: {
          scope: 'openid profile email',
        },
        passReqToCallback: false,
      },
      async (tokenSet, done) => {
        const claims = tokenSet.claims();

        //get rid of password field later (handle it later for Oauth)
        const userContents = {
          email: claims.email,
          displayName: claims.name,
          username: claims.sub,
          password: crypto.randomUUID(),
        }

        try {
          const user = await query.getUser("", claims.email);
          
          if (user)
            return done(null, user);
          else if (claims.email_verified) {
            const createdUser = await query.createUser(userContents);
            return done(null, createdUser);
          }
          else
            return done(null, false);

        } catch (err) {
          return done(err);
        }
      }
    ));
  } catch (err) {
    console.error('FATAL ERROR: Google OIDC config failed');
    process.exit(1);
  }
})();