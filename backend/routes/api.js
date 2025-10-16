const express = require("express");
const router = express.Router();
const query = require("../db/query.js"); 
const jwt = require('jsonwebtoken');
const passport = require("passport");

const ACCESS_SECRET = process.env.ACCESS_TOKEN_SECRET;   
const REFRESH_SECRET = process.env.REFRESH_TOKEN_SECRET;

router.post('/signup', async (req, res, next) => {
  try {
    if (await query.getUser(req.body.username)) {
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

//add something that prevents refresh token from being
//created if it already exists
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

      const payload = {
        id: user.id,
        username: user.username
      };

      const accessToken = jwt.sign(
        payload, 
        ACCESS_SECRET, 
        {expiresIn: '15m'}
      );
      
      if(!query.checkRefreshTokenWithUserId(user.id, req.cookies.refreshToken)) {
        const refreshToken = jwt.sign(
          payload, 
          REFRESH_SECRET, 
          { expiresIn: '7d' }
        );

        const updatedUser = await query.saveRefreshToken(user.id, refreshToken);
        console.log(updatedUser);

        res.cookie('refreshToken', refreshToken, {
          httpOnly: true,
          secure: (process.env.MODE === 'production') ? true : false,
          sameSite: 'none',
          maxAge: 7 * 24 * 60 * 60 * 1000 //7 days in milliseconds
        });
      }

      return res.json({
        user: user.username,
        accessToken: accessToken,
        expiresIn: 900 //15 minutes
      });
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

    const newPayload = {
        id: user.id,
        username: user.username
      };

    const newAccessToken = jwt.sign(
      newPayload, 
      ACCESS_SECRET, 
      {expiresIn: '15m'}
    );
    const newRefreshToken = jwt.sign(
      newPayload, 
      REFRESH_SECRET, 
      { expiresIn: '7d' }
    );

    const message = await query.deleteRefreshToken(decoded.id, refreshToken);
    console.log(message);

    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: (process.env.MODE === 'production') ? true : false,
      sameSite: 'none',
      maxAge: 7 * 24 * 60 * 60 * 1000 //7 days in milliseconds
    });

    return res.json({
      user: user.username,
      accessToken: newAccessToken,
      expiresIn: 900 //15 minutes
    });
  } catch (err) {
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: (process.env.MODE === 'production') ? true : false,
      sameSite: 'none',
    });
    return res.status(401).json({ message: 'Invalid or expired Refresh Token.' });
  }
});

module.exports = router;