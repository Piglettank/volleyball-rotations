<script setup lang="ts">
import { useCounterStore } from '@/stores/counter'
import { ref } from 'vue'

const count = useCounterStore()
</script>

<template>
  <div class="court-container">
    <div class="outside-court">
      <div class="outer-lines">
        <div class="three-meter-top-left"></div>
        <div class="three-meter-top-right"></div>
        <div class="three-meter-bottom-left"></div>
        <div class="three-meter-bottom-right"></div>

        <div class="base-top-left"></div>
        <div class="base-top-right"></div>
        <div class="base-bottom-left"></div>
        <div class="base-bottom-right"></div>

        <div class="pole-left"></div>
        <div class="pole-right"></div>

        <div class="court">
          <div class="inner-lines-top"></div>
          <div class="inner-lines-middle"></div>
          <div class="inner-lines-bottom"></div>
        </div>
      </div>
    </div>
  </div>
  <h1>You did it!</h1>
  <p>
    Visit <a href="https://vuejs.org/" target="_blank" rel="noopener">vuejs.org</a> to read the
    documentation
  </p>
  <p>Count: {{ count.count }}</p>
  <button @click="count.increment">Increment</button>
</template>

<style scoped lang="scss">
$meter: 30px;
$extra-space: 4;
$court-height: (9 + 9) * $meter;
$court-width: (9) * $meter;
$total-court-width: (9 + $extra-space) * $meter;
$total-court-height: (18 + $extra-space) * $meter;
$line-width: 0.1 * $meter;

$line-color: #ffffff;
$court-color: #efb73e;
$outside-court-color: #69b0bc;

.outside-court {
  background-color: $outside-court-color;
  width: $total-court-width;
  height: $total-court-height;
  display: flex;
  justify-content: center;
  align-items: center;
}

.outer-lines {
  width: 100%;
  height: 100%;
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  .three-meter-top-left {
    position: absolute;
    top: ($total-court-height / 2) - 3 * $meter;
    left: 0.5 * $meter;
    width: 3 * $meter;
    height: 1px;
    border-bottom: $line-width dashed $line-color;
  }
  .three-meter-top-right {
    position: absolute;
    top: ($total-court-height / 2) - 3 * $meter;
    right: 0.5 * $meter;
    width: 3 * $meter;
    height: 1px;
    border-bottom: $line-width dashed $line-color;
  }
  .three-meter-bottom-left {
    position: absolute;
    bottom: ($total-court-height / 2) - 3 * $meter;
    left: 0.5 * $meter;
    width: 3 * $meter;
    height: 1px;
    border-top: $line-width dashed $line-color;
  }
  .three-meter-bottom-right {
    position: absolute;
    bottom: ($total-court-height / 2) - 3 * $meter;
    right: 0.5 * $meter;
    width: 3 * $meter;
    height: 1px;
    border-top: $line-width dashed $line-color;
  }
  .base-top-left {
    position: absolute;
    top: (($extra-space / 2) - 0.5) * $meter;
    left: ($extra-space / 2) * $meter - $line-width;
    width: 1px;
    height: 0.25 * $meter;
    border-left: $line-width solid $line-color;
  }
  .base-top-right {
    position: absolute;
    top: (($extra-space / 2) - 0.5) * $meter;
    right: ($extra-space / 2) * $meter - $line-width;
    width: 1px;
    height: 0.25 * $meter;
    border-right: $line-width solid $line-color;
  }
  .base-bottom-left {
    position: absolute;
    bottom: (($extra-space / 2) - 0.5) * $meter;
    left: ($extra-space / 2) * $meter - $line-width;
    width: 1px;
    height: 0.25 * $meter;
    border-left: $line-width solid $line-color;
  }
  .base-bottom-right {
    position: absolute;
    bottom: (($extra-space / 2) - 0.5) * $meter;
    right: ($extra-space / 2) * $meter - $line-width;
    width: 1px;
    height: 0.25 * $meter;
    border-right: $line-width solid $line-color;
  }
  .pole-left {
    position: absolute;
    left: (($extra-space / 2) - 0.6) * $meter;
    top: 50%;
    width: 7px;
    height: 7px;
    background-color: $line-color;
    border-radius: 50%;
  }
  .pole-right {
    position: absolute;
    right: (($extra-space / 2) - 0.6) * $meter;
    top: 50%;
    width: 7px;
    height: 7px;
    background-color: $line-color;
    border-radius: 50%;
  }
}

.court {
  width: $court-width;
  height: $court-height;
  background-color: $court-color;
  position: relative;
  border: $line-width solid $line-color;
  .inner-lines-top {
    position: absolute;
    top: 6 * $meter;
    height: 1px;
    width: 100%;
    border-bottom: $line-width solid $line-color;
  }
  .inner-lines-middle {
    position: absolute;
    top: 50%;
    height: $line-width / 2;
    width: 110%;
    left: -5%;
    border-bottom: $line-width double $line-color;
  }
  .inner-lines-bottom {
    position: absolute;
    bottom: 6 * $meter;
    height: 1px;
    width: 100%;
    border-top: $line-width solid $line-color;
  }
}
</style>
