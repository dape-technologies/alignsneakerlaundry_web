<script setup>
import { computed, onMounted, ref } from 'vue'
import {
  PhArrowRight as ArrowRightIcon,
  PhCheckCircle as CheckCircleIcon,
  PhClock as ClockIcon,
  PhCurrencyCircleDollar as CurrencyCircleDollarIcon,
  PhPackage as PackageIcon,
  PhSneaker as ShoeIcon,
  PhTray as TrayIcon,
  PhUsers as UsersIcon,
  PhWashingMachine as WashingMachineIcon,
  PhX as CloseIcon,
} from '@phosphor-icons/vue'
import AppShell from '../components/AppShell.vue'
import CareBoardColumn from '../components/CareBoardColumn.vue'
import StatusBadge from '../components/StatusBadge.vue'
import { useAuthStore } from '../stores/auth'
import { api } from '../services/api'
import { dateTime, money } from '../lib/format'

const auth = useAuthStore()
const data = ref(null)
const error = ref('')
const notice = ref('')
const selectedStage = ref('all')
const busySession = ref(null)
const pendingMove = ref(null)
const moveLocks = new Set()

const stages = [
  { status: 'received', label: 'Received', icon: TrayIcon },
  { status: 'cleaning', label: 'In cleaning', icon: WashingMachineIcon },
  { status: 'ready_for_collection', label: 'Ready for collection', icon: CheckCircleIcon },
]

const dragNextStage = {
  received: 'cleaning',
  cleaning: 'ready_for_collection',
}

const activeStageNames = stages.map((stage) => stage.status)

const actionNextStage = {
  ...dragNextStage,
  ready_for_collection: 'collected',
}

const receivedSessions = ref([])
const cleaningSessions = ref([])
const readySessions = ref([])

const boardColumns = [
  { ...stages[0], sessions: receivedSessions },
  { ...stages[1], sessions: cleaningSessions },
  { ...stages[2], sessions: readySessions },
]

const filteredSessions = computed(() => {
  const sessions = data.value?.active_sessions || []
  return selectedStage.value === 'all'
    ? sessions
    : sessions.filter((session) => session.status === selectedStage.value)
})

function stageCount(status) {
  return data.value?.pipeline_counts?.[status] || 0
}

function setBoardSessions(sessions) {
  receivedSessions.value = sessions.filter((session) => session.status === 'received')
  cleaningSessions.value = sessions.filter((session) => session.status === 'cleaning')
  readySessions.value = sessions.filter((session) => session.status === 'ready_for_collection')
}

async function loadDashboard() {
  error.value = ''
  try {
    data.value = (await api.get('/dashboard')).data
    setBoardSessions(data.value.active_sessions || [])
  } catch {
    error.value = 'Dashboard data could not be loaded.'
  } finally {
    busySession.value = null
    moveLocks.clear()
  }
}

function handleBoardMove({ sessionId, from, to }) {
  const session = data.value?.active_sessions.find((item) => item.id === sessionId)
  if (!session || from === to || moveLocks.has(session.id) || !activeStageNames.includes(to)) return

  moveLocks.add(session.id)
  session.status = to
  setBoardSessions(data.value.active_sessions)
  requestMove(session, to, from)
}

function requestMove(session, to = actionNextStage[session.status], from = session.status) {
  if (!to || busySession.value) return

  if (to === 'ready_for_collection') {
    moveLocks.add(session.id)
    pendingMove.value = { session, from, to }
    return
  }

  persistMove(session, from, to)
}

async function persistMove(session, from, to) {
  busySession.value = session.id
  notice.value = ''
  error.value = ''
  try {
    await api.patch(`/cleaning-sessions/${session.id}/status`, {
      status: to,
      expected_status: from,
      notes: 'Updated from the care board.',
    })
    notice.value = `${session.shoe.reference} moved successfully.`
  } catch (requestError) {
    error.value = requestError.response?.data?.errors?.status?.[0]
      || requestError.response?.data?.message
      || 'The care stage could not be updated.'
  } finally {
    pendingMove.value = null
    await loadDashboard()
  }
}

function confirmReady() {
  if (!pendingMove.value) return
  const { session, from, to } = pendingMove.value
  persistMove(session, from, to)
}

async function cancelReady() {
  pendingMove.value = null
  await loadDashboard()
}

onMounted(loadDashboard)
</script>

