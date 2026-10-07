import type { CSSProperties } from "react"

import { useTranslations } from "next-intl"

import BlogList from "@/components/sections/posts/BlogList"

type Logo = {
    name: string
    src?: string           // simpleicons CDN URL
    srcDark?: string       // dark variant (simpleicons CDN URL)
    svgLight?: string      // inline SVG string for light mode (no simpleicons entry)
    svgDark?: string       // inline SVG string for dark mode
}

// ─── Inline SVGs for icons not in simpleicons v16 ────────────────────────────

// AWS — official wordmark (devicon). The "aws" lettering is dark navy, so
// the dark-mode copy swaps it to white; the orange smile stays the same.
const SVG_AWS_LIGHT = `<svg viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg">
  <path fill="#252f3e" d="M36.379 53.64c0 1.56.168 2.825.465 3.75.336.926.758 1.938 1.347 3.032.207.336.293.672.293.969 0 .418-.254.84-.8 1.261l-2.653 1.77c-.379.25-.758.379-1.093.379-.422 0-.844-.211-1.266-.59a13.28 13.28 0 0 1-1.516-1.98 34.153 34.153 0 0 1-1.304-2.485c-3.282 3.875-7.41 5.813-12.38 5.813-3.535 0-6.355-1.012-8.421-3.032-2.063-2.023-3.114-4.718-3.114-8.086 0-3.578 1.262-6.484 3.833-8.671 2.566-2.192 5.976-3.286 10.316-3.286 1.43 0 2.902.125 4.46.336 1.56.211 3.161.547 4.845.926v-3.074c0-3.2-.676-5.43-1.98-6.734C26.061 32.633 23.788 32 20.546 32c-1.473 0-2.988.168-4.547.547a33.416 33.416 0 0 0-4.547 1.433c-.676.293-1.18.461-1.473.547-.296.082-.507.125-.675.125-.59 0-.883-.422-.883-1.304v-2.063c0-.676.082-1.18.293-1.476.21-.293.59-.586 1.18-.883 1.472-.758 3.242-1.39 5.304-1.895 2.063-.547 4.254-.8 6.57-.8 5.008 0 8.672 1.136 11.032 3.41 2.316 2.273 3.492 5.726 3.492 10.359v13.64Zm-17.094 6.403c1.387 0 2.82-.254 4.336-.758 1.516-.508 2.863-1.433 4-2.695.672-.8 1.18-1.684 1.43-2.695.254-1.012.422-2.23.422-3.665v-1.765a34.401 34.401 0 0 0-3.871-.719 31.816 31.816 0 0 0-3.961-.25c-2.82 0-4.883.547-6.274 1.684-1.387 1.136-2.062 2.734-2.062 4.84 0 1.98.504 3.453 1.558 4.464 1.012 1.051 2.485 1.559 4.422 1.559Zm33.809 4.547c-.758 0-1.262-.125-1.598-.422-.34-.254-.633-.84-.887-1.64L40.715 29.98c-.25-.843-.38-1.39-.38-1.687 0-.672.337-1.05 1.013-1.05h4.125c.8 0 1.347.124 1.644.421.336.25.59.84.84 1.64l7.074 27.876 6.57-27.875c.208-.84.462-1.39.797-1.64.34-.255.93-.423 1.688-.423h3.367c.8 0 1.348.125 1.684.422.336.25.633.84.8 1.64l6.653 28.212 7.285-28.211c.25-.84.547-1.39.84-1.64.336-.255.887-.423 1.644-.423h3.914c.676 0 1.055.336 1.055 1.051 0 .21-.043.422-.086.676-.043.254-.125.59-.293 1.05L80.801 62.57c-.254.84-.547 1.387-.887 1.64-.336.255-.883.423-1.598.423h-3.62c-.801 0-1.348-.13-1.684-.422-.34-.297-.633-.844-.801-1.684l-6.527-27.16-6.485 27.117c-.21.844-.46 1.391-.8 1.684-.337.297-.926.422-1.684.422Zm54.105 1.137c-2.187 0-4.379-.254-6.484-.758-2.106-.504-3.746-1.055-4.84-1.684-.676-.379-1.137-.8-1.305-1.18a2.919 2.919 0 0 1-.254-1.18v-2.148c0-.882.336-1.304.97-1.304.25 0 .503.043.757.129.25.082.629.25 1.05.418a23.102 23.102 0 0 0 4.634 1.476c1.683.336 3.324.504 5.011.504 2.653 0 4.715-.465 6.145-1.39 1.433-.926 2.191-2.274 2.191-4 0-1.18-.379-2.145-1.136-2.946-.758-.8-2.192-1.516-4.254-2.191l-6.106-1.895c-3.074-.969-5.348-2.398-6.734-4.293-1.39-1.855-2.106-3.918-2.106-6.105 0-1.77.38-3.328 1.137-4.676a10.829 10.829 0 0 1 3.031-3.453c1.262-.965 2.696-1.684 4.38-2.188 1.683-.504 3.452-.715 5.304-.715.926 0 1.894.043 2.82.168.969.125 1.852.293 2.738.461.84.211 1.641.422 2.399.676.758.254 1.348.504 1.77.758.59.336 1.011.672 1.261 1.05.254.34.379.802.379 1.391v1.98c0 .884-.336 1.348-.969 1.348-.336 0-.883-.171-1.597-.507-2.403-1.094-5.098-1.641-8.086-1.641-2.399 0-4.293.379-5.598 1.18-1.309.797-1.98 2.02-1.98 3.746 0 1.18.421 2.191 1.261 2.988.844.8 2.403 1.602 4.633 2.316l5.98 1.895c3.032.969 5.22 2.316 6.524 4.043 1.305 1.727 1.938 3.707 1.938 5.895 0 1.812-.38 3.453-1.094 4.882-.758 1.434-1.77 2.696-3.074 3.707-1.305 1.051-2.864 1.809-4.672 2.36-1.895.586-3.875.883-6.024.883Zm0 0"/>
  <path fill="#f90" d="M118 73.348c-4.432.063-9.664 1.052-13.621 3.832-1.223.883-1.012 2.062.336 1.894 4.508-.547 14.44-1.726 16.21.547 1.77 2.23-1.976 11.62-3.663 15.79-.504 1.26.59 1.769 1.726.8 7.41-6.231 9.348-19.242 7.832-21.137-.757-.925-4.388-1.79-8.82-1.726zM1.63 75.859c-.927.116-1.347 1.236-.368 2.121 16.508 14.902 38.359 23.872 62.613 23.872 17.305 0 37.43-5.43 51.281-15.66 2.273-1.688.297-4.254-2.02-3.204-15.534 6.57-32.421 9.77-47.788 9.77-22.778 0-44.8-6.273-62.653-16.633-.39-.231-.755-.304-1.064-.266z"/>
</svg>`
const SVG_AWS_DARK = `<svg viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg">
  <path fill="#ffffff" d="M36.379 53.64c0 1.56.168 2.825.465 3.75.336.926.758 1.938 1.347 3.032.207.336.293.672.293.969 0 .418-.254.84-.8 1.261l-2.653 1.77c-.379.25-.758.379-1.093.379-.422 0-.844-.211-1.266-.59a13.28 13.28 0 0 1-1.516-1.98 34.153 34.153 0 0 1-1.304-2.485c-3.282 3.875-7.41 5.813-12.38 5.813-3.535 0-6.355-1.012-8.421-3.032-2.063-2.023-3.114-4.718-3.114-8.086 0-3.578 1.262-6.484 3.833-8.671 2.566-2.192 5.976-3.286 10.316-3.286 1.43 0 2.902.125 4.46.336 1.56.211 3.161.547 4.845.926v-3.074c0-3.2-.676-5.43-1.98-6.734C26.061 32.633 23.788 32 20.546 32c-1.473 0-2.988.168-4.547.547a33.416 33.416 0 0 0-4.547 1.433c-.676.293-1.18.461-1.473.547-.296.082-.507.125-.675.125-.59 0-.883-.422-.883-1.304v-2.063c0-.676.082-1.18.293-1.476.21-.293.59-.586 1.18-.883 1.472-.758 3.242-1.39 5.304-1.895 2.063-.547 4.254-.8 6.57-.8 5.008 0 8.672 1.136 11.032 3.41 2.316 2.273 3.492 5.726 3.492 10.359v13.64Zm-17.094 6.403c1.387 0 2.82-.254 4.336-.758 1.516-.508 2.863-1.433 4-2.695.672-.8 1.18-1.684 1.43-2.695.254-1.012.422-2.23.422-3.665v-1.765a34.401 34.401 0 0 0-3.871-.719 31.816 31.816 0 0 0-3.961-.25c-2.82 0-4.883.547-6.274 1.684-1.387 1.136-2.062 2.734-2.062 4.84 0 1.98.504 3.453 1.558 4.464 1.012 1.051 2.485 1.559 4.422 1.559Zm33.809 4.547c-.758 0-1.262-.125-1.598-.422-.34-.254-.633-.84-.887-1.64L40.715 29.98c-.25-.843-.38-1.39-.38-1.687 0-.672.337-1.05 1.013-1.05h4.125c.8 0 1.347.124 1.644.421.336.25.59.84.84 1.64l7.074 27.876 6.57-27.875c.208-.84.462-1.39.797-1.64.34-.255.93-.423 1.688-.423h3.367c.8 0 1.348.125 1.684.422.336.25.633.84.8 1.64l6.653 28.212 7.285-28.211c.25-.84.547-1.39.84-1.64.336-.255.887-.423 1.644-.423h3.914c.676 0 1.055.336 1.055 1.051 0 .21-.043.422-.086.676-.043.254-.125.59-.293 1.05L80.801 62.57c-.254.84-.547 1.387-.887 1.64-.336.255-.883.423-1.598.423h-3.62c-.801 0-1.348-.13-1.684-.422-.34-.297-.633-.844-.801-1.684l-6.527-27.16-6.485 27.117c-.21.844-.46 1.391-.8 1.684-.337.297-.926.422-1.684.422Zm54.105 1.137c-2.187 0-4.379-.254-6.484-.758-2.106-.504-3.746-1.055-4.84-1.684-.676-.379-1.137-.8-1.305-1.18a2.919 2.919 0 0 1-.254-1.18v-2.148c0-.882.336-1.304.97-1.304.25 0 .503.043.757.129.25.082.629.25 1.05.418a23.102 23.102 0 0 0 4.634 1.476c1.683.336 3.324.504 5.011.504 2.653 0 4.715-.465 6.145-1.39 1.433-.926 2.191-2.274 2.191-4 0-1.18-.379-2.145-1.136-2.946-.758-.8-2.192-1.516-4.254-2.191l-6.106-1.895c-3.074-.969-5.348-2.398-6.734-4.293-1.39-1.855-2.106-3.918-2.106-6.105 0-1.77.38-3.328 1.137-4.676a10.829 10.829 0 0 1 3.031-3.453c1.262-.965 2.696-1.684 4.38-2.188 1.683-.504 3.452-.715 5.304-.715.926 0 1.894.043 2.82.168.969.125 1.852.293 2.738.461.84.211 1.641.422 2.399.676.758.254 1.348.504 1.77.758.59.336 1.011.672 1.261 1.05.254.34.379.802.379 1.391v1.98c0 .884-.336 1.348-.969 1.348-.336 0-.883-.171-1.597-.507-2.403-1.094-5.098-1.641-8.086-1.641-2.399 0-4.293.379-5.598 1.18-1.309.797-1.98 2.02-1.98 3.746 0 1.18.421 2.191 1.261 2.988.844.8 2.403 1.602 4.633 2.316l5.98 1.895c3.032.969 5.22 2.316 6.524 4.043 1.305 1.727 1.938 3.707 1.938 5.895 0 1.812-.38 3.453-1.094 4.882-.758 1.434-1.77 2.696-3.074 3.707-1.305 1.051-2.864 1.809-4.672 2.36-1.895.586-3.875.883-6.024.883Zm0 0"/>
  <path fill="#f90" d="M118 73.348c-4.432.063-9.664 1.052-13.621 3.832-1.223.883-1.012 2.062.336 1.894 4.508-.547 14.44-1.726 16.21.547 1.77 2.23-1.976 11.62-3.663 15.79-.504 1.26.59 1.769 1.726.8 7.41-6.231 9.348-19.242 7.832-21.137-.757-.925-4.388-1.79-8.82-1.726zM1.63 75.859c-.927.116-1.347 1.236-.368 2.121 16.508 14.902 38.359 23.872 62.613 23.872 17.305 0 37.43-5.43 51.281-15.66 2.273-1.688.297-4.254-2.02-3.204-15.534 6.57-32.421 9.77-47.788 9.77-22.778 0-44.8-6.273-62.653-16.633-.39-.231-.755-.304-1.064-.266z"/>
</svg>`

