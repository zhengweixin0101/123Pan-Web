<template>
  <li class="mb-1 -ml-10 list-none select-none">
    <div 
      class="flex items-center justify-between gap-2 p-2 rounded hover:bg-blue-50 transition-colors cursor-pointer"
      :style="{ paddingLeft: level * 20 + 'px' }"
      @click="toggle"
    >
      <div class="flex items-center gap-1">
        <span v-if="file.Type === 1">{{ isExpanded ? '📂' : '📁' }}</span>
        <span v-else>📄</span>
        <span>{{ file.FileName }}</span>
      </div>

      <div v-if="deletable">
        <div @click.stop="deleteFile" class="text-red-500 hover:text-red-900">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 50 50" fill="currentColor">
            <path d="M 21 2 C 19.354545 2 18 3.3545455 18 5 L 18 7 L 10.154297 7 A 1.0001 1.0001 0 0 0 9.984375 6.9863281 A 1.0001 1.0001 0 0 0 9.8398438 7 L 8 7 A 1.0001 1.0001 0 1 0 8 9 L 9 9 L 9 45 C 9 46.645455 10.354545 48 12 48 L 38 48 C 39.645455 48 41 46.645455 41 45 L 41 9 L 42 9 A 1.0001 1.0001 0 1 0 42 7 L 40.167969 7 A 1.0001 1.0001 0 0 0 39.841797 7 L 32 7 L 32 5 C 32 3.3545455 30.645455 2 29 2 L 21 2 z M 21 4 L 29 4 C 29.554545 4 30 4.4454545 30 5 L 30 7 L 20 7 L 20 5 C 20 4.4454545 20.445455 4 21 4 z M 11 9 L 18.832031 9 A 1.0001 1.0001 0 0 0 19.158203 9 L 30.832031 9 A 1.0001 1.0001 0 0 0 31.158203 9 L 39 9 L 39 45 C 39 45.554545 38.554545 46 38 46 L 12 46 C 11.445455 46 11 45.554545 11 45 L 11 9 z M 18.984375 13.986328 A 1.0001 1.0001 0 0 0 18 15 L 18 40 A 1.0001 1.0001 0 1 0 20 40 L 20 15 A 1.0001 1.0001 0 0 0 18.984375 13.986328 z M 24.984375 13.986328 A 1.0001 1.0001 0 0 0 24 15 L 24 40 A 1.0001 1.0001 0 1 0 26 40 L 26 15 A 1.0001 1.0001 0 0 0 24.984375 13.986328 z M 30.984375 13.986328 A 1.0001 1.0001 0 0 0 30 15 L 30 40 A 1.0001 1.0001 0 1 0 32 40 L 32 15 A 1.0001 1.0001 0 0 0 30.984375 13.986328 z"></path>
          </svg>
        </div>
      </div>
    </div>

    <ul v-if="isExpanded">
      <li v-if="isLoading" class="text-gray-500 list-none">加载中...</li>

      <li
        v-else-if="!childrenRef || !childrenRef.length"
        class="text-gray-400 list-none"
      >
        🚫 暂无文件
      </li>

      <FileItem
        v-else
        v-for="sub in childrenRef || []"
        :key="sub.FileId"
        :file="sub"
        :level="level + 1"
        :deletable="deletable"
        :share-key="shareKey"
        :share-pwd="sharePwd"
        @download="$emit('download', $event)"
        @delete-file="$emit('delete-file', $event)"
      />
    </ul>
  </li>
</template>

<script setup>
import { ref } from 'vue';

const props = defineProps({
  file: Object,
  level: Number,
  deletable: Boolean,
  shareKey: { type: String, default: '' },
  sharePwd: { type: String, default: '' },
});

const emit = defineEmits(['download', 'delete-file']);

const isExpanded = ref(false);
const isLoading = ref(false);
const childrenRef = ref(props.file.children && props.file.children.length ? props.file.children : []);

import { getFolderChildren, parseShareChildren } from './123pan.js';

function toggle() {
    if (props.file.Type === 1) {
    // 展开时如果还没有 children，则懒加载当前目录的子项
    if (!isExpanded.value && (!childrenRef.value || !childrenRef.value.length)) {
      isLoading.value = true;
      const load = async () => {
        try {
          let children = [];
          if (props.shareKey) {
            children = await parseShareChildren(null, props.shareKey, props.sharePwd, props.file.FileId);
          } else {
            // 这里尝试从 file._token 使用，如果不存在，将不加载
            const token = props.file._token || (window.__USER__ && window.__USER__.token) || null;
            children = token ? await getFolderChildren(token, props.file.FileId) : [];
            if (token && children && children.length) {
              children = children.map(c => ({ ...c, _token: token }));
            }
          }
          // 写入本地 childrenRef，避免直接修改 prop
          childrenRef.value = children;
        } catch (err) {
          console.error('加载子目录失败', err);
        } finally {
          isLoading.value = false;
          isExpanded.value = true;
        }
      };
      load();
    } else {
      isExpanded.value = !isExpanded.value;
    }
  } else {
    emit('download', props.file);
  }
}

function deleteFile() {
  emit('delete-file', props.file);
}
</script>