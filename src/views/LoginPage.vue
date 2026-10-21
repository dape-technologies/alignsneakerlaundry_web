<script setup>
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  PhArrowRight as ArrowRightIcon,
  PhDrop as DropIcon,
  PhEnvelopeSimple as EmailIcon,
  PhEye as EyeIcon,
  PhEyeSlash as EyeSlashIcon,
  PhLockKey as LockIcon,
  PhSparkle as SparkleIcon,
} from '@phosphor-icons/vue'
import { useAuthStore } from '../stores/auth'
import BrandLogo from '../components/BrandLogo.vue'

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()
const showPassword = ref(false)
const form = reactive({
  email: '',
  password: '',
})
const loading = ref(false)
const error = ref(route.query.reason === 'session-expired' ? 'Your session expired. Sign in again to continue.' : '')

async function submit() {
  if (!navigator.onLine) {
    error.value = 'A connection is required to sign in.'
    return
  }

  loading.value = true
  error.value = ''

  try {
    await auth.login(form)
    router.push(route.query.redirect || '/dashboard')
  } catch (requestError) {
    error.value = requestError.response?.data?.errors?.email?.[0] || 'We could not sign you in. Check your details and connection.'
  } finally {
    loading.value = false
  }
}

</script>

<template>
  <main id="main-content" class="login-layout min-h-[100dvh] bg-canvas">
    <section class="login-visual relative min-h-[100dvh] overflow-hidden bg-sky-soft p-6 xl:p-8">
      <img
        src="/login-sneaker-care.png"
        alt="A freshly cleaned sneaker beside professional brushes and foam"
        class="absolute inset-0 size-full object-cover"
      />
      <div class="absolute inset-0 bg-[linear-gradient(115deg,rgba(234,246,252,0.98)_0%,rgba(234,246,252,0.9)_34%,rgba(234,246,252,0.05)_72%)]"></div>
      <div class="absolute inset-x-0 bottom-0 h-52 bg-gradient-to-t from-navy/80 to-transparent"></div>

      <div class="relative flex h-full min-h-[calc(100dvh-3rem)] flex-col justify-between xl:min-h-[calc(100dvh-4rem)]">
        <div class="flex items-center gap-3">
          <BrandLogo size="lg" />
          <span class="text-xs font-bold uppercase tracking-[0.18em] text-navy">Professional footwear care</span>
        </div>

        <div class="max-w-[670px] pb-[30vh] xl:pb-[28vh]">
          <p class="mb-4 flex items-center gap-2 text-sm font-bold text-sky-deep"><SparkleIcon :size="18" weight="fill" /> Care, clearly managed</p>
          <h1 class="text-[clamp(3.8rem,6.6vw,7.5rem)] font-extrabold uppercase leading-[0.82] tracking-[-0.075em] text-navy">
            Go Fresh<br /><span class="text-sky-deep">Shoe</span><br />Laundry
          </h1>
        </div>

        <div class="flex items-end justify-between gap-6 text-white">
          <div>
            <p class="text-lg font-semibold">From intake to immaculate.</p>
            <p class="mt-1 text-sm text-white/70">Every pair tracked through every care stage.</p>
          </div>
          <div class="flex gap-2" aria-hidden="true">
            <span class="grid size-11 place-items-center rounded-full border border-white/20 bg-white/10 backdrop-blur"><DropIcon :size="20" weight="fill" /></span>
            <span class="grid size-11 place-items-center rounded-full border border-white/20 bg-white/10 backdrop-blur"><SparkleIcon :size="20" weight="fill" /></span>
          </div>
        </div>
      </div>
    </section>

    <section class="login-auth relative flex min-h-[100dvh] items-center justify-center overflow-hidden px-4 py-7 sm:px-8">
      <img
        src="/login-sneaker-care.png"
        alt="Professional sneaker cleaning tools"
        class="login-mobile-background absolute inset-0 size-full object-cover object-[58%_center]"
      />
      <div class="login-mobile-background absolute inset-0 bg-[linear-gradient(180deg,rgba(16,47,76,0.5)_0%,rgba(16,47,76,0.2)_22%,rgba(16,47,76,0.48)_100%)]"></div>

      <div class="relative w-full max-w-md">
        <h1 class="login-mobile-title mb-5 whitespace-nowrap text-center text-[clamp(1.5rem,7vw,2rem)] font-extrabold tracking-[-0.05em] text-white drop-shadow-[0_2px_14px_rgba(16,47,76,0.35)]">
          Go Fresh <span class="text-[#79d0f4]">Shoe</span> Laundry
        </h1>

        <form
          class="login-form rounded-2xl border border-white/70 bg-white/95 p-5 shadow-[0_24px_70px_rgba(7,31,51,0.28)] backdrop-blur-xl sm:p-7"
          :aria-busy="loading"
          @submit.prevent="submit"
        >
          <div class="login-intro">
            <span class="login-mark" aria-hidden="true"><LockIcon :size="21" weight="duotone" /></span>
            <h2>Welcome back</h2>
          </div>

          <div v-if="error" class="alert-error mt-6" role="alert" aria-live="polite">{{ error }}</div>

          <div class="login-fields">
            <div class="login-field">
              <label for="email">Email</label>
              <div class="login-control">
                <EmailIcon :size="19" class="login-control-icon" aria-hidden="true" />
                <input
                  id="email"
                  v-model="form.email"
                  type="email"
                  autocomplete="email"
                  inputmode="email"
                  placeholder="staff@example.com"
                  required
                />
              </div>
            </div>

            <div class="login-field">
              <label for="password">Password</label>
              <div class="login-control">
                <LockIcon :size="19" class="login-control-icon" aria-hidden="true" />
                <input
                  id="password"
                  v-model="form.password"
                  :type="showPassword ? 'text' : 'password'"
                  autocomplete="current-password"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  class="password-toggle"
                  :aria-label="showPassword ? 'Hide password' : 'Show password'"
                  :aria-pressed="showPassword"
                  @click="showPassword = !showPassword"
                >
                  <EyeSlashIcon v-if="showPassword" :size="19" />
                  <EyeIcon v-else :size="19" />
                </button>
              </div>
            </div>

          </div>

          <button class="login-submit button-primary" type="submit" :disabled="loading">
            <span>{{ loading ? 'Signing in...' : 'Sign in' }}</span>
            <ArrowRightIcon v-if="!loading" :size="18" weight="bold" />
          </button>
        </form>
      </div>
    </section>
  </main>
