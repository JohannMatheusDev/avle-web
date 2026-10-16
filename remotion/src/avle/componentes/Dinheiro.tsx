import React from 'react';
import {cor} from '../marca';
import {tipo} from '../tema';

const formato = new Intl.NumberFormat('pt-BR', {maximumFractionDigits: 0});

/**
 * Valor em reais do jeito do DESIGN.md: número em semibold, com o "R$" e o
 * sufixo apagados, para o olho ir direto ao número.
 */
export const Dinheiro: React.FC<{
	valor: number;
	tamanho: number;
	sufixo?: string;
	corDoNumero?: string;
}> = ({valor, tamanho, sufixo, corDoNumero = cor.texto}) => {
	const apagado: React.CSSProperties = {
		fontSize: tamanho * 0.42,
		fontWeight: 500,
		color: cor.textoSecundario,
		letterSpacing: 0,
	};
	return (
		<span style={{...tipo.numero, fontSize: tamanho, color: corDoNumero, whiteSpace: 'pre'}}>
			<span style={{...apagado, marginRight: tamanho * 0.12}}>R$</span>
			{formato.format(Math.round(valor))}
			{sufixo ? <span style={{...apagado, marginLeft: tamanho * 0.06}}>{sufixo}</span> : null}
		</span>
	);
};
