/**
 * @typedef {Object} ToctoctocOauthServicesConfiguration
 * @property {GithubOauthServiceConfiguration} [github]
 * @property {GitlabOauthServiceConfiguration[]} [gitlab]
 */

/**
 * @typedef {Object} BaseOauthServiceConfiguration
 * @property {string} client_id
 * @property {string} client_secret
 */

/**
 * @typedef {BaseOauthServiceConfiguration} GithubOauthServiceConfiguration
 */

/**
 * @typedef {BaseOauthServiceConfiguration & {origin: string}} GitlabOauthServiceConfiguration
 */
