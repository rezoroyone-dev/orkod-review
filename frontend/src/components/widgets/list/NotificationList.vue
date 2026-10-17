
<script setup lang="ts">
import { useAppStore } from '@/stores/app';
import { format } from 'date-fns';
import { computed } from 'vue';

const appStore = useAppStore();

const notificationsList = computed(() => appStore.notificationList);

const handleClick = () => {
  console.log('notification clicked');
};

const formatTime = (dateStr: string): string => {
  try {
    return format(new Date(dateStr), 'HH:mm');
  } catch {
    return '';
  }
};
</script>

<template>
  <v-card class="elevation-0">
    <v-toolbar flat dense color="transparent">
      <v-toolbar-title>
        <h4>Notifications</h4>
      </v-toolbar-title>
    </v-toolbar>
    <v-divider></v-divider>
    <v-card-text class="pa-0">
      <v-list class="pa-0">
        <template v-for="item in notificationsList" :key="item.id">
          <v-list-item @click="handleClick">
            <template v-slot:prepend>
              <v-avatar color="light-blue">
                <v-icon color="white">mdi-calendar</v-icon>
              </v-avatar>
            </template>
            <v-list-item-title>{{ item.title }}</v-list-item-title>
            <template v-slot:append>
              <span class="caption ml-5">{{ formatTime(item.start) }}</span>
            </template>
          </v-list-item>
        </template>
        <template v-if="!notificationsList || notificationsList.length === 0">
          <v-list-item>
            <v-list-item-title>No notifications</v-list-item-title>
          </v-list-item>
        </template>
      </v-list>
    </v-card-text>
  </v-card>
</template>
