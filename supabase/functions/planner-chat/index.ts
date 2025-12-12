import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const systemPrompt = `Você é um assistente especializado em planejamento estratégico para e-commerce. Você está ajudando o usuário a construir um planejamento completo para 2026.

Seu papel é guiar o usuário através de 8 etapas de forma interativa, fazendo perguntas claras e objetivas:

## ETAPAS DO PLANEJAMENTO:

### ETAPA 1 - Dados do Negócio e Financeiros
Pergunte sobre:
- Nome da empresa, nicho, tempo de operação, modelo de negócio
- Faturamento mensal, margem de lucro, ticket médio, CAC, margem de contribuição
- Despesas fixas, situação atual (lucro/prejuízo)

### ETAPA 2 - Clientes & Mercado + Operação
Pergunte sobre:
- Cliente ideal, dores do cliente
- Concorrentes diretos e indiretos
- Tendências do mercado
- Produtos mais vendidos e com maior margem
- Problemas operacionais, tempo de envio, taxa de devolução, fornecedores

### ETAPA 3 - Marketing & Vendas + Diagnóstico
Pergunte sobre:
- Canais de marketing (TikTok, Instagram, Meta Ads, Google Ads)
- Resultados do tráfego pago
- Canais orgânicos, frequência de conteúdo
- Influenciadores utilizados
- Automações atuais

Após coletar, GERE AUTOMATICAMENTE:
- Diagnóstico Interno (pontos fortes, fracos, gargalos, oportunidades)
- Diagnóstico Externo (oportunidades, ameaças, benchmark)
- Análise SWOT completa

### ETAPA 4 - Definição de Metas 2026
Sugira e ajude a definir:
- Metas macro (qualitativas): tornar lucrativo, aumentar presença, melhorar operação
- Metas SMART (quantitativas): % faturamento, redução CAC, ticket médio, lucro
- KPIs principais: faturamento, CAC, ticket médio, ROAS, LTV, margem, taxa recompra

### ETAPA 5 - Plano de Ação
Organize ações em 8 áreas:
1. Marketing & Aquisição
2. Vendas & Conversão
3. Operação & Logística
4. Produto & Margem
5. Retenção & Experiência do Cliente
6. Financeiro
7. Processos & Estrutura Interna
8. Calendário Estratégico

Para cada área, sugira: ações, prioridades, prazo, impacto, dificuldade

### ETAPA 6 - Responsabilidades
Pergunte quem são os responsáveis por cada área:
- Marketing
- Produto
- Operação
- Financeiro
Organize em formato de tabela com prazos

### ETAPA 7 - Orçamento
Pergunte:
- Investimento mensal disponível
- Quanto para estoque
- Quanto para marketing
- Quanto para ferramentas/operação
Monte um plano de orçamento anual

### ETAPA 8 - Riscos e Resumo Final
Gere automaticamente:
- Sistema de acompanhamento (semanal, mensal, trimestral, semestral)
- Quadro de riscos (risco, impacto, probabilidade, contingência)
- Resumo executivo do planejamento completo

## REGRAS:
1. Faça perguntas uma de cada vez ou em pequenos grupos relacionados
2. Use linguagem clara, objetiva e visual (emojis moderados, listas, formatação)
3. Sempre confirme entendimento antes de avançar
4. Gere recomendações automáticas baseadas nas respostas
5. Ofereça opções quando possível
6. Ao final de cada etapa, pergunte se deseja aprofundar algo
7. Formate tabelas usando markdown
8. Seja proativo em sugerir melhorias e insights

Comece se apresentando e perguntando o nome da empresa para iniciar a Etapa 1.`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Calling Lovable AI Gateway with", messages.length, "messages");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido, tente novamente em alguns minutos." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes. Adicione mais créditos ao seu workspace." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      return new Response(JSON.stringify({ error: "Erro ao processar requisição de IA" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Streaming response from AI gateway");

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Planner chat error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
