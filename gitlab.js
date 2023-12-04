import got from 'got'

import { htmlTemplate, allowlist } from './tools.js'

/**
 * @param {import('./types.js').GitlabOauthServiceConfiguration} gitlabConfig
 * @returns {import('fastify').RouteHandler}
 */
export const makeGitlabRouteHandler = ({origin: gitlabInstanceOrigin, client_id, client_secret, redirect_uri: oauthAppRedirectURI}) => {
  return (req, res) => {
    console.log('gitlab route', req.url, gitlabInstanceOrigin)

    // @ts-ignore
    const {code, destination, state} = req.query

    if(!code){
      res.status(400)
        .header('Content-Type', 'text/html')
        .send(htmlTemplate`
          <h1>Erreur</h1>
          <p>le paramètre <code>code</code> est manquant</p>
          <p>Peut-être que l'API GitLab ne fonctionne plus pareil. Regarder l'API Rest GitLab</p>
        `)
      return;
    }

    const finalRedirectURL = new URL(destination)
    const hostname = finalRedirectURL.hostname

    if(!hostname){
      res.status(400)
        .header('Content-Type', 'text/html')
        .send(htmlTemplate(`
          <h1>Erreur</h1>
          <p>le paramètre <code>destination</code> n'a pas de hostname. (destination : ${destination})</p>
          <p>Rajouter une origine au paramètre <code>destination</code>
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

    const parameters = `client_id=${client_id}&client_secret=${client_secret}&redirect_uri=${oauthAppRedirectURI}&code=${code}&grant_type=authorization_code`
    const urlGitlabOAuth =`${gitlabInstanceOrigin}/oauth/token?${parameters}`

    got.post(urlGitlabOAuth, { json: true }).then(gitlabResponse => {
      const response = JSON.parse(gitlabResponse.body)
      const { access_token, refresh_token, expires_in } = response

      if(!access_token){
        res.status(400)
          .header('Content-Type', 'text/html')
          .send(htmlTemplate`
            <h1>Erreur</h1>
            <p>le <code>access_token</code> attendu de la part de GitLab n'a pas été récupéré</p>
            <p>Peut-être que le fonctionnement de l'API GitLab a changé ou que le code ne le trouve pas au bon endroit</p>
          `)
        return;
      }

      finalRedirectURL.searchParams.set(`access_token`, access_token)
      finalRedirectURL.searchParams.set(`refresh_token`, refresh_token)
      finalRedirectURL.searchParams.set(`expires_in`, expires_in)
      finalRedirectURL.searchParams.set(`state`, state)
      finalRedirectURL.searchParams.set(`type`, 'gitlab')
      finalRedirectURL.searchParams.set(`origin`, gitlabInstanceOrigin)

      res.redirect(302, finalRedirectURL.toString())
    }).catch(e => {
      console.error(e)
      console.error(e.response)
      res.status(502)
        .send(`Error when trying to get a token from gitlab instance ${gitlabInstanceOrigin}. 
          Tried ${urlGitlabOAuth} and got response code ${e.response.statusCode}.
          With message: ${e.response.body}`)
    })
  }
}
