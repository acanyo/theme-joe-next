<script setup lang="ts">
import { createMessage, type FormKitFrameworkContext, type FormKitNode } from "@formkit/core";
import { VButton } from "@halo-dev/components";
import { FormKit } from "@formkit/vue";
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { findRegion, locateAuthor, readWeather } from "./weather";

const props = defineProps<{ context: FormKitFrameworkContext }>();
const busy = ref(false);
const error = ref("");
const disabled = computed(() => Boolean(props.context.disabled));
const LAST_CITY = "joe-next:author-city";
const PENDING = "joe-weather-pending";
let locationNode: FormKitNode | undefined;
let receipt: string | undefined;
let controller: AbortController | undefined;
let timer: ReturnType<typeof setTimeout> | undefined;
let currentCity = "";

const cityValue = () => String(locationNode?.value ?? "").trim();
function source(value: string) {
  void props.context.node.parent?.at("weather_source")?.input(value, false);
}

function cancel() {
  controller?.abort();
  controller = undefined;
  clearTimeout(timer);
  props.context.node.store.remove(PENDING);
  busy.value = false;
}

async function refresh(locate = false) {
  cancel();
  if (!locate && !cityValue()) {
    error.value = "请先填写作者地区，或点击定位并获取";
    return;
  }
  const request = new AbortController();
  controller = request;
  timer = setTimeout(() => request.abort(), locate ? 20000 : 10000);
  busy.value = true;
  error.value = "";
  props.context.node.store.set(createMessage({
    key: PENDING, type: "validation", value: "正在获取天气", visible: false, blocking: true,
  }));
  try {
    let city = cityValue();
    const region = locate ? await locateAuthor(request.signal) : await findRegion(city, request.signal);
    if (request.signal.aborted) return;
    city = region.city;
    currentCity = city;
    if (cityValue() !== city) await locationNode?.input(city);
    try { localStorage.setItem(LAST_CITY, city); } catch { /* 浏览器禁用存储时仍可使用 */ }
    const weather = await readWeather(region, request.signal);
    if (request.signal.aborted || cityValue() !== city) return;
    await props.context.node.input(weather);
    source("open-meteo");
  } catch (reason) {
    if (controller !== request) return;
    error.value = request.signal.aborted ? "获取超时，可重试或手动填写天气" :
      `${reason instanceof Error ? reason.message : "天气获取失败"}，可重试或手动填写`;
  } finally {
    if (controller === request) {
      clearTimeout(timer);
      controller = undefined;
      busy.value = false;
      props.context.node.store.remove(PENDING);
    }
  }
}

function manualInput(value: unknown) {
  const text = String(value ?? "");
  if (text === String(props.context._value ?? "")) return;
  cancel();
  error.value = "";
  source("");
  void props.context.node.input(text, false);
}

onMounted(() => {
  locationNode = props.context.node.parent?.at("location");
  if (!locationNode) return;
  currentCity = cityValue();
  receipt = locationNode.on("commit", ({ payload }) => {
    const city = String(payload ?? "").trim();
    if (city === currentCity) return;
    currentCity = city;
    void props.context.node.input("");
    source("");
    if (city) void refresh();
    else cancel();
  });
  // 文章已有天气时不请求接口，保留保存时的记录。
  if (String(props.context._value ?? "").trim()) return;
  if (!currentCity) {
    try { currentCity = localStorage.getItem(LAST_CITY)?.trim() ?? ""; } catch { /* 无存储时由作者填写或授权定位 */ }
    if (currentCity) void locationNode.input(currentCity, false);
  }
  if (currentCity) void refresh();
});

onBeforeUnmount(() => {
  cancel();
  if (receipt) locationNode?.off(receipt);
});
</script>

<template>
  <div class="joe-author-weather">
    <FormKit
      :id="context.id"
      type="text"
      :ignore="true"
      :delay="0"
      outer-class="$reset"
      :model-value="context._value ?? ''"
      :disabled="disabled"
      placeholder="根据作者地区自动获取"
      @update:model-value="manualInput"
    />
    <div class="joe-author-weather__actions">
      <VButton size="sm" :loading="busy" :disabled="disabled" @click="refresh()">更新天气</VButton>
      <VButton size="sm" :disabled="busy || disabled" @click="refresh(true)">定位并获取</VButton>
    </div>
    <p v-if="error" :class="context.classes.message" role="status">{{ error }}</p>
    <p :class="[context.classes.help, 'joe-author-weather__source']">
      天气来自 <a href="https://open-meteo.com/" target="_blank" rel="noopener noreferrer">Open-Meteo</a>，地名来自 BigDataCloud。
    </p>
  </div>
</template>

<style scoped>
.joe-author-weather { width: 100%; }
.joe-author-weather__actions { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px; }
.joe-author-weather__source { margin-top: 6px; }
.joe-author-weather__source a { text-decoration: underline; }
</style>