// Redis — classic stacked-layers logo (devicon). simpleicons only ships the
// 2024 rebrand mark, which is not the one people recognize.
const SVG_REDIS = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"><path fill="#A41E11" d="M121.8 93.1c-6.7 3.5-41.4 17.7-48.8 21.6-7.4 3.9-11.5 3.8-17.3 1S13 98.1 6.3 94.9c-3.3-1.6-5-2.9-5-4.2V78s48-10.5 55.8-13.2c7.8-2.8 10.4-2.9 17-.5s46.1 9.5 52.6 11.9v12.5c0 1.3-1.5 2.7-4.9 4.4z"/><path fill="#D82C20" d="M121.8 80.5C115.1 84 80.4 98.2 73 102.1c-7.4 3.9-11.5 3.8-17.3 1-5.8-2.8-42.7-17.7-49.4-20.9C-.3 79-.5 76.8 6 74.3c6.5-2.6 43.2-17 51-19.7 7.8-2.8 10.4-2.9 17-.5s41.1 16.1 47.6 18.5c6.7 2.4 6.9 4.4.2 7.9z"/><path fill="#A41E11" d="M121.8 72.5C115.1 76 80.4 90.2 73 94.1c-7.4 3.8-11.5 3.8-17.3 1C49.9 92.3 13 77.4 6.3 74.2c-3.3-1.6-5-2.9-5-4.2V57.3s48-10.5 55.8-13.2c7.8-2.8 10.4-2.9 17-.5s46.1 9.5 52.6 11.9V68c0 1.3-1.5 2.7-4.9 4.5z"/><path fill="#D82C20" d="M121.8 59.8c-6.7 3.5-41.4 17.7-48.8 21.6-7.4 3.8-11.5 3.8-17.3 1C49.9 79.6 13 64.7 6.3 61.5s-6.8-5.4-.3-7.9c6.5-2.6 43.2-17 51-19.7 7.8-2.8 10.4-2.9 17-.5s41.1 16.1 47.6 18.5c6.7 2.4 6.9 4.4.2 7.9z"/><path fill="#A41E11" d="M121.8 51c-6.7 3.5-41.4 17.7-48.8 21.6-7.4 3.8-11.5 3.8-17.3 1C49.9 70.9 13 56 6.3 52.8c-3.3-1.6-5.1-2.9-5.1-4.2V35.9s48-10.5 55.8-13.2c7.8-2.8 10.4-2.9 17-.5s46.1 9.5 52.6 11.9v12.5c.1 1.3-1.4 2.6-4.8 4.4z"/><path fill="#D82C20" d="M121.8 38.3C115.1 41.8 80.4 56 73 59.9c-7.4 3.8-11.5 3.8-17.3 1S13 43.3 6.3 40.1s-6.8-5.4-.3-7.9c6.5-2.6 43.2-17 51-19.7 7.8-2.8 10.4-2.9 17-.5s41.1 16.1 47.6 18.5c6.7 2.4 6.9 4.4.2 7.8z"/><path fill="#fff" d="M80.4 26.1l-10.8 1.2-2.5 5.8-3.9-6.5-12.5-1.1 9.3-3.4-2.8-5.2 8.8 3.4 8.2-2.7L72 23zM66.5 54.5l-20.3-8.4 29.1-4.4z"/><ellipse fill="#fff" cx="38.4" cy="35.4" rx="15.5" ry="6"/><path fill="#7A0C00" d="M93.3 27.7l17.2 6.8-17.2 6.8z"/><path fill="#AD2115" d="M74.3 35.3l19-7.6v13.6l-1.9.8z"/></svg>`

