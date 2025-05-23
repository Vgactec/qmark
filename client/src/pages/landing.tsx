import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Zap, 
  Shield, 
  BarChart3, 
  Users, 
  MessageCircle, 
  Mail,
  Facebook,
  Instagram,
  ArrowRight,
  CheckCircle
} from "lucide-react";

export default function Landing() {
  const features = [
    {
      icon: <Zap className="h-6 w-6" />,
      title: "Gestão Inteligente",
      description: "Gerencie suas campanhas de marketing e vendas com workflows eficientes"
    },
    {
      icon: <Shield className="h-6 w-6" />,
      title: "Segurança LGPD",
      description: "Armazenamento seguro com criptografia AES256 em conformidade com a LGPD"
    },
    {
      icon: <BarChart3 className="h-6 w-6" />,
      title: "Relatórios em Tempo Real",
      description: "Acompanhe o desempenho das suas campanhas com métricas detalhadas"
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: "Gestão de Leads",
      description: "Capture e gerencie leads de múltiplas plataformas em um só lugar"
    }
  ];

  const integrations = [
    { name: "Facebook", icon: <Facebook className="h-5 w-5" />, color: "text-blue-600" },
    { name: "Instagram", icon: <Instagram className="h-5 w-5" />, color: "text-pink-600" },
    { name: "Gmail", icon: <Mail className="h-5 w-5" />, color: "text-red-600" },
    { name: "WhatsApp", icon: <MessageCircle className="h-5 w-5" />, color: "text-green-600" }
  ];

  const benefits = [
    "Conexões OAuth2 seguras com principais plataformas",
    "Workflows manuais para gerenciamento de marketing digital",
    "Dashboard unificado com métricas em tempo real",
    "Gestão inteligente de leads e conversões",
    "Conformidade com LGPD e proteção de dados",
    "Suporte especializado para micro-empreendedores"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100">
      {/* Header */}
      <header className="border-b border-neutral-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">Q</span>
              </div>
              <span className="text-xl font-bold text-neutral-900">QMARK</span>
              <span className="hidden sm:block text-sm text-neutral-600">|</span>
              <span className="hidden sm:block text-sm text-neutral-600">MicroInFortal</span>
            </div>
            <Button asChild>
              <a href="/api/login">
                Entrar
                <ArrowRight className="ml-2 h-4 w-4" />
              </a>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <Badge variant="outline" className="mb-4">
            🇧🇷 Feito especialmente para micro-empreendedores brasileiros
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold text-neutral-900 mb-6">
            Gerencie seu
            <span className="text-primary"> Marketing Digital</span>
          </h1>
          <p className="text-xl text-neutral-600 mb-8 max-w-3xl mx-auto">
            Conecte suas redes sociais, planeje campanhas e gerencie leads 
            de forma inteligente. Tudo em uma plataforma segura e fácil de usar.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <a href="/api/login">
                Começar Gratuitamente
                <ArrowRight className="ml-2 h-5 w-5" />
              </a>
            </Button>
            <Button size="lg" variant="outline">
              Ver Demonstração
            </Button>
          </div>
        </div>
      </section>

      {/* Integrations */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-neutral-900 mb-4">
            Conecte suas plataformas favoritas
          </h2>
          <p className="text-center text-neutral-600 mb-12 max-w-2xl mx-auto">
            Integrações seguras via OAuth2 com as principais plataformas de marketing digital
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {integrations.map((integration) => (
              <div key={integration.name} className="text-center">
                <div className={`w-16 h-16 mx-auto mb-4 rounded-lg bg-neutral-100 flex items-center justify-center ${integration.color}`}>
                  {integration.icon}
                </div>
                <h3 className="font-medium text-neutral-900">{integration.name}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-neutral-900 mb-4">
            Tudo que você precisa para crescer
          </h2>
          <p className="text-center text-neutral-600 mb-12 max-w-2xl mx-auto">
            Ferramentas profissionais pensadas especialmente para micro-empreendedores
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="text-center">
                <CardHeader>
                  <div className="w-12 h-12 mx-auto mb-4 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                    {feature.icon}
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>{feature.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-neutral-900 mb-6">
                Por que escolher o QMARK?
              </h2>
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-secondary mt-0.5 flex-shrink-0" />
                    <span className="text-neutral-700">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-gradient-to-br from-primary/5 to-secondary/5 rounded-2xl p-8">
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Dashboard Unificado</CardTitle>
                  <CardDescription>
                    Monitore todas as suas métricas em tempo real
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-neutral-600">Leads Capturados</span>
                      <span className="font-bold text-lg">324</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-neutral-600">Conversões</span>
                      <span className="font-bold text-lg text-secondary">89</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-neutral-600">Automações Ativas</span>
                      <span className="font-bold text-lg text-primary">12</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-primary">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Pronto para melhorar seu negócio?
          </h2>
          <p className="text-xl text-primary-foreground/80 mb-8 max-w-2xl mx-auto">
            Junte-se a centenas de micro-empreendedores que já estão 
            transformando seus resultados com o QMARK.
          </p>
          <Button size="lg" variant="secondary" asChild>
            <a href="/api/login">
              Começar Agora - É Gratuito
              <ArrowRight className="ml-2 h-5 w-5" />
            </a>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 sm:px-6 lg:px-8 bg-neutral-900 text-white">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-6 h-6 bg-primary rounded-md flex items-center justify-center">
              <span className="text-white font-bold text-sm">Q</span>
            </div>
            <span className="font-bold">QMARK</span>
          </div>
          <p className="text-sm text-neutral-400 mb-2">
            Plataforma SaaS para automatização de marketing digital
          </p>
          <p className="text-xs text-neutral-500">
            Desenvolvido em conformidade com a LGPD | Dados protegidos com criptografia AES256
          </p>
        </div>
      </footer>
    </div>
  );
}
