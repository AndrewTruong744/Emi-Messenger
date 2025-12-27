import authQuery from '../db/authQuery.js';
import jwt from 'jsonwebtoken';
import { type Response } from 'express';
import {type User as PrismaUser} from '@prisma/client'

const ACCESS_SECRET = process.env['ACCESS_TOKEN_SECRET'];   
const REFRESH_SECRET = process.env['REFRESH_TOKEN_SECRET'];

async function generateJwt(user : PrismaUser, refreshTokenCookie : string | undefined, res : Response, isOdic=false) {
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

  const updatedUser = await authQuery.saveRefreshToken(user.id, refreshToken);

  if (refreshTokenCookie) {
    const deleteCount = await authQuery.deleteRefreshToken(user.id, refreshTokenCookie);
  }

  // set domain on prod
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: (process.env['MODE'] === 'production') ? true : false,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, //7 days in milliseconds
    path: '/'
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