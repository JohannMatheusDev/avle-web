/**
 * O texto dos termos de uso da AVLE, num lugar só.
 *
 * Aparece em dois momentos: no cadastro, atrás da caixinha "li e aceito", e
 * nas boas-vindas de quem ainda não aceitou. Eram duas cópias, e a primeira
 * que mudasse deixaria a cliente aceitando no cadastro um texto diferente do
 * que o painel mostra depois.
 */
export default function TextoDosTermos() {
  return (
    <div className="space-y-4">
      <p>
        A AVLE organiza clubes de compra coletiva junto com lojas parceiras. Ao participar, você
        contribui mensalmente e concorre à contemplação para retirar o seu produto na loja.
      </p>

      <div className="bg-[#F8F6F2] border border-[#DFD9CE] rounded-2xl p-4 space-y-3">
        <p className="text-[10px] uppercase tracking-wider font-bold text-stone-500">O que você aceita</p>
        <ul className="space-y-2 text-xs">
          <li>• Pagar a parcela do seu grupo até o <strong>quinto dia útil</strong> de cada mês.</li>
          <li>• Receber avisos de cobrança por e-mail e WhatsApp, com o Pix e o boleto.</li>
          <li>• Que a contemplação segue sorteio auditável, e a retirada depende das parcelas em dia.</li>
          <li>• Que a retirada do produto exige o cadastro completo, com o seu endereço.</li>
          <li>• Que os seus dados são usados para emitir as cobranças e falar com você sobre o plano.</li>
        </ul>
      </div>

      <p className="text-xs text-stone-500">
        A parcela é paga mês a mês, por Pix ou boleto: participar <strong>não consome o limite do seu cartão de crédito</strong>.
      </p>

      <p className="text-xs text-stone-400">
        O regulamento completo do seu grupo é apresentado pela loja no momento da adesão.
      </p>
    </div>
  );
}
