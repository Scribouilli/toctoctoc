# File-moi les clefs (hand me the keys)

- Create a [Github Oauth app](https://developer.github.com/apps/building-oauth-apps/creating-an-oauth-app/)

## URLs

- `/gh-callback`: hardcoded route for github to redirect to as redirect url
- `/receive-token`: example web page that receives the github access token
- any other page: shows a link to "login with github"

## Deploy to heroku

1. [Create an heroku app](https://devcenter.heroku.com/articles/git#creating-a-heroku-remote)

```sh
heroku create
```

2. [Configure](https://devcenter.heroku.com/articles/config-vars) `GITHUB_ID` and `GITHUB_SECRET`:
```sh
heroku config:set GITHUB_ID=<github oauth app cliend_id>
heroku config:set GITHUB_SECRET=<github oauth app cliend_secret>
```

3. [Push the code to the heroku](https://devcenter.heroku.com/articles/git)

```sh
git push heroku master 
```

4. [Save the environment variables](https://devcenter.heroku.com/articles/heroku-local#copy-heroku-config-vars-to-your-local-env-file) so they work locally

```sh
heroku config -s > .env
```

## [Locally (dev)](https://devcenter.heroku.com/articles/heroku-local#run-your-app-locally-using-the-heroku-local-command-line-tool)

```sh
npm start # heroku local
```