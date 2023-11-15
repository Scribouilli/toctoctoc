import './types.js'

/**
 * Adapté depuis une génération par ChatGPT à partir de la définition des types.
 * I regret nothing
 */

/**
 * Vérifie si un objet est une instance de ToctoctocOauthServicesConfiguration.
 * @param {any} obj - L'objet à vérifier.
 * @returns {obj is import('./types.js').ToctoctocOauthServicesConfiguration} - True si l'objet est une instance de ToctoctocOauthServicesConfiguration, sinon false.
 */
export function isToctoctocOauthServicesConfiguration(obj) {
    return (
      typeof obj === 'object' &&
      (obj.github === undefined || isGithubOauthServiceConfiguration(obj.github)) &&
      (obj.gitlab === undefined || (Array.isArray(obj.gitlab) && obj.gitlab.every(isGitlabOauthServiceConfiguration)))
    );
  }
  
  /**
   * Vérifie si un objet est une instance de BaseOauthServiceConfiguration.
   * @param {any} obj - L'objet à vérifier.
   * @returns {obj is import('./types.js').BaseOauthServiceConfiguration} - True si l'objet est une instance de BaseOauthServiceConfiguration, sinon false.
   */
  function isBaseOauthServiceConfiguration(obj) {
    return (
      typeof obj === 'object' &&
      typeof obj.client_id === 'string' &&
      typeof obj.client_secret === 'string'
    );
  }
  
  /**
   * Vérifie si un objet est une instance de GithubOauthServiceConfiguration.
   * @param {any} obj - L'objet à vérifier.
   * @returns {obj is import('./types.js').GithubOauthServiceConfiguration} - True si l'objet est une instance de GithubOauthServiceConfiguration, sinon false.
   */
  function isGithubOauthServiceConfiguration(obj) {
    return isBaseOauthServiceConfiguration(obj);
  }
  
  /**
   * Vérifie si un objet est une instance de GitlabOauthServiceConfiguration.
   * @param {any} obj - L'objet à vérifier.
   * @returns {obj is import('./types.js').GitlabOauthServiceConfiguration} - True si l'objet est une instance de GitlabOauthServiceConfiguration, sinon false.
   */
  function isGitlabOauthServiceConfiguration(obj) {
    // @ts-ignore
    return isBaseOauthServiceConfiguration(obj) && typeof obj.origin === 'string' && typeof obj.redirect_uri === 'string';
  }