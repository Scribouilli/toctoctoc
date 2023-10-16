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


    redirectUrl.searchParams.set(`access_token`, access_token)
    res.redirect(302, redirectUrl.toString())
  }).catch(e => {
    console.error(e)
    console.error(e.response)
    res.status(500)
  })
}
