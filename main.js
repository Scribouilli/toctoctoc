//@ts-check

import { onGithubCallback } from './github/index.js'

import { readFileSync } from 'node:fs'

import Fastify from 'fastify'

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

server.get('/github-callback', onGithubCallback(client_id, client_secret))


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