// MySQL — blue dolphin-style wordmark
const SVG_MYSQL = `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <text x="50" y="52" font-family="Arial, sans-serif" font-size="22" font-weight="700" text-anchor="middle" fill="#4479A1">MySQL</text>
  <path d="M62 28 Q72 18 80 25 Q88 32 75 40 Q85 42 82 55 Q70 45 62 50 Q58 38 62 28z" fill="#4479A1" opacity="0.85"/>
</svg>`
const SVG_MYSQL_DARK = `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <text x="50" y="52" font-family="Arial, sans-serif" font-size="22" font-weight="700" text-anchor="middle" fill="#5B9BD5">MySQL</text>
  <path d="M62 28 Q72 18 80 25 Q88 32 75 40 Q85 42 82 55 Q70 45 62 50 Q58 38 62 28z" fill="#5B9BD5" opacity="0.85"/>
</svg>`

// PostGIS — elephant head (PostgreSQL) + location pin
const SVG_POSTGIS = `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <ellipse cx="42" cy="54" rx="26" ry="28" fill="#4169E1"/>
  <ellipse cx="42" cy="46" rx="20" ry="18" fill="#6080F0"/>
  <path d="M28 44 Q22 36 26 28 Q30 20 38 24" fill="#4169E1"/>
  <ellipse cx="34" cy="46" rx="4" ry="6" fill="#8090FF" opacity="0.6"/>
  <path d="M42 72 Q36 82 38 90" stroke="#4169E1" stroke-width="4" fill="none" stroke-linecap="round"/>
  <path d="M42 72 Q48 82 46 90" stroke="#4169E1" stroke-width="4" fill="none" stroke-linecap="round"/>
  <circle cx="40" cy="42" r="3" fill="#1a1a2e"/>
  <path d="M42 60 Q55 58 60 46" stroke="#8090FF" stroke-width="2" fill="none" stroke-linecap="round"/>
  <circle cx="72" cy="36" r="14" fill="#27AE60"/>
  <path d="M72 24c-6.627 0-12 4.84-12 10.8 0 8.1 12 21.6 12 21.6s12-13.5 12-21.6C84 28.84 78.627 24 72 24z" fill="#2ECC71"/>
  <circle cx="72" cy="34" r="5" fill="white"/>
</svg>`

