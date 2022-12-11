//@ts-check

import { resolve } from 'path'
import { parse, format } from 'url'
import { readFileSync } from 'fs'

import Fastify from 'fastify'
import got from 'got'

const server = Fastify()

const client_id = process.env.GITHUB_ID
const client_secret = process.env.GITHUB_SECRET

const whitelist = new Set(readFileSync('./whitelist.csv', {encoding: 'utf8'}).split('\n').map(s => s.trim()))

server.get('/gh-callback', (req, res) => {
  const {code, destination='/receive-token'} = req.query

  const urlGhOAuth =
    `https://github.com/login/oauth/access_token?code=${code}&client_id=${client_id}&client_secret=${client_secret}`

  got.post(urlGhOAuth, { json: true }).then(ghResponse => {
    const access_token = ghResponse.body.access_token
    const redirectUrl = parse(destination, true)
    const hostname = redirectUrl.hostname // hostname is null when destination is a relative url

    redirectUrl.query.access_token = access_token

    if (!hostname || whitelist.has(hostname)) {
      res.redirect(302, format(redirectUrl))
    } else {
      res.send(403, `<h1>403 Error</h1><p>Vous avez demandé : ${destination}, et ${hostname} n'est pas présent dans notre <a href="https://github.com/daktary-team/file-moi-les-clefs/blob/master/whitelist.csv">liste d'invité</a>.</p>`)
    }
  })
})

server.get('/receive-token', (req, res) => {
  res.sendFile(resolve(__dirname, './example_access_token.html'))
})

server.get('/\*' , (req, res) => {
  res.send(`<!doctype html>
    <html lang=en>
        <head>
            <meta charset=utf-8>
            <meta name="referrer" content="same-origin">
            <meta http-equiv="X-UA-Compatible" content="IE=edge">
            
            <title></title>
            
            <meta name="description" content=" ">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            
            <link rel="stylesheet" href="https://rawgit.com/twbs/bootstrap/v4-dev/dist/css/bootstrap-reboot.css">
            
            <script crossorigin="anonymous" src="https://cdn.polyfill.io/v2/polyfill.min.js"></script>
        </head>
        <body>
          <a href="https://github.com/login/oauth/authorize?client_id=${client_id}&scope=public_repo">Login with Github</button>
        </body>
    </html>
  `)
})

server.listen({ port: process.env.PORT || 5000 }, (err, address) => {
    console.log(`Server is listening on ${address}  `)
}) 

process.on('uncaughtException', e => console.error('uncaughtException', e))
process.on('unhandledRejection', e => console.error('unhandledRejection', e))
