'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from './api';

export type Aviso = {
  id: number;
  tipo: string;
  titulo: string;
  mensagem: string;
  valor: number | null;
  lida: boolean;
  quando: string | null;
};

/**
 * Os avisos de entrada de dinheiro, prontos para qualquer tela usar.
 *
 * Vive como hook, e não como componente, porque os dois painéis mostram a mesma
 * informação em lugares diferentes: no painel da loja ela divide o INBOX da
 * árvore com as sorteadas aguardando crédito, e no do admin ocupa o painel
 * inteiro. Um componente fechado obrigaria a duplicar a busca.
 *
 * A checagem é a cada minuto. A diferença entre saber agora e saber daqui a um
 * minuto não muda nada para quem atende, e uma conexão aberta o dia inteiro
 * custaria muito mais do que resolve.
 */
export function useAvisos() {
  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const [naoLidas, setNaoLidas] = useState(0);

  const buscar = useCallback(async () => {
    const r = await apiFetch('/api/notificacoes?quantidade=30');
    if (!r.ok) throw new Error('sem avisos');
    return r.json();
  }, []);

  useEffect(() => {
    let ativo = true;
    const carregar = () =>
      buscar()
        .then((d) => {
          if (!ativo) return;
          setAvisos(d.avisos ?? []);
          setNaoLidas(Number(d.naoLidas) || 0);
        })
        .catch(() => {});

    carregar();
    const relogio = setInterval(carregar, 60000);
    return () => {
      ativo = false;
      clearInterval(relogio);
    };
  }, [buscar]);

  const marcarTodas = useCallback(async () => {
    // A tela muda antes da resposta: quem clicou já sabe que leu, e esperar a
    // rede para zerar o contador faz o botão parecer quebrado.
    setNaoLidas(0);
    setAvisos((atuais) => atuais.map((a) => ({ ...a, lida: true })));
    await apiFetch('/api/notificacoes/marcar-todas', { method: 'POST' }).catch(() => {});
  }, []);

  return { avisos, naoLidas, marcarTodas };
}
