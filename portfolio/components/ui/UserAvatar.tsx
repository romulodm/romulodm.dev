"use client";

import Image from "next/image";
import { Avatar } from "seedicon/react";

import { cn } from "@/lib/utils";
import { toAvatarStyle, usesSeedicon, type AvatarUser } from "@/lib/avatar";

/**
 * Ponto unico de renderizacao de avatar no site.
 *
 * Antes disto cada lugar fazia `<Image src={user.image ?? "/default.png"}>`, e
 * todo mundo que criou conta com e-mail e senha dividia o mesmo PNG cinza. Aqui
 * quem nao tem (ou nao quer) a foto do provider recebe um SVG deterministico
 * gerado da sua semente — nada e armazenado, nada e requisitado pela rede.
 *
 * Sobre bundle: `seedicon/react` resolve estilos por nome, logo referencia o
 * registry inteiro (~19KB gz). Isso entra no bundle client das paginas com
 * comentarios e mural, uma vez, e fica cacheado. A alternativa — gerar o SVG no
 * servidor e mandar markup por prop — custaria 1–3KB de HTML POR avatar, o que
 * passa os 19KB em qualquer thread com mais de dez comentarios. Por isso o
 * componente e client e chama o pacote direto.
 */
interface UserAvatarProps {
  user: AvatarUser;
  /** Lado do quadrado, em px. */
  size?: number;
  /** Vai para o elemento renderizado (o <Image> ou o wrapper do seedicon). */
  className?: string;
  priority?: boolean;
}

export function UserAvatar({ user, size = 32, className, priority }: UserAvatarProps) {
  if (usesSeedicon(user)) {
    return (
      <Avatar
        seed={user.avatarSeed}
        style={toAvatarStyle(user.avatarStyle)}
        size={size}
        shape="circle"
        // `rounded-full` acompanha o shape="circle" acima e nao e decoracao: o
        // seedicon joga o className num <div> quadrado de width/height = size e
        // recorta o circulo dentro do SVG. Sem arredondar o wrapper, todo
        // `ring-*` ou `border` que os chamadores passam desenha um quadrado em
        // volta do avatar redondo. Os dois andam juntos — mudar um pede o outro.
        className={cn("shrink-0 rounded-full", className)}
      />
    );
  }

  return (
    <Image
      src={user.image!}
      alt={user.username}
      width={size}
      height={size}
      priority={priority}
      className={cn("rounded-full object-cover shrink-0", className)}
      style={{ width: size, height: size }}
    />
  );
}
