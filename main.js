//@ts-check

import { onGithubCallback } from './github.js'
import { onGitlabCallback } from './gitlab.js'
import { htmlTemplate, allowlist } from './tools.js'


import Fastify from 'fastify'

if(
  !process.env.GITHUB_OAUTH_APP_CLIENT_ID &&
  !process.env.GITLAB_OAUTH_APP_CLIENT_ID
){
  console.error(`
    Aucune OAuth App n'est configurée pour ce serveur.

    Il manque l'une des variables d'environnement suivantes :
      - "GITHUB_OAUTH_APP_CLIENT_ID"
      - ou "GITLAB_OAUTH_APP_CLIENT_ID"
  `)
  process.exit(1);
}

if(process.env.GITLAB_OAUTH_APP_CLIENT_ID) {
  if(!process.env.GITLAB_OAUTH_APP_CLIENT_SECRET){
    console.error(`
      Une application GitLab est configurée sans secret.

      Il manque la variable d'environnement "GITLAB_OAUTH_APP_CLIENT_SECRET".
    `)
    process.exit(1);
  }
}

if(process.env.GITHUB_OAUTH_APP_CLIENT_ID){
  if(!process.env.GITHUB_OAUTH_APP_CLIENT_SECRET){
    console.error(`
      Une application GitHub est configurée sans secret.

      Il manque la variable d'environnement "GITHUB_OAUTH_APP_CLIENT_SECRET".
    `)
    process.exit(1);
  }
}

if(!process.env.ORIGIN){
  console.error(`
    Il manque la variable d'environnement "ORIGIN".
  `)
  process.exit(1);
}

const githubClientId = process.env.GITHUB_OAUTH_APP_CLIENT_ID || ""
const githubClientSecret = process.env.GITHUB_OAUTH_APP_CLIENT_SECRET || ""
const gitlabClientId = process.env.GITLAB_OAUTH_APP_CLIENT_ID || ""
const gitlabClientSecret = process.env.GITLAB_OAUTH_APP_CLIENT_SECRET || ""
const origin = process.env.ORIGIN
const port = process.env.PORT || 4000
const host = process.env.HOST || 'localhost'

const server = Fastify()

server.get('/' , (req, res) => {
  res.header('Content-Type', 'text/html')
  res.send(htmlTemplate(`
    <h1>Serveur toctoctoc</h1>
    <p>Le serveur toctoctoc est disponible (<code>client_id: ${githubClientId}</code>)</p>
    <p>Tu peux créer un bouton "login with github" où le <code>redirect_uri</code> contient un
      paramètre <code>destination</code> vers l'un des domaines suivants :
      <ul>
        ${[...allowlist].map(hostname => `<li>${hostname}</li>`).join('')}
      </ul>
    </p>

  `))
})

server.get(
  "/github-callback",
  onGithubCallback(githubClientId, githubClientSecret),
)

server.get(
  "/gitlab-callback",
  onGitlabCallback(gitlabClientId, gitlabClientSecret, origin),
)

// @ts-ignore
server.listen({ port, host }, (err, address) => {
  console.log(`Server is listening on ${address}  `)
})

process.on('uncaughtException', e => console.error('uncaughtException', e))
process.on('unhandledRejection', e => console.error('unhandledRejection', e))
