import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPolicy() {
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
              Política de Privacidade - QMARK
            </CardTitle>
            <p className="text-center text-neutral-600">
              Última atualização: {new Date().toLocaleDateString('pt-BR')}
            </p>
          </CardHeader>
          <CardContent className="prose prose-neutral max-w-none">
            <h2>1. Informações Gerais</h2>
            <p>
              A QMARK ("nós", "nossa" ou "nosso") opera a plataforma SaaS de automação de marketing digital 
              destinada a micro-empreendedores brasileiros. Esta Política de Privacidade explica como coletamos, 
              usamos, divulgamos e protegemos suas informações quando você usa nosso serviço.
            </p>

            <h2>2. Conformidade com a LGPD</h2>
            <p>
              Esta política está em total conformidade com a Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018) 
              e garante que todos os dados pessoais sejam tratados de forma transparente, segura e respeitando 
              seus direitos fundamentais.
            </p>

            <h2>3. Dados Coletados</h2>
            <h3>3.1 Dados de Cadastro</h3>
            <ul>
              <li>Nome completo</li>
              <li>Endereço de e-mail</li>
              <li>Informações de perfil das plataformas conectadas</li>
            </ul>

            <h3>3.2 Dados de Integração OAuth2</h3>
            <ul>
              <li>Tokens de acesso das plataformas (Facebook, Instagram, Gmail, WhatsApp)</li>
              <li>Dados de campanhas e métricas de marketing</li>
              <li>Informações de leads e conversões</li>
            </ul>

            <h2>4. Finalidade do Tratamento</h2>
            <p>Utilizamos seus dados para:</p>
            <ul>
              <li>Fornecer nossos serviços de automação de marketing</li>
              <li>Gerenciar suas integrações com plataformas terceiras</li>
              <li>Gerar relatórios e analytics personalizados</li>
              <li>Melhorar nossos serviços e experiência do usuário</li>
              <li>Cumprir obrigações legais e regulatórias</li>
            </ul>

            <h2>5. Proteção e Segurança</h2>
            <p>
              Implementamos medidas de segurança robustas incluindo:
            </p>
            <ul>
              <li>Criptografia AES256 para dados sensíveis</li>
              <li>Armazenamento seguro em servidores certificados</li>
              <li>Controle de acesso restrito aos dados</li>
              <li>Monitoramento contínuo de segurança</li>
              <li>Backup e recuperação de dados</li>
            </ul>

            <h2>6. Compartilhamento de Dados</h2>
            <p>
              Não vendemos, alugamos ou compartilhamos seus dados pessoais com terceiros, exceto:
            </p>
            <ul>
              <li>Com seu consentimento explícito</li>
              <li>Para cumprir obrigações legais</li>
              <li>Com provedores de serviços essenciais (sob contrato de confidencialidade)</li>
              <li>Em caso de fusão, aquisição ou venda de ativos (com notificação prévia)</li>
            </ul>

            <h2>7. Seus Direitos (LGPD)</h2>
            <p>Você tem o direito de:</p>
            <ul>
              <li><strong>Acesso:</strong> Solicitar informações sobre seus dados pessoais</li>
              <li><strong>Correção:</strong> Corrigir dados incompletos, inexatos ou desatualizados</li>
              <li><strong>Exclusão:</strong> Solicitar a eliminação de dados desnecessários</li>
              <li><strong>Portabilidade:</strong> Receber seus dados em formato estruturado</li>
              <li><strong>Revogação:</strong> Retirar consentimento a qualquer momento</li>
              <li><strong>Oposição:</strong> Opor-se ao tratamento de dados</li>
            </ul>

            <h2>8. Retenção de Dados</h2>
            <p>
              Mantemos seus dados apenas pelo tempo necessário para cumprir as finalidades descritas 
              nesta política ou conforme exigido por lei. Dados de marketing podem ser mantidos por 
              até 5 anos para fins de análise histórica, salvo solicitação de exclusão.
            </p>

            <h2>9. Cookies e Tecnologias Similares</h2>
            <p>
              Utilizamos cookies essenciais para o funcionamento da plataforma, cookies de performance 
              para melhorar nossos serviços e cookies de funcionalidade para personalizar sua experiência. 
              Você pode gerenciar suas preferências de cookies nas configurações do seu navegador.
            </p>

            <h2>10. Transferência Internacional</h2>
            <p>
              Seus dados podem ser processados em servidores localizados fora do Brasil, sempre 
              garantindo nível de proteção adequado conforme a LGPD e utilizando cláusulas contratuais 
              padrão aprovadas.
            </p>

            <h2>11. Menores de Idade</h2>
            <p>
              Nossos serviços são destinados a empresários maiores de 18 anos. Não coletamos 
              intencionalmente dados de menores de idade.
            </p>

            <h2>12. Alterações na Política</h2>
            <p>
              Podemos atualizar esta política periodicamente. Notificaremos sobre mudanças significativas 
              por e-mail ou através de aviso em nossa plataforma com 30 dias de antecedência.
            </p>

            <h2>13. Contato e Encarregado de Dados</h2>
            <p>
              Para exercer seus direitos ou esclarecer dúvidas sobre esta política, entre em contato:
            </p>
            <div className="bg-neutral-100 p-4 rounded-lg">
              <p><strong>E-mail:</strong> privacidade@qmark.com.br</p>
              <p><strong>Encarregado de Dados:</strong> dpo@qmark.com.br</p>
              <p><strong>Telefone:</strong> +55 (11) 99999-9999</p>
              <p><strong>Endereço:</strong> [Seu endereço comercial]</p>
            </div>

            <h2>14. Autoridade Nacional de Proteção de Dados</h2>
            <p>
              Você também pode entrar em contato com a Autoridade Nacional de Proteção de Dados (ANPD) 
              através do site www.gov.br/anpd para questões relacionadas ao tratamento de dados pessoais.
            </p>

            <div className="border-t border-neutral-200 pt-6 mt-8">
              <p className="text-sm text-neutral-600 text-center">
                Este documento foi elaborado em conformidade com a Lei Geral de Proteção de Dados (LGPD) 
                e representa nosso compromisso com a transparência e proteção da sua privacidade.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}