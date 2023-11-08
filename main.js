//@ts-check

import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import { onGithubCallback } from './github.js'
import { onGitlabCallback } from './gitlab.js'
import { htmlTemplate, allowlist } from './tools.js'
import { decryptOauthServicesContent } from './oauthServicesDecrypt.js'


import Fastify from 'fastify'
/*
if(!process.env.OAUTH_SERVICES_DECRYPTION_KEY){
  console.error(`Il manque la variable d'environnement OAUTH_SERVICES_DECRYPTION_KEY.`)
  process.exit(1);
}

if(!process.env.ORIGIN){
  console.error(`Il manque la variable d'environnement "ORIGIN".`)
  process.exit(1);
}*/

/*
const ENCRYPTED_OAUTH_SERVICES_FILE = './oauth-services.json.encrypted';

const filePath = resolve(ENCRYPTED_OAUTH_SERVICES_FILE);
const encryptedOauthServicesConfigContent = await readFile(filePath, { encoding: 'utf8' });
const oauthServicesConfigContent = decryptOauthServicesContent(
  encryptedOauthServicesConfigContent, 
  process.env.OAUTH_SERVICES_DECRYPTION_KEY
)


const oauthServicesConfig = JSON.parse(oauthServicesConfigContent)


const {github, gitlab} = oauthServicesConfig;

if(!github && !gitlab){
  console.error('')
}

*/



/*
const githubClientId = process.env.GITHUB_OAUTH_APP_CLIENT_ID || ""
const githubClientSecret = process.env.GITHUB_OAUTH_APP_CLIENT_SECRET || ""
const gitlabClientId = process.env.GITLAB_OAUTH_APP_CLIENT_ID || ""
const gitlabClientSecret = process.env.GITLAB_OAUTH_APP_CLIENT_SECRET || ""
*/
const origin = process.env.ORIGIN
const port = process.env.PORT || 4000
const host = process.env.HOST || 'localhost'

const server = Fastify()

server.get('/' , (req, res) => {
  res.header('Content-Type', 'text/html')
  res.send(htmlTemplate(`
    <h1>Serveur toctoctoc</h1>
    <p>Le serveur toctoctoc est disponible</p>
    <p>Tu peux créer un bouton "login with github/gitlab" où le <code>redirect_uri</code> contient un
      paramètre <code>destination</code> vers l'un des domaines suivants :
      <ul>
        ${[...allowlist].map(hostname => `<li>${hostname}</li>`).join('')}
      </ul>
    </p>

  `))
})


server.get('/oauth-services-config' , async (req, res) => {
  res.header('Content-Type', 'text/html')
  res.send(await readFile(resolve('./oauth-services-config.html'), { encoding: 'utf8' }))
})
server.get('/oauthServicesDecrypt.js' , async (req, res) => {
  res.header('Content-Type', 'text/javascript')
  res.send(await readFile(resolve('./oauthServicesDecrypt.js'), { encoding: 'utf8' }))
})

/*
server.get(
  "/github-callback",
  onGithubCallback(githubClientId, githubClientSecret),
)

server.get(
  "/gitlab-callback",
  onGitlabCallback(gitlabClientId, gitlabClientSecret, origin),
)*/

// @ts-ignore
server.listen({ port, host }, (err, address) => {
  console.log(`Server is listening on ${address}  `)
})

process.on('uncaughtException', e => console.error('uncaughtException', e))
process.on('unhandledRejection', e => console.error('unhandledRejection', e))