// ─── Logo list ────────────────────────────────────────────────────────────────

const logos: Logo[] = [
    // Core frontend
    { name: "React", src: "https://cdn.simpleicons.org/react/61DAFB" },                              // 0
    { name: "Next.js", src: "https://cdn.simpleicons.org/nextdotjs/000000", srcDark: "https://cdn.simpleicons.org/nextdotjs/ffffff" }, // 1
    { name: "Tailwind CSS", src: "https://cdn.simpleicons.org/tailwindcss/06B6D4" },                        // 3
    { name: "TypeScript", src: "https://cdn.simpleicons.org/typescript/3178C6" },
    { name: "Redis", svgLight: SVG_REDIS },                      // 2

    // Backend
    { name: "Node.js", src: "https://cdn.simpleicons.org/nodedotjs/339933" },                          // 5
    { name: "Chainlink", src: "https://cdn.simpleicons.org/chainlink/375BD2" },
    { name: "NestJS", src: "https://cdn.simpleicons.org/nestjs/E0234E" },                             // 6
    { name: "Solidity", src: "https://cdn.simpleicons.org/solidity/363636", srcDark: "https://cdn.simpleicons.org/solidity/aaaaaa" },                        // 10
    { name: "Express", src: "https://cdn.simpleicons.org/express/000000", srcDark: "https://cdn.simpleicons.org/express/ffffff" },   // 7

    // Databases

    { name: "Python", src: "https://cdn.simpleicons.org/python/3776AB" },                             // 9
    { name: "MongoDB", src: "https://cdn.simpleicons.org/mongodb/47A248" },                            // 11
    { name: "Vite", src: "https://cdn.simpleicons.org/vite/646CFF" },                               // 4
    { name: "Stripe", src: "https://cdn.simpleicons.org/stripe/635BFF" },                             // 32
    { name: "TypeORM", src: "https://cdn.simpleicons.org/typeorm/FE0803" },                            // 14
    // 6
    { name: "Go", src: "https://cdn.simpleicons.org/go/00ADD8" },

    // DevOps / infra
    { name: "Nginx", src: "https://cdn.simpleicons.org/nginx/009639" },                               // 19
    { name: "RabbitMQ", src: "https://cdn.simpleicons.org/rabbitmq/FF6600" },                           // 22
    { name: "AWS", svgLight: SVG_AWS_LIGHT, svgDark: SVG_AWS_DARK },                               // 18
    { name: "Git", src: "https://cdn.simpleicons.org/git/F05032" },
    { name: "Apache Kafka", src: "https://cdn.simpleicons.org/apachekafka/231F20", srcDark: "https://cdn.simpleicons.org/apachekafka/ffffff" }, // 23
    { name: "Linux", src: "https://cdn.simpleicons.org/linux/FCC624" },                               // 21

    // Messaging / queues
    { name: "npm", src: "https://cdn.simpleicons.org/npm/CB3837" },                                 // 22
    { name: "Ethereum", src: "https://cdn.simpleicons.org/ethereum/3C3C3D", srcDark: "https://cdn.simpleicons.org/ethereum/9ca3af" },   // 27
    { name: "Claude Code", src: "https://cdn.simpleicons.org/claudecode/D97757" },                  // 24
    { name: "MQTT", src: "https://cdn.simpleicons.org/mqtt/660066" },                               // 25

    // Blockchain / Web3
    { name: "PostgreSQL", src: "https://cdn.simpleicons.org/postgresql/4169E1" },
    { name: "FastAPI", src: "https://cdn.simpleicons.org/fastapi/009688" },                          // 27
    { name: "GitHub Actions", src: "https://cdn.simpleicons.org/githubactions/2088FF" },             // 28
    { name: "Raspberry Pi", src: "https://cdn.simpleicons.org/raspberrypi/A22846" },
    { name: "Web3.js", src: "https://cdn.simpleicons.org/web3dotjs/F16822" },                         // 30

    // Tooling / other
    { name: "GraphQL", src: "https://cdn.simpleicons.org/graphql/E10098" },
    { name: "Prisma", src: "https://cdn.simpleicons.org/prisma/2D3748", srcDark: "https://cdn.simpleicons.org/prisma/a0aec0" },    // 13
    // 31
    { name: "Arduino", src: "https://cdn.simpleicons.org/arduino/00979D" },                            // 33
    { name: "Three.js", src: "https://cdn.simpleicons.org/threedotjs/000000", srcDark: "https://cdn.simpleicons.org/threedotjs/ffffff" }, // 34
    { name: "Postman", src: "https://cdn.simpleicons.org/postman/FF6C37" },                            // 35
    { name: "Flask", src: "https://cdn.simpleicons.org/flask/000000", srcDark: "https://cdn.simpleicons.org/flask/ffffff" },  // 36
    { name: "Kubernetes", src: "https://cdn.simpleicons.org/kubernetes/326CE5" },
    { name: "Docker", src: "https://cdn.simpleicons.org/docker/2496ED" },                             // 16                          // 38
    { name: "Jest", src: "https://cdn.simpleicons.org/jest/C21325" },                               // 39
    { name: "Figma", src: "https://cdn.simpleicons.org/figma/F24E1E" },                              // 40
]

