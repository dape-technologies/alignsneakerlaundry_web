<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import {
  PhCheckCircle as CheckCircleIcon,
  PhClock as ClockIcon,
  PhCurrencyCircleDollar as CurrencyCircleDollarIcon,
  PhPackage as PackageIcon,
  PhSneaker as ShoeIcon,
  PhTray as TrayIcon,
  PhUsers as UsersIcon,
  PhWashingMachine as WashingMachineIcon,
} from '@phosphor-icons/vue'
import AppShell from '../components/AppShell.vue'
import CareBoardColumn from '../components/CareBoardColumn.vue'
import { useAuthStore } from '../stores/auth'
import { api } from '../services/api'
import { dateTime, money } from '../lib/format'

const auth = useAuthStore()
const data = ref(null)
const error = ref('')
const notice = ref('')
const selectedStage = ref('received')
const busySession = ref(null)
const pendingMove = ref(null)
const cancellationReason = ref('')
const touchDrag = ref(null)
const touchDropStage = ref(null)
const moveLocks = new Set()
let noticeTimer

const stages = [
  { status: 'received', label: 'Received', icon: TrayIcon },
  { status: 'cleaning', label: 'In cleaning', icon: WashingMachineIcon },
  { status: 'ready_for_collection', label: 'Ready for collection', icon: CheckCircleIcon },
]

const allowedMoves = {
  received: ['cleaning'],
  cleaning: ['received', 'ready_for_collection'],
  ready_for_collection: ['cleaning'],
}

const activeStageNames = stages.map((stage) => stage.status)

