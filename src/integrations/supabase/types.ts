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
          task_id: string
          title: string
        }
        Insert: {
          completed?: boolean
          created_at?: string
          id?: string
          task_id: string
          title: string
        }
        Update: {
          completed?: boolean
          created_at?: string
          id?: string
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
          notes: string | null
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
          notes?: string | null
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
          notes?: string | null
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
