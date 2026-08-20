import Anthropic from '@anthropic-ai/sdk'
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod'
import { z } from 'zod'

const ShiftAssignmentSchema = z.object({
  employeeId: z.string(),
  date: z.string(),
  startTime: z.string().nullable(),
  endTime: z.string().nullable()
})

const WeeklyScheduleSchema = z.object({
  assignments: z.array(ShiftAssignmentSchema)
})

const RequestBodySchema = z.object({
  prompt: z.string().min(1),
  storeOpeningTime: z.string(),
  storeClosingTime: z.string(),
  weekDays: z.array(z.string()),
  employees: z.array(z.object({
    id: z.string(),
    name: z.string(),
    role: z.string(),
    weeklyHours: z.number(),
    vacationDates: z.array(z.string())
  }))
})

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  if (!config.anthropicApiKey) {
    throw createError({
      statusCode: 500,
      statusMessage: 'ANTHROPIC_API_KEY não está configurada no servidor. Define esta variável de ambiente e reinicia o servidor.'
    })
  }

  const body = await readValidatedBody(event, RequestBodySchema.parse)

  const client = new Anthropic({ apiKey: config.anthropicApiKey })

  const systemPrompt = `És um assistente que gera horários de trabalho semanais para uma loja de retalho em Portugal.
Regras obrigatórias:
- A loja abre à(s) ${body.storeOpeningTime} e fecha à(s) ${body.storeClosingTime}. Nenhum turno pode começar antes da abertura nem terminar depois do fecho.
- Cada colaborador tem uma carga horária semanal alvo ("weeklyHours"); distribui os turnos ao longo da semana para te aproximares desse total.
- "vacationDates" de cada colaborador são dias em que já está de férias — nunca atribuas turno nesses dias e não os incluas no resultado.
- Usa o formato "HH:mm" (24 horas) para "startTime"/"endTime". Para um dia de folga, usa null em ambos.
- Devolve exatamente um "assignment" por combinação de colaborador e dia da semana fornecido (exceto dias de férias, que devem ser omitidos).
- Segue o pedido do gerente o mais fielmente possível, respeitando sempre as regras acima.`

  const userContext = JSON.stringify({
    storeOpeningTime: body.storeOpeningTime,
    storeClosingTime: body.storeClosingTime,
    weekDays: body.weekDays,
    employees: body.employees
  })

  let response
  try {
    response = await client.messages.parse({
      model: 'claude-opus-5',
      max_tokens: 8000,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: `Contexto da loja e da equipa (JSON):\n${userContext}\n\nPedido do gerente: ${body.prompt}`
        }
      ],
      output_config: {
        format: zodOutputFormat(WeeklyScheduleSchema)
      }
    })
  } catch (err) {
    console.error('Anthropic API error', err)
    throw createError({ statusCode: 502, statusMessage: 'Falha ao contactar a IA para gerar o horário.' })
  }

  if (response.stop_reason === 'refusal') {
    throw createError({ statusCode: 422, statusMessage: 'O pedido foi recusado pelos filtros de segurança da IA. Tenta reformular o pedido.' })
  }

  if (!response.parsed_output) {
    throw createError({ statusCode: 502, statusMessage: 'A IA não devolveu um horário válido. Tenta novamente.' })
  }

  return response.parsed_output
})
