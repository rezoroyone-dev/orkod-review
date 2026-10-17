<template>
  <v-layout row class="align-center layout px-4 pt-4 app--page-header">
    <div class="page-header-left">
      <h3 class="pr-3">{{title}}</h3>
    </div>
    <v-breadcrumbs divider="-">
      <v-breadcrumbs-item>
      <v-icon size="large">mdi-home</v-icon>
      </v-breadcrumbs-item>
      <v-breadcrumbs-item v-for="(item,key) in breadcrumbs" :key="key">
      {{ item }}
      </v-breadcrumbs-item>
    </v-breadcrumbs>
    <v-spacer></v-spacer>
    <div class="page-header-right">
      <v-btn icon variant="text">
        <v-icon color="secondary">mdi-refresh</v-icon>
      </v-btn>
    </div>
  </v-layout>  
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRoute } from 'vue-router';
import menu from '@/api/menu';

const route = useRoute();
const title = ref('');

const breadcrumbs = computed(() => {
  let breadcrumbs = [];
  menu.forEach(item => {
    if (item.items) {
      let child = item.items.find(i => {
        return i.component === route.name;
      });
      if (child) {
        breadcrumbs.push(item.title);
        breadcrumbs.push(child.title);
        // title.value = child.title;
      }
    } else {
      if (item.name === route.name) {
        // title.value = item.title;
        breadcrumbs.push(item.title);
      }
    }
  });
  return breadcrumbs;
});
</script>
