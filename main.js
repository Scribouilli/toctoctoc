//@ts-check

import { readFileSync } from 'node:fs'

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

/**
 * 
 * @param {TemplateStringsArray | string} content
 * @returns {string}
 */
function htmlTemplate(content){
  if(typeof content !== 'string'){
    content = content[0]
  }

  return `<!doctype html>
    <html lang="fr">
        <head>
            <meta charset="utf-8">
            <link rel="icon" href="data:,">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            
            <title>Serveur toctoctoc</title>
            
            <meta name="referrer" content="no-referrer">
            <style>body{width: 60%; margin: 1rem auto;}</style>
        </head>
        <body>
          ${content}
        </body>
    </html>`
}

const server = Fastify()

server.get('/github-callback', (req, res) => {
  // @ts-ignore
  const {code, destination} = req.query

  if(!code){
    res.status(400)
      .header('Content-Type', 'text/html')
      .send(htmlTemplate`
        <h1>Erreur</h1>
        <p>le paramètre <code>code<code> est manquant</p>
        <p>Peut-être que l'API github ne fonctionne plus pareil. Regarder l'API Rest github</p>
      `)
    return;
  }
  if(!destination){
    res.status(400)
      .header('Content-Type', 'text/html')
      .send(htmlTemplate`
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
      .send(htmlTemplate`
        <h1>Erreur</h1>
        <p>le paramètre <code>destination<code> n'a pas de hostname. (destination : ${destination})</p>
        <p>Rajouter une origine au paramètre <code>destination<code>
      `)
    return;
  }

  if(hostname !== 'localhost' && !allowlist.has(hostname)){
    res.status(403)
      .header('Content-Type', 'text/html')
      .send(htmlTemplate(`
        <h1>Erreur</h1>
        <p>La destination est ${destination}, et son hostname (${hostname}) n'est pas présent dans notre <a href="https://github.com/Scribouilli/toctoctoc/blob/main/allowlist.csv">liste de hostname autorisés</a>.</p>
        <p>Liste des hostname autorisés : 
          <ul>
            ${[...allowlist].map(hostname => `<li>${hostname}</li>`).join('')}
          </ul>
        </p>
        <p>Changer cette liste ou installez une nouvelle instance de toctoctoc où ce hostname est autorisé</p>
      `))
    return;
  }

  const urlGithubOAuth =
    `https://github.com/login/oauth/access_token?code=${code}&client_id=${client_id}&client_secret=${client_secret}`

  got.post(urlGithubOAuth, { json: true }).then(githubResponse => {
    const access_token = new URLSearchParams(githubResponse.body).get('access_token')

    if(!access_token){
      res.status(400)
        .header('Content-Type', 'text/html')
        .send(htmlTemplate`
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


server.get('/' , (req, res) => {

  res.header('Content-Type', 'text/html')
  res.send(htmlTemplate(`
    <h1>Serveur toctoctoc</h1>
    <p>Le serveur toctoctoc est disponible (<code>client_id: ${client_id}</code>)</p>
    <p>Tu peux créer un bouton "login with github" où le <code>redirect_uri</code> contient un 
      paramètre <code>destination</code> vers l'un des domaines suivants :
      <ul>
        ${[...allowlist].map(hostname => `<li>${hostname}</li>`).join('')}
      </ul>
    </p>

  `))
})

// @ts-ignore
server.listen({ port, host }, (err, address) => {
    console.log(`Server is listening on ${address}  `)
})

process.on('uncaughtException', e => console.error('uncaughtException', e))
process.on('unhandledRejection', e => console.error('unhandledRejection', e))
