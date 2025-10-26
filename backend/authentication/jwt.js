import query from '../db/query.js';
import jwt from 'jsonwebtoken';

const ACCESS_SECRET = process.env.ACCESS_TOKEN_SECRET;   
const REFRESH_SECRET = process.env.REFRESH_TOKEN_SECRET;

async function generateJwt(user, refreshTokenCookie, res, isOdic=false) {
  const payload = {
    id: user.id,
    username: user.username
  };

  const accessToken = jwt.sign(
    payload, 
    ACCESS_SECRET, 
    {expiresIn: '15m'}
  );
  
  const refreshToken = jwt.sign(
    payload, 
    REFRESH_SECRET, 
    { expiresIn: '7d' }
  );

  const updatedUser = await query.saveRefreshToken(user.id, refreshToken);
  //console.log(updatedUser);

  if (refreshTokenCookie) {
    const deleteCount = await query.deleteRefreshToken(user.id, refreshTokenCookie);
    //console.log(`Deleted ${deleteCount} old token(s) for user ${user.id}`);
  }

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: (process.env.MODE === 'production') ? true : false,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000 //7 days in milliseconds
  });

  if (isOdic)
    return accessToken;
  else {
    return res.json({
      user: user.username,
      accessToken: accessToken,
      expiresIn: 900 //15 minutes
    });
  }
}

export default generateJwt;