<template>
  <AppShell>
    <header>
      <div>
        <p class="eyebrow">Today at Align</p>
        <h1 class="page-title">{{ auth.isAdmin ? 'Operations overview' : 'Care board' }}</h1>
      </div>
    </header>

    <div v-if="error" class="alert-error mt-6" role="alert">{{ error }}</div>
    <div v-if="notice" class="mt-6 rounded-lg border border-[#b8dfcf] bg-[#edf8f3] px-4 py-3 text-sm font-semibold text-[#245f4c]" role="status">{{ notice }}</div>

    <div v-if="!data" class="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4" aria-label="Loading dashboard">
      <div v-for="index in 4" :key="index" class="skeleton h-32"></div>
    </div>

    <template v-else>
      <section class="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4" aria-label="Key metrics">
        <article class="metric-block xl:col-span-2">
          <div class="metric-icon"><CurrencyCircleDollarIcon :size="25" /></div>
          <p>Revenue this month</p>
          <strong>{{ money(data.metrics.month_revenue) }}</strong>
          <span>{{ money(data.metrics.outstanding) }} outstanding</span>
        </article>
        <article class="metric-block">
          <div class="metric-icon"><PackageIcon :size="25" /></div>
          <p>Active orders</p>
          <strong>{{ data.metrics.active_orders }}</strong>
          <span>{{ data.metrics.today_orders }} received today</span>
        </article>
        <article class="metric-block">
          <div class="metric-icon"><UsersIcon :size="25" /></div>
          <p>Clients this month</p>
          <strong>{{ data.metrics.month_clients }}</strong>
          <span>{{ data.metrics.month_orders }} orders</span>
        </article>
      </section>

      <template v-if="auth.isAdmin">
        <section class="mt-10" aria-labelledby="pipeline-heading">
          <div class="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
            <div>
              <p class="eyebrow">Live workflow</p>
              <h2 id="pipeline-heading" class="section-title mt-1">Care pipeline</h2>
            </div>
            <button v-if="selectedStage !== 'all'" type="button" class="text-link self-start sm:self-auto" @click="selectedStage = 'all'">Show all active <CloseIcon :size="15" /></button>
          </div>

          <div class="pipeline-scroll mt-5">
            <div class="pipeline-track">
              <template v-for="(stage, index) in stages" :key="stage.status">
                <button
                  type="button"
                  class="pipeline-step"
                  :class="[`pipeline-step-${stage.status}`, { 'pipeline-step-active': selectedStage === stage.status }]"
                  :aria-pressed="selectedStage === stage.status"
                  @click="selectedStage = stage.status"
                >
                  <span class="pipeline-icon"><component :is="stage.icon" :size="22" /></span>
                  <span>
                    <strong>{{ stage.label }}</strong>
                    <small>{{ stageCount(stage.status) }} pair<span v-if="stageCount(stage.status) !== 1">s</span></small>
                  </span>
                  <b>{{ stageCount(stage.status) }}</b>
                </button>
                <span v-if="index < stages.length - 1" class="pipeline-connector" aria-hidden="true"><ArrowRightIcon :size="18" weight="bold" /></span>
              </template>
            </div>
          </div>
        </section>

        <section class="mt-10" aria-labelledby="active-footwear-heading">
          <div class="flex items-end justify-between gap-4">
            <div>
              <h2 id="active-footwear-heading" class="section-title">{{ selectedStage === 'all' ? 'Active footwear' : stages.find((stage) => stage.status === selectedStage)?.label }}</h2>
              <p class="mt-1 text-sm text-muted">{{ filteredSessions.length }} pair<span v-if="filteredSessions.length !== 1">s</span></p>
            </div>
            <RouterLink to="/orders" class="text-link">All orders <ArrowRightIcon :size="16" /></RouterLink>
          </div>

          <div v-if="filteredSessions.length" class="data-panel mt-4 overflow-x-auto">
            <table class="workflow-table">
              <thead><tr><th>Footwear</th><th>Client</th><th>Received</th><th>Order</th><th>Stage</th></tr></thead>
              <tbody>
                <tr v-for="session in filteredSessions" :key="session.id">
                  <td>
                    <div class="flex min-w-56 items-center gap-3">
                      <img v-if="session.shoe.reference_photo_url" :src="session.shoe.reference_photo_url" :alt="session.shoe.display_name" class="size-11 rounded-lg object-cover" />
                      <span v-else class="grid size-11 shrink-0 place-items-center rounded-lg bg-sky-soft text-sky-deep"><ShoeIcon :size="22" /></span>
                      <span><strong class="block text-navy">{{ session.shoe.display_name }}</strong><small class="font-bold text-sky-deep">{{ session.shoe.reference }}</small></span>
                    </div>
                  </td>
                  <td><strong class="text-navy">{{ session.order.client.name }}</strong></td>
                  <td class="text-muted">{{ dateTime(session.received_at) }}</td>
                  <td><RouterLink :to="`/orders/${session.order.id}`" class="text-link">{{ session.order.reference }}</RouterLink></td>
                  <td><StatusBadge :status="session.status" /></td>
                </tr>
              </tbody>
            </table>
          </div>
          <div v-else class="empty-state mt-4"><CheckCircleIcon :size="34" class="text-sky-deep" /><h3>No footwear here</h3><p>This stage is clear.</p></div>
        </section>
      </template>

      <section v-else class="mt-10" aria-labelledby="care-board-heading">
        <div class="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
          <div>
            <p class="eyebrow">Drag between stages</p>
            <h2 id="care-board-heading" class="section-title mt-1">Active footwear</h2>
          </div>
          <p class="flex items-center gap-2 text-sm font-semibold text-muted"><ClockIcon :size="17" /> {{ data.active_sessions.length }} in progress</p>
        </div>

        <div class="board-scroll mt-5">
          <div class="care-board">
            <CareBoardColumn
              v-for="column in boardColumns"
              :key="column.status"
              :status="column.status"
              :label="column.label"
              :icon="column.icon"
              :sessions="column.sessions.value"
              :busy-session="busySession"
              @move="handleBoardMove"
              @action="requestMove"
            />
          </div>
        </div>
        <p class="mt-4 text-xs font-semibold text-muted">Tip: use the action button when dragging is not convenient.</p>
      </section>
    </template>

    <div v-if="pendingMove" class="dialog-backdrop" role="presentation" @click.self="cancelReady">
      <section role="alertdialog" aria-modal="true" aria-labelledby="ready-dialog-title" class="confirm-dialog">
        <span class="metric-icon"><CheckCircleIcon :size="24" /></span>
        <h2 id="ready-dialog-title" class="mt-4 text-xl font-bold text-navy">Mark as ready?</h2>
        <p class="mt-2 text-sm leading-6 text-muted">The client will receive a pickup email for {{ pendingMove.session.shoe.reference }}.</p>
        <div class="mt-6 grid grid-cols-2 gap-3">
          <button type="button" class="button-secondary justify-center" :disabled="busySession" @click="cancelReady">Cancel</button>
          <button type="button" class="button-primary justify-center" :disabled="busySession" @click="confirmReady">{{ busySession ? 'Updating…' : 'Confirm' }}</button>
        </div>
      </section>
    </div>
  </AppShell>
