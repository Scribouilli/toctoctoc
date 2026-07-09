#!/usr/bin/env node

//@ts-check

import { readFileSync } from 'node:fs'
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { parseArgs } from 'node:util';

import Fastify from 'fastify'

import './types.js'

import { makeGithubRouteHandler } from './github.js'
import { makeGitlabRouteHandler } from './gitlab.js'
import { htmlTemplate } from './tools.js'
import { decryptOauthServicesContent } from './oauthServicesDecrypt.js'

// @ts-ignore
const DEFAULT_ALLOW_LIST_FILE = resolve(import.meta.dirname, './allowlist.csv');


const {
  positionals: [cmd],
  values: { 
    "allowlist-file": allowListFile, 
    "encrypted-config-file": encryptedConfigFilepath,
    help
  },
} = parseArgs({
  options: {
    help: { type: 'boolean', short: 'h', default: false },
    "allowlist-file": { type: 'string', default: DEFAULT_ALLOW_LIST_FILE },
    "encrypted-config-file": { type: 'string' },
  },
  allowPositionals: true,
});

if (cmd === 'help' || help /*|| !cmd*/) {
  const helpText = `Usage: ${process.argv0} [...options] <command>

Commands:

Options:
    -h, --help                Show this help message
    --allowlist-file          Allow-list file path
    --encrypted-config-file   Encrypted configuration file path
`

  console.log(helpText)
  process.exit(0)
}


if(!encryptedConfigFilepath){
  console.log('Server starting without configuration')
}

if(encryptedConfigFilepath && !process.env.OAUTH_SERVICES_DECRYPTION_KEY){
  console.error(`Il manque la variable d'environnement OAUTH_SERVICES_DECRYPTION_KEY pour déchiffrer le fichier de configuration.`)
  process.exit(1);
}

const allowlist = new Set(
  readFileSync(
    // @ts-ignore
    resolve(allowListFile), 
    {encoding: 'utf8'}
  )
  .split('\n').map(s => s.trim()).filter(x => !!x)
)

console.log('allowlist', allowlist)




/** @type {import('./types.js').GithubOauthServiceConfiguration | undefined} */
let githubConfig;

/** @type {import('./types.js').GitlabOauthServiceConfiguration[] | undefined} */
let gitlabConfigs;


if(encryptedConfigFilepath){
  const encryptedOauthServicesConfigContent = await readFile(resolve(encryptedConfigFilepath), { encoding: 'utf8' });

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

const port = process.env.PORT || 4000
const host = process.env.HOST || 'localhost'

const server = Fastify()

// @ts-ignore
const oauth_services_config_html_content = await readFile(resolve(import.meta.dirname, './oauth-services-config.html'), { encoding: 'utf8' })
// @ts-ignore
const oauthServicesDecrypt_js_content = await readFile(resolve(import.meta.dirname, './oauthServicesDecrypt.js'), { encoding: 'utf8' })

// @ts-ignore
async function sendOauthServicesConfigHTMLContent(_req, res){
  res.header('Content-Type', 'text/html')
  res.send(oauth_services_config_html_content)
}


if(githubConfig || gitlabConfigs){
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
}
else{
  server.get('/', sendOauthServicesConfigHTMLContent)
}



server.get('/oauth-services-config', sendOauthServicesConfigHTMLContent)

server.get('/oauthServicesDecrypt.js', async (req, res) => {
  res.header('Content-Type', 'text/javascript')
  res.send(oauthServicesDecrypt_js_content)
})

if(githubConfig){
  server.get("/github-callback", makeGithubRouteHandler(githubConfig, allowlist))
}

if(Array.isArray(gitlabConfigs)){
  for(const gitlabConfig of gitlabConfigs){
    const {origin} = gitlabConfig
    
    server.get(
      `/gitlab-callback/${origin}/`, makeGitlabRouteHandler(gitlabConfig, allowlist),
    )
  }
}


// @ts-ignore
server.listen({ port, host }, (err, address) => {
  console.log(`Server is listening on http://${host}:${port}`)
})

process.on('uncaughtException', e => console.error('uncaughtException', e))
process.on('unhandledRejection', e => console.error('unhandledRejection', e))
