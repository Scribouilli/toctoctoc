const http = require('http')
const path = require('path')
const {parse} = require('url')
const {createReadStream} = require('fs')

const app = require('express')()
const got = require('got')

const client_id = process.env.GITHUB_ID
const client_secret = process.env.GITHUB_SECRET

app.get('/gh-callback', (req, res) => {
  const {code, destination} = req.query
  const urlGhOAuth =
    `https://github.com/login/oauth/access_token?code=${code}&client_id=${client_id}&client_secret=${client_secret}`

  got.post(urlGhOAuth, { json: true }).then(ghResponse => {
    const access_token = ghResponse.body.access_token
    // let dest = destination ? destination : '/receive-token'
  
    if (destination) {
      res.redirect(302, `${destination}?access_token=${access_token}`)
    } else {
      res.redirect(302, `?access_token=${access_token}`)
    }
  })
})

app.get('/receive-token', (req, res) => {
  res.sendFile(path.resolve(__dirname, './example_access_token.html'))
})

app.get('/\*' , (req, res) => {
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
          <a href="https://github.com/login/oauth/authorize?client_id=${client_id}&scope=public_repo&redirect_uri=https://file-moi-les-clefs.herokuapp.com/gh-callback?destination=cdp">Login with Github</button>
        </body>
    </html>
  `)
})

app.listen(process.env.PORT || 5000, () => {
  console.log("Server is listening")
})

process.on('uncaughtException', e => console.error('uncaughtException', e))
process.on('unhandledRejection', e => console.error('unhandledRejection', e))
