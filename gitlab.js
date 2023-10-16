import got from 'got'

import { htmlTemplate, allowlist } from './tools.js'

export const onGitlabCallback = (client_id, client_secret) => (req, res) => {
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

  // TODO check if we can pass destination?
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

  const parameters = `client_id=${client_id}&client_secret=${client_secret}&code=${code}&grant_type=authorization_code&redirect_uri=http://localhost:4000/gitlab-callback?destination=${destination}`
  const urlGitlabOAuth =`https://gitlab.com/oauth/token?${parameters}`

  got.post(urlGitlabOAuth, { json: true }).then(gitlabResponse => {
    const access_token = JSON.parse(gitlabResponse.body).access_token

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
  }).catch(e => {
    console.error(e)
    console.error(e.response)
    res.status(500)
  })
}