</template>

<style scoped>
.login-layout {
  display: block;
}

.login-visual {
  display: none;
}

.login-intro h2 {
  margin-top: 1.4rem;
  color: #102f4c;
  font-size: clamp(2.15rem, 8vw, 2.65rem);
  font-weight: 750;
  letter-spacing: -0.055em;
  line-height: 0.96;
}

.login-intro p {
  margin-top: 0.75rem;
  color: #64788a;
  font-size: 0.95rem;
  line-height: 1.5;
}

.login-mark {
  display: grid;
  width: 2.75rem;
  height: 2.75rem;
  place-items: center;
  border: 1px solid #d9edf7;
  border-radius: 0.75rem;
  background: #eaf6fc;
  color: #1886bd;
  box-shadow: inset 0 1px 0 rgb(255 255 255 / 0.8);
}

.login-fields {
  display: grid;
  gap: 1.15rem;
  margin-top: 2rem;
}

.login-field {
  display: grid;
  gap: 0.55rem;
}

.login-field label,
.demo-login > p {
  color: #142536;
  font-size: 0.82rem;
  font-weight: 650;
}

.login-control {
  display: flex;
  min-height: 3.25rem;
  align-items: center;
  gap: 0.75rem;
  border: 1px solid #d9e7f0;
  border-radius: 0.75rem;
  background: #f6fafd;
  padding: 0.65rem 0.85rem;
  transition: border-color 180ms ease, background-color 180ms ease, box-shadow 180ms ease;
}

.login-control:hover {
  border-color: #bdd4e1;
}

.login-control:focus-within {
  border-color: #38a9e0;
  background: #ffffff;
  box-shadow: 0 0 0 3px rgb(56 169 224 / 0.12);
}

.login-control-icon {
  flex: 0 0 auto;
  color: #71889a;
}

.login-control:focus-within .login-control-icon {
  color: #1886bd;
}

.login-control input {
  min-width: 0;
  flex: 1 1 auto;
  border: 0;
  background: transparent;
  padding: 0;
  color: #142536;
  font-size: 0.98rem;
  font-weight: 550;
}

.login-control input:focus-visible {
  box-shadow: none;
}

.login-control input::placeholder {
  color: #8094a5;
}

.password-toggle {
  display: grid;
  width: 2rem;
  height: 2rem;
  flex: 0 0 auto;
  place-items: center;
  border-radius: 0.5rem;
  color: #71889a;
}

.password-toggle:hover {
  background: #eaf6fc;
  color: #102f4c;
}

.demo-login {
  border: 1px solid #d9e7f0;
  border-radius: 0.75rem;
  background: #f6fafd;
  padding: 0.75rem;
}

.demo-login > p {
  margin: 0 0 0.55rem;
  color: #64788a;
}

.demo-options {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.5rem;
}

.demo-option {
  display: flex;
  min-height: 2.65rem;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  border: 1px solid #d9e7f0;
  border-radius: 0.6rem;
  background: #ffffff;
  padding: 0.6rem 0.7rem;
  color: #102f4c;
  font-size: 0.82rem;
  font-weight: 650;
  text-align: left;
}

.demo-option:hover,
.demo-option.selected {
  border-color: #38a9e0;
  background: #eef9fe;
}

.demo-option svg {
  flex: 0 0 auto;
  color: #1886bd;
}

.login-submit {
  min-height: 3.25rem;
  width: 100%;
  justify-content: center;
  margin-top: 1.5rem;
  border-radius: 0.75rem;
}

@media (min-width: 64rem) {
  .login-layout {
    display: grid;
    grid-template-columns: minmax(0, 1.16fr) minmax(27.5rem, 0.84fr);
  }

  .login-visual {
    display: block;
  }

  .login-auth {
    background: #ffffff;
    padding: 2rem 3rem;
  }

  .login-mobile-background,
  .login-mobile-title {
    display: none;
  }

  .login-form {
    border: 0;
    border-radius: 0;
    background: transparent;
    padding: 0;
    box-shadow: none;
    -webkit-backdrop-filter: none;
    backdrop-filter: none;
  }

  .login-intro h2 {
    font-size: 2.75rem;
  }
}
</style>
