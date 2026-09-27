'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Troca de frase por dissolucao em blocos, em duas fases.
 *
 * A frase que sai se desmancha por completo antes de a nova comecar a aparecer:
 * na metade da transicao a linha fica vazia. Nao e um crossfade — em nenhum
 * momento as duas frases dividem a linha.
 *
 * O que decide quais pedacos ja sumiram (ou ja chegaram) e uma grade de blocos.
 * Cada celula tem um limiar proprio, misturando a posicao horizontal com ruido,
 * e vira quando o progresso da fase passa desse limiar. As duas fases usam a
 * mesma grade, entao a saida e a entrada varrem a linha no mesmo sentido, da
 * esquerda para a direita, com a borda desfiada.
 *
 * Em nenhum quadro existe um caractere que nao pertenca a uma das duas frases:
 * o efeito recorta glifos, nao os substitui.
 */

/** Lado da celula da grade, em pixels de CSS. */
const CELL_PX = 7;

/**
 * Quanto do limiar vem da posicao horizontal, e nao do ruido.
 *
 * Em 0 a linha inteira se desmancha de uma vez, como estatica. Em 1 vira uma
 * cortina reta varrendo para a direita. O valor alto deixa a varredura legivel
 * e reserva o resto para desfiar a borda dela.
 */
const SWEEP_BIAS = 0.72;

/**
 * Intervalo entre repinturas da mascara.
 *
 * A mascara e blocada e tem poucos estados visiveis: redesenhar a cada quadro
 * de 60Hz gastaria tres vezes mais `toDataURL` sem diferenca na tela.
 */
const REPAINT_MS = 30;

type Masker = (progress: number) => string;

/**
 * Monta o gerador de mascaras para uma caixa de tamanho fixo.
 *
 * O desenho acontece numa grade minuscula (uma celula = um pixel) e so depois e
 * ampliado para o tamanho real com a suavizacao desligada. Desenhar direto no
 * tamanho final custaria milhares de `fillRect` por quadro, e deixar o navegador
 * ampliar a imagem da mascara por conta propria devolveria blocos borrados.
 *
 * As mascaras das duas fases saem empilhadas numa imagem so — a da frase que
 * entra em cima, a da que sai embaixo — e cada camada escolhe a sua metade com
 * `mask-position`. E uma chamada de `toDataURL` por quadro em vez de duas.
 */
function createMasker(width: number, height: number): Masker {
    const cols = Math.max(1, Math.ceil(width / CELL_PX));
    const rows = Math.max(1, Math.ceil(height / CELL_PX));
    const cells = cols * rows;

    const thresholds = new Float32Array(cells);
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            const sweep = (col / Math.max(cols - 1, 1)) * SWEEP_BIAS;
            thresholds[row * cols + col] = sweep + Math.random() * (1 - SWEEP_BIAS);
        }
    }

    const small = document.createElement('canvas');
    small.width = cols;
    small.height = rows * 2;
    const smallCtx = small.getContext('2d')!;
    const image = smallCtx.createImageData(cols, rows * 2);

    const full = document.createElement('canvas');
    full.width = width;
    full.height = height * 2;
    const fullCtx = full.getContext('2d')!;
    fullCtx.imageSmoothingEnabled = false;

    const data = image.data;
    // Os canais de cor sao constantes: so o alfa muda de quadro para quadro.
    for (let i = 0; i < data.length; i += 4) {
        data[i] = 255;
        data[i + 1] = 255;
        data[i + 2] = 255;
    }

    return (progress: number) => {
        // Primeira metade da transicao desmancha a frase antiga; a segunda monta
        // a nova. No ponto de virada as duas mascaras estao zeradas e a linha
        // fica vazia por um quadro — e esse vazio que separa as duas frases.
        const exit = Math.min(progress * 2, 1);
        const enter = Math.max(progress * 2 - 1, 0);

        for (let i = 0; i < cells; i++) {
            const threshold = thresholds[i];
            data[i * 4 + 3] = enter > threshold ? 255 : 0;
            data[(cells + i) * 4 + 3] = exit > threshold ? 0 : 255;
        }

        smallCtx.putImageData(image, 0, 0);
        fullCtx.clearRect(0, 0, full.width, full.height);
        fullCtx.drawImage(small, 0, 0, full.width, full.height);

        return full.toDataURL();
    };
}

function maskStyle(url: string | null, half: 'in' | 'out') {
    if (!url) return undefined;

    const image = `url(${url})`;
    const position = half === 'in' ? '0 0' : '0 100%';

    return {
        maskImage: image,
        WebkitMaskImage: image,
        maskSize: '100% 200%',
        WebkitMaskSize: '100% 200%',
        maskPosition: position,
        WebkitMaskPosition: position,
        maskRepeat: 'no-repeat',
        WebkitMaskRepeat: 'no-repeat',
    } as const;
}

