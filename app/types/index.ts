export type Role = 'vendedor' | 'assistente' | 'provador' | 'subgerente' | 'gerente' | 'gerente_regional'

export interface Company {
  id: string
  name: string
}

export interface Store {
  id: string
  companyId: string
  name: string
  location: string
}

export interface Employee {
  id: string
  name: string
  email: string
  role: Role
  color: string
  companyId: string
  /** Horas contratadas por semana (ex: 40 tempo inteiro, 30 ou 20 tempo parcial). */
  weeklyHours: number
  /** Dias de férias anuais atribuídos (dias úteis). Mínimo legal em Portugal: 22. */
  vacationDaysPerYear: number
  /** Loja onde o colaborador trabalha. Vazio apenas para gerentes regionais. */
  storeId?: string
  /** Lojas geridas por um gerente regional (role 'gerente_regional'). */
  managedStoreIds?: string[]
  /** Foto de perfil (data URL), carregada pelo próprio ou pela gestão. */
  photoUrl?: string | null
}

/** Tamanho máximo aceite para upload de foto de perfil (bytes). */
export const MAX_PHOTO_SIZE_BYTES = 2 * 1024 * 1024

export interface ShiftEntry {
  id: string
  employeeId: string
  date: string
  /** 'HH:mm'. null em ambos significa folga. */
  startTime: string | null
  endTime: string | null
}

/** Pausa de almoço, descontada do tempo entre startTime e endTime quando o turno ultrapassa BREAK_THRESHOLD_HOURS. */
export const BREAK_HOURS = 1

/** Turnos com esta duração ou menos não têm pausa de almoço. */
export const BREAK_THRESHOLD_HOURS = 6

/** Cargos com permissões de gestão da loja: alterar horários, aprovar/rejeitar/eliminar férias de outros. */
export const MANAGER_ROLES: Role[] = ['gerente', 'subgerente', 'gerente_regional']

/** Horário normal de funcionamento da loja, usado para gerar horários aleatórios dentro do período de abertura. */
export const STORE_OPENING_TIME = '09:00'
export const STORE_CLOSING_TIME = '23:30'

export interface ShiftAuditEntry {
  id: string
  /** Colaborador cujo horário mudou. */
  employeeId: string
  date: string
  /** Quem fez a alteração. */
  changedByEmployeeId: string
  changedAt: string
  previousLabel: string
  newLabel: string
}

export interface AppNotification {
  id: string
  /** Destinatário. */
  employeeId: string
  message: string
  createdAt: string
  read: boolean
}

export type VacationStatus = 'pendente' | 'aprovado' | 'rejeitado'

export interface VacationRequest {
  id: string
  employeeId: string
  startDate: string
  endDate: string
  status: VacationStatus
  notes?: string
}

export type VacationAuditAction = 'aprovado' | 'rejeitado' | 'eliminado'

export interface VacationAuditEntry {
  id: string
  /** Colaborador a quem pertence o pedido de férias. */
  employeeId: string
  startDate: string
  endDate: string
  action: VacationAuditAction
  /** Quem fez a ação. */
  changedByEmployeeId: string
  changedAt: string
}

export const VACATION_AUDIT_LABELS: Record<VacationAuditAction, string> = {
  aprovado: 'aprovou',
  rejeitado: 'rejeitou',
  eliminado: 'eliminou'
}

export const VACATION_AUDIT_COLORS: Record<VacationAuditAction, 'success' | 'error' | 'neutral'> = {
  aprovado: 'success',
  rejeitado: 'error',
  eliminado: 'neutral'
}

export const ROLE_LABELS: Record<Role, string> = {
  vendedor: 'Vendedor',
  assistente: 'Assistente',
  provador: 'Provador',
  subgerente: 'Subgerente',
  gerente: 'Gerente de Loja',
  gerente_regional: 'Gerente Regional'
}

export const ROLE_ORDER: Role[] = ['gerente', 'subgerente', 'vendedor', 'assistente', 'provador', 'gerente_regional']

export const ROLE_GROUPS: { label: string, icon: string, color: 'primary' | 'success' | 'info', roles: Role[] }[] = [
  { label: 'Gerência', icon: 'i-lucide-shield', color: 'primary', roles: ['gerente', 'subgerente'] },
  { label: 'Vendas', icon: 'i-lucide-shopping-bag', color: 'success', roles: ['vendedor'] },
  { label: 'Apoio', icon: 'i-lucide-life-buoy', color: 'info', roles: ['assistente', 'provador'] }
]

export const ROLE_COLORS: Record<Role, 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'neutral'> = {
  gerente: 'primary',
  subgerente: 'info',
  vendedor: 'success',
  assistente: 'warning',
  provador: 'neutral',
  gerente_regional: 'secondary'
}

export const WEEKLY_HOURS_OPTIONS = [40, 30, 20]

/** Mínimo legal de férias em Portugal: 22 dias úteis por ano. */
export const DEFAULT_VACATION_DAYS_PER_YEAR = 22

export interface MonthlyTarget {
  id: string
  storeId: string
  /** 'YYYY-MM'. */
  month: string
  target: number
}

export interface WeeklyTarget {
  id: string
  storeId: string
  /** Data ISO da segunda-feira da semana. */
  weekStart: string
  target: number
}

export interface StoreSalesEntry {
  id: string
  storeId: string
  date: string
  /** Objectivo. */
  target: number
  /** Apuro. */
  achieved: number
  totalClients: number
  /** Total de talões (inclui devoluções). */
  totalReceipts: number
  returns: number
  units: number
}

export interface EmployeeSalesEntry {
  id: string
  employeeId: string
  date: string
  /** Total de vendas. */
  salesValue: number
  units: number
  /** Clientes atendidos por este colaborador. */
  clientsServed: number
  /** Objetivo do dia, atribuído manualmente pela gestão. */
  target: number
}

export const PODIUM_COLORS: Record<number, string> = {
  0: '#f59e0b',
  1: '#94a3b8',
  2: '#f97316'
}

export const VACATION_STATUS_COLORS: Record<VacationStatus, 'warning' | 'success' | 'error'> = {
  pendente: 'warning',
  aprovado: 'success',
  rejeitado: 'error'
}

export const COLOR_HEX: Record<string, string> = {
  red: '#ef4444',
  orange: '#f97316',
  amber: '#f59e0b',
  lime: '#84cc16',
  green: '#22c55e',
  teal: '#14b8a6',
  cyan: '#06b6d4',
  sky: '#0ea5e9',
  blue: '#3b82f6',
  violet: '#8b5cf6',
  purple: '#a855f7',
  fuchsia: '#d946ef',
  pink: '#ec4899'
}

export const AVATAR_COLORS = Object.keys(COLOR_HEX)
