/**
 * Os termos de quem vira afiliada de uma loja, versão afiliados-1. O valor da
 * comissão não está aqui de propósito: é a loja que define, e ele aparece no
 * painel da afiliada assim que existir.
 */
export default function TermosDoAfiliado({ loja }: { loja: string }) {
  return (
    <>
      <p>
        Ao se cadastrar, você passa a divulgar a {loja} com um link só seu. Leia como funciona antes de aceitar.
      </p>
      <h4>1. O seu link</h4>
      <p>
        Depois do cadastro, você recebe um link de indicação ligado à {loja}. Quem se cadastra na AVLE por esse link
        fica marcada como indicada por você. A primeira indicação é a que vale: se a pessoa já tinha conta, ou entrou
        pelo link de outra pessoa, ela não conta para você.
      </p>
      <h4>2. Quando a comissão existe</h4>
      <p>
        A comissão nasce quando a cliente indicada <strong>paga</strong> uma parcela de um grupo da {loja}. Cadastro sem
        pagamento não gera comissão. Cada parcela paga gera uma comissão, até a cliente terminar de pagar o plano.
      </p>
      <h4>3. O valor</h4>
      <p>
        O valor da comissão é definido pela {loja} e aparece no seu painel. Enquanto ele não estiver definido, as
        comissões ficam registradas como &quot;a definir&quot; e ganham valor quando a regra for publicada.
      </p>
      <h4>4. O pagamento</h4>
      <p>
        A comissão é paga por Pix, na chave que você cadastrar. Mantenha a chave certa: o pagamento feito na chave
        informada por você é considerado entregue. Se a baixa de uma parcela for desfeita (por exemplo, pagamento
        estornado), a comissão dela é cancelada.
      </p>
      <h4>5. O que não pode</h4>
      <p>
        Indicar a si mesma, prometer o que a {loja} não oferece, falar em nome da AVLE ou da loja fora do que foi
        combinado, ou usar o link de forma enganosa. Nesses casos a loja pode desligar o seu link, e as comissões que
        vierem dele deixam de ser geradas.
      </p>
      <h4>6. Seus dados e os das clientes</h4>
      <p>
        Seus dados (nome, CPF, contato e chave Pix) servem para identificar você e pagar a comissão. No painel você vê
        quantas pessoas entraram e pagaram pelo seu link, com o primeiro nome e a inicial do sobrenome, sem os dados
        completos delas.
      </p>
      <h4>7. Mudanças</h4>
      <p>
        A AVLE e a {loja} podem mudar estas regras. Quando mudarem, a nova versão fica disponível no seu painel.
      </p>
    </>
  );
}
