<template>
  <div id="themeSetting">
    <v-toolbar color="blue" dark>
      <v-toolbar-title>
        Theme Settings
      </v-toolbar-title>
    </v-toolbar>
    <v-container>
      <v-row>
        <v-col>
          <div class="text-subtitle-1 px-1 my-2">
            Color Option
          </div>
          <div class="color-option">
            <v-row>
              <v-col cols="12" sm="6" class="pa-1" v-for="(option,index) in themeColorOptions" :key="index">
                <label class="color-option--label">
                  <input type="radio" name="color" v-bind:value="option.key" v-model="themeColor">
                  <span class="color-option--item bg">
                    <span class="overlay">
                      <v-icon>mdi-check</v-icon>
                    </span>
                    <span class="color-option--item--header sideNav" :class="option.value.sideNav"></span>
                    <span class="color-option--item--header mainNav" :class="option.value.mainNav"></span>
                    <span class="sideMenu" :class="option.value.sideManu"></span>
                  </span>
                </label>
              </v-col>
            </v-row>
          </div>
          <div class="theme-options">
            <div class="text-subtitle-1 px-1 my-2">
              Sidebar Option
            </div>
            <v-divider></v-divider>
            <div class="my-3">
              <v-btn-toggle v-model="sideBarOption">
                <v-btn variant="text" value="dark">
                  Dark
                </v-btn>
                <v-btn variant="text" value="light">
                  Light
                </v-btn>
              </v-btn-toggle>
            </div>
          </div>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>


<script setup lang="ts">
import { ref, watch } from 'vue';
import { useTheme } from 'vuetify';
import colors from 'vuetify/util/colors';

const theme = useTheme();

const themeColor = ref('purple');
const sideBarOption = ref('light');
const vuetifyColors: Record<string, unknown> = colors;
const themeColorOptions = [
  {
    key: 'blue',
    value: {
      sideNav: 'blue',
      mainNav: 'blue',
      sideManu: 'white'
    }
  },
  {
    key: 'lightBlue',
    value: {
      sideNav: 'blue',
      mainNav: 'white',
      sideManu: 'blue lighten-1'
    }
  },
  {
    key: 'teal',
    value: {
      sideNav: 'teal',
      mainNav: 'teal',
      sideManu: 'white'
    }
  },
  {
    key: 'red',
    value: {
      sideNav: 'red',
      mainNav: 'red',
      sideManu: 'white'
    }
  },
  {
    key: 'orange',
    value: {
      sideNav: 'orange',
      mainNav: 'orange',
      sideManu: 'white'
    }
  },
  {
    key: 'purple',
    value: {
      sideNav: 'purple',
      mainNav: 'purple',
      sideManu: 'white'
    }
  },
  {
    key: 'indigo',
    value: {
      sideNav: 'indigo',
      mainNav: 'indigo',
      sideManu: 'white'
    }
  },
  {
    key: 'cyan',
    value: {
      sideNav: 'cyan',
      mainNav: 'cyan',
      sideManu: 'white'
    }
  },
  {
    key: 'pink',
    value: {
      sideNav: 'pink',
      mainNav: 'pink',
      sideManu: 'white'
    }
  },
  {
    key: 'green',
    value: {
      sideNav: 'green',
      mainNav: 'green',
      sideManu: 'white'
    }
  }
];

watch(themeColor, (val) => {
  const colorObj = vuetifyColors[val] as { base: string };
  theme.themes.value.light.colors.primary = colorObj.base;
  theme.themes.value.dark.colors.primary = colorObj.base;
}, { immediate: true });

watch(sideBarOption, (val) => {
  theme.change(val);
}, { immediate: true });
</script>

<style scoped>
.color-option {
  display: flex;
  flex-wrap: wrap;
}

.color-option--label {
  position: relative;
  display: block;
  cursor: pointer;
  margin: 0;
}

.color-option--label input[type="radio"] {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}

.color-option--item {
  position: relative;
  display: block;
  width: 100%;
  height: 80px;
  border-radius: 4px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.color-option--label input[type="radio"]:checked + .color-option--item {
  border-color: #1976d2;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  transform: scale(1.05);
}

.overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.4);
  opacity: 0;
  transition: opacity 0.3s ease;
  z-index: 2;
}

.color-option--label input[type="radio"]:checked + .color-option--item .overlay {
  opacity: 1;
}

.overlay .v-icon {
  color: white;
  font-size: 24px;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.5));
}

.color-option--item--header {
  position: absolute;
  height: 20px;
  left: 0;
  right: 0;
  display: block;
}

.color-option--item--header.sideNav {
  top: 0;
  background-color: var(--v-theme-surface);
}

.color-option--item--header.mainNav {
  top: 20px;
  background-color: var(--v-theme-primary);
}

.sideMenu {
  position: absolute;
  top: 40px;
  bottom: 0;
  left: 0;
  width: 60px;
  background-color: var(--v-theme-surface-variant);
}

/* Apply Vuetify color classes as background colors */
.blue { background-color: #1976d2 !important; }
.lightBlue { background-color: #42a5f5 !important; }
.teal { background-color: #009688 !important; }
.red { background-color: #f44336 !important; }
.orange { background-color: #ff9800 !important; }
.purple { background-color: #9c27b0 !important; }
.indigo { background-color: #3f51b5 !important; }
.cyan { background-color: #00bcd4 !important; }
.pink { background-color: #e91e63 !important; }
.green { background-color: #4caf50 !important; }

/* Light variants */
.blue.lighten-1 { background-color: #64b5f6 !important; }
.white { background-color: #ffffff !important; }

.theme-options {
  margin-top: 24px;
}

.theme-options .text-subtitle-1 {
  font-weight: 500;
  color: rgba(0, 0, 0, 0.87);
}

.v-btn-toggle .v-btn {
  margin-right: 8px;
}

.v-btn-toggle .v-btn:last-child {
  margin-right: 0;
}
</style>