// ─── Column layout ────────────────────────────────────────────────────────────

type Column = { items: Logo[]; topPx: number }

const LEFT: Column[] = [
    { items: [logos[9], logos[2]], topPx: 170 },
    { items: [logos[21], logos[29], logos[33]], topPx: 100 },
    { items: [logos[16], logos[20], logos[17], logos[18]], topPx: 25 },
    { items: [logos[19], logos[38], logos[37]], topPx: 100 },
    { items: [logos[32], logos[26]], topPx: 140 },
    { items: [logos[11], logos[13]], topPx: 100 },
]

const CENTER: Column[] = [
    { items: [logos[3]], topPx: 130 },
    { items: [logos[0]], topPx: 100 },
    { items: [logos[1]], topPx: 60 },
    { items: [logos[5]], topPx: 60 },
    { items: [logos[7]], topPx: 90 },
    { items: [logos[30]], topPx: 130 },
]

const RIGHT: Column[] = [
    { items: [logos[10], logos[15]], topPx: 100 },
    { items: [logos[8], logos[6]], topPx: 140 },
    { items: [logos[39], logos[31], logos[4]], topPx: 100 },
    { items: [logos[22], logos[23], logos[24], logos[25]], topPx: 25 },
    { items: [logos[28], logos[27], logos[34]], topPx: 100 },
    { items: [logos[36], logos[12]], topPx: 170 },
]

