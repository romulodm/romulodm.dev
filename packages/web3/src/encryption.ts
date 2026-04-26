import nacl from 'tweetnacl'
import { encodeBase64, decodeBase64 } from 'tweetnacl-util'

export function encryptMessage(plaintext: string, serverPublicKeyB64: string): string {
    const serverPubKey = decodeBase64(serverPublicKeyB64)
    const ephemeral = nacl.box.keyPair()
    const nonce = nacl.randomBytes(nacl.box.nonceLength)

    // TextEncoder/Decoder — disponíveis em browser e Node 18+
    const messageBytes = new TextEncoder().encode(plaintext)
    const ciphertext = nacl.box(messageBytes, nonce, serverPubKey, ephemeral.secretKey)

    const packed = new Uint8Array(32 + 24 + ciphertext.length)
    packed.set(ephemeral.publicKey, 0)
    packed.set(nonce, 32)
    packed.set(ciphertext, 56)

    return encodeBase64(packed)
}

export function decryptMessage(encryptedB64: string, serverPrivateKeyB64: string): string | null {
    try {
        const packed = decodeBase64(encryptedB64)
        const ephPubKey = packed.slice(0, 32)
        const nonce = packed.slice(32, 56)
        const ciphertext = packed.slice(56)
        const privateKey = decodeBase64(serverPrivateKeyB64)
        const decrypted = nacl.box.open(ciphertext, nonce, ephPubKey, privateKey)

        // TextDecoder — sem depender de tweetnacl-util
        return decrypted ? new TextDecoder().decode(decrypted) : null
    } catch {
        return null
    }
}