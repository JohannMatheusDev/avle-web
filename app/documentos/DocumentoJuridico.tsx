/**
 * Mostra um documento oficial a partir do texto corrido.
 *
 * O .docx original chega como texto, uma linha por parágrafo. Aqui a linha
 * que abre com "CLÁUSULA" ou "ANEXO" vira título de seção, a primeira linha
 * vira o título do documento e o resto vira parágrafo. Não reescreve nada:
 * o que a pessoa lê é o texto que aceita.
 */
export default function DocumentoJuridico({ texto, semTitulo = false }: { texto: string; semTitulo?: boolean }) {
  const linhas = texto.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
  return (
    <article className="text-[12px] text-stone-700 leading-relaxed space-y-2 print:text-black">
      {linhas.map((linha, i) => {
        if (i === 0 && !semTitulo) {
          return (
            <h4 key={i} className="text-[14px] font-serif font-bold text-[#0B1E14] text-center pb-2">
              {linha}
            </h4>
          );
        }
        if (/^(CLÁUSULA|ANEXO|TESTEMUNHAS)/.test(linha)) {
          return (
            <h5 key={i} className="text-[11px] font-bold text-[#0B1E14] uppercase tracking-wide pt-3">
              {linha.replace(/\s{2,}/g, ' · ')}
            </h5>
          );
        }
        return <p key={i}>{linha}</p>;
      })}
    </article>
  );
}
