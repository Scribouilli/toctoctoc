import { readFileSync } from 'node:fs'

/**
 *
 * @param {TemplateStringsArray | string} content
 * @returns {string}
 */
export const htmlTemplate = (content) => {
  if(typeof content !== 'string'){
    content = content[0]
  }

  return `<!doctype html>
    <html lang="fr">
        <head>
            <meta charset="utf-8">
            <link rel="icon" href="data:,">
            <meta name="viewport" content="width=device-width, initial-scale=1">

            <title>Serveur toctoctoc</title>

            <meta name="referrer" content="no-referrer">
            <style>body{width: 60%; margin: 1rem auto;}</style>
        </head>
        <body>
          ${content}
        </body>
    </html>`
}

export const allowlist = new Set(
  readFileSync('./allowlist.csv', {encoding: 'utf8'}).split('\n').map(s => s.trim()).filter(x => !!x)
)
