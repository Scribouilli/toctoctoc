# toctoctoc

This project is a generic server to connect to github (soon gitlab) via oauth.

After having logged in with github, this server forward everything useful (secret token) to the client-side. From there, the client-side code communicates directly with github without intermediaries (because github has CORS headers open and allows for these sorts of interactions)

The typical workflow goes like this:
- go to `useful-service.com`
    - this website contains a "login with github" button leading to `https://github.com/login/oauth/authorize?client_id=${client_id}&scope=${scope}` (each different `useful-service.com` can customize the `scope` part of this link to ask only for the needed rights)
- on github.com, the user shares rights with "File-moi les clefs" (we need a better name)
- the "File-moi les clefs" hands the keys back to `useful-service.com`
    - `useful-service.com` probably stores the keys in `localStorage` or equivalent
- from there, the client-side of `useful-service.com` makes direct calls to `github.com`


## Benefits of this approach

1) This approach enables a client-side-only application to have an identity and private/personal storage associated to it without having to implement any of it. This reduces the cost and hassle of writing an application with private data

Github was a first choice to make it easy to prove the viability of the approach, but of course, it's a limited choice.\
We plan on implementing the same for gitlab (both gitlab.com and self-hosted gitlab instances). And maybe one day ActivityPub-compatible identities...

2) A single server for different applications

3) no server-side code


## Security

The only thing this server has to protect is the credentials received from github (secret token)

Aside from adhering to POLA practices, this server has very little to do, so little to protect and it's good this way\
It does not keep trace of the token after having sent them to their destination. 
One risk is a man-in-the-middle attack, but **well-configured HTTPS takes care of this easily**

The only remaining risk probably comes from a complete take-over of the server via a remote-code execution (RCE) or complete system take-over. This could happen in the following ways:
- hardware-access attack (backdoor or direct malicious access to hardware)
- (i haven't studied it, but probably DNS-based attacks)
- exploitation of a known RCE vulnerability in the operating system (and probably network stack specifically)
- exploitation of a known RCE vulnerability in a dependency
    - node.js itself
    - in a dependency itself
    - or via a supply-chain attack

another important piece of the security puzzle are the various `useful-service.com` services themselves who **need HTTPS and to make sure what's stored in the local storage is secure** (so only highly-trusted third-party scripts, CSP, etc.)

An important note is that the different `useful-service.com` services are isolated from one another

For the most part, the boring aspect of the project (accounting data from very small companies), HTTPS and up-to-date dependencies (OS, node.js and package.json dependencies) should probably keep things safe fairly easily


## How it works for Github

1. Create a [Github Oauth app](https://developer.github.com/apps/building-oauth-apps/creating-an-oauth-app/)

2. Set environment variables:
    - `GITHUB_OAUTH_APP_CLIENT_ID`: Github app oauth client id
    - `GITHUB_OAUTH_APP_CLIENT_SECRET`: Github app oauth secret id
    - `PORT`: Port this server will listen to
    - `HOST`: Host this server will listen to

    or put them in an `.env` file.


## URLs

- `/github-callback`: route for github to redirect to as redirect url
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

## Manual installation

**Be sure you've created an Oauth app on your Github account and created an .env file accordingly.**

You need to install [Node.js](https://nodejs.org/en/download/) first

1. Clone the repository
```sh
git clone git@github.com:Scribouilli/file-moi-les-clefs.git
```

2. Install dependencies
```sh
npm install
```

3. Set config in `.env` file (see above)  


4. Start the server. It will listen on the chosen port defined in your .env file.

```sh
npm start
```
