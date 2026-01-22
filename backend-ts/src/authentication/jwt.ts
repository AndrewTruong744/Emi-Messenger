import authQuery from '../db/authQuery.js';
import jwt from 'jsonwebtoken';
import { type Response } from 'express';
import {type User as PrismaUser} from '@prisma/client'

/*
  This application uses a both JWT token method:
  - Access Token (short lived): lives in a frontend store (in our case, zustand)
    and gets invalidated every 15 mins (XSS risk)
  - Refresh Token (long lived): lives in a HTTPOnly cookie, with data inside cookie inaccessible
    and gets invalidated every 7 days (prevents XSS risk but has CSRF risk)
  
  TODO: implement CSRF tokens to prevent CSRF attacks
*/

const ACCESS_SECRET = process.env['ACCESS_TOKEN_SECRET'];   
const REFRESH_SECRET = process.env['REFRESH_TOKEN_SECRET'];

async function generateJwt(
  user : PrismaUser, 
  refreshTokenCookie : string | undefined, 
  res : Response, 
  isOdic=false
) {
  const payload = {
    id: user.id,
    username: user.username
  };

  const accessToken = jwt.sign(
    payload, 
    ACCESS_SECRET!, 
    {expiresIn: '15m'}
  );
  
  const refreshToken = jwt.sign(
    payload, 
    REFRESH_SECRET!, 
    { expiresIn: '7d' }
  );

  await authQuery.saveRefreshToken(user.id, refreshToken);

  // deletes old refresh token (Token Rotation)
  if (refreshTokenCookie) {
    await authQuery.deleteRefreshToken(user.id, refreshTokenCookie);
  }

  // set domain on prod
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: (process.env['MODE'] === 'production') ? true : false,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, //7 days in milliseconds
    path: '/'
  });

  // if logged in with Single Sign On, just return the access token
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