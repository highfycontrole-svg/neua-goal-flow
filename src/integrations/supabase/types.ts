export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      ad_anuncios: {
        Row: {
          aprendizado_funcionou: string | null
          aprendizado_nao_funcionou: string | null
          aprendizado_recomendacoes: string | null
          copy_anuncio: string | null
          created_at: string
          formato: string
          gancho_principal: string | null
          id: string
          insight_especifico: string | null
          link_anuncio_pronto: string | null
          link_referencia: string | null
          observacoes: string | null
          pack_id: string
          roteiro_visual: Json | null
          status_performance: string | null
          status_producao: string
          titulo: string
          updated_at: string
          user_id: string
        }
        Insert: {
          aprendizado_funcionou?: string | null
          aprendizado_nao_funcionou?: string | null
          aprendizado_recomendacoes?: string | null
          copy_anuncio?: string | null
          created_at?: string
          formato?: string
          gancho_principal?: string | null
          id?: string
          insight_especifico?: string | null
          link_anuncio_pronto?: string | null
          link_referencia?: string | null
          observacoes?: string | null
          pack_id: string
          roteiro_visual?: Json | null
          status_performance?: string | null
          status_producao?: string
          titulo: string
          updated_at?: string
          user_id: string
        }
        Update: {
          aprendizado_funcionou?: string | null
          aprendizado_nao_funcionou?: string | null
          aprendizado_recomendacoes?: string | null
          copy_anuncio?: string | null
          created_at?: string
          formato?: string
          gancho_principal?: string | null
          id?: string
          insight_especifico?: string | null
          link_anuncio_pronto?: string | null
          link_referencia?: string | null
          observacoes?: string | null
          pack_id?: string
          roteiro_visual?: Json | null
          status_performance?: string | null
          status_producao?: string
          titulo?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ad_anuncios_pack_id_fkey"
            columns: ["pack_id"]
            isOneToOne: false
            referencedRelation: "ad_packs"
            referencedColumns: ["id"]
          },
        ]
      }
      ad_packs: {
        Row: {
          campaign_id: string | null
          created_at: string
          id: string
          insight_central: string | null
          nome: string
          produto_id: string | null
          promessa_principal: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          campaign_id?: string | null
          created_at?: string
          id?: string
          insight_central?: string | null
          nome: string
          produto_id?: string | null
          promessa_principal?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          campaign_id?: string | null
          created_at?: string
          id?: string
          insight_central?: string | null
          nome?: string
          produto_id?: string | null
          promessa_principal?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ad_packs_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_packs_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
        ]
      }
      arquitetos: {
        Row: {
          arroba_principal: string | null
          classificacao_tier:
            | Database["public"]["Enums"]["tier_classificacao"]
            | null
          condicao_obrigacao_conteudo: string | null
          created_at: string | null
          cupom_exclusivo: string | null
          data_entrada_club: string | null
          data_envio_boas_vindas: string | null
          email_contato: string | null
          endereco_completo: string | null
          id: string
          link_contrato_assinado: string | null
          links_redes_sociais: Json | null
          nome_completo: string
          notas_internas: string | null
          produto_boas_vindas_enviado: string | null
          seguidores_entrada: number | null
          status_arquiteto:
            | Database["public"]["Enums"]["status_arquiteto"]
            | null
          telefone_contato: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          arroba_principal?: string | null
          classificacao_tier?:
            | Database["public"]["Enums"]["tier_classificacao"]
            | null
          condicao_obrigacao_conteudo?: string | null
          created_at?: string | null
          cupom_exclusivo?: string | null
          data_entrada_club?: string | null
          data_envio_boas_vindas?: string | null
          email_contato?: string | null
          endereco_completo?: string | null
          id?: string
          link_contrato_assinado?: string | null
          links_redes_sociais?: Json | null
          nome_completo: string
          notas_internas?: string | null
          produto_boas_vindas_enviado?: string | null
          seguidores_entrada?: number | null
          status_arquiteto?:
            | Database["public"]["Enums"]["status_arquiteto"]
            | null
          telefone_contato?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          arroba_principal?: string | null
          classificacao_tier?:
            | Database["public"]["Enums"]["tier_classificacao"]
            | null
          condicao_obrigacao_conteudo?: string | null
          created_at?: string | null
          cupom_exclusivo?: string | null
          data_entrada_club?: string | null
          data_envio_boas_vindas?: string | null
          email_contato?: string | null
          endereco_completo?: string | null
          id?: string
          link_contrato_assinado?: string | null
          links_redes_sociais?: Json | null
          nome_completo?: string
          notas_internas?: string | null
          produto_boas_vindas_enviado?: string | null
          seguidores_entrada?: number | null
          status_arquiteto?:
            | Database["public"]["Enums"]["status_arquiteto"]
            | null
          telefone_contato?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      campaigns: {
        Row: {
          created_at: string
          description: string | null
          end_date: string | null
          id: string
          name: string
          start_date: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          name: string
          start_date?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          name?: string
          start_date?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      desempenho_financeiro: {
        Row: {
          arquiteto_id: string
          comissao_base: number | null
          comissao_escalavel: number | null
          comissao_total_a_pagar: number | null
          created_at: string | null
          data_pagamento: string | null
          historico_classificacao_tier: Json | null
          id: string
          mes_referencia: string
          status_pagamento:
            | Database["public"]["Enums"]["status_pagamento"]
            | null
          taxa_conversao_cupom: number | null
          ticket_medio: number | null
          updated_at: string | null
          user_id: string
          valor_total_vendido: number | null
          vendas_pedidos: number | null
        }
        Insert: {
          arquiteto_id: string
          comissao_base?: number | null
          comissao_escalavel?: number | null
          comissao_total_a_pagar?: number | null
          created_at?: string | null
          data_pagamento?: string | null
          historico_classificacao_tier?: Json | null
          id?: string
          mes_referencia: string
          status_pagamento?:
            | Database["public"]["Enums"]["status_pagamento"]
            | null
          taxa_conversao_cupom?: number | null
          ticket_medio?: number | null
          updated_at?: string | null
          user_id: string
          valor_total_vendido?: number | null
          vendas_pedidos?: number | null
        }
        Update: {
          arquiteto_id?: string
          comissao_base?: number | null
          comissao_escalavel?: number | null
          comissao_total_a_pagar?: number | null
          created_at?: string | null
          data_pagamento?: string | null
          historico_classificacao_tier?: Json | null
          id?: string
          mes_referencia?: string
          status_pagamento?:
            | Database["public"]["Enums"]["status_pagamento"]
            | null
          taxa_conversao_cupom?: number | null
          ticket_medio?: number | null
          updated_at?: string | null
          user_id?: string
          valor_total_vendido?: number | null
          vendas_pedidos?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "desempenho_financeiro_arquiteto_id_fkey"
            columns: ["arquiteto_id"]
            isOneToOne: false
            referencedRelation: "arquitetos"
            referencedColumns: ["id"]
          },
        ]
      }
      despesas: {
        Row: {
          canal: string | null
          categoria: string
          created_at: string
          data: string
          descricao: string | null
          forma_pagamento: string | null
          id: string
          pedido_id: string | null
          recorrente: boolean
          subcategoria: string | null
          updated_at: string
          user_id: string
          valor: number
        }
        Insert: {
          canal?: string | null
          categoria: string
          created_at?: string
          data?: string
          descricao?: string | null
          forma_pagamento?: string | null
          id?: string
          pedido_id?: string | null
          recorrente?: boolean
          subcategoria?: string | null
          updated_at?: string
          user_id: string
          valor?: number
        }
        Update: {
          canal?: string | null
          categoria?: string
          created_at?: string
          data?: string
          descricao?: string | null
          forma_pagamento?: string | null
          id?: string
          pedido_id?: string | null
          recorrente?: boolean
          subcategoria?: string | null
          updated_at?: string
          user_id?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "despesas_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedidos"
            referencedColumns: ["id"]
          },
        ]
      }
      fluxo_caixa: {
        Row: {
          categoria: string | null
          created_at: string
          data: string
          descricao: string | null
          id: string
          realizado: boolean
          tipo: string
          updated_at: string
          user_id: string
          valor: number
        }
        Insert: {
          categoria?: string | null
          created_at?: string
          data: string
          descricao?: string | null
          id?: string
          realizado?: boolean
          tipo: string
          updated_at?: string
          user_id: string
          valor?: number
        }
        Update: {
          categoria?: string | null
          created_at?: string
          data?: string
          descricao?: string | null
          id?: string
          realizado?: boolean
          tipo?: string
          updated_at?: string
          user_id?: string
          valor?: number
        }
        Relationships: []
      }
      gravacoes: {
        Row: {
          created_at: string
          descricao: string | null
          id: string
          link_arquivo: string | null
          origem: string
          origem_id: string | null
          status: string
          tags: string[] | null
          titulo: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          descricao?: string | null
          id?: string
          link_arquivo?: string | null
          origem?: string
          origem_id?: string | null
          status?: string
          tags?: string[] | null
          titulo: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          descricao?: string | null
          id?: string
          link_arquivo?: string | null
          origem?: string
          origem_id?: string | null
          status?: string
          tags?: string[] | null
          titulo?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      interacoes: {
        Row: {
          arquiteto_id: string
          assunto_motivo: string | null
          created_at: string | null
          data_interacao: string | null
          id: string
          proxima_acao_follow_up: string | null
          responsavel_interacao: string | null
          resumo_interacao: string | null
          tipo_interacao: Database["public"]["Enums"]["tipo_interacao"]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          arquiteto_id: string
          assunto_motivo?: string | null
          created_at?: string | null
          data_interacao?: string | null
          id?: string
          proxima_acao_follow_up?: string | null
          responsavel_interacao?: string | null
          resumo_interacao?: string | null
          tipo_interacao: Database["public"]["Enums"]["tipo_interacao"]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          arquiteto_id?: string
          assunto_motivo?: string | null
          created_at?: string | null
          data_interacao?: string | null
          id?: string
          proxima_acao_follow_up?: string | null
          responsavel_interacao?: string | null
          resumo_interacao?: string | null
          tipo_interacao?: Database["public"]["Enums"]["tipo_interacao"]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "interacoes_arquiteto_id_fkey"
            columns: ["arquiteto_id"]
            isOneToOne: false
            referencedRelation: "arquitetos"
            referencedColumns: ["id"]
          },
        ]
      }
      kpi_cac_canal: {
        Row: {
          ano: number
          cac_google_ads: number | null
          cac_grupo_vip: number | null
          cac_meta_ads: number | null
          cac_organico: number | null
          created_at: string | null
          id: string
          mes: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          ano: number
          cac_google_ads?: number | null
          cac_grupo_vip?: number | null
          cac_meta_ads?: number | null
          cac_organico?: number | null
          created_at?: string | null
          id?: string
          mes: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          ano?: number
          cac_google_ads?: number | null
          cac_grupo_vip?: number | null
          cac_meta_ads?: number | null
          cac_organico?: number | null
          created_at?: string | null
          id?: string
          mes?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      kpi_grupo_vip: {
        Row: {
          cliques_links: number | null
          created_at: string | null
          id: string
          investimento: number | null
          mensagens_enviadas: number | null
          notas: string | null
          novos_membros: number | null
          receita_atribuida: number | null
          semana_inicio: string
          total_membros: number | null
          updated_at: string | null
          user_id: string
          vendas_atribuidas: number | null
        }
        Insert: {
          cliques_links?: number | null
          created_at?: string | null
          id?: string
          investimento?: number | null
          mensagens_enviadas?: number | null
          notas?: string | null
          novos_membros?: number | null
          receita_atribuida?: number | null
          semana_inicio: string
          total_membros?: number | null
          updated_at?: string | null
          user_id: string
          vendas_atribuidas?: number | null
        }
        Update: {
          cliques_links?: number | null
          created_at?: string | null
          id?: string
          investimento?: number | null
          mensagens_enviadas?: number | null
          notas?: string | null
          novos_membros?: number | null
          receita_atribuida?: number | null
          semana_inicio?: string
          total_membros?: number | null
          updated_at?: string | null
          user_id?: string
          vendas_atribuidas?: number | null
        }
        Relationships: []
      }
      kpi_manychat: {
        Row: {
          created_at: string | null
          ctr_fluxo: number | null
          disparos: number | null
          id: string
          investimento: number | null
          leads_gerados: number | null
          notas: string | null
          pct_conclusao: number | null
          ponto_abandono: string | null
          receita_atribuida: number | null
          semana_inicio: string
          updated_at: string | null
          user_id: string
          vendas_atribuidas: number | null
        }
        Insert: {
          created_at?: string | null
          ctr_fluxo?: number | null
          disparos?: number | null
          id?: string
          investimento?: number | null
          leads_gerados?: number | null
          notas?: string | null
          pct_conclusao?: number | null
          ponto_abandono?: string | null
          receita_atribuida?: number | null
          semana_inicio: string
          updated_at?: string | null
          user_id: string
          vendas_atribuidas?: number | null
        }
        Update: {
          created_at?: string | null
          ctr_fluxo?: number | null
          disparos?: number | null
          id?: string
          investimento?: number | null
          leads_gerados?: number | null
          notas?: string | null
          pct_conclusao?: number | null
          ponto_abandono?: string | null
          receita_atribuida?: number | null
          semana_inicio?: string
          updated_at?: string | null
          user_id?: string
          vendas_atribuidas?: number | null
        }
        Relationships: []
      }
      logistica_conteudo: {
        Row: {
          arquiteto_id: string
          codigo_rastreio: string | null
          confirmacao_recebimento: boolean | null
          created_at: string | null
          cupom_mencionado_conteudo: boolean | null
          data_envio_efetiva: string | null
          data_ultimo_envio_produto: string | null
          id: string
          link_reel: string | null
          links_stories: string | null
          mes_referencia: string
          obrigacao_conteudo_mensal: string | null
          observacoes_conteudo: string | null
          produtos_enviados_sku: string | null
          proxima_data_envio_programada: string | null
          qualidade_conteudo_avaliacao: number | null
          status_envio: Database["public"]["Enums"]["status_envio"] | null
          status_reel: Database["public"]["Enums"]["status_conteudo"] | null
          status_stories: Database["public"]["Enums"]["status_conteudo"] | null
          tipo_envio: Database["public"]["Enums"]["tipo_envio"] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          arquiteto_id: string
          codigo_rastreio?: string | null
          confirmacao_recebimento?: boolean | null
          created_at?: string | null
          cupom_mencionado_conteudo?: boolean | null
          data_envio_efetiva?: string | null
          data_ultimo_envio_produto?: string | null
          id?: string
          link_reel?: string | null
          links_stories?: string | null
          mes_referencia: string
          obrigacao_conteudo_mensal?: string | null
          observacoes_conteudo?: string | null
          produtos_enviados_sku?: string | null
          proxima_data_envio_programada?: string | null
          qualidade_conteudo_avaliacao?: number | null
          status_envio?: Database["public"]["Enums"]["status_envio"] | null
          status_reel?: Database["public"]["Enums"]["status_conteudo"] | null
          status_stories?: Database["public"]["Enums"]["status_conteudo"] | null
          tipo_envio?: Database["public"]["Enums"]["tipo_envio"] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          arquiteto_id?: string
          codigo_rastreio?: string | null
          confirmacao_recebimento?: boolean | null
          created_at?: string | null
          cupom_mencionado_conteudo?: boolean | null
          data_envio_efetiva?: string | null
          data_ultimo_envio_produto?: string | null
          id?: string
          link_reel?: string | null
          links_stories?: string | null
          mes_referencia?: string
          obrigacao_conteudo_mensal?: string | null
          observacoes_conteudo?: string | null
          produtos_enviados_sku?: string | null
          proxima_data_envio_programada?: string | null
          qualidade_conteudo_avaliacao?: number | null
          status_envio?: Database["public"]["Enums"]["status_envio"] | null
          status_reel?: Database["public"]["Enums"]["status_conteudo"] | null
          status_stories?: Database["public"]["Enums"]["status_conteudo"] | null
          tipo_envio?: Database["public"]["Enums"]["tipo_envio"] | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "logistica_conteudo_arquiteto_id_fkey"
            columns: ["arquiteto_id"]
            isOneToOne: false
            referencedRelation: "arquitetos"
            referencedColumns: ["id"]
          },
        ]
      }
      marketing_campanhas: {
        Row: {
          cpa: number | null
          created_at: string
          data_fim: string | null
          data_inicio: string
          id: string
          investimento: number
          nome_campanha: string
          pedidos_gerados: number
          plataforma: string
          receita_gerada: number
          roas: number | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cpa?: number | null
          created_at?: string
          data_fim?: string | null
          data_inicio: string
          id?: string
          investimento?: number
          nome_campanha: string
          pedidos_gerados?: number
          plataforma: string
          receita_gerada?: number
          roas?: number | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cpa?: number | null
          created_at?: string
          data_fim?: string | null
          data_inicio?: string
          id?: string
          investimento?: number
          nome_campanha?: string
          pedidos_gerados?: number
          plataforma?: string
          receita_gerada?: number
          roas?: number | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      marketing_influenciadores: {
        Row: {
          created_at: string
          custo: number
          custo_por_pedido: number | null
          data_fim: string | null
          data_inicio: string | null
          id: string
          nome: string
          pedidos_gerados: number
          plataforma: string
          receita_gerada: number
          roi: number | null
          status: string
          tipo_pagamento: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          custo?: number
          custo_por_pedido?: number | null
          data_fim?: string | null
          data_inicio?: string | null
          id?: string
          nome: string
          pedidos_gerados?: number
          plataforma: string
          receita_gerada?: number
          roi?: number | null
          status?: string
          tipo_pagamento?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          custo?: number
          custo_por_pedido?: number | null
          data_fim?: string | null
          data_inicio?: string | null
          id?: string
          nome?: string
          pedidos_gerados?: number
          plataforma?: string
          receita_gerada?: number
          roi?: number | null
          status?: string
          tipo_pagamento?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      meta_connections: {
        Row: {
          access_token: string
          connected_at: string
          id: string
          meta_user_id: string | null
          meta_user_name: string | null
          selected_ad_account_id: string | null
          selected_ad_account_name: string | null
          token_expires_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token: string
          connected_at?: string
          id?: string
          meta_user_id?: string | null
          meta_user_name?: string | null
          selected_ad_account_id?: string | null
          selected_ad_account_name?: string | null
          token_expires_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string
          connected_at?: string
          id?: string
          meta_user_id?: string | null
          meta_user_name?: string | null
          selected_ad_account_id?: string | null
          selected_ad_account_name?: string | null
          token_expires_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      meta_insights_cache: {
        Row: {
          ad_account_id: string
          date_start: string
          date_stop: string
          id: string
          level: string
          metrics: Json | null
          object_id: string
          object_name: string | null
          synced_at: string
          user_id: string
        }
        Insert: {
          ad_account_id: string
          date_start: string
          date_stop: string
          id?: string
          level: string
          metrics?: Json | null
          object_id: string
          object_name?: string | null
          synced_at?: string
          user_id: string
        }
        Update: {
          ad_account_id?: string
          date_start?: string
          date_stop?: string
          id?: string
          level?: string
          metrics?: Json | null
          object_id?: string
          object_name?: string | null
          synced_at?: string
          user_id?: string
        }
        Relationships: []
      }
      metas: {
        Row: {
          ano: number
          created_at: string
          descricao: string | null
          id: string
          mes: number
          nome: string
          prioridade: string
          setor_id: string
          status: boolean
          tipo: string | null
          updated_at: string
          user_id: string
          valor_meta: string
          valor_realizado: string
        }
        Insert: {
          ano: number
          created_at?: string
          descricao?: string | null
          id?: string
          mes: number
          nome: string
          prioridade?: string
          setor_id: string
          status?: boolean
          tipo?: string | null
          updated_at?: string
          user_id: string
          valor_meta: string
          valor_realizado?: string
        }
        Update: {
          ano?: number
          created_at?: string
          descricao?: string | null
          id?: string
          mes?: number
          nome?: string
          prioridade?: string
          setor_id?: string
          status?: boolean
          tipo?: string | null
          updated_at?: string
          user_id?: string
          valor_meta?: string
          valor_realizado?: string
        }
        Relationships: [
          {
            foreignKeyName: "metas_setor_id_fkey"
            columns: ["setor_id"]
            isOneToOne: false
            referencedRelation: "setores"
            referencedColumns: ["id"]
          },
        ]
      }
      mindos_edges: {
        Row: {
          animated: boolean | null
          created_at: string
          edge_type: string | null
          id: string
          label: string | null
          project_id: string
          source_node_id: string
          style: Json | null
          target_node_id: string
        }
        Insert: {
          animated?: boolean | null
          created_at?: string
          edge_type?: string | null
          id?: string
          label?: string | null
          project_id: string
          source_node_id: string
          style?: Json | null
          target_node_id: string
        }
        Update: {
          animated?: boolean | null
          created_at?: string
          edge_type?: string | null
          id?: string
          label?: string | null
          project_id?: string
          source_node_id?: string
          style?: Json | null
          target_node_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mindos_edges_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "mindos_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mindos_edges_source_node_id_fkey"
            columns: ["source_node_id"]
            isOneToOne: false
            referencedRelation: "mindos_nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mindos_edges_target_node_id_fkey"
            columns: ["target_node_id"]
            isOneToOne: false
            referencedRelation: "mindos_nodes"
            referencedColumns: ["id"]
          },
        ]
      }
      mindos_nodes: {
        Row: {
          attachments: Json | null
          content: Json | null
          created_at: string
          height: number | null
          icon_category: string | null
          icon_name: string | null
          id: string
          node_type: Database["public"]["Enums"]["mindos_node_type"]
          position_x: number
          position_y: number
          project_id: string
          status: string | null
          style: Json | null
          tags: string[] | null
          updated_at: string
          width: number | null
        }
        Insert: {
          attachments?: Json | null
          content?: Json | null
          created_at?: string
          height?: number | null
          icon_category?: string | null
          icon_name?: string | null
          id?: string
          node_type?: Database["public"]["Enums"]["mindos_node_type"]
          position_x?: number
          position_y?: number
          project_id: string
          status?: string | null
          style?: Json | null
          tags?: string[] | null
          updated_at?: string
          width?: number | null
        }
        Update: {
          attachments?: Json | null
          content?: Json | null
          created_at?: string
          height?: number | null
          icon_category?: string | null
          icon_name?: string | null
          id?: string
          node_type?: Database["public"]["Enums"]["mindos_node_type"]
          position_x?: number
          position_y?: number
          project_id?: string
          status?: string | null
          style?: Json | null
          tags?: string[] | null
          updated_at?: string
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "mindos_nodes_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "mindos_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      mindos_projects: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          thumbnail_url: string | null
          type: Database["public"]["Enums"]["mindos_project_type"]
          updated_at: string
          user_id: string
          viewport: Json | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          thumbnail_url?: string | null
          type: Database["public"]["Enums"]["mindos_project_type"]
          updated_at?: string
          user_id: string
          viewport?: Json | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          thumbnail_url?: string | null
          type?: Database["public"]["Enums"]["mindos_project_type"]
          updated_at?: string
          user_id?: string
          viewport?: Json | null
        }
        Relationships: []
      }
      pedidos: {
        Row: {
          codigos_rastreio: string[] | null
          created_at: string
          id: string
          numero_pedido: string
          prazo_entrega: number | null
          status: string
          status_entrega: string | null
          transportadora: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          codigos_rastreio?: string[] | null
          created_at?: string
          id?: string
          numero_pedido: string
          prazo_entrega?: number | null
          status?: string
          status_entrega?: string | null
          transportadora?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          codigos_rastreio?: string[] | null
          created_at?: string
          id?: string
          numero_pedido?: string
          prazo_entrega?: number | null
          status?: string
          status_entrega?: string | null
          transportadora?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      planner_2026: {
        Row: {
          automacao_atual: string | null
          cac_medio: number | null
          canais_marketing: string | null
          canais_organicos: string | null
          cliente_ideal: string | null
          concorrentes_diretos: string | null
          concorrentes_indiretos: string | null
          created_at: string
          despesas_fixas: number | null
          diagnostico_externo: Json | null
          diagnostico_interno: Json | null
          dores_cliente: string | null
          etapa_atual: number | null
          faturamento_mensal: number | null
          fornecedores: string | null
          frequencia_conteudo: string | null
          id: string
          influenciadores: string | null
          kpis: Json | null
          margem_contribuicao: number | null
          margem_lucro: number | null
          metas_macro: Json | null
          metas_smart: Json | null
          modelo_negocio: string | null
          nicho: string | null
          nome_empresa: string | null
          orcamento: Json | null
          plano_acao: Json | null
          problemas_operacionais: string | null
          produtos_maior_margem: string | null
          produtos_mais_vendidos: string | null
          responsaveis: Json | null
          resultados_trafego: string | null
          resumo_executivo: string | null
          riscos: Json | null
          sistema_acompanhamento: Json | null
          situacao_atual: string | null
          swot: Json | null
          taxa_devolucao: number | null
          tempo_medio_envio: string | null
          tempo_operacao: string | null
          tendencias_mercado: string | null
          ticket_medio: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          automacao_atual?: string | null
          cac_medio?: number | null
          canais_marketing?: string | null
          canais_organicos?: string | null
          cliente_ideal?: string | null
          concorrentes_diretos?: string | null
          concorrentes_indiretos?: string | null
          created_at?: string
          despesas_fixas?: number | null
          diagnostico_externo?: Json | null
          diagnostico_interno?: Json | null
          dores_cliente?: string | null
          etapa_atual?: number | null
          faturamento_mensal?: number | null
          fornecedores?: string | null
          frequencia_conteudo?: string | null
          id?: string
          influenciadores?: string | null
          kpis?: Json | null
          margem_contribuicao?: number | null
          margem_lucro?: number | null
          metas_macro?: Json | null
          metas_smart?: Json | null
          modelo_negocio?: string | null
          nicho?: string | null
          nome_empresa?: string | null
          orcamento?: Json | null
          plano_acao?: Json | null
          problemas_operacionais?: string | null
          produtos_maior_margem?: string | null
          produtos_mais_vendidos?: string | null
          responsaveis?: Json | null
          resultados_trafego?: string | null
          resumo_executivo?: string | null
          riscos?: Json | null
          sistema_acompanhamento?: Json | null
          situacao_atual?: string | null
          swot?: Json | null
          taxa_devolucao?: number | null
          tempo_medio_envio?: string | null
          tempo_operacao?: string | null
          tendencias_mercado?: string | null
          ticket_medio?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          automacao_atual?: string | null
          cac_medio?: number | null
          canais_marketing?: string | null
          canais_organicos?: string | null
          cliente_ideal?: string | null
          concorrentes_diretos?: string | null
          concorrentes_indiretos?: string | null
          created_at?: string
          despesas_fixas?: number | null
          diagnostico_externo?: Json | null
          diagnostico_interno?: Json | null
          dores_cliente?: string | null
          etapa_atual?: number | null
          faturamento_mensal?: number | null
          fornecedores?: string | null
          frequencia_conteudo?: string | null
          id?: string
          influenciadores?: string | null
          kpis?: Json | null
          margem_contribuicao?: number | null
          margem_lucro?: number | null
          metas_macro?: Json | null
          metas_smart?: Json | null
          modelo_negocio?: string | null
          nicho?: string | null
          nome_empresa?: string | null
          orcamento?: Json | null
          plano_acao?: Json | null
          problemas_operacionais?: string | null
          produtos_maior_margem?: string | null
          produtos_mais_vendidos?: string | null
          responsaveis?: Json | null
          resultados_trafego?: string | null
          resumo_executivo?: string | null
          riscos?: Json | null
          sistema_acompanhamento?: Json | null
          situacao_atual?: string | null
          swot?: Json | null
          taxa_devolucao?: number | null
          tempo_medio_envio?: string | null
          tempo_operacao?: string | null
          tendencias_mercado?: string | null
          ticket_medio?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      planner_2026_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          planner_id: string
          role: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          planner_id: string
          role: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          planner_id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "planner_2026_messages_planner_id_fkey"
            columns: ["planner_id"]
            isOneToOne: false
            referencedRelation: "planner_2026"
            referencedColumns: ["id"]
          },
        ]
      }
      planner_eventos: {
        Row: {
          created_at: string
          data_fim: string | null
          data_inicio: string
          descricao: string | null
          duracao_minutos: number | null
          hora_inicio: string | null
          id: string
          observacoes: string | null
          status: string
          tipo: string
          titulo: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data_fim?: string | null
          data_inicio: string
          descricao?: string | null
          duracao_minutos?: number | null
          hora_inicio?: string | null
          id?: string
          observacoes?: string | null
          status?: string
          tipo: string
          titulo: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          data_fim?: string | null
          data_inicio?: string
          descricao?: string | null
          duracao_minutos?: number | null
          hora_inicio?: string | null
          id?: string
          observacoes?: string | null
          status?: string
          tipo?: string
          titulo?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      planner_ideias: {
        Row: {
          created_at: string
          descricao: string | null
          id: string
          qualidade: string
          resultado: string | null
          status: string
          tipo: string
          tipo_customizado: string | null
          titulo: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          descricao?: string | null
          id?: string
          qualidade?: string
          resultado?: string | null
          status?: string
          tipo: string
          tipo_customizado?: string | null
          titulo: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          descricao?: string | null
          id?: string
          qualidade?: string
          resultado?: string | null
          status?: string
          tipo?: string
          tipo_customizado?: string | null
          titulo?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      planners_manuais: {
        Row: {
          conteudo: Json
          created_at: string
          id: string
          nome: string
          tipo: string
          updated_at: string
          user_id: string
        }
        Insert: {
          conteudo?: Json
          created_at?: string
          id?: string
          nome: string
          tipo: string
          updated_at?: string
          user_id: string
        }
        Update: {
          conteudo?: Json
          created_at?: string
          id?: string
          nome?: string
          tipo?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      product_variants: {
        Row: {
          created_at: string
          foto_url: string | null
          id: string
          nome: string
          preco_custo: number
          preco_venda: number
          product_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          foto_url?: string | null
          id?: string
          nome: string
          preco_custo?: number
          preco_venda?: number
          product_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          foto_url?: string | null
          id?: string
          nome?: string
          preco_custo?: number
          preco_venda?: number
          product_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
        ]
      }
      produtos: {
        Row: {
          categoria: string | null
          colecao: string | null
          created_at: string
          foto_url: string | null
          frete: number
          id: string
          link_produto: string | null
          lucro: number
          margem_liquida: number
          markup: number
          nome: string
          preco_custo: number
          preco_venda: number
          ranking: string
          status: string
          total_taxas: number
          updated_at: string
          user_id: string
        }
        Insert: {
          categoria?: string | null
          colecao?: string | null
          created_at?: string
          foto_url?: string | null
          frete?: number
          id?: string
          link_produto?: string | null
          lucro?: number
          margem_liquida?: number
          markup?: number
          nome: string
          preco_custo?: number
          preco_venda?: number
          ranking?: string
          status?: string
          total_taxas?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          categoria?: string | null
          colecao?: string | null
          created_at?: string
          foto_url?: string | null
          frete?: number
          id?: string
          link_produto?: string | null
          lucro?: number
          margem_liquida?: number
          markup?: number
          nome?: string
          preco_custo?: number
          preco_venda?: number
          ranking?: string
          status?: string
          total_taxas?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      produtos_financeiro: {
        Row: {
          created_at: string
          custo_logistico_medio: number
          custo_unitario: number
          fornecedor: string | null
          id: string
          margem_produto: number | null
          prazo_medio_dias: number | null
          preco_venda: number
          produto_id: string | null
          sku: string | null
          taxa_problema: number | null
          tipo: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          custo_logistico_medio?: number
          custo_unitario?: number
          fornecedor?: string | null
          id?: string
          margem_produto?: number | null
          prazo_medio_dias?: number | null
          preco_venda?: number
          produto_id?: string | null
          sku?: string | null
          taxa_problema?: number | null
          tipo?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          custo_logistico_medio?: number
          custo_unitario?: number
          fornecedor?: string | null
          id?: string
          margem_produto?: number | null
          prazo_medio_dias?: number | null
          preco_venda?: number
          produto_id?: string | null
          sku?: string | null
          taxa_problema?: number | null
          tipo?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "produtos_financeiro_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
        ]
      }
      receitas: {
        Row: {
          created_at: string
          data: string
          descricao: string | null
          forma_recebimento: string | null
          id: string
          origem: string
          pedido_id: string | null
          status: string
          taxas: number
          updated_at: string
          user_id: string
          valor_bruto: number
          valor_liquido: number | null
        }
        Insert: {
          created_at?: string
          data?: string
          descricao?: string | null
          forma_recebimento?: string | null
          id?: string
          origem?: string
          pedido_id?: string | null
          status?: string
          taxas?: number
          updated_at?: string
          user_id: string
          valor_bruto?: number
          valor_liquido?: number | null
        }
        Update: {
          created_at?: string
          data?: string
          descricao?: string | null
          forma_recebimento?: string | null
          id?: string
          origem?: string
          pedido_id?: string | null
          status?: string
          taxas?: number
          updated_at?: string
          user_id?: string
          valor_bruto?: number
          valor_liquido?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "receitas_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedidos"
            referencedColumns: ["id"]
          },
        ]
      }
      setores: {
        Row: {
          created_at: string
          id: string
          nome: string
        }
        Insert: {
          created_at?: string
          id?: string
          nome: string
        }
        Update: {
          created_at?: string
          id?: string
          nome?: string
        }
        Relationships: []
      }
      super_metas: {
        Row: {
          ano: number
          created_at: string
          descricao: string | null
          id: string
          mes: number
          meta_id: string | null
          nome: string
          prioridade: string
          setor_id: string
          status: boolean
          tipo: string | null
          updated_at: string
          user_id: string
          valor_meta: string
          valor_realizado: string
        }
        Insert: {
          ano: number
          created_at?: string
          descricao?: string | null
          id?: string
          mes: number
          meta_id?: string | null
          nome: string
          prioridade?: string
          setor_id: string
          status?: boolean
          tipo?: string | null
          updated_at?: string
          user_id: string
          valor_meta: string
          valor_realizado?: string
        }
        Update: {
          ano?: number
          created_at?: string
          descricao?: string | null
          id?: string
          mes?: number
          meta_id?: string | null
          nome?: string
          prioridade?: string
          setor_id?: string
          status?: boolean
          tipo?: string | null
          updated_at?: string
          user_id?: string
          valor_meta?: string
          valor_realizado?: string
        }
        Relationships: [
          {
            foreignKeyName: "super_metas_meta_id_fkey"
            columns: ["meta_id"]
            isOneToOne: false
            referencedRelation: "metas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "super_metas_setor_id_fkey"
            columns: ["setor_id"]
            isOneToOne: false
            referencedRelation: "setores"
            referencedColumns: ["id"]
          },
        ]
      }
      utm_campaigns: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      utm_links: {
        Row: {
          base_url: string
          campaign_id: string
          created_at: string
          id: string
          label: string | null
          user_id: string
          utm_campaign: string
          utm_content: string | null
          utm_medium: string
          utm_source: string
          utm_term: string | null
        }
        Insert: {
          base_url: string
          campaign_id: string
          created_at?: string
          id?: string
          label?: string | null
          user_id: string
          utm_campaign: string
          utm_content?: string | null
          utm_medium: string
          utm_source: string
          utm_term?: string | null
        }
        Update: {
          base_url?: string
          campaign_id?: string
          created_at?: string
          id?: string
          label?: string | null
          user_id?: string
          utm_campaign?: string
          utm_content?: string | null
          utm_medium?: string
          utm_source?: string
          utm_term?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "utm_links_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "utm_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_statuses: {
        Row: {
          color: string
          created_at: string
          id: string
          name: string
          order_index: number
          workspace_id: string
        }
        Insert: {
          color: string
          created_at?: string
          id?: string
          name: string
          order_index: number
          workspace_id: string
        }
        Update: {
          color?: string
          created_at?: string
          id?: string
          name?: string
          order_index?: number
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_statuses_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_subtasks: {
        Row: {
          completed: boolean
          created_at: string
          id: string
          order_index: number | null
          task_id: string
          title: string
        }
        Insert: {
          completed?: boolean
          created_at?: string
          id?: string
          order_index?: number | null
          task_id: string
          title: string
        }
        Update: {
          completed?: boolean
          created_at?: string
          id?: string
          order_index?: number | null
          task_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_subtasks_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "workspace_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_tasks: {
        Row: {
          created_at: string
          date: string | null
          description: string | null
          id: string
          links: string[] | null
          notes: string | null
          order_index: number | null
          precisa_gravar: string | null
          responsible: string | null
          status_id: string | null
          tags: string[] | null
          title: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          date?: string | null
          description?: string | null
          id?: string
          links?: string[] | null
          notes?: string | null
          order_index?: number | null
          precisa_gravar?: string | null
          responsible?: string | null
          status_id?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          date?: string | null
          description?: string | null
          id?: string
          links?: string[] | null
          notes?: string | null
          order_index?: number | null
          precisa_gravar?: string | null
          responsible?: string | null
          status_id?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_tasks_status_id_fkey"
            columns: ["status_id"]
            isOneToOne: false
            referencedRelation: "workspace_statuses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_tasks_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspaces: {
        Row: {
          created_at: string
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      mindos_node_type: "idea" | "task" | "text" | "icon"
      mindos_project_type: "mindmap" | "flowchart"
      status_arquiteto: "Ativo" | "Em Análise" | "Pausado" | "Desligado"
      status_conteudo: "Entregue" | "Pendente" | "Atrasado" | "Não Aplicável"
      status_envio: "Enviado" | "Em Trânsito" | "Entregue" | "Problema"
      status_pagamento: "Pendente" | "Pago" | "Em Revisão"
      tier_classificacao: "Bronze" | "Prata" | "Ouro" | "Platina"
      tipo_envio:
        | "Kit Trimestral"
        | "Lançamento"
        | "Evento Especial"
        | "Boas-Vindas"
      tipo_interacao: "E-mail" | "Ligação" | "WhatsApp" | "Reunião" | "Feedback"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      mindos_node_type: ["idea", "task", "text", "icon"],
      mindos_project_type: ["mindmap", "flowchart"],
      status_arquiteto: ["Ativo", "Em Análise", "Pausado", "Desligado"],
      status_conteudo: ["Entregue", "Pendente", "Atrasado", "Não Aplicável"],
      status_envio: ["Enviado", "Em Trânsito", "Entregue", "Problema"],
      status_pagamento: ["Pendente", "Pago", "Em Revisão"],
      tier_classificacao: ["Bronze", "Prata", "Ouro", "Platina"],
      tipo_envio: [
        "Kit Trimestral",
        "Lançamento",
        "Evento Especial",
        "Boas-Vindas",
      ],
      tipo_interacao: ["E-mail", "Ligação", "WhatsApp", "Reunião", "Feedback"],
    },
  },
} as const