const allColumns = [...LEFT, ...CENTER, ...RIGHT]

// ─── Mobile carousel layout ───────────────────────────────────────────────────
// Mesmos icones do arco, so que divididos em 2 faixas que rolam em loop:
// a de cima vai, a de baixo volta. A ordem segue os grupos da lista
// (frontend -> backend -> infra -> etc).

const MOBILE_ROW_SPLIT = Math.ceil(logos.length / 2)

const MOBILE_ROWS: Logo[][] = [
    logos.slice(0, MOBILE_ROW_SPLIT),
    logos.slice(MOBILE_ROW_SPLIT),
]

// Duracoes proporcionais ao tamanho de cada faixa, para as duas andarem
// na mesma velocidade aparente mesmo com contagens diferentes de icones.
const MOBILE_ROW_DURATIONS = MOBILE_ROWS.map((row) => `${Math.round(row.length * 2.4)}s`)

// ─── LogoIcon ─────────────────────────────────────────────────────────────────
// Renderiza o icone em si (img do simpleicons ou SVG inline), com variante dark.

function LogoIcon({ logo }: { logo: Logo }) {
    const hasDarkVariant = !!(logo.srcDark || logo.svgDark)

    if (logo.svgLight) {
        return (
            <>
                {/* Inline SVG — light */}
                <div
                    className={`h-[65%] w-[65%] [&>svg]:h-full [&>svg]:w-full ${hasDarkVariant ? 'dark:hidden' : ''}`}
                    dangerouslySetInnerHTML={{ __html: logo.svgLight }}
                />
                {/* Inline SVG — dark */}
                {logo.svgDark && (
                    <div
                        className="h-[65%] w-[65%] [&>svg]:h-full [&>svg]:w-full hidden dark:block"
                        dangerouslySetInnerHTML={{ __html: logo.svgDark }}
                    />
                )}
            </>
        )
    }

    return (
        <>
            {/* Simpleicons img — light */}
            <img
                className={`h-[65%] w-[65%] object-contain ${hasDarkVariant ? 'dark:hidden' : ''}`}
                src={logo.src}
                alt={logo.name}
                loading="lazy"
            />
            {/* Simpleicons img — dark */}
            {logo.srcDark && (
                <img
                    className="h-[65%] w-[65%] object-contain hidden dark:block"
                    src={logo.srcDark}
                    alt={logo.name}
                    loading="lazy"
                />
            )}
        </>
    )
}

