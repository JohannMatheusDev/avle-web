'use client';

/**
 * O link da afiliada (/a/CODIGO). Guarda a indicação e leva para o convite da
 * loja dela, onde a cliente se cadastra como em qualquer convite.
 */

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Logo } from '@/design-system';
import { apiFetch } from '../../lib/api';
import { guardarIndicacao } from '../../lib/indicacao';
import s from '../../afiliados/Afiliados.module.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.avle.com.br';

const slug = (nome: string) =>
  nome.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

export default function LinkDaAfiliada() {
  const router = useRouter();
  const params = useParams();
  const codigo = String(params.codigo ?? '').toUpperCase();
  const [falhou, setFalhou] = useState(false);

  useEffect(() => {
    apiFetch(`${API_URL}/api/afiliados/link/${encodeURIComponent(codigo)}`)
      .then(async (r) => {
        if (!r.ok) throw new Error();
        const d = await r.json();
        guardarIndicacao(d.codigo, d.lojaId);
        router.replace(`/convite/${d.lojaId}-${slug(d.loja || 'loja')}`);
      })
      .catch(() => setFalhou(true));
  }, [codigo, router]);

  return (
    <div className={`avle-ds ${s.pagina}`}>
      <div className={s.entrada}>
        <Logo height={24} />
        <p className={s.apoio}>
          {falhou ? 'Este link de indicação não está mais valendo. Peça um link novo a quem indicou.' : 'Abrindo a loja…'}
        </p>
      </div>
    </div>
  );
}
