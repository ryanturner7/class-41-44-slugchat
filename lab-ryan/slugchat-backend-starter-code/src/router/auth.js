'use strict'

import {Router} from 'express'
import User from '../model/user.js'
import superagent from 'superagent'
import bodyParser from 'body-parser'
import basicAuth from '../middleware/basic-auth.js'

export default new Router()

.get('/oauth/google/code', (req, res, next) => {
  console.log('req.query', req.query)
  if(!req.query.code) {
    res.redirect(process.env.CLIENT_URL)
    } else {
      superagent.post('https://www.googleapis.com/oauth2/v4/token')
      .type('form')
      .send({
        code: req.query.code,
        grant_type: 'authorization_code',
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: `${process.env.API_URL}/oauth/google/code`,
      })
      .then(response => {
        console.log('google token data', response.body)
        return superagent.get('https://www.googleapis.com/plus/v1/people/me/openIdConnect')
        .set('Authorization', `Bearer ${response.body.access_token}`)
      })
      .then(response => {
        console.log('google profile', response.body)
        return User.handleOAUTH(response.body)
      })
      .then(user => user.tokenCreate())
      .then(token => {
        res.cookie('X-Slugchat-Token', token)
        res.redirect(process.env.CLIENT_URL)
      })
      .catch((error) => {
        console.error(error)
        res.redirect(process.env.CLIENT_URL)
      })
    }
  })s