const CARD_CLASS = `
    flex items-center justify-center rounded-2xl
    border transition-transform duration-200 ease-out
    border-black/10 bg-white/75 backdrop-blur-2xl 
    dark:border-white/10 dark:bg-[rgba(23,23,23,0.85)]
`

// ─── LogoTile (arco — telas medias/grandes) ───────────────────────────────────
// Aqui o nome aparece em tooltip no hover.

function LogoTile({ logo }: { logo: Logo }) {
    return (
        <div className="group relative flex-shrink-0 pointer-events-auto">

            {/* Tooltip */}
            <div className="
                pointer-events-none
                absolute left-1/2 -translate-x-1/2
                bottom-[calc(100%+10px)]
                whitespace-nowrap rounded-lg
                bg-neutral-900 px-3 py-1.5
                text-xs font-semibold text-white
                shadow-lg
                opacity-0 scale-95 -translate-y-1
                group-hover:opacity-100 group-hover:scale-100 group-hover:translate-y-0
                transition-all duration-150 ease-out
                z-50
            ">
                {logo.name}
                <span className="
                    absolute left-1/2 -translate-x-1/2 top-full
                    border-4 border-transparent border-t-neutral-900
                " />
            </div>

            {/* Card */}
            <div className={`${CARD_CLASS} group-hover:-translate-y-1 w-16 h-16 md:w-20 md:h-20 xl:w-[100px] xl:h-[100px]`}>
                <LogoIcon logo={logo} />
            </div>
        </div>
    )
}

