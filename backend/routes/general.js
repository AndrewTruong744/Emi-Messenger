import express from "express";
import generalQuery from "../db/generalQuery.js";
import passport from "passport";

const router = express.Router();

router.get('/users/:username?', 
  passport.authenticate('access-token', {session: false}),
  async (req, res) => {
    try {
      const username = (req.params.username) ? req.params.username : '?';
      const users = await generalQuery.getUsers(username);
      
      return res.json({users});
    } catch (err) {
      return res.status(503).json({
        error: true,
        message: 'Database is currently unreachable'
      })
    }
  }
);

router.get('/conversations',
  passport.authenticate('access-token', {session: false}),
  (req, res) => {

    return res.json({

    });
  }
);

router.get('/messages/:username',
  passport.authenticate('access-token', {session: false}),
  (req, res) => {

    return res.json({

    });
  }
)

router.post('/message/:username',
  passport.authenticate('access-token', {session: false}),
  (req, res) => {

    return res.json({

    });
  }
);

export default router;