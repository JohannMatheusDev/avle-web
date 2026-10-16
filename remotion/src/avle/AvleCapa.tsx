import React from 'react';
import {AbsoluteFill, Img} from 'remotion';
import {FraseGancho} from './componentes/FraseGancho';
import {alturaPara, artes, cor} from './marca';
import {areaSegura, FONTE} from './tema';

const MARCA_LARGURA = 220;

/**
 * Capa do vídeo: a pergunta do gancho inteira, já com o "ANTES" em terracota,
 * e a assinatura da AVLE no pé da área segura. Usa o mesmo componente da cena
 * 1 com `frame` nulo, para a capa e o vídeo nunca mostrarem frases diferentes.
 */
export const AvleCapa: React.FC = () => (
	<AbsoluteFill style={{backgroundColor: cor.fundoForte, fontFamily: FONTE}}>
		<FraseGancho frame={null} />
		<Img
			src={artes.marcaCreme.src}
			style={{
				position: 'absolute',
				left: areaSegura.esquerda,
				top: areaSegura.base - alturaPara(artes.marcaCreme, MARCA_LARGURA),
				width: MARCA_LARGURA,
			}}
		/>
	</AbsoluteFill>
);
