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
 * @typedef {Object} TokenOauthServiceConfiguration
 * @property {string} user_token
 */


/**
 * @typedef {Object} SpecificGitlabOauthServiceConfiguration
 * @property {string} origin
 * @property {string} redirect_uri
 */

/**
 * @typedef {BaseOauthServiceConfiguration & SpecificGitlabOauthServiceConfiguration} GitlabOauthServiceConfiguration
 */
