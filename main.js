//@ts-check

import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import Fastify from 'fastify'

import './types.js'

import { makeGithubRouteHandler, revokeGithubToken } from './github.js'
import { makeGitlabRouteHandler } from './gitlab.js'
import { htmlTemplate, allowlist } from './tools.js'
import { decryptOauthServicesContent } from './oauthServicesDecrypt.js'


const NO_DECRYPT_FLAG = '--no-decrypt-config'

let decryptConfig = true

if(process.argv.includes(NO_DECRYPT_FLAG)){
  decryptConfig = false
  console.log('Server starting without configuration')
}


if(decryptConfig && !process.env.OAUTH_SERVICES_DECRYPTION_KEY){
  console.error(`Il manque la variable d'environnement OAUTH_SERVICES_DECRYPTION_KEY.`)
  process.exit(1);
}

if(!process.env.TOCTOCTOC_ORIGIN){
  console.error(`Il manque la variable d'environnement "TOCTOCTOC_ORIGIN".`)
  process.exit(1);
}

const toctoctocOrigin = process.env.TOCTOCTOC_ORIGIN

const ENCRYPTED_OAUTH_SERVICES_FILE = './oauth-services.json.encrypted';

/** @type {import('./types.js').GithubOauthServiceConfiguration | undefined} */
let githubConfig;

/** @type {import('./types.js').GitlabOauthServiceConfiguration[] | undefined} */
let gitlabConfigs;


if(decryptConfig){
  const encryptedOauthServicesConfigContent = await readFile(resolve(ENCRYPTED_OAUTH_SERVICES_FILE), { encoding: 'utf8' });

  const oauthServicesConfigContent = await decryptOauthServicesContent(
    encryptedOauthServicesConfigContent, 
    // @ts-ignore
    process.env.OAUTH_SERVICES_DECRYPTION_KEY
  )

  console.log('Oauth services config (after decryption): ', oauthServicesConfigContent)


  /** @type {import('./types.js').ToctoctocOauthServicesConfiguration} */
  const oauthServicesConfig = JSON.parse(oauthServicesConfigContent)
  // this will throw if the config is not proper JSON. This is intentional

  const {github, gitlab} = oauthServicesConfig;
  githubConfig = github;
  gitlabConfigs = gitlab;

  if(!githubConfig && !gitlabConfigs){
    console.error('Missing github or gitlab configuration')
    process.exit(1)
  }
}

const port = process.env.PORT || 8080
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
    <p>Pour chiffrer le fichier de config, <a href="/oauth-services-config">c'est par ici</a></p>
  `))
})

const oauth_services_config_html_content = await readFile(resolve('./oauth-services-config.html'), { encoding: 'utf8' })
const oauthServicesDecrypt_js_content = await readFile(resolve('./oauthServicesDecrypt.js'), { encoding: 'utf8' })

server.get('/oauth-services-config' , async (req, res) => {
  res.header('Content-Type', 'text/html')
  res.send(oauth_services_config_html_content)
})
server.get('/oauthServicesDecrypt.js' , async (req, res) => {
  res.header('Content-Type', 'text/javascript')
  res.send(oauthServicesDecrypt_js_content)
})

if(githubConfig){
  server.get("/github-callback", makeGithubRouteHandler(githubConfig))
  server.post('/github/revoke', revokeGithubToken(githubConfig))
}

if(Array.isArray(gitlabConfigs)){
  for(const gitlabConfig of gitlabConfigs){
    const {origin} = gitlabConfig
    
    server.get(
      `/gitlab-callback/${origin}/`, makeGitlabRouteHandler(gitlabConfig),
    )
  }
}


// @ts-ignore
server.listen({ port, host }, (err, address) => {
  console.log(`Server is listening on http://${host}:${port}`)
})

process.on('uncaughtException', e => console.error('uncaughtException', e))
process.on('unhandledRejection', e => console.error('unhandledRejection', e))
