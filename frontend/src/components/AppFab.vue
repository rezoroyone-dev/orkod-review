<template>
  <v-fab-transition>
    <v-btn fab="fab" small dark="dark" fixed="fixed" bottom="bottom" right="right" color="red" v-scroll="onScroll" v-show="fab" @click="toTop">
      <v-icon>mdi-chevron-up</v-icon>
    </v-btn>
  </v-fab-transition>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useGoTo } from 'vuetify'; // Assuming useGoTo is available in Vuetify 3

const fab = ref(false);
const router = useRouter();
const goTo = useGoTo();

const onScroll = () => {
  if (typeof window === 'undefined') return;

  const top = window.pageYOffset ||
    document.documentElement.offsetTop ||
    0;

  fab.value = top > 300;
};

const toTop = () => {
  router.push({ hash: '' }).catch((error) => {
    console.log(error);
  });
  goTo(0);
};
</script>
