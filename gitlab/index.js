import got from 'got'

export const onGitlabCallback = (client_id, client_secret) => (req, res) => {
  // @ts-ignore
  const {code, destination} = req.query

  const redirectUrl = new URL(destination)
  const hostname = redirectUrl.hostname

  const parameters = `client_id=${client_id}&client_secret=${client_secret}&code=${code}&grant_type=authorization_code&redirect_uri=http://localhost:4000/gitlab-callback?destination=${destination}`
  const urlGitlabOAuth =`https://gitlab.com/oauth/token?${parameters}`

  got.post(urlGitlabOAuth, { json: true }).then(gitlabResponse => {
    const access_token = JSON.parse(gitlabResponse.body).access_token

    // if(!access_token){
      // res.status(400)
        // .header('Content-Type', 'text/html')
        // .send(`<!doctype html>
          // <html lang="fr">
              // <head>
                  // <meta charset="utf-8">
                  // <link rel="icon" href="data:,">
                  // <meta name="viewport" content="width=device-width, initial-scale=1">

                  // <title>Serveur toctoctoc</title>

                  // <meta name="referrer" content="no-referrer">
                  // <style>body{width: 60%; margin: 1rem auto;}</style>
              // </head>
              // <body>
            // <h1>Erreur</h1>
            // <p>le <code>access_token</code> attendu de la part de GitLab n'a pas été récupéré</p>
            // <p>Peut-être que le fonctionnement de l'API github a changé ou que le code ne le trouve pas au bon endroit</p>
                // </body>
            // </html>
        // `)
      // return;
    // }

    redirectUrl.searchParams.set(`access_token`, access_token)
    res.redirect(302, redirectUrl.toString())
  }).catch(e => {
    console.error(e)
    console.error(e.response)
    res.status(500)
  })
}
