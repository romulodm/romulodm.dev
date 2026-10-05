/**
 * Cookie com a preferencia da sidebar do admin ("collapsed" | "expanded").
 * Fica fora do AdminShell ('use client') porque o layout, que e Server
 * Component, precisa do valor real da string e nao de uma client reference.
 * Lido no servidor para a pagina ja nascer com a largura certa, sem a sidebar
 * "pulando" depois da hidratacao.
 */
export const ADMIN_SIDEBAR_COOKIE = 'admin_sidebar'
