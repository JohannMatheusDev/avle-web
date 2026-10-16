import React from 'react';
import {AbsoluteFill} from 'remotion';
import {QuadroDoGancho} from './cenas/Cena1Gancho';
import {FONTE} from './tema';
import {cenas} from './timing';

/**
 * Capa da V2: o gancho no último frame da cena, já congelado e com o
 * carimbo "SEM COBRAR NINGUÉM" assentado. É o mesmo quadro do vídeo, não um
 * desenho à parte.
 */
export const AvleCapaV2: React.FC = () => (
	<AbsoluteFill style={{fontFamily: FONTE}}>
		<QuadroDoGancho frame={cenas.gancho.duracao - 1} />
	</AbsoluteFill>
);
