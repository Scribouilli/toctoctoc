//@ts-check

import { resolve } from 'node:path'
import { readFileSync, createReadStream } from 'node:fs'

import Fastify from 'fastify'
import got from 'got'

if(!process.env.GITHUB_OAUTH_APP_CLIENT_ID){
  console.error(`Il manque la variable d'environnement "GITHUB_OAUTH_APP_CLIENT_ID"`)
  process.exit(1);
}
if(!process.env.GITHUB_OAUTH_APP_CLIENT_SECRET){
  console.error(`Il manque la variable d'environnement "GITHUB_OAUTH_APP_CLIENT_SECRET"`)
  process.exit(1);
}
if(!process.env.PORT){
  console.error(`Il manque la variable d'environnement "PORT"`)
  process.exit(1);
}


const client_id = process.env.GITHUB_OAUTH_APP_CLIENT_ID
const client_secret = process.env.GITHUB_OAUTH_APP_CLIENT_SECRET
const port = process.env.PORT
const host = process.env.HOST || 'localhost'

const allowlist = new Set(
  readFileSync('./allowlist.csv', {encoding: 'utf8'}).split('\n').map(s => s.trim())
)

const server = Fastify()

server.get('/github-callback', (req, res) => {
  // @ts-ignore
  const {code, destination} = req.query

  if(!code){
    res.status(400)
      .header('Content-Type', 'text/html')
      .send(`
        <h1>Erreur</h1>
        <p>le paramètre <code>code<code> est manquant</p>
        <p>Peut-être que l'API github ne fonctionne plus pareil. Regarder l'API Rest github</p>
      `)
    return;
  }
  if(!destination){
    res.status(400)
      .header('Content-Type', 'text/html')
      .send(`
        <h1>Erreur</h1>
        <p>le paramètre <code>destination<code> est manquant.</p>
        <p>Il est sûrement manquant en tant que paramètre du <code>redirect_uri</code> du lien "login with github"
      `)
    return;
  }

  const redirectUrl = new URL(destination)
  const hostname = redirectUrl.hostname

  if(!hostname){
    res.status(400)
      .header('Content-Type', 'text/html')
      .send(`
        <h1>Erreur</h1>
        <p>le paramètre <code>destination<code> n'a pas de hostname. (destination : ${destination})</p>
        <p>Rajouter une origine au paramètre <code>destination<code>
      `)
    return;
  }

  if(hostname !== 'localhost' && !allowlist.has(hostname)){
    res.status(403)
      .header('Content-Type', 'text/html')
      .send(`
        <h1>Erreur</h1>
        <p>La destination est ${destination}, et son hostname (${hostname}) n'est pas présent dans notre <a href="https://github.com/Scribouilli/toctoctoc/blob/main/allowlist.csv">liste de hostname autorisés</a>.</p>
        <p>Liste des hostname autorisés : 
          <ul>
            ${[...allowlist].map(hostname => `<li>${hostname}</li>`)}
          </ul>
        </p>
        <p>Changer cette liste ou installez une nouvelle instance de toctoctoc où ce hostname est autorisé</p>
      `)
    return;
  }

  const urlGithubOAuth =
    `https://github.com/login/oauth/access_token?code=${code}&client_id=${client_id}&client_secret=${client_secret}`

  got.post(urlGithubOAuth, { json: true }).then(githubResponse => {
    const access_token = new URLSearchParams(githubResponse.body).get('access_token')

    if(!access_token){
      res.status(400)
        .header('Content-Type', 'text/html')
        .send(`
          <h1>Erreur</h1>
          <p>le <code>access_token</code> attendu de la part de Github n'a pas été récupéré</p>
          <p>Peut-être que le fonctionnement de l'API github a changé ou que le code ne le trouve pas au bon endroit</p>
        `)
      return;
    }

    redirectUrl.searchParams.set(`access_token`, access_token)
    res.redirect(302, redirectUrl.toString())
  })
})

server.get('/receive-token', (req, res) => {
  res.header('Content-Type', 'application/octet-stream')
  res.send(createReadStream(resolve('./example_access_token.html')))
})

server.get('/\*' , (req, res) => {

  res.header('Content-Type', 'text/html')
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

// @ts-ignore
server.listen({ port, host }, (err, address) => {
    console.log(`Server is listening on ${address}  `)
})

process.on('uncaughtException', e => console.error('uncaughtException', e))
process.on('unhandledRejection', e => console.error('unhandledRejection', e))
