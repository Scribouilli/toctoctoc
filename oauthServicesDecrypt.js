//@ts-check

const { subtle } = globalThis.crypto;

/**
 * 
 * @param {string} s 
 * @returns {string}
 */
export function b64ToUTF8(s) {
    console.log('b64ToUTF8', s)
    return decodeURIComponent(escape(atob(s)))
}

/**
 * 
 * @param {string} base64String 
 * @returns {Uint8Array}
 */
export function base64ToUint8Array(base64String){
    const str = b64ToUTF8(base64String)
    return Uint8Array.from(str, char => char.charCodeAt(0))
}

/**
 * 
 * @param {Uint8Array} typedArray 
 * @returns {string}
 */
export function typedArrayToString(typedArray){
    const string = typedArray.reduce((data, byte) => {
        return data + String.fromCharCode(byte)
    }, '')

    return string;
}


/**
 * 
 * @param {string} k 
 * @returns {Promise<CryptoKey>}
 */
export function makeCryptoKey(k){
    return subtle.importKey('raw', base64ToUint8Array(k), "AES-CBC", true, ["encrypt", "decrypt"])
}

/**
 * 
 * @param {string} string 
 * @returns { Promise<{k: CryptoKey, iv: Uint8Array}> }
 */
export async function keyAndIvFromString(string){
    const [k, iv] = string.split('-')

    const key = await makeCryptoKey(k)
    const initializationVector = base64ToUint8Array(iv) 

    return {
        k: key,
        iv: initializationVector
    }
}

/**
 * 
 * @param {string} base64encryptedContent 
 * @param {string} keyWithIV 
 * @returns {Promise<string>}
 */
export async function decryptOauthServicesContent(base64encryptedContent, keyWithIV){
    const {k, iv} = await keyAndIvFromString(keyWithIV)

    const ciphertext = base64ToUint8Array(base64encryptedContent);

    const plaintext = await subtle.decrypt(
        {
            name: "AES-CBC",
            iv
        },
        k,
        ciphertext
    );

    return typedArrayToString(new Uint8Array(plaintext))
}