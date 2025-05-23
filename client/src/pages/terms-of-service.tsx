import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <header className="bg-white border-b border-neutral-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">Q</span>
              </div>
              <span className="text-xl font-bold text-neutral-900">QMARK</span>
            </div>
            <Button variant="outline" asChild>
              <a href="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </a>
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">
              Termos de Uso - QMARK
            </CardTitle>
            <p className="text-center text-neutral-600">
              Última atualização: {new Date().toLocaleDateString('pt-BR')}
            </p>
          </CardHeader>
          <CardContent className="prose prose-neutral max-w-none">
            <h2>1. Aceitação dos Termos</h2>
            <p>
              Bem-vindo à QMARK! Ao acessar e usar nossa plataforma de automação de marketing digital, 
              você concorda em cumprir e estar vinculado a estes Termos de Uso. Se você não concordar 
              com qualquer parte destes termos, não deve usar nossos serviços.
            </p>

            <h2>2. Descrição do Serviço</h2>
            <p>
              A QMARK é uma plataforma SaaS (Software as a Service) que oferece:
            </p>
            <ul>
              <li>Automação de marketing digital para micro-empreendedores</li>
              <li>Integração com plataformas sociais (Facebook, Instagram, WhatsApp, Gmail)</li>
              <li>Dashboard unificado para gestão de campanhas e leads</li>
              <li>Relatórios e analytics em tempo real</li>
              <li>Ferramentas de gestão de relacionamento com clientes</li>
            </ul>

            <h2>3. Elegibilidade e Cadastro</h2>
            <h3>3.1 Requisitos</h3>
            <ul>
              <li>Ser maior de 18 anos</li>
              <li>Ser micro-empreendedor ou pequeno empresário</li>
              <li>Possuir CNPJ ou MEI válido</li>
              <li>Fornecer informações verdadeiras e atualizadas</li>
            </ul>

            <h3>3.2 Responsabilidades do Usuário</h3>
            <p>Você se compromete a:</p>
            <ul>
              <li>Manter suas credenciais de acesso seguras</li>
              <li>Notificar imediatamente sobre uso não autorizado</li>
              <li>Atualizar suas informações quando necessário</li>
              <li>Usar o serviço conforme as leis aplicáveis</li>
            </ul>

            <h2>4. Planos e Pagamentos</h2>
            <h3>4.1 Planos Disponíveis</h3>
            <ul>
              <li><strong>Plano Gratuito:</strong> Funcionalidades básicas limitadas</li>
              <li><strong>Plano Essencial:</strong> R$ 49,90/mês - Para iniciantes</li>
              <li><strong>Plano Profissional:</strong> R$ 99,90/mês - Para crescimento</li>
              <li><strong>Plano Empresarial:</strong> R$ 199,90/mês - Para expansão</li>
            </ul>

            <h3>4.2 Condições de Pagamento</h3>
            <ul>
              <li>Cobrança mensal ou anual antecipada</li>
              <li>Pagamento via cartão de crédito, PIX ou boleto</li>
              <li>Upgrade/downgrade pode ser feito a qualquer momento</li>
              <li>Cancelamento sem multa com 30 dias de antecedência</li>
            </ul>

            <h2>5. Uso Permitido</h2>
            <p>Você pode usar nossos serviços para:</p>
            <ul>
              <li>Automatizar campanhas de marketing legítimas</li>
              <li>Gerenciar relacionamento com clientes</li>
              <li>Analisar performance de campanhas</li>
              <li>Integrar com suas contas de redes sociais</li>
            </ul>

            <h2>6. Uso Proibido</h2>
            <p>É estritamente proibido:</p>
            <ul>
              <li>Enviar spam ou comunicações não solicitadas</li>
              <li>Violar direitos de propriedade intelectual</li>
              <li>Usar para atividades ilegais ou fraudulentas</li>
              <li>Tentar hackear ou comprometer nossa segurança</li>
              <li>Revender ou transferir acesso sem autorização</li>
              <li>Criar contas falsas ou múltiplas</li>
            </ul>

            <h2>7. Integrações de Terceiros</h2>
            <p>
              Nossa plataforma integra com serviços terceiros (Facebook, Google, etc.). 
              Você deve cumprir os termos de uso dessas plataformas e entende que:
            </p>
            <ul>
              <li>Não somos responsáveis por mudanças em APIs de terceiros</li>
              <li>Algumas funcionalidades podem ser limitadas por políticas externas</li>
              <li>Você deve autorizar expressamente cada integração</li>
            </ul>

            <h2>8. Propriedade Intelectual</h2>
            <h3>8.1 Nossa Propriedade</h3>
            <p>
              A QMARK e todo seu conteúdo (software, design, textos, logos) são de nossa 
              propriedade exclusiva e protegidos por direitos autorais.
            </p>

            <h3>8.2 Seus Dados</h3>
            <p>
              Você mantém todos os direitos sobre seus dados de negócio. Concedemos apenas 
              licença limitada para processar esses dados conforme necessário para fornecer nossos serviços.
            </p>

            <h2>9. Privacidade e Dados</h2>
            <p>
              O tratamento de dados pessoais é regido por nossa Política de Privacidade, 
              em total conformidade com a LGPD. Destacamos:
            </p>
            <ul>
              <li>Criptografia AES256 para dados sensíveis</li>
              <li>Direito de acesso, correção e exclusão</li>
              <li>Portabilidade de dados</li>
              <li>Consentimento explícito para cada uso</li>
            </ul>

            <h2>10. Disponibilidade e Suporte</h2>
            <h3>10.1 SLA (Service Level Agreement)</h3>
            <ul>
              <li>Uptime mínimo de 99,5% mensal</li>
              <li>Suporte técnico 24/7 para planos pagos</li>
              <li>Backup diário automático</li>
              <li>Manutenções programadas com aviso de 48h</li>
            </ul>

            <h3>10.2 Limitações</h3>
            <p>
              Não garantimos disponibilidade ininterrupta devido a:
            </p>
            <ul>
              <li>Manutenções necessárias</li>
              <li>Problemas em provedores terceiros</li>
              <li>Casos de força maior</li>
            </ul>

            <h2>11. Limitação de Responsabilidade</h2>
            <p>
              Nossa responsabilidade é limitada ao valor pago pelos serviços nos últimos 12 meses. 
              Não somos responsáveis por:
            </p>
            <ul>
              <li>Danos indiretos ou lucros cessantes</li>
              <li>Problemas em integrações de terceiros</li>
              <li>Uso inadequado da plataforma</li>
              <li>Violação de termos de plataformas externas</li>
            </ul>

            <h2>12. Suspensão e Cancelamento</h2>
            <h3>12.1 Suspensão por Violação</h3>
            <p>Podemos suspender sua conta em caso de:</p>
            <ul>
              <li>Violação destes termos</li>
              <li>Atraso no pagamento superior a 15 dias</li>
              <li>Atividades suspeitas ou ilegais</li>
            </ul>

            <h3>12.2 Cancelamento Voluntário</h3>
            <ul>
              <li>Você pode cancelar a qualquer momento</li>
              <li>Dados mantidos por 90 dias após cancelamento</li>
              <li>Exportação de dados disponível antes da exclusão</li>
            </ul>

            <h2>13. Modificações dos Termos</h2>
            <p>
              Podemos modificar estes termos com 30 dias de antecedência. Notificaremos via:
            </p>
            <ul>
              <li>E-mail para seu endereço cadastrado</li>
              <li>Aviso no dashboard da plataforma</li>
              <li>Publicação em nosso site</li>
            </ul>

            <h2>14. Lei Aplicável e Foro</h2>
            <p>
              Estes termos são regidos pela legislação brasileira. O foro da comarca de 
              [Sua cidade] é eleito para dirimir quaisquer controvérsias.
            </p>

            <h2>15. Contato</h2>
            <p>
              Para dúvidas sobre estes termos:
            </p>
            <div className="bg-neutral-100 p-4 rounded-lg">
              <p><strong>E-mail:</strong> legal@qmark.com.br</p>
              <p><strong>Telefone:</strong> +55 (11) 99999-9999</p>
              <p><strong>Endereço:</strong> [Seu endereço comercial]</p>
              <p><strong>CNPJ:</strong> [Seu CNPJ]</p>
            </div>

            <h2>16. Disposições Finais</h2>
            <ul>
              <li>Se alguma cláusula for inválida, as demais permanecem em vigor</li>
              <li>O não exercício de direitos não implica em renúncia</li>
              <li>Estes termos constituem acordo integral entre as partes</li>
            </ul>

            <div className="border-t border-neutral-200 pt-6 mt-8">
              <p className="text-sm text-neutral-600 text-center">
                Ao usar a QMARK, você confirma ter lido, entendido e concordado com estes Termos de Uso. 
                Nossa missão é ajudar micro-empreendedores brasileiros a crescerem com tecnologia segura e confiável.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}