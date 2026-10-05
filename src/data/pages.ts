import { STORE } from "@/config/store";

export interface InstitutionalPage {
  title: string;
  description: string;
  sections: { heading?: string; body: string }[];
  faq?: boolean;
}

export const PAGES: Record<string, InstitutionalPage> = {
  sobre: {
    title: "Sobre nós",
    description: `Conheça a ${STORE.name} e nossa missão.`,
    sections: [
      { body: `A ${STORE.name} nasceu para reunir, em um só lugar, os melhores produtos de performance, tecnologia e bem-estar, com curadoria, preço justo e entrega rápida para todo o Brasil.` },
      { heading: "Nossa missão", body: "Oferecer uma experiência de compra simples, segura e transparente, com atendimento humano de verdade." },
    ],
  },
  contato: {
    title: "Contato",
    description: "Fale com a nossa equipe de atendimento.",
    sections: [
      { heading: "Atendimento", body: `E-mail: ${STORE.email}. WhatsApp disponível pelo botão no canto da tela. Segunda a sexta, das 9h às 18h.` },
    ],
  },
  faq: {
    title: "Perguntas frequentes",
    description: "Tire suas dúvidas sobre pedidos, entregas e pagamentos.",
    faq: true,
    sections: [
      { heading: "Qual o prazo de entrega?", body: "O prazo depende do CEP e da modalidade de frete escolhida, e é exibido antes de finalizar a compra." },
      { heading: "Quais as formas de pagamento?", body: `Pix (com ${STORE.pixDiscount * 100}% de desconto), cartão de crédito em até ${STORE.maxInstallments}x sem juros e boleto.` },
      { heading: "Como rastreio meu pedido?", body: "Após o envio você recebe o código de rastreio por e-mail e pode acompanhá-lo na sua conta." },
      { heading: "Posso trocar um produto?", body: "Sim, em até 7 dias após o recebimento por arrependimento, ou 30 dias em caso de defeito." },
    ],
  },
  trocas: {
    title: "Trocas e devoluções",
    description: "Política de trocas e devoluções conforme o CDC.",
    sections: [
      { heading: "Direito de arrependimento", body: "Conforme o Código de Defesa do Consumidor (art. 49), você pode desistir da compra em até 7 dias corridos após o recebimento." },
      { heading: "Produtos com defeito", body: "Produtos com defeito podem ser trocados em até 30 dias (não duráveis) ou 90 dias (duráveis)." },
      { heading: "Como solicitar", body: `Entre em contato pelo e-mail ${STORE.email} com o número do pedido.` },
    ],
  },
  privacidade: {
    title: "Política de privacidade",
    description: "Como tratamos seus dados pessoais conforme a LGPD.",
    sections: [
      { body: "Tratamos seus dados pessoais de acordo com a Lei Geral de Proteção de Dados (Lei 13.709/2018)." },
      { heading: "Dados coletados", body: "Nome, e-mail, CPF, endereço e telefone, usados exclusivamente para processar pedidos, emitir notas fiscais e prestar atendimento." },
      { heading: "Seus direitos", body: "Você pode solicitar acesso, correção, portabilidade ou exclusão dos seus dados a qualquer momento." },
      { heading: "Cookies", body: "Utilizamos cookies essenciais para o funcionamento do site e, com seu consentimento, cookies de análise." },
    ],
  },
  termos: {
    title: "Termos de uso",
    description: "Condições gerais de uso do site.",
    sections: [
      { body: `Ao utilizar o site da ${STORE.name}, você concorda com estes termos. Preços e condições podem ser alterados sem aviso prévio; vale o preço exibido no momento da compra.` },
      { heading: "Disponibilidade", body: "Os produtos estão sujeitos à disponibilidade de estoque." },
    ],
  },
};