// ─── CarouselTile (celular) ───────────────────────────────────────────────────
// Sem tooltip: o nome fica fixo embaixo do card, porque em touch nao ha hover.

function CarouselTile({ logo }: { logo: Logo }) {
    return (
        <div className="flex w-[84px] flex-shrink-0 flex-col items-center gap-2">
            <div className={`${CARD_CLASS} h-16 w-16`}>
                <LogoIcon logo={logo} />
            </div>
            <span className="w-full truncate text-center text-xs font-medium leading-none text-neutral-500 dark:text-neutral-400">
                {logo.name}
            </span>
        </div>
    )
}

// ─── Section ──────────────────────────────────────────────────────────────────

export default function Stack() {
    const t = useTranslations("home.showcase")

    return (
        /*
         * Esta secao nao e marcada com `data-st-03`. A transicao que a entrega
         * e feita pelo <Built />, o irmao anterior, em modo `cover` — cada
         * secao cobre a si mesma com a cor da seguinte, encadeado. O modo
         * `reveal` ancoraria a grade no rodape desta secao, que fica a milhares
         * de pixels da emenda.
         */
        <section className="relative -mt-16 flex flex-col items-center overflow-hidden pt-10 md:pt-4 px-4 sm:px-6">

            {/* Arc container */}
            <div
                className="relative hidden w-full pointer-events-none md:block"
                style={{ height: 380, marginBottom: -160 }}
            >
                <div
                    className="
                        absolute left-1/2 top-0 origin-top flex items-start
                        gap-2 sm:gap-3 md:gap-5 lg:gap-7 xl:gap-11
                    "
                    style={{ transform: "translateX(-50%)" }}
                >
                    {allColumns.map((col, colIdx) => (
                        <div
                            key={colIdx}
                            className="flex flex-col flex-shrink-0 gap-2 sm:gap-3 md:gap-5 lg:gap-7 xl:gap-11"
                            style={{ marginTop: col.topPx }}
                        >
                            {col.items.map((logo, logoIdx) => (
                                <LogoTile key={`${logo.name}-${colIdx}-${logoIdx}`} logo={logo} />
                            ))}
                        </div>
                    ))}
                </div>
            </div>

            {/* Carrossel — mesmos icones do arco, em 2 faixas: uma indo e outra
                vindo. Sai de cena a partir de md, onde o arco assume. */}
            <div className="relative w-full md:hidden">
                {/* Fade nas bordas */}
                <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-gradient-to-r from-background to-transparent" />
                <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-background to-transparent" />

                <div className="flex flex-col gap-4 py-2">
                    {MOBILE_ROWS.map((row, rowIdx) => (
                        <div key={rowIdx} className="overflow-hidden py-1">
                            <div
                                className={`
                                    flex w-max animate-stack-marquee
                                    motion-reduce:animate-none
                                    ${rowIdx % 2 === 1 ? '[animation-direction:reverse]' : ''}
                                `}
                                style={{ "--marquee-duration": MOBILE_ROW_DURATIONS[rowIdx] } as CSSProperties}
                            >
                                {/* Duas copias identicas: o keyframe anda -50%, entao o loop
                                    volta exatamente para o inicio da segunda copia. */}
                                {[0, 1].map((copy) => (
                                    <div
                                        key={copy}
                                        className="flex flex-shrink-0 gap-3 pr-3"
                                        aria-hidden={copy === 1}
                                    >
                                        {row.map((logo, logoIdx) => (
                                            <CarouselTile key={`${logo.name}-${copy}-${logoIdx}`} logo={logo} />
                                        ))}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* O cabecalho e igual ao das outras secoes, linha inclusive — ela
                cai por cima do arco, que ja esta esmaecido no fundo. */}
            <div className="relative z-10 mx-auto mt-6 max-w-xl text-center">
                <p className="mx-auto mt-3 max-w-lg text-pretty text-base leading-relaxed text-neutral-500 dark:text-neutral-400 sm:text-lg">
                    {t("description")}

                    <>
                        {' '}
                        <strong className="font-semibold text-neutral-900 dark:text-neutral-100">
                            {t("highlight")}
                        </strong>
                    </>

                </p>

            </div>

            <BlogList />
        </section>
    )
}