</template>

<style scoped>
.pipeline-scroll,
.board-scroll { overflow-x: auto; padding-bottom: .35rem; }
.pipeline-track { display: grid; grid-template-columns: minmax(12rem, 1fr) 3.25rem minmax(12rem, 1fr) 3.25rem minmax(12rem, 1fr); min-width: 48rem; align-items: center; }
.pipeline-step { --stage-accent: #60778a; --stage-bg: #f4f7f9; --stage-icon: #e5ecf1; --stage-border: #d6e0e7; display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: .85rem; min-height: 6.75rem; padding: 1.1rem; border: 1px solid var(--stage-border); border-radius: .8rem; background: var(--stage-bg); text-align: left; transition: border-color .18s ease, box-shadow .18s ease, transform .18s ease; }
.pipeline-step-received { --stage-accent: #5c7182; --stage-bg: #f3f6f8; --stage-icon: #e2e9ee; --stage-border: #d3dde4; }
.pipeline-step-cleaning { --stage-accent: #147eae; --stage-bg: #eef8fc; --stage-icon: #d9f0fa; --stage-border: #c5e5f2; }
.pipeline-step-ready_for_collection { --stage-accent: #32725c; --stage-bg: #eef8f3; --stage-icon: #dcefe6; --stage-border: #c9e4d8; }
.pipeline-step:hover { border-color: var(--stage-accent); transform: translateY(-2px); }
.pipeline-step:focus-visible { outline: 3px solid color-mix(in srgb, var(--stage-accent) 28%, transparent); outline-offset: 3px; }
.pipeline-step-active { border-color: var(--stage-accent); box-shadow: 0 10px 24px color-mix(in srgb, var(--stage-accent) 14%, transparent), 0 0 0 1px var(--stage-accent); }
.pipeline-icon { display: grid; width: 2.8rem; height: 2.8rem; place-items: center; border-radius: .7rem; background: var(--stage-icon); color: var(--stage-accent); }
.pipeline-step strong { display: block; color: #123451; font-size: .95rem; }
.pipeline-step small { display: block; margin-top: .25rem; color: #668096; font-weight: 600; }
.pipeline-step b { color: var(--stage-accent); font-size: 1.8rem; line-height: 1; font-variant-numeric: tabular-nums; }
.pipeline-connector { display: grid; place-items: center; color: #8ca0af; }
.workflow-table { width: 100%; min-width: 58rem; border-collapse: collapse; font-size: .875rem; }
.workflow-table th { padding: .85rem 1rem; background: #f4f9fc; color: #668096; font-size: .7rem; letter-spacing: .06em; text-align: left; text-transform: uppercase; }
.workflow-table td { padding: 1rem; border-top: 1px solid var(--color-line); }
.care-board { display: grid; grid-template-columns: repeat(3, minmax(18rem, 1fr)); gap: 1rem; min-width: 58rem; }
.dialog-backdrop { position: fixed; inset: 0; z-index: 60; display: grid; place-items: center; padding: 1rem; background: rgba(9, 29, 45, .5); backdrop-filter: blur(3px); }
.confirm-dialog { width: min(100%, 25rem); padding: 1.5rem; border: 1px solid #d4e4ed; border-radius: 1rem; background: white; box-shadow: 0 24px 70px rgba(9, 29, 45, .22); }
@media (max-width: 640px) {
  .pipeline-track { min-width: 40rem; grid-template-columns: minmax(10rem, 1fr) 2rem minmax(10rem, 1fr) 2rem minmax(10rem, 1fr); }
  .pipeline-step { min-height: 5.75rem; padding: .85rem; }
  .pipeline-step b { font-size: 1.4rem; }
}
</style>
