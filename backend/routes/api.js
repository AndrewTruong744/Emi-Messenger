import express from "express";
import query from '../db/query.js';
import jwt from 'jsonwebtoken';
import passport from "passport";
import generateJwt from "../authentication/jwt.js";

const router = express.Router();

const ACCESS_SECRET = process.env.ACCESS_TOKEN_SECRET;   
const REFRESH_SECRET = process.env.REFRESH_TOKEN_SECRET;

router.post('/signup', async (req, res, next) => {
  try {
    if (await query.getUser(req.body.username, req.body.email)) {
      console.error('User already exists');
      return res.status(409).json({
        message: 'User already exists'
      });
    }

    const createdUser = await query.createUser(req.body);
    return res.json({message: 'Success'});
  } catch (err) {
    console.error('Trouble connecting to database');
    return res.status(503).json({
      message: 'Database offline'
    });
  }
})

router.post('/login', (req, res, next) => {
  passport.authenticate('local', {session: false}, 
    async (err, user, info) => {
      if (err || !user) {
        return res.status(401).json({
          message: 'Authentication failed',
          user: user,
          info: info
        });
      }

      return await generateJwt(user, req.cookies.refreshToken, res);
    })(req, res, next);
});

router.get('/login/google', passport.authenticate('google', {session: false}));

//another path for refreshToken

router.get('/oauth2/redirect/google', (req, res, next) => {
  passport.authenticate('google', {
    session: false, 
    failureMessage: true
  }, async (err, user, info) => {
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');

    if (err || !user) {
      const script = `<script>
        window.opener.postMessage(
          { 
            type: 'OAUTH_FAILURE',
            message: 'failure' 
          }, 
          '${process.env.ORIGIN}'
        );

        window.close();
      </script>`;
      return res.send(script);
    }

    const accessToken = await generateJwt(user, req.cookies.refreshToken, res, true);
    //send access token and refresh httpOnly cookie token
    const script = `<script>
      window.opener.postMessage(
        { 
          type: 'OAUTH_SUCCESS', 
          accessToken: '${JSON.stringify(accessToken)}'
        }, 
        '${process.env.ORIGIN}'
      );

      window.close();
    </script>`;
    return res.send(script);
  })(req, res, next);
});

router.post('/logout', async (req, res, next) => {
  const refreshToken = req.cookies.refreshToken;

  if (refreshToken) {
    try {
      const decoded = jwt.verify(refreshToken, REFRESH_SECRET);

      const message = await query.deleteRefreshToken(decoded.id, refreshToken);
      console.log(message);
    } catch (err) {
      console.log("Token invalid during logout, proceeding to clear cookies");
    }
  }

  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: (process.env.MODE === 'production') ? true : false,
    sameSite: 'none',
  });

  return res.status(200).json({message: 'Logout sucessful'});
});

router.post('/refresh', async (req, res) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    return res.status(401).json(
      { message: 'No Refresh Token provided. Please log in.' });
  }

  try {
    const decoded = jwt.verify(refreshToken, REFRESH_SECRET);
    const user = await query.checkRefreshToken(refreshToken);

    if (!user)
      throw new Error('Refresh token does not exist');

    return await generateJwt(user, refreshToken, res);
  } catch (err) {
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: (process.env.MODE === 'production') ? true : false,
      sameSite: 'none',
    });
    return res.status(401).json({ message: 'Invalid or expired Refresh Token.' });
  }
});

export default router;