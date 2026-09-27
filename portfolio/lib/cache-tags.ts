/**
 * Tags de cache compartilhadas.
 *
 * Vivem fora de qualquer arquivo `"use server"` de proposito: um modulo com essa
 * diretiva so pode exportar funcoes async, entao uma constante declarada la nao
 * pode ser importada por uma Route Handler. Sem este arquivo, a action de perfil
 * e a rota de avatar acabariam com duas copias da mesma string.
 */

/** Entrada de `unstable_cache` do perfil publico (getProfileByUsername). */
export const PROFILE_CACHE_TAG = "profile-by-username";
