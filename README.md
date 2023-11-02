# Toctoctoc

This project is a generic server to connect to a OAuth identity service.
Currently, the implemented services are GitHub and GitLab through `gitlab.com`.

After having logged in with the service, this server forwards everything useful
(secret token, refresh token if necessary) to the client-side. From there, the
client-side code communicates directly with the service without intermediaries.
This is possible with the implemented services (GitHub, GitLab) because they have
CORS headers open on many API endpoints.

- [Workflow example](#workflow-example)
- [How to install toctoctoc](#how-to-install-toctoctoc)
- [How to use your toctoctoc server](#how-to-use-your-toctoctoc-server)
- [Endpoints](#endpoints)
- [Benefits of this approach](#benefits-of-this-approach)
- [Security](#security)

## Workflow example

Let's say you have a client application. You want your users to be able to
connect with GitHub and use their GitHub identity to communicate with Github
(for instance, committing stuff on one of their repository).

The typical workflow would go like this:
- The users go on `your-client-application.com`.
- They click on a "Login with GitHub" button. The link of this button would
  look like this:
  `https://github.com/login/oauth/authorize?client_id=${client_id}&scope=${scope}&redirect_uri=${redirect_uri}`
- On `github.com`, they share rights with your toctoctoc GitHub OAuth application.
- They are redirected to their `destination` (see below for more instruction),
  usually `your-client-application.com`.
  Through this redirection, the toctoctoc server returns a GitHub
  `access_token` to the client application.
- From there, the client application can store the `access_token` (for instance,
    in `localStorage`) and makes direct calls to `github.com`.

You can also set it up for GitLab if you need it.

## How to install toctoctoc

### 1 - Prerequisites

- You need to install [Node.js](https://nodejs.org/en/download/).
- A URL to access your toctoctoc server. It can be `http://localhost:[port]` on
  a development environment or a domain that points to your toctoctoc server.

### 2 - Create an OAuth application

Create an OAuth application for the service you want to handle with the server:
- A [GitHub OAuth app](https://developer.github.com/apps/building-oauth-apps/creating-an-oauth-app/):
  for the `Authorization callback URL`, use the endpoint provided by your
  toctoctoc server: `[your-toctoctoc-server-URL]/github-callback`.
- And/or a [GitLab OAuth app](https://docs.gitlab.com/ee/integration/oauth_provider.html):
  for the `Callback URL`, use the endpoint provided by your toctoctoc server:
  `[your-toctoctoc-server-URL]/gitlab-callback`.

### 3 - Install the server

Clone the repository
```sh
git clone git@github.com:Scribouilli/toctoctoc.git
```

Install dependencies
```sh
npm install
```

### 4 - Setup the environment variables

You need to fill the client id and client secret of at least one service.

- `GITHUB_OAUTH_APP_CLIENT_ID`: GitHub OAuth application client id.
- `GITHUB_OAUTH_APP_CLIENT_SECRET`: GitHub OAuth application client secret.
- `GITLAB_OAUTH_APP_CLIENT_ID`: GitLab OAuth application id.
- `GITLAB_OAUTH_APP_CLIENT_SECRET`: GitLab OAuth application secret.
- `PORT`: The port this server will listen to. By default, it's `4000`.
- `HOST`: The host this server will listen to. By default, it's `localhost`.
- `ORIGIN`: The [web content's origin](https://developer.mozilla.org/en-US/docs/Glossary/Origin)
  of your toctoctoc server. It is defined by the protocol, the
  hostname and the port of the URL you use to access your toctoctoc server. (eg.
  `http://localhost:4000`)

You can put these environment variables in an `.env` file.

### 5 - Start the server

**You need to setup at least one service to use toctoctoc properly. Be
sure that your OAuth application is setup correctly and your environment
variables too.**

Start the server. It will listen on the chosen port defined in your
`.env` file.

```sh
npm start
```

## How to use your toctoctoc server

On your client application, you have to authenticate your users through one of
the services (GitHub or GitLab) and configure this authentication to use
it with your toctoctoc server.

### With GitHub

You [request a user's GitHub identity](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps#1-request-a-users-github-identity)
through this endpoint:
```
https://github.com/login/oauth/authorize
```

To use it with toctoctoc, the mandatory parameters are:
- `client_id`: it's the `client_id` provided by your GitHub OAuth application
  for toctoctoc.
- `scope`: the scope you want to ask for the needed rights, for example
  `public_repo,user:email`.
- `redirect_uri`: it's the endpoint provided by your toctoctoc server for
  GitHub that ends like `/github-callback`. This `redirect_uri` must have a
  `destination` parameter filled with ah URL: it enables toctoctoc to know
  where to redirect the user after fetching the `access_token`.

Here is an example of link to let your users to authenticate through GitHub and
retrieve an `access_token` with your toctoctoc server:
```html
<a
 href="https://github.com/login/oauth/authorize?client_id=XXXXXX&scope=public_repo,user:email&redirect_uri=http://my-toctoctoc-server-host.com/github-callback?destination=http://my-client-application.com"
>
  Login with GitHub 🍂
</a>
```

You can check [GitHub's available scopes](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/scopes-for-oauth-apps)
to only ask for the rights you need.

### With GitLab

You [request a GitLab authorization code](https://docs.gitlab.com/ee/api/oauth2.html#authorization-code-flow)
through this endpoint:
```
https://gitlab.com/oauth/authorize
```

To use it with toctoctoc, the mandatory parameters are:
- `client_id`: it's the `client_id` provided by your GitHub OAuth application
  for toctoctoc.
- `response_type`: `code`.
- `state` : a value that can’t be predicted, used by you to maintain state
  between the request to GitLab and the callback on your client application.
- `scope`: the scope you want to ask for the needed rights, for example
  `read_repository+write_repository+email`.
- `redirect_uri`: it's the endpoint provided by your toctoctoc server for
  GitHub that ends like `/gitlab-callback`. This `redirect_uri` must have a
  `destination` parameter filled with ah URL: it enables toctoctoc to know
  where to redirect the user after fetching the `access_token` and the
  `refresh_token`.

Here is an example of a link to let your users authenticate through GitLab and
retrieve an `access_token` with your toctoctoc server:

```html
<a
  href="https://gitlab.com/oauth/authorize?client_id=XXXXXX&redirect_uri=http://my-toctoctoc-server-host.com/gitlab-callback?destination=http://my-client-application.com&response_type=code&state=XXXXXX&scope=read_repository+write_repository+email"
>
  Login with GitLab 🍃
</a>
```

Along with the `access_token`, some other parameters are returned with the
`destination` URL after the GitLab authentication:
- `refresh_token`: a token used to ask for a new GitLab OAuth token (check the
  section below for more information).
- `expires_in`: the validity of the `access_token` in milliseconds.
- `state` : the value you provided to maintain state
  between the request to GitLab and the callback on your client application.

You can check [GitLab's available scopes](https://docs.gitlab.com/ee/integration/oauth_provider.html#view-all-authorized-applications)
to only ask for the rights you need.

#### Token expiration

GitLab access tokens expire after two hours. On your client application, after
maximum two hours, you have to generate a new
`access_token` using the `refresh_token` attribute following the third step of
[this documentation](https://docs.gitlab.com/ee/api/oauth2.html#authorization-code-flow).

## Endpoints

This server provides the following endpoints for you to use with your
service OAuth application:

- `/github-callback`: route for GitHub to redirect to as redirect URL.
- `/gitlab-callback`: route for GitLab to redirect to as a redirect URL.

## Benefits of this approach

1) This approach enables a client-side-only application to have an identity and private/personal storage associated to it without having to implement any of it. This reduces the cost and hassle of writing an application with private data

GitHub was a first choice to make it easy to prove the viability of the approach, but of course, it's a limited choice.\
We plan on implementing the same for gitlab (both gitlab.com and self-hosted gitlab instances). And maybe one day ActivityPub-compatible identities...

2) A single server for different applications

3) no server-side code


## Security

The only thing this server has to protect are the credentials received from the services (for example GitHub's secret token).

Aside from adhering to [POLA](# "Principle of least authority") practices, this server has very little to do, so little to protect and it's good this way.\
It does not keep trace of the token after having sent it to their destination.
One risk is a man-in-the-middle attack, but **well-configured HTTPS takes care of this easily**.

The only remaining risk probably comes from a complete take-over of the server via a remote-code execution (RCE) or complete system take-over. This could happen in the following ways:
- hardware-access attack (backdoor or direct malicious access to hardware)
- (I haven't studied it, but probably DNS-based attacks)
- exploitation of a known RCE vulnerability in the operating system (and probably network stack specifically)
- exploitation of a known RCE vulnerability in a dependency
    - node.js itself
    - in a dependency itself
    - or via a supply-chain attack

Another important piece of the security puzzle are the various `your-client-application.com` services themselves who **need HTTPS and to make sure what's stored in the local storage is secure** (so only highly-trusted third-party scripts, CSP, etc.)

An important note is that the different `your-client-application.com` services are isolated from one another.

For the most part, the boring aspect of the project (accounting data from very small companies), HTTPS and up-to-date dependencies (OS, node.js and package.json dependencies) should probably keep things safe fairly easily.

