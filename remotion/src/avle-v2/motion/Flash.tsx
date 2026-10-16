import React from 'react';
import {AbsoluteFill} from 'remotion';
import {cor} from '../marca';

/**
 * Um frame em bege nos beats de impacto. Não é branco puro nem opaco: um
 * frame 100% liso parece falha de render; a 85% lê como clarão.
 */
const OPACIDADE = 0.85;

export const Flash: React.FC<{frame: number; em: readonly number[]}> = ({frame, em}) =>
	em.includes(frame) ? (
		<AbsoluteFill style={{backgroundColor: cor.bege, opacity: OPACIDADE, pointerEvents: 'none'}} />
	) : null;
