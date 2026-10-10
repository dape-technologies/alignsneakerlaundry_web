<script setup>
import { PhArrowRight as ArrowRightIcon, PhCheckCircle as CheckCircleIcon, PhDrop as DropIcon, PhShieldCheck as ShieldCheckIcon, PhSparkle as SparkleIcon } from '@phosphor-icons/vue'
</script>

<template>
  <div class="min-h-[100dvh] bg-[#f4f7f3] text-[#11251d] dark:bg-[#0d1713] dark:text-stone-100">
    <header class="mx-auto flex h-18 max-w-7xl items-center justify-between px-4 sm:px-6">
      <RouterLink to="/" class="flex items-center gap-3 font-black">
        <span class="grid size-10 place-items-center rounded-xl bg-[#16352a] text-[#d7ff58]">A</span>
        <span>Align Sneaker Laundry</span>
      </RouterLink>
      <RouterLink to="/login" class="button-secondary">Staff login</RouterLink>
    </header>

    <main>
      <section class="mx-auto grid max-w-7xl items-center gap-8 px-4 pb-12 pt-8 sm:px-6 lg:min-h-[calc(100dvh-4.5rem)] lg:grid-cols-[0.88fr_1.12fr] lg:py-14">
        <div class="max-w-xl">
          <p class="mb-4 text-sm font-black uppercase tracking-[0.18em] text-[#376b55] dark:text-[#9ee6c2]">Machine washed. Hand finished.</p>
          <h1 class="text-5xl font-black leading-[0.94] tracking-[-0.055em] sm:text-6xl lg:text-7xl">Fresh shoes, ready for your next move.</h1>
          <p class="mt-6 max-w-lg text-lg leading-8 text-[#4d655b] dark:text-stone-300">Professional deep cleaning, careful drying, and quality checks for sneakers that deserve proper care.</p>
          <div class="mt-8 flex flex-wrap gap-3">
            <a href="tel:+256700000000" class="button-primary">Book a wash <ArrowRightIcon :size="18" weight="bold" /></a>
            <a href="#services" class="button-secondary">View services</a>
          </div>
        </div>
        <img src="/sneaker-laundry-hero.png" alt="Clean green and white sneakers beside a professional washing machine" class="aspect-[16/11] w-full rounded-2xl object-cover shadow-[0_24px_80px_rgba(22,53,42,0.18)]" fetchpriority="high" />
      </section>

      <section id="services" class="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <h2 class="max-w-xl text-4xl font-black tracking-[-0.04em] sm:text-5xl">Care for every pair.</h2>
        <p class="mt-4 max-w-2xl text-lg text-[#587065] dark:text-stone-300">From daily canvas shoes to delicate leather sneakers, every order receives the right treatment.</p>
        <div class="mt-10 grid gap-4 md:grid-cols-[1.2fr_0.8fr]">
          <article class="rounded-2xl bg-[#16352a] p-8 text-stone-50 md:row-span-2 md:p-10">
            <DropIcon :size="34" class="text-[#d7ff58]" weight="duotone" />
            <h3 class="mt-20 text-3xl font-black">Deep machine clean</h3>
            <p class="mt-3 max-w-md text-[#bdd2c8]">Heavy-duty equipment removes deep dirt while our process protects shape, colour, and materials.</p>
          </article>
          <article class="rounded-2xl bg-white p-8 dark:bg-stone-900">
            <SparkleIcon :size="30" class="text-[#376b55] dark:text-[#9ee6c2]" weight="duotone" />
            <h3 class="mt-8 text-2xl font-black">Detail finish</h3>
            <p class="mt-2 text-[#587065] dark:text-stone-300">Laces, soles, edges, and stubborn marks receive focused hand care.</p>
          </article>
          <article class="rounded-2xl bg-[#d7ff58] p-8 text-[#11251d]">
            <ShieldCheckIcon :size="30" weight="duotone" />
            <h3 class="mt-8 text-2xl font-black">Quality checked</h3>
            <p class="mt-2 text-[#294a3c]">We inspect every pair before sending your pickup notification.</p>
          </article>
        </div>
      </section>

      <section class="mx-auto max-w-7xl px-4 pb-24 sm:px-6">
        <div class="rounded-2xl border border-[#cbd8d0] p-8 dark:border-stone-700 sm:p-12">
          <h2 class="text-3xl font-black tracking-[-0.035em]">Simple from drop-off to pickup.</h2>
          <div class="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <div v-for="item in ['Bring in your shoes', 'We record and inspect them', 'Your shoes are professionally cleaned', 'We notify you when they are ready']" :key="item" class="flex gap-3">
              <CheckCircleIcon :size="22" class="mt-0.5 shrink-0 text-[#376b55] dark:text-[#9ee6c2]" weight="fill" />
              <p class="font-bold">{{ item }}</p>
            </div>
          </div>
        </div>
      </section>
    </main>

    <footer class="border-t border-[#cbd8d0] px-4 py-8 text-sm text-[#587065] dark:border-stone-800 dark:text-stone-400">
      <div class="mx-auto flex max-w-7xl flex-col justify-between gap-3 sm:flex-row"><strong>Align Sneaker Laundry</strong><span>Professional sneaker care in Kampala</span></div>
    </footer>
  </div>
</template>
