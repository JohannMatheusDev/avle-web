import React from 'react';
import {cor} from '../marca';
import {punch} from '../movimento';
import {tipo} from '../tema';

const formato = new Intl.NumberFormat('pt-BR', {maximumFractionDigits: 0});

/**
 * Número que muda na tela. Cada troca dá um punch curto no frame
 * `ultimaTroca`, porque número mudando é um dos estímulos da V2 e um número
 * que só troca de dígito, parado, passa despercebido.
 *
 * Com `prefixo` "R$", o prefixo sai apagado, como o DESIGN.md pede para valor.
 */
export const Contador: React.FC<{
	valor: number;
	frame: number;
	ultimaTroca?: number;
	tamanho: number;
	corDoNumero?: string;
	prefixo?: string;
	sufixo?: string;
	pico?: number;
}> = ({valor, frame, ultimaTroca, tamanho, corDoNumero = cor.texto, prefixo, sufixo, pico = 1.12}) => {
	const escala = ultimaTroca === undefined ? 1 : punch(frame, ultimaTroca, pico);
	const apagado: React.CSSProperties = {fontSize: tamanho * 0.42, fontWeight: 500, opacity: 0.6, letterSpacing: 0};
	return (
		<span
			style={{
				...tipo.numero,
				fontSize: tamanho,
				color: corDoNumero,
				whiteSpace: 'pre',
				display: 'inline-block',
				transform: `scale(${escala})`,
			}}
		>
			{prefixo ? <span style={{...apagado, marginRight: tamanho * 0.12}}>{prefixo}</span> : null}
			{formato.format(Math.round(valor))}
			{sufixo ? <span style={{...apagado, marginLeft: tamanho * 0.06}}>{sufixo}</span> : null}
		</span>
	);
};
