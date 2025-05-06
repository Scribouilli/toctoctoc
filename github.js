import got from 'got'

import { htmlTemplate, allowlist } from './tools.js'

/**
 * @param {import('./types.js').GithubOauthServiceConfiguration} githubConfig
 * @returns {import('fastify').RouteHandler}
 */
export const makeGithubRouteHandler = ({client_id, client_secret}) => {
  if(!client_id){
    throw new TypeError('Missing github.client_id in configuration')
  }
  if(!client_secret){
    throw new TypeError('Missing github.client_secret in configuration')
  }
  
  return (req, res) => {
    //@ts-ignore
    const {code, destination} = req.query

    if(!code){
      res.status(400)
        .header('Content-Type', 'text/html')
        .send(htmlTemplate`
        <h1>Erreur</h1>
        <p>le paramètre <code>code</code> est manquant</p>
        <p>Peut-être que l'API github ne fonctionne plus pareil. Regarder l'API Rest github</p>
      `)
      return;
    }
    if(!destination){
      res.status(400)
        .header('Content-Type', 'text/html')
        .send(htmlTemplate`
        <h1>Erreur</h1>
        <p>le paramètre <code>destination</code> est manquant.</p>
        <p>Il est sûrement manquant en tant que paramètre du <code>redirect_uri</code> du lien "login with github"
      `)
      return;
    }

    const redirectUrl = new URL(destination)
    const hostname = redirectUrl.hostname

    if(!hostname){
      res.status(400)
        .header('Content-Type', 'text/html')
        .send(htmlTemplate(`
        <h1>Erreur</h1>
        <p>le paramètre <code>destination</code> n'a pas de hostname. (destination : ${destination})</p>
        <p>Rajouter une origine au paramètre <code>destination<code>
      `))
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
      redirectUrl.searchParams.set(`type`, 'github')

      res.redirect(302, redirectUrl.toString())
    })
  }
}
/**
 * @param {import('./types.js').GithubOauthServiceConfiguration} githubConfig
 * @returns {import('fastify').RouteHandler}
 */
export const revokeGithubToken = ({client_id, client_secret}) => {
  return async (req, res) => {
    //@ts-ignore
    const { access_token } = req.body;
    if(!client_id){
      throw new TypeError('Missing github.client_id in configuration')
    }
    if(!client_secret){
      throw new TypeError('Missing github.client_secret in configuration')
    }

    try {
      const urlGithubOAuth =
      `https://api.github.com/applications/${client_id}/token`

      const response = await got.delete(urlGithubOAuth, {
        username: client_id,
        password: client_secret,
        json: {
          access_token
        },
        responseType: 'json'
      });
      res.status(200).send({ success: true })
    }
    catch (error) {
      res.status(500).send({ error: 'Failed to revoke token' })
    }
  }
}