const actionNextStage = {
  received: 'cancelled',
  cleaning: 'ready_for_collection',
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

const selectedStageSessions = computed(() => (data.value?.active_sessions || [])
  .filter((session) => session.status === selectedStage.value))
const selectedStageLabel = computed(() => stages.find((stage) => stage.status === selectedStage.value)?.label || '')

function stageCount(status) {
  return data.value?.pipeline_counts?.[status] || 0
}

function setBoardSessions(sessions) {
  receivedSessions.value = sessions.filter((session) => session.status === 'received')
  cleaningSessions.value = sessions.filter((session) => session.status === 'cleaning')
  readySessions.value = sessions.filter((session) => session.status === 'ready_for_collection')
}

function showNotice(message) {
  window.clearTimeout(noticeTimer)
  notice.value = message
  noticeTimer = window.setTimeout(() => {
    notice.value = ''
  }, 2200)
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
  if (!session || from === to || moveLocks.has(session.id) || !allowedMoves[from]?.includes(to)) return

  moveLocks.add(session.id)
  session.status = to
  setBoardSessions(data.value.active_sessions)
  requestMove(session, to, from)
}

function columnAtPoint(clientX, clientY) {
  const element = document.elementFromPoint(clientX, clientY)
  return element?.closest?.('[data-care-column-status]')?.dataset.careColumnStatus || null
}

function scrollBoardAtEdge(clientX, clientY) {
  const board = [...document.querySelectorAll('[data-care-board-scroll]')].find((element) => {
    const bounds = element.getBoundingClientRect()
    return clientY >= bounds.top && clientY <= bounds.bottom
  })
  if (!board) return

  const bounds = board.getBoundingClientRect()
  const edge = 52
  if (clientX >= bounds.right - edge) board.scrollLeft += 22
  if (clientX <= bounds.left + edge) board.scrollLeft -= 22
}

function startTouchMove(payload) {
  touchDrag.value = { sessionId: payload.sessionId, from: payload.from }
  touchDropStage.value = payload.from
}

function updateTouchMove({ clientX, clientY }) {
  if (!touchDrag.value) return
  scrollBoardAtEdge(clientX, clientY)
  const stage = columnAtPoint(clientX, clientY)
  if (activeStageNames.includes(stage)) touchDropStage.value = stage
}

function finishTouchMove({ clientX, clientY }) {
  if (!touchDrag.value) return
  const move = touchDrag.value
  const stageAtRelease = columnAtPoint(clientX, clientY)
  const to = activeStageNames.includes(stageAtRelease) ? stageAtRelease : touchDropStage.value
  touchDrag.value = null
  touchDropStage.value = null
  if (to && to !== move.from) handleBoardMove({ ...move, to })
}

function cancelTouchMove() {
  touchDrag.value = null
  touchDropStage.value = null
}

function requestMove(session, to = actionNextStage[session.status], from = session.status) {
  if (!to || busySession.value) return

  if (to === 'cancelled') {
    cancellationReason.value = ''
    pendingMove.value = { session, from, to, kind: 'cancel' }
    return
  }

  if (to === 'ready_for_collection') {
    moveLocks.add(session.id)
    pendingMove.value = { session, from, to, kind: 'ready' }
    return
  }

  if (to === 'collected' && session.order.balance > 0) {
    error.value = 'Record the full outstanding payment before collection.'
    return
  }

  persistMove(session, from, to)
}

async function persistMove(session, from, to, notes = 'Updated from the care board.') {
  busySession.value = session.id
  notice.value = ''
  error.value = ''
  try {
    await api.patch(`/cleaning-sessions/${session.id}/status`, {
      status: to,
      expected_status: from,
      notes,
    })
    showNotice(`${session.shoe.reference} moved`)
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

function confirmCancellation() {
  if (!pendingMove.value || !cancellationReason.value.trim()) return
  const { session, from, to } = pendingMove.value
  persistMove(session, from, to, cancellationReason.value.trim())
}

async function cancelReady() {
  pendingMove.value = null
  cancellationReason.value = ''
  await loadDashboard()
}

onMounted(loadDashboard)
onBeforeUnmount(() => window.clearTimeout(noticeTimer))
</script>

<template>
  <AppShell>
    <header>
      <div>
        <p class="eyebrow">Today at Go Fresh</p>
        <h1 class="page-title">{{ auth.isAdmin ? 'Operations overview' : 'Care board' }}</h1>
      </div>
    </header>

    <div v-if="error" class="alert-error mt-6" role="alert">{{ error }}</div>
    <Transition name="toast">
      <div v-if="notice" class="board-toast" role="status" aria-live="polite">
        <CheckCircleIcon :size="15" weight="fill" />
        {{ notice }}
      </div>
    </Transition>

    <div v-if="!data" class="overview-metrics mt-8" aria-label="Loading dashboard">
      <div v-for="index in 3" :key="index" class="skeleton h-32"></div>
    </div>

    <template v-else>
      <section class="overview-metrics mt-8" aria-label="Key metrics">
        <article class="metric-block">
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

      <section v-if="auth.isAdmin" class="mt-10" aria-labelledby="shoe-progress-heading">
        <div class="flex items-end justify-between gap-4">
          <div>
            <p class="eyebrow">Live workflow</p>
            <h2 id="shoe-progress-heading" class="section-title mt-1">Shoe progress</h2>
          </div>
          <p class="flex items-center gap-2 text-sm font-semibold text-muted"><ClockIcon :size="17" /> {{ data.active_sessions.length }} in progress</p>
        </div>

        <div class="stage-tiles mt-5" role="tablist" aria-label="Footwear care stages">
          <button
            v-for="stage in stages"
            :id="`stage-tab-${stage.status}`"
            :key="stage.status"
            type="button"
            role="tab"
            class="stage-tile"
            :class="[`stage-tile-${stage.status}`, { 'stage-tile-active': selectedStage === stage.status }]"
            :aria-selected="selectedStage === stage.status"
            aria-controls="stage-footwear-panel"
            @click="selectedStage = stage.status"
          >
            <span class="stage-tile-icon"><component :is="stage.icon" :size="21" /></span>
            <span class="stage-tile-copy"><strong>{{ stage.label }}</strong><small>Footwear</small></span>
            <b>{{ stageCount(stage.status) }}</b>
          </button>
        </div>

        <section
          id="stage-footwear-panel"
          class="data-panel mt-4 overflow-x-auto"
          role="tabpanel"
          :aria-labelledby="`stage-tab-${selectedStage}`"
        >
          <div class="stage-table-heading">
            <h3>{{ selectedStageLabel }}</h3>
            <span>{{ selectedStageSessions.length }} pair<span v-if="selectedStageSessions.length !== 1">s</span></span>
          </div>
          <table v-if="selectedStageSessions.length" class="data-table min-w-[760px]">
            <thead><tr><th>Footwear</th><th>Client</th><th>Order</th><th>Service</th><th>Received</th></tr></thead>
            <tbody>
              <tr v-for="session in selectedStageSessions" :key="session.id">
                <td>
                  <div class="flex min-w-52 items-center gap-3">
                    <img v-if="session.shoe.reference_photo_url" :src="session.shoe.reference_photo_url" :alt="session.shoe.display_name" class="size-10 rounded-lg object-cover" />
                    <span v-else class="grid size-10 shrink-0 place-items-center rounded-lg bg-sky-soft text-sky-deep"><ShoeIcon :size="20" /></span>
                    <span><strong class="block text-navy">{{ session.shoe.display_name }}</strong><small class="font-bold text-sky-deep">{{ session.shoe.reference }}<template v-if="session.tag"> · {{ session.tag.label }}</template></small></span>
                  </div>
                </td>
                <td><strong class="block text-navy">{{ session.order.client.name }}</strong><span class="text-xs text-muted">{{ session.order.client.phone }}</span></td>
                <td><RouterLink :to="`/orders/${session.order.id}`" class="text-link">{{ session.order.reference }}</RouterLink></td>
                <td class="font-semibold text-navy">{{ session.service }}</td>
                <td class="whitespace-nowrap text-muted">{{ dateTime(session.received_at) }}</td>
              </tr>
            </tbody>
          </table>
          <div v-else class="stage-table-empty"><CheckCircleIcon :size="24" /><span>No footwear in this stage</span></div>
        </section>

      </section>

      <section v-else class="mt-10" aria-labelledby="care-board-heading">
        <div class="flex items-end justify-between gap-4">
          <div>
            <p class="eyebrow">Drag between stages</p>
            <h2 id="care-board-heading" class="section-title mt-1">Roadmap</h2>
          </div>
        </div>

        <div class="board-scroll mt-5" data-care-board-scroll>
          <div class="care-board">
            <CareBoardColumn
              v-for="column in boardColumns"
              :key="column.status"
              :status="column.status"
              :label="column.label"
              :icon="column.icon"
              :sessions="column.sessions.value"
              :busy-session="busySession"
              :touch-drop-active="touchDropStage === column.status && touchDrag?.from !== column.status"
              @move="handleBoardMove"
              @action="requestMove"
              @touch-drag-start="startTouchMove"
              @touch-drag-move="updateTouchMove"
              @touch-drop="finishTouchMove"
              @touch-drag-cancel="cancelTouchMove"
            />
          </div>
        </div>
        <p class="mt-4 text-xs font-semibold text-muted">Tip: use the action button when dragging is not convenient.</p>
      </section>
    </template>

    <div v-if="pendingMove" class="dialog-backdrop" role="presentation" @click.self="cancelReady">
      <section role="alertdialog" aria-modal="true" :aria-labelledby="pendingMove.kind === 'cancel' ? 'cancel-dialog-title' : 'ready-dialog-title'" class="confirm-dialog">
        <span class="metric-icon"><CheckCircleIcon :size="24" /></span>
        <template v-if="pendingMove.kind === 'cancel'">
          <h2 id="cancel-dialog-title" class="mt-4 text-xl font-bold text-navy">Cancel order?</h2>
          <label class="field mt-4"><span>Reason<span class="required-mark" aria-hidden="true">*</span></span><textarea v-model="cancellationReason" rows="2" required autofocus placeholder="Add a cancellation reason"></textarea></label>
        </template>
        <template v-else>
          <h2 id="ready-dialog-title" class="mt-4 text-xl font-bold text-navy">Mark as ready?</h2>
          <p class="mt-2 text-sm leading-6 text-muted">The client will receive a pickup email for {{ pendingMove.session.shoe.reference }}.</p>
        </template>
        <div class="mt-6 grid grid-cols-2 gap-3">
          <button type="button" class="button-secondary justify-center" :disabled="busySession" @click="cancelReady">Back</button>
          <button v-if="pendingMove.kind === 'cancel'" type="button" class="button-primary justify-center" :disabled="busySession || !cancellationReason.trim()" @click="confirmCancellation">{{ busySession ? 'Cancelling…' : 'Cancel order' }}</button>
          <button v-else type="button" class="button-primary justify-center" :disabled="busySession" @click="confirmReady">{{ busySession ? 'Updating…' : 'Confirm' }}</button>
        </div>
      </section>
    </div>
  </AppShell>
</template>

<style scoped>
.board-scroll { overflow-x: auto; padding-bottom: .35rem; }
.overview-metrics { display: grid; grid-template-columns: repeat(3, minmax(13rem, 1fr)); gap: .75rem; overflow-x: auto; padding-bottom: .35rem; scrollbar-width: none; scroll-snap-type: x proximity; }
.overview-metrics::-webkit-scrollbar { display: none; }
.overview-metrics > * { scroll-snap-align: start; }
.stage-tiles { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: .65rem; }
.stage-tile { --stage-accent: #60778a; --stage-bg: #f3f6f8; --stage-border: #d3dde4; display: grid; grid-template-columns: auto minmax(0, 1fr) auto; min-height: 6rem; align-items: center; gap: .75rem; padding: .9rem 1rem; border: 1px solid var(--stage-border); border-radius: .8rem; background: var(--stage-bg); text-align: left; transition: border-color .18s ease, box-shadow .18s ease, transform .18s ease; }
.stage-tile-received { --stage-accent: #5c7182; --stage-bg: #f3f6f8; --stage-border: #d3dde4; }
.stage-tile-cleaning { --stage-accent: #147eae; --stage-bg: #eef8fc; --stage-border: #c5e5f2; }
.stage-tile-ready_for_collection { --stage-accent: #32725c; --stage-bg: #eef8f3; --stage-border: #c9e4d8; }
.stage-tile:hover { border-color: var(--stage-accent); transform: translateY(-1px); }
.stage-tile:focus-visible { outline: 3px solid color-mix(in srgb, var(--stage-accent) 26%, transparent); outline-offset: 2px; }
.stage-tile-active { border-color: var(--stage-accent); box-shadow: 0 9px 22px color-mix(in srgb, var(--stage-accent) 13%, transparent); }
.stage-tile-icon { display: grid; width: 2.5rem; height: 2.5rem; place-items: center; border-radius: .65rem; background: color-mix(in srgb, var(--stage-accent) 12%, white); color: var(--stage-accent); }
.stage-tile-copy { min-width: 0; }
.stage-tile-copy strong { display: block; color: #123451; font-size: .88rem; line-height: 1.1; }
.stage-tile-copy small { display: block; margin-top: .25rem; color: #6c8292; font-size: .68rem; font-weight: 650; }
.stage-tile b { color: var(--stage-accent); font-size: 1.65rem; font-variant-numeric: tabular-nums; line-height: 1; }
.stage-table-heading { display: flex; align-items: center; justify-content: space-between; padding: .85rem 1rem; border-bottom: 1px solid var(--color-line); }
.stage-table-heading h3 { color: #123451; font-size: .95rem; font-weight: 750; }
.stage-table-heading span { color: #64788a; font-size: .75rem; font-weight: 700; }
.stage-table-empty { display: flex; min-height: 8rem; align-items: center; justify-content: center; gap: .6rem; color: #6c8292; font-size: .82rem; font-weight: 700; }
.care-board { display: grid; grid-template-columns: repeat(3, minmax(18rem, 1fr)); gap: 1rem; min-width: 58rem; }
.board-toast { position: fixed; right: 1rem; bottom: 1rem; z-index: 70; display: inline-flex; max-width: calc(100vw - 2rem); align-items: center; gap: .4rem; padding: .5rem .65rem; border: 1px solid #b8dfcf; border-radius: .55rem; background: #edf8f3; color: #245f4c; box-shadow: 0 10px 28px rgba(9, 29, 45, .14); font-size: .75rem; font-weight: 700; line-height: 1; pointer-events: none; }
.toast-enter-active, .toast-leave-active { transition: opacity .16s ease, transform .16s ease; }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translateY(.4rem); }
.dialog-backdrop { position: fixed; inset: 0; z-index: 60; display: grid; place-items: center; padding: 1rem; background: rgba(9, 29, 45, .5); backdrop-filter: blur(3px); }
.confirm-dialog { width: min(100%, 25rem); padding: 1.5rem; border: 1px solid #d4e4ed; border-radius: 1rem; background: white; box-shadow: 0 24px 70px rgba(9, 29, 45, .22); }
@media (max-width: 640px) {
  .stage-tiles { gap: .4rem; }
  .stage-tile { min-height: 5.5rem; grid-template-columns: 1fr auto; gap: .35rem; padding: .65rem; }
  .stage-tile-icon { width: 2rem; height: 2rem; }
  .stage-tile-copy { grid-column: 1 / -1; grid-row: 2; }
  .stage-tile-copy strong { min-height: 1.55rem; font-size: .72rem; }
  .stage-tile-copy small { display: none; }
  .stage-tile b { grid-column: 2; grid-row: 1; font-size: 1.25rem; }
  .board-toast { right: auto; left: 50%; transform: translateX(-50%); }
  .toast-enter-from, .toast-leave-to { opacity: 0; transform: translate(-50%, .4rem); }
}
@media (min-width: 768px) {
  .overview-metrics { grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 1rem; overflow: visible; padding-bottom: 0; }
}
</style>
