<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import {
  PhChartLineUp as TrendIcon,
  PhCurrencyCircleDollar as CurrencyIcon,
  PhPrinter as PrintIcon,
  PhReceipt as ReceiptIcon,
  PhUsers as UsersIcon,
} from '@phosphor-icons/vue'
import AppShell from '../components/AppShell.vue'
import { api } from '../services/api'
import { dateOnly, money } from '../lib/format'

const report = ref(null)
const error = ref('')
const inputDate = (date) => [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-')
const filters = reactive({
  from: inputDate(new Date(new Date().getFullYear(), new Date().getMonth(), 1)),
  to: inputDate(new Date()),
})
const stageMeta = [
  { key: 'received', label: 'Received', color: '#64788a' },
  { key: 'cleaning', label: 'In cleaning', color: '#1886bd' },
  { key: 'ready_for_collection', label: 'Ready for collection', color: '#3b8a6e' },
]

const stageSeries = computed(() => stageMeta.map((stage) => ({
  ...stage,
  value: Number(report.value?.status_counts?.[stage.key] || 0),
})))
const totalStages = computed(() => stageSeries.value.reduce((sum, item) => sum + item.value, 0))
const donutBackground = computed(() => {
  if (!totalStages.value) return '#e8eff4'
  let cursor = 0
  const stops = stageSeries.value.map((item) => {
    const start = cursor
    cursor += (item.value / totalStages.value) * 100
    return `${item.color} ${start}% ${cursor}%`
  })
  return `conic-gradient(${stops.join(', ')})`
})
const dailyRevenue = computed(() => report.value?.daily_revenue || [])
const revenueMax = computed(() => Math.max(...dailyRevenue.value.map((day) => Number(day.total)), 1))
const linePoints = computed(() => dailyRevenue.value.map((day, index) => ({
  x: 28 + (index * 664) / Math.max(dailyRevenue.value.length - 1, 1),
  y: 202 - (Number(day.total) / revenueMax.value) * 164,
  ...day,
})))
const polyline = computed(() => linePoints.value.map((point) => `${point.x},${point.y}`).join(' '))
const areaPath = computed(() => linePoints.value.length
  ? `M ${linePoints.value[0].x} 202 L ${polyline.value.replaceAll(' ', ' L ')} L ${linePoints.value.at(-1).x} 202 Z`
  : '')
const financialSeries = computed(() => {
  const values = [
    { label: 'Quoted', value: Number(report.value?.quoted_revenue || 0), color: '#102f4c' },
    { label: 'Collected', value: Number(report.value?.collected_revenue || 0), color: '#22a3d8' },
    { label: 'Outstanding', value: Number(report.value?.outstanding || 0), color: '#ec8a48' },
  ]
  const max = Math.max(...values.map((item) => item.value), 1)
  return values.map((item) => ({ ...item, width: `${(item.value / max) * 100}%` }))
})

async function loadReport() {
  error.value = ''
  try {
    report.value = (await api.get('/reports', { params: filters })).data
  } catch {
    error.value = 'Business report could not be loaded.'
  }
}
function printReport() { window.print() }
onMounted(loadReport)
</script>

<template>
  <AppShell>
    <div class="report-page">
      <header class="report-header flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
        <div><p class="eyebrow">Owner view</p><h1 class="page-title">Business reports</h1><p v-if="report" class="mt-3 text-sm font-semibold text-muted">{{ dateOnly(report.period.from) }} – {{ dateOnly(report.period.to) }}</p></div>
        <div class="report-actions flex flex-wrap items-end gap-3">
          <form class="flex flex-wrap items-end gap-3" @submit.prevent="loadReport">
            <label class="field"><span>From</span><input v-model="filters.from" type="date" /></label>
            <label class="field"><span>To</span><input v-model="filters.to" type="date" /></label>
            <button class="button-primary" type="submit">Apply</button>
          </form>
          <button class="button-secondary" type="button" :disabled="!report" @click="printReport"><PrintIcon :size="18" /> Print report</button>
        </div>
      </header>

      <div v-if="error" class="alert-error mt-8">{{ error }}</div>
      <div v-else-if="!report" class="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4"><div v-for="index in 4" :key="index" class="skeleton h-32"></div></div>
      <template v-else>
        <section class="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4" aria-label="Report summary">
          <article class="metric-block xl:col-span-2"><div class="metric-icon"><CurrencyIcon :size="25" /></div><p>Collected revenue</p><strong>{{ money(report.collected_revenue) }}</strong><span>{{ money(report.quoted_revenue) }} quoted</span></article>
          <article class="metric-block"><div class="metric-icon"><ReceiptIcon :size="25" /></div><p>Service orders</p><strong>{{ report.orders }}</strong><span>{{ money(report.average_order_value) }} average</span></article>
          <article class="metric-block"><div class="metric-icon"><UsersIcon :size="25" /></div><p>Clients served</p><strong>{{ report.clients }}</strong><span>{{ money(report.outstanding) }} outstanding</span></article>
        </section>

        <section class="report-grid mt-6">
          <article class="chart-card chart-card-wide">
            <div class="chart-heading"><div><p class="eyebrow">Cash flow</p><h2 class="section-title mt-1">Daily collections</h2></div><span class="chart-key"><i class="bg-[#22a3d8]"></i> Revenue</span></div>
            <div v-if="dailyRevenue.length" class="line-chart" aria-label="Line chart of daily collected revenue">
              <svg viewBox="0 0 720 230" role="img">
                <title>Daily collected revenue</title>
                <line v-for="y in [38, 79, 120, 161, 202]" :key="y" x1="28" :y1="y" x2="692" :y2="y" class="grid-line" />
                <path :d="areaPath" class="chart-area" />
                <polyline :points="polyline" class="chart-line" />
                <circle v-for="point in linePoints" :key="point.date" :cx="point.x" :cy="point.y" r="4" class="chart-point"><title>{{ dateOnly(point.date) }}: {{ money(point.total) }}</title></circle>
              </svg>
              <div class="chart-axis"><span>{{ dateOnly(dailyRevenue[0].date) }}</span><span v-if="dailyRevenue.length > 1">{{ dateOnly(dailyRevenue.at(-1).date) }}</span></div>
            </div>
            <div v-else class="chart-empty"><TrendIcon :size="28" /><p>No payments were recorded in this period.</p></div>
          </article>

          <article class="chart-card">
            <div><p class="eyebrow">Care flow</p><h2 class="section-title mt-1">Orders by stage</h2></div>
            <div class="donut-layout">
              <div class="donut" :style="{ background: donutBackground }"><span><strong>{{ totalStages }}</strong><small>pairs</small></span></div>
              <ul class="chart-legend">
                <li v-for="stage in stageSeries" :key="stage.key"><i :style="{ backgroundColor: stage.color }"></i><span>{{ stage.label }}</span><strong>{{ stage.value }}</strong></li>
              </ul>
            </div>
          </article>

          <article class="chart-card chart-card-wide">
            <div class="chart-heading"><div><p class="eyebrow">Financial position</p><h2 class="section-title mt-1">Revenue comparison</h2></div><span class="text-xs font-semibold text-muted">UGX</span></div>
            <div class="bar-chart" aria-label="Bar chart comparing quoted, collected and outstanding revenue">
              <div v-for="item in financialSeries" :key="item.label" class="bar-row">
                <span>{{ item.label }}</span>
                <div class="bar-track"><i :style="{ width: item.width, backgroundColor: item.color }"></i></div>
                <strong>{{ money(item.value) }}</strong>
              </div>
            </div>
          </article>
        </section>

        <footer class="print-footer">Align Sneaker Laundry · Generated {{ dateOnly(new Date()) }}</footer>
      </template>
    </div>
  </AppShell>
</template>

<style scoped>
.report-grid { display: grid; grid-template-columns: minmax(0, 1.4fr) minmax(18rem, .6fr); gap: 1rem; }
.chart-card { min-width: 0; break-inside: avoid; border: 1px solid var(--color-line); border-radius: .85rem; background: white; padding: 1.25rem; box-shadow: 0 10px 32px rgba(29, 79, 111, .04); }
.chart-card-wide { grid-column: span 1; }
.chart-heading { display: flex; align-items: flex-end; justify-content: space-between; gap: 1rem; }
.chart-key { display: inline-flex; align-items: center; gap: .4rem; color: var(--color-muted); font-size: .75rem; font-weight: 700; }
.chart-key i, .chart-legend i { width: .6rem; height: .6rem; flex: 0 0 auto; border-radius: .18rem; }
.line-chart { margin-top: 1.25rem; }
.line-chart svg { display: block; width: 100%; overflow: visible; }
.grid-line { stroke: #e4edf3; stroke-width: 1; }
.chart-area { fill: rgba(34, 163, 216, .1); }
.chart-line { fill: none; stroke: #168dc0; stroke-linecap: round; stroke-linejoin: round; stroke-width: 4; }
.chart-point { fill: white; stroke: #168dc0; stroke-width: 3; }
.chart-axis { display: flex; justify-content: space-between; margin: -.25rem 1.7rem 0; color: var(--color-muted); font-size: .7rem; font-weight: 600; }
.chart-empty { display: grid; min-height: 15rem; place-items: center; align-content: center; gap: .6rem; color: var(--color-muted); font-size: .875rem; }
.donut-layout { display: grid; place-items: center; gap: 1.5rem; padding-top: 2rem; }
.donut { display: grid; width: 11rem; aspect-ratio: 1; place-items: center; border-radius: 50%; }
.donut::before { content: ''; grid-area: 1 / 1; width: 64%; aspect-ratio: 1; border-radius: 50%; background: white; box-shadow: 0 0 0 1px #edf2f6; }
.donut span { z-index: 1; grid-area: 1 / 1; text-align: center; }
.donut strong { display: block; color: var(--color-navy); font-size: 2rem; line-height: 1; }
.donut small { color: var(--color-muted); font-size: .72rem; font-weight: 700; }
.chart-legend { width: 100%; display: grid; gap: .65rem; }
.chart-legend li { display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: .55rem; color: var(--color-muted); font-size: .78rem; font-weight: 600; }
.chart-legend strong { color: var(--color-navy); }
.bar-chart { display: grid; gap: 1rem; margin-top: 1.75rem; }
.bar-row { display: grid; grid-template-columns: 6rem minmax(8rem, 1fr) 9rem; align-items: center; gap: .8rem; font-size: .78rem; font-weight: 700; }
.bar-row > span { color: var(--color-muted); }
.bar-row > strong { color: var(--color-navy); text-align: right; }
.bar-track { height: .8rem; overflow: hidden; border-radius: .25rem; background: #edf3f6; }
.bar-track i { display: block; min-width: 2px; height: 100%; border-radius: inherit; }
.print-footer { display: none; }
@media (max-width: 900px) { .report-grid { grid-template-columns: 1fr; } }
@media (max-width: 560px) { .bar-row { grid-template-columns: 5rem minmax(6rem, 1fr); } .bar-row > strong { grid-column: 2; text-align: left; } }
@media print {
  .report-actions { display: none !important; }
  .report-page { color: #142536; }
  .report-header { border-bottom: 2px solid #102f4c; padding-bottom: .75rem; }
  .report-grid { grid-template-columns: 1.35fr .65fr; }
  .chart-card, :deep(.metric-block) { box-shadow: none; }
  .line-chart svg { max-height: 10.5rem; }
  .print-footer { display: block; margin-top: 1rem; border-top: 1px solid #d9e7f0; padding-top: .6rem; color: #64788a; font-size: .7rem; text-align: right; }
}
</style>
