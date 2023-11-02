import got from 'got'

import { htmlTemplate, allowlist } from './tools.js'

/**
 * @param {string} client_id
 * @param {string} client_secret
 */
export const onGitlabCallback = (client_id, client_secret, origin) => {
  // @ts-ignore
  return (req, res) => {
    const {code, destination, state} = req.query

    if(!code){
      res.status(400)
        .header('Content-Type', 'text/html')
        .send(htmlTemplate`
          <h1>Erreur</h1>
          <p>le paramètre <code>code<code> est manquant</p>
          <p>Peut-être que l'API GitLab ne fonctionne plus pareil. Regarder l'API Rest GitLab</p>
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
          <p>le paramètre <code>destination<code> n'a pas de hostname. (destination : ${destination})</p>
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

    const parameters = `client_id=${client_id}&client_secret=${client_secret}&code=${code}&grant_type=authorization_code&redirect_uri=${origin}/gitlab-callback?destination=${destination}`
    const urlGitlabOAuth =`https://gitlab.com/oauth/token?${parameters}`

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

      redirectUrl.searchParams.set(`access_token`, access_token)
      redirectUrl.searchParams.set(`refresh_token`, refresh_token)
      redirectUrl.searchParams.set(`expires_in`, expires_in)
      redirectUrl.searchParams.set(`state`, state)

      res.redirect(302, redirectUrl.toString())
    }).catch(e => {
      console.error(e)
      console.error(e.response)
      res.status(500)
    })
  }
}