/**
 * One layer of the stack: all of them share the first grid cell. `pb` keeps
 * descenders inside the masked area.
 */
const LAYER = 'col-start-1 row-start-1 block pb-[0.25em]';

type DissolveTextProps = {
    text: string;
    /**
     * Every phrase `text` can take. The box reserves the height of the tallest
     * one, so it does not jump when a phrase wraps onto more lines than the
     * previous one. Without it the box follows the current phrase.
     */
    phrases?: string[];
    /** Duracao das duas fases somadas, em ms. */
    duration?: number;
    className?: string;
};

export default function DissolveText({
    text,
    phrases,
    duration = 470,
    className,
}: DissolveTextProps) {
    const boxRef = useRef<HTMLSpanElement>(null);

    const [incoming, setIncoming] = useState(text);
    const [outgoing, setOutgoing] = useState<string | null>(null);
    const [mask, setMask] = useState<string | null>(null);

    /** Frase efetivamente na tela — ponto de partida da proxima transicao. */
    const shownRef = useRef(text);
    const frameRef = useRef<number | null>(null);

    useEffect(() => {
        if (shownRef.current === text) return;

        const previous = shownRef.current;
        shownRef.current = text;

        const box = boxRef.current;
        const prefersReducedMotion = window.matchMedia(
            '(prefers-reduced-motion: reduce)',
        ).matches;

        setIncoming(text);

        if (!box || prefersReducedMotion) {
            setOutgoing(null);
            setMask(null);
            return;
        }

        const masker = createMasker(
            Math.max(1, Math.round(box.clientWidth)),
            Math.max(1, Math.round(box.clientHeight)),
        );

        // A primeira mascara e aplicada junto com a troca do texto. Sem isso, a
        // frase nova apareceria inteira por um quadro antes de o primeiro rAF
        // recortar qualquer coisa.
        setOutgoing(previous);
        setMask(masker(0));

        const startedAt = performance.now();
        let paintedAt = -Infinity;

        const step = (now: number) => {
            const progress = Math.min((now - startedAt) / duration, 1);

            if (progress >= 1) {
                // Ao terminar, a mascara sai de cena: texto plano custa menos
                // para compor, e qualquer arredondamento da grade deixa de
                // aparecer na borda dos glifos.
                setMask(null);
                setOutgoing(null);
                frameRef.current = null;
                return;
            }

            if (now - paintedAt >= REPAINT_MS) {
                paintedAt = now;
                setMask(masker(progress));
            }

            frameRef.current = requestAnimationFrame(step);
        };

        frameRef.current = requestAnimationFrame(step);

        return () => {
            if (frameRef.current !== null) {
                cancelAnimationFrame(frameRef.current);
                frameRef.current = null;
            }
            // Interrompida no meio, a transicao nao pode deixar a frase antiga
            // nem a mascara congeladas na tela.
            setMask(null);
            setOutgoing(null);
        };
    }, [text, duration]);

    /*
     * Every phrase in `phrases` is laid out invisibly in the same grid cell as
     * the visible layers, so the box is as tall as the longest one at the
     * current width. Phrases wrap on narrow screens, and without that reserve
     * the heading would change height (and push the text below it) every time
     * a phrase with a different line count came in.
     */
    const reserve = phrases ?? [incoming];

    return (
        <span
            ref={boxRef}
            className={`relative grid ${className ?? ''}`}
        >
            {/*
             * Leitor de tela recebe so a frase atual. As camadas visuais ficam
             * com `aria-hidden`: durante a transicao ha duas frases no DOM, e
             * anunciar as duas nao diria nada.
             */}
            <span className="sr-only">{text}</span>

            {reserve.map((phrase) => (
                <span
                    key={phrase}
                    aria-hidden="true"
                    className={`${LAYER} invisible`}
                >
                    {phrase}
                </span>
            ))}

            {/*
             * The visible layers stretch over the whole cell, so the mask
             * (sized to the layer) lines up with the grid the masker built from
             * the box.
             */}
            <span
                aria-hidden="true"
                className={LAYER}
                style={maskStyle(mask, 'in')}
            >
                {incoming}
            </span>

            {outgoing !== null && (
                <span
                    aria-hidden="true"
                    className={LAYER}
                    style={maskStyle(mask, 'out')}
                >
                    {outgoing}
                </span>
            )}
        </span>
    